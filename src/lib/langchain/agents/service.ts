import { RunnableConfig, Runnable } from '@langchain/core/runnables';
import { SystemMessage, AIMessage } from '@langchain/core/messages';
import { AgentState } from '@/lib/types/agents';
import { serviceListTool } from '@/lib/langchain/tools/service';
import { LangChainService } from '@/lib/langchain/service';
import { Service } from '@/lib/types/agents';
import { createReactAgent } from '@langchain/langgraph/prebuilt';

export class ServiceAgent {
  private llmService: LangChainService;
  private serviceAgent!: Runnable;
  constructor(llmService: LangChainService) {
    this.llmService = llmService;
    this.initialize();
  }

  private async initialize() {
    this.serviceAgent = createReactAgent({
      llm: this.llmService.getLLM(),
      tools: [serviceListTool],
      prompt: new SystemMessage(
        'You are a service administrator. You can use service tools to view and manage the service. ' +
          'When returning data in table format, ' +
          'please format the output using markdown table syntax with proper headers and alignment. ' +
          'For example, use | Column1 | Column2 | Column3 | format with --- separators for table headers.'
      )
    });
  }

  public serviceNode = async (
    state: typeof AgentState.State,
    config?: RunnableConfig
  ) => {
    const result = await this.serviceAgent.invoke(state, config);
    const lastMessage = result.messages[result.messages.length - 1];
    return {
      messages: [new AIMessage({ content: lastMessage.content, name: Service })]
    };
  };
}
