import { END } from '@langchain/langgraph';
import {
  ChatPromptTemplate,
  MessagesPlaceholder
} from '@langchain/core/prompts';
import { AIMessageChunk, AIMessage } from '@langchain/core/messages';
import { LangChainService } from '@/lib/langchain/service';
import { RunnableConfig, Runnable } from '@langchain/core/runnables';
import { options, getClusterMembersSummary } from '@/lib/types/agents';
import { AgentState } from '@/lib/types/agents';
import { routeTool } from '@/lib/langchain/tools/supervisor';
import { AgentMembers } from '@/lib/types/agents';

export class SupervisorAgent {
  private llmService: LangChainService;
  private supervisorChain?: Runnable;

  constructor(llmService: LangChainService) {
    this.llmService = llmService;

    this.initialize();
  }

  private async initialize() {
    const systemPrompt =
      'You are a supervisor tasked with managing a conversation between the' +
      ' following workers: {members}. Given the following user request,' +
      ' respond with the worker to act next. Each worker will perform a' +
      ' task and respond with their results and status. When finished,' +
      ' If no suitable worker is found, then answer this question based on your understanding.' +
      ' respond with FINISH.';

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      new MessagesPlaceholder('messages'),
      [
        'human',
        'Given the conversation above, who should act next?' +
          ' Or should we FINISH? Select one of: {options}'
      ]
    ]);
    const formattedPrompt = await prompt.partial({
      options: options.join(', '),
      members: getClusterMembersSummary().join(', ')
    });

    const chain = this.llmService
      .getLLM()
      .bindTools([routeTool], { tool_choice: 'route' });
    this.supervisorChain = formattedPrompt.pipe(chain);
  }

  public superviseNode = async (
    state: typeof AgentState.State,
    config?: RunnableConfig
  ) => {
    if (!this.supervisorChain) {
      throw new Error('Supervisor chain is not initialized');
    }
    const res = await this.supervisorChain.invoke(state, config);
    const x = res as AIMessageChunk;
    const toolCall = x.tool_calls?.[0];
    const next = toolCall ? toolCall.args.next : END;
    const message = toolCall ? toolCall.args.message : '';
    return {
      next,
      messages: [
        new AIMessage({
          content: message,
          name: AgentMembers.Supervisor.name
        })
      ]
    };
  };
}
