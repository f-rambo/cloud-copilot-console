import { NextResponse } from 'next/server';
import { graph } from '@/lib/langchain/graph';
import { HumanMessage, AIMessageChunk } from '@langchain/core/messages';

export async function POST(request: Request) {
  const { message, chatId } = await request.json();
  if (!message || !chatId || message === '' || chatId === '') {
    return NextResponse.json(
      { error: 'Missing message or chatId' },
      { status: 400 }
    );
  }
  const streamEventsResults = graph.streamEvents(
    { messages: [new HumanMessage({ content: message })] },
    {
      version: 'v2',
      configurable: { thread_id: chatId },
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
