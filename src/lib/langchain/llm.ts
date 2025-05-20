import { ChatOpenAI } from '@langchain/openai';

export const llm = new ChatOpenAI({
  model: 'openai/gpt-4o',
  temperature: 0,
  maxRetries: 3,
  streaming: true,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_API_BASE_URL
  }
});
