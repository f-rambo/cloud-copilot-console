import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export const clusterListTool = new DynamicStructuredTool({
  name: 'clusterList',
  description: 'Get a list of clusters',
  schema: z.object({
    clusters: z.array(z.string())
  }),
  func: async () => {
    return { clusters: ['cluster1', 'cluster2', 'cluster3'] };
  }
});

export const clusterDetail = new DynamicStructuredTool({
  name: 'clusterDetail',
  description: 'Get a detail of a cluster',
  schema: z.object({
    cluster: z.string(),
    detail: z.string()
  }),
  func: async ({ cluster }) => {
    if (cluster === 'cluster1') {
      return { cluster, detail: 'cluster1 detail' };
    }
    if (cluster === 'cluster2') {
      return { cluster, detail: 'cluster2 detail' };
    }
    if (cluster === 'cluster3') {
      return { cluster, detail: 'cluster3 detail' };
    }
    return { cluster, detail: 'cluster not found' };
  }
});

export const clusterKuberentesCommandWithKubectlExec =
  new DynamicStructuredTool({
    name: 'clusterKuberentesCommandWithKubectlExec',
    description: 'Get a kubernetes command result with kubectl exec',
    schema: z.object({
      cluster: z.string(),
      command: z.string(),
      result: z.string()
    }),
    func: async ({ cluster, command }) => {
      if (cluster === 'cluster1') {
        return { cluster, command, result: 'cluster1 command result' };
      }
    }
  });
