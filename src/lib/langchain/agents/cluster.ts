import { RunnableConfig, Runnable } from '@langchain/core/runnables';
import { SystemMessage, AIMessage } from '@langchain/core/messages';
import { AgentState } from '@/lib/types/agents';
import { McpToolClient } from '@/lib/langchain/tools/cluster';
import { LangChainService } from '@/lib/langchain/service';
import { AgentMembers } from '@/lib/types/agents';
import { createReactAgent } from '@langchain/langgraph/prebuilt';

export class ClusterAgent {
  private llmService: LangChainService;
  private clusterAgent!: Runnable;
  private sessionId: string;

  constructor(llmService: LangChainService, sessionId: string) {
    this.llmService = llmService;
    this.sessionId = sessionId;
    this.initialize();
  }

  private async initialize() {
    this.clusterAgent = createReactAgent({
      llm: this.llmService.getLLM(),
      tools: [...(await McpToolClient(this.sessionId).getTools())],
      prompt: new SystemMessage(
        'You are a cluster administrator. You can use cluster tools to view and manage the cluster. ' +
          'These are the kubernetes clusters. ' +
          'you can execute Kubectl commands to solve cluster problems. ' +
          'When returning data in table format, ' +
          'please format the output using markdown table syntax with proper headers and alignment. ' +
          'For example, use | Column1 | Column2 | Column3 | format with --- separators for table headers.'
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
        new AIMessage({
          content: lastMessage.content,
          name: AgentMembers.ClusterAgent.name
        })
      ]
    };
  };
}
