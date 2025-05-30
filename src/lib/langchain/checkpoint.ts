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
      process.env.POSTGRESQL + '/langchain',
      { schema: 'langchain' }
    );
    await newCheckpointer.setup();
    checkpointerInstance = newCheckpointer;
    setupPromise = null;
    return checkpointerInstance;
  })();

  return setupPromise;
}
