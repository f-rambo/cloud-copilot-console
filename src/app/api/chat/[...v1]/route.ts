import { NextResponse } from 'next/server';
import { LangchainStateGraph } from '@/lib/langchain/graph';
import { HumanMessage, AIMessageChunk } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';
import { getCheckpointer } from '@/lib/langchain/checkpoint';
import {
  ChatMessage,
  FormattedMessage,
  MessagesResponse
} from '@/lib/types/chat';
import { role } from '@/lib/types/agents';

const chatIndexString = 'chat/v1/';

const msgFunction = '/msg';

function getRealPathUrl(url: string) {
  const urlObj = new URL(url);

  const chatIndex = urlObj.pathname.indexOf(chatIndexString);
  urlObj.pathname =
    chatIndex !== -1
      ? urlObj.pathname.substring(chatIndex + chatIndexString.length)
      : urlObj.pathname;
  return urlObj.pathname.toString();
}

export async function GET(request: Request) {
  const url = getRealPathUrl(request.url);
  switch (url) {
    case msgFunction:
      return handleGetMsg(request);
    default:
      return NextResponse.json({ msg: 'Not found' }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const url = getRealPathUrl(request.url);
  switch (url) {
    case msgFunction:
      return handlePostMsg(request);
    case '/mock-msg':
      return handleMockMsg(request);
    default:
      return NextResponse.json({ msg: 'Not found' }, { status: 400 });
  }
}

async function handlePostMsg(request: Request) {
  const { message, sessionId, userId } = await request.json();
  if (!message || !sessionId || !userId) {
    return NextResponse.json(
      { msg: 'Missing message/sessionId/userId' },
      { status: 400 }
    );
  }

  const checkpointer = await getCheckpointer();
  const streamEventsResults = (
    await new LangchainStateGraph(sessionId, checkpointer).App()
  ).streamEvents(
    {
      messages: [new HumanMessage({ id: uuidv4(), content: message })]
    },
    {
      version: 'v2',
      configurable: { thread_id: sessionId, user_id: userId },
      recursionLimit: 100
    }
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of streamEventsResults) {
          if (event.event === 'on_chat_model_stream' && event.data.chunk) {
            const aiMsgChunk = event.data.chunk as AIMessageChunk;

            const chunk = {
              content: aiMsgChunk.content,
              type: 'content',
              sessionId,
              userId
            };

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
            );
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        console.error('Stream error:', error);
        const errorMessage = {
          content: 'Sorry, something went wrong.',
          type: 'error'
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`)
        );
      } finally {
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'none'
    }
  });
}

async function handleGetMsg(
  request: Request
): Promise<NextResponse<MessagesResponse>> {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const userId = searchParams.get('userId');

  if (!sessionId || !userId) {
    return NextResponse.json<MessagesResponse>(
      { messages: [], total: 0, error: 'Missing sessionId or userId' },
      { status: 400 }
    );
  }

  const checkpointer = await getCheckpointer();
  const res = await checkpointer.get({
    configurable: { thread_id: sessionId, user_id: userId },
    recursionLimit: 100
  });

  if (!res?.channel_values.messages) {
    return NextResponse.json<MessagesResponse>(
      { messages: [], total: 0, error: 'No messages found' },
      { status: 400 }
    );
  }

  const messages = res?.channel_values.messages as ChatMessage[];

  const formattedMessages = messages.map<FormattedMessage>(
    (message: ChatMessage, index: number): FormattedMessage => {
      const isHuman =
        message.constructor.name === 'HumanMessage' ||
        (message as { _getType?: () => string })._getType?.() === 'human';
      const isAI =
        message.constructor.name === 'AIMessage' ||
        (message as { _getType?: () => string })._getType?.() === 'ai';

      let content =
        typeof message.content === 'string'
          ? message.content
          : JSON.stringify(message.content) || '';

      let thinking = '';

      const thinkingMatch = content.match(
        /^(.*?)\n\n(?:Thinking:|思考过程:|思考：)\s*([\s\S]*)$/i
      );
      if (thinkingMatch) {
        content = thinkingMatch[1].trim();
        thinking = thinkingMatch[2].trim();
      } else {
        const fullThinkingMatch = content.match(
          /^(?:Thinking:|思考过程:|思考：)\s*([\s\S]*)$/i
        );
        if (fullThinkingMatch) {
          thinking = fullThinkingMatch[1].trim();
          content = '';
        }
      }

      return {
        id: message.id || `msg_${index}`,
        role: isHuman ? role.Human : isAI ? role.Ai : role.System,
        content,
        name: message.name || '',
        thinking
      };
    }
  );

  const response: MessagesResponse = {
    messages: formattedMessages,
    total: formattedMessages.length
  };

  return NextResponse.json(response, { status: 200 });
}

async function handleMockMsg(request: Request) {
  const { message, sessionId, userId } = await request.json();
  if (!message || !sessionId || !userId) {
    return NextResponse.json(
      { msg: 'Missing message/sessionId/userId' },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const thinkingMessage = {
          content: '<think>',
          type: 'thinking_start'
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(thinkingMessage)}\n\n`)
        );

        await new Promise((resolve) => setTimeout(resolve, 500));

        const thinkingContent = {
          content: '让我为您准备一个包含丰富Markdown格式的回复...',
          type: 'thinking_content'
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(thinkingContent)}\n\n`)
        );

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const thinkingEnd = {
          content: '</think>',
          type: 'thinking_end'
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(thinkingEnd)}\n\n`)
        );

        const markdownResponse = `# 📋 AI助手回复

您好！我收到了您的消息：**"${message}"**

## 🚀 功能特性

这是一个支持丰富Markdown格式的聊天系统，包含以下特性：

### ✨ 文本格式
- **粗体文本**
- *斜体文本*
- ~~删除线~~
- \`内联代码\`

### 📝 代码块示例

\`\`\`javascript
function greetUser(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome to our chat system!\`;
}

greetUser('用户');
\`\`\`

### 📊 数据表格

| 功能 | 状态 | 描述 |
|------|------|------|
| Markdown渲染 | ✅ 已完成 | 支持完整的Markdown语法 |
| 代码高亮 | ✅ 已完成 | 多语言语法高亮 |
| 表格支持 | ✅ 已完成 | 响应式表格显示 |
| 链接支持 | ✅ 已完成 | 自动打开新窗口 |

### 🔗 有用链接

- [Markdown语法指南](https://www.markdownguide.org/)
- [React Markdown文档](https://github.com/remarkjs/react-markdown)

### 📋 任务清单

- [x] 实现基础聊天功能
- [x] 添加Markdown支持
- [x] 集成代码高亮
- [ ] 添加文件上传功能
- [ ] 实现语音消息

### 💡 提示信息

> **注意**: 这是一个演示性的回复，展示了各种Markdown格式的渲染效果。您可以在聊天中使用这些格式来丰富您的消息内容。

### 🎯 快速操作

1. **发送消息**: 在输入框中输入文本
2. **使用Markdown**: 支持标准Markdown语法
3. **代码分享**: 使用代码块分享代码片段
4. **创建列表**: 使用有序或无序列表

---

*感谢您使用我们的聊天系统！如有任何问题，请随时询问。* 🤖`;

        const words = markdownResponse.split('');

        for (const word of words) {
          const chunk = {
            content: word,
            type: 'content',
            sessionId,
            userId
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
          );

          // 模拟打字效果（稍微快一点以便更好的演示）
          await new Promise((resolve) => setTimeout(resolve, 20));
        }

        // 发送结束标记
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        console.error('Stream error:', error);
        const errorMessage = {
          content: 'Sorry, something went wrong.',
          type: 'error'
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`)
        );
      } finally {
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'none',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
