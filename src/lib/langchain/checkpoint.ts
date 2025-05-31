import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { Pool } from 'pg';

let checkpointerInstance: PostgresSaver | null = null;
let setupPromise: Promise<PostgresSaver> | null = null;

export async function ensureLangchainDatabase(): Promise<void> {
  const defaultPool = new Pool({
    connectionString: process.env.POSTGRESQL + '/postgres'
  });

  try {
    const checkDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = 'langchain';
    `;

    const result = await defaultPool.query(checkDbQuery);

    if (result.rows.length === 0) {
      await defaultPool.query('CREATE DATABASE langchain;');
    }
  } catch (error) {
    throw error;
  } finally {
    await defaultPool.end();
  }
}

export async function getCheckpointer(): Promise<PostgresSaver> {
  if (checkpointerInstance) {
    return checkpointerInstance;
  }

  if (setupPromise) {
    return setupPromise;
  }

  setupPromise = (async () => {
    await ensureLangchainDatabase();

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
