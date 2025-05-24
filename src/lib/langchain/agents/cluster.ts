import { RunnableConfig, Runnable } from '@langchain/core/runnables';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { AgentState } from '@/lib/types/agents';
import {
  clusterListTool,
  clusterDetail,
  clusterKuberentesCommandWithKubectlExec
} from '@/lib/langchain/tools/cluster';
import { LangChainService } from '@/lib/langchain/service';
import { Cluster } from '@/lib/types/agents';
import { createReactAgent } from '@langchain/langgraph/prebuilt';

export class ClusterAgent {
  private llmService: LangChainService;
  private clusterAgent!: Runnable;

  constructor(llmService: LangChainService) {
    this.llmService = llmService;
    this.initialize();
  }

  private async initialize() {
    this.clusterAgent = createReactAgent({
      llm: this.llmService.getLLM(),
      tools: [
        clusterListTool,
        clusterDetail,
        clusterKuberentesCommandWithKubectlExec
      ],
      prompt: new SystemMessage(
        'You are a cluster administrator. You can use cluster tools to view and manage the cluster. ' +
          'These are the kubernetes clusters. ' +
          'you can execute Kubectl commands to solve cluster problems'
      )
    });
  }

  public clusterNode = async (
    state: typeof AgentState.State,
    config?: RunnableConfig
  ) => {
    const result = await this.clusterAgent.invoke(state, config);
    const lastMessage = result.messages[result.messages.length - 1];
    return {
      messages: [
        new HumanMessage({ content: lastMessage.content, name: Cluster })
      ]
    };
  };
}
