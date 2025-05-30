import { END } from '@langchain/langgraph';
import { z } from 'zod';
import { members } from '@/lib/types/agents';
import { DynamicStructuredTool } from '@langchain/core/tools';

export const routeTool = new DynamicStructuredTool({
  name: 'route',
  description: 'Select the next role and supervisor reply message',
  schema: z.object({
    next: z.enum([END, ...members]).describe('The next role to act'),
    message: z.string().describe('This is the reply from the supervisor.')
  }),
  func: async ({ next, message }) => {
    return {
      next,
      message
    };
  }
});
