import { ChatOpenAI } from '@langchain/openai';

export const llm = new ChatOpenAI({
  model: 'gpt-4o',
  temperature: 0,
  maxRetries: 5,
  streaming: true,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_API_BASE_URL,
    timeout: 60000
  }
});
