import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

let checkpointerInstance: PostgresSaver | null = null;
let setupPromise: Promise<PostgresSaver> | null = null;

export async function getCheckpointer(): Promise<PostgresSaver> {
  if (checkpointerInstance) {
    return checkpointerInstance;
  }

  if (setupPromise) {
    return setupPromise;
  }

  setupPromise = (async () => {
    const newCheckpointer = PostgresSaver.fromConnString(
      'postgresql://postgres:123456@localhost:5432/langchain',
      {
        schema: 'langchain'
      }
    );
    await newCheckpointer.setup();
    checkpointerInstance = newCheckpointer;
    setupPromise = null;
    return checkpointerInstance;
  })();

  return setupPromise;
}
