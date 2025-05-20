import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export const serviceListTool = new DynamicStructuredTool({
  name: 'serviceList',
  description: 'Get a list of services',
  schema: z.object({
    services: z.array(z.string())
  }),
  func: async () => {
    return { services: ['service1', 'service2', 'service3'] };
  }
});
