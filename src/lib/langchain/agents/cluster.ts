import { RunnableConfig } from '@langchain/core/runnables';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { AgentState } from '@/lib/langchain/agents/supervisor';
import {
  clusterListTool,
  clusterDetail,
  clusterKuberentesCommandWithKubectlExec
} from '@/lib/langchain/tools/cluster';
import { llm } from '@/lib/langchain/llm';
import { ClusterAgent } from '@/lib/types/agents';

export const clusterAgent = createReactAgent({
  llm,
  tools: [
    clusterListTool,
    clusterDetail,
    clusterKuberentesCommandWithKubectlExec
  ],
  stateModifier: new SystemMessage(
    'You are a cluster administrator. You can use cluster tools to view and manage the cluster. ' +
      'These are the kubernetes clusters. ' +
      'you can execute Kubectl commands to solve cluster problems'
  )
});

export const clusterNode = async (
  state: typeof AgentState.State,
  config?: RunnableConfig
) => {
  const result = await clusterAgent.invoke(state, config);
  const lastMessage = result.messages[result.messages.length - 1];
  return {
    messages: [
      new HumanMessage({ content: lastMessage.content, name: ClusterAgent })
    ]
  };
};
