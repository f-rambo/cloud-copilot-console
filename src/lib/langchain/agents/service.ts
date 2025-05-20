import { RunnableConfig } from '@langchain/core/runnables';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { AgentState } from '@/lib/langchain/agents/supervisor';
import { serviceListTool } from '@/lib/langchain/tools/service';
import { llm } from '@/lib/langchain/llm';
import { ServiceAgent } from '@/lib/types/agents';

export const serviceAgent = createReactAgent({
  llm,
  tools: [serviceListTool],
  stateModifier: new SystemMessage(
    'You are a service administrator. You can use service tools to view and manage the service.'
  )
});

export const serviceNode = async (
  state: typeof AgentState.State,
  config?: RunnableConfig
) => {
  const result = await serviceAgent.invoke(state, config);
  const lastMessage = result.messages[result.messages.length - 1];
  return {
    messages: [
      new HumanMessage({ content: lastMessage.content, name: ServiceAgent })
    ]
  };
};
