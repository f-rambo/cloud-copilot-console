import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { graph } from '@/lib/langchain/graph';
import { HumanMessage } from '@langchain/core/messages';

export async function POST(request: Request) {
  const { message } = await request.json();
  const streamResults = graph.stream(
    {
      messages: [
        new HumanMessage({
          content: message
        })
      ]
    },
    { configurable: { thread_id: uuidv4() }, recursionLimit: 100 }
  );
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const output of await streamResults) {
        console.log(output);
        const content = '123';
        const data = `data: ${content}\n\n`;
        controller.enqueue(encoder.encode(data));
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
