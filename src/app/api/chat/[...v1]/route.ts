import { NextResponse } from 'next/server';
import { LangchainStateGraph } from '@/lib/langchain/graph';
import { HumanMessage, AIMessageChunk } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';

const chatIndexString = 'chat/v1/';

const msgFunction = '/msg';
const ttFunction = '/tt';

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
    case ttFunction:
      return handlerTT(request);
    default:
      return NextResponse.json({ msg: 'Not found' }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const url = getRealPathUrl(request.url);
  switch (url) {
    case msgFunction:
      return handlePostMsg(request);
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
  const streamEventsResults = (
    await new LangchainStateGraph().App()
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
      for await (const event of streamEventsResults) {
        if (event.event === 'on_chat_model_stream' && event.data.chunk) {
          const aiMsgChunk = event.data.chunk as AIMessageChunk;
          // let chunk = '';
          // if (aiMsgChunk.tool_call_chunks) {
          //   for (const args of aiMsgChunk.tool_call_chunks) {
          //     chunk += args.args;
          //   }
          // }
          // const node = event.metadata.langgraph_node;
          const data = `data: ${aiMsgChunk.content}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      }
      controller.close();
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

async function handleGetMsg(request: Request) {
  console.log(request.url);
  return NextResponse.json({ msg: 'Hello World' }, { status: 200 });
}

async function handlerTT(request: Request) {
  console.log(request.url);
  return NextResponse.json({ msg: 'Test pass' }, { status: 200 });
}
