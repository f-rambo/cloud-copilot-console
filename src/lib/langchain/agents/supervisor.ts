import { END, Annotation } from '@langchain/langgraph';
import {
  ChatPromptTemplate,
  MessagesPlaceholder
} from '@langchain/core/prompts';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { llm } from '@/lib/langchain/llm';
import { z } from 'zod';
import { RunnableConfig } from '@langchain/core/runnables';
import { AgentMembers } from '@/lib/types/agents';

export const members = AgentMembers.map((x) => x.name);
const options = [END, ...members];

const getClusterMembersSummary = (): string[] => {
  return AgentMembers.map(
    (member) => `${member.name}: (${member.description})`
  );
};

// This defines the object that is passed between each node
// in the graph. We will create different nodes for each agent and tool
export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),
  // The agent node that last performed work
  next: Annotation<string>({
    reducer: (x, y) => y ?? x ?? END,
    default: () => END
  })
});

// supervisor prompt
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

const supervisorChain = formattedPrompt
  .pipe(
    llm.bindTools([
      {
        name: 'route',
        description: 'Select the next role and supervisor reply message',
        schema: z.object({
          next: z.enum([END, ...members]).describe('The next role to act'),
          message: z.string().describe('This is the reply from the supervisor.')
        })
      }
    ])
  )
  .pipe((x) => {
    const toolCall = x.tool_calls?.[0];
    const next = toolCall ? toolCall.args.next : END;
    const message = toolCall ? toolCall.args.message : '';
    return {
      next,
      messages: [
        new HumanMessage({
          content: message,
          name: 'Supervisor'
        })
      ]
    };
  });

export const supervisorNode = async (
  state: typeof AgentState.State,
  config?: RunnableConfig
) => {
  return await supervisorChain.invoke(state, config);
};
