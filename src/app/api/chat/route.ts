import { NextResponse } from 'next/server';
import { ChatOllama } from '@langchain/ollama';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import {
  START,
  END,
  StateGraph,
  MemorySaver,
  MessagesAnnotation,
  Annotation
} from '@langchain/langgraph';
import { v4 as uuidv4 } from 'uuid';
import { StringOutputParser } from '@langchain/core/output_parsers';

const llm = new ChatOllama({
  model: 'deepseek-r1:7b',
  temperature: 0,
  maxRetries: 3
});

export const ChatRoles = {
  System: 'system',
  User: 'user',
  Assistant: 'assistant',
  Agent: 'agent',
  Function: 'function',
  Tool: 'tool',
  Placeholder: 'placeholder',
  Human: 'human'
} as const;

const promptTemplate = ChatPromptTemplate.fromMessages([
  [
    ChatRoles.System,
    'You are a helpful assistant that translates {input_language} to {output_language}.'
  ],
  [ChatRoles.Placeholder, '{messages}']
]);

const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  input_language: Annotation<string>(),
  output_language: Annotation<string>()
});

const parser = new StringOutputParser();

const chain = promptTemplate.pipe(llm).pipe(parser);

const callModel = async (state: typeof GraphAnnotation.State) => {
  const stream = await chain.stream(state);
  let fullContent = '';
  for await (const chunk of stream) {
    fullContent += chunk;
  }
  return {
    messages: [
      {
        role: ChatRoles.Assistant,
        content: fullContent
      }
    ]
  };
};

const workflow = new StateGraph(GraphAnnotation)
  .addNode('model', callModel)
  .addEdge(START, 'model')
  .addEdge('model', END);

const memory = new MemorySaver();
const app = workflow.compile({ checkpointer: memory });

export async function POST(request: Request) {
  const { messages } = await request.json();
  const input = {
    input_language: 'English',
    output_language: 'German',
    messages: [
      {
        role: 'user',
        content: messages
      }
    ]
  };
  const config = { configurable: { thread_id: uuidv4() } };
  const eventStream = app.streamEvents(input, { ...config, version: 'v2' });
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const event of eventStream) {
        if (event.event === 'on_chat_model_stream') {
          const content = String(event.data.chunk.content || '');
          const data = `data: ${content}\n\n`;
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
