import { MultiServerMCPClient } from '@langchain/mcp-adapters';

// import { DynamicStructuredTool } from '@langchain/core/tools';
// import { z } from 'zod';

// export const clusterListTool = new DynamicStructuredTool({
//   name: 'clusterList',
//   description: 'Get a list of clusters',
//   schema: z.object({
//     clusters: z.array(z.string())
//   }),
//   func: async () => {
//     return { clusters: ['cluster1', 'cluster2', 'cluster3'] };
//   }
// });

export function McpToolClient(sessionId: string) {
  const sseUrl =
    process.env.SERVER_API_SSE_URL + '/cluster/sse?sessionId=' + sessionId;
  return new MultiServerMCPClient({
    mcpServers: {
      cluster: {
        url: sseUrl,
        transport: 'sse',
        type: 'sse'
      }
    }
  });
}
