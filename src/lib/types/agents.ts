import { END, Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';

interface AgentMember {
  ClusterAgent: AgentMemberDetails;
  ServiceAgent: AgentMemberDetails;
  Supervisor: AgentMemberDetails;
}

interface AgentMemberDetails {
  name: string;
  description: string;
}

export const AgentMembers: AgentMember = {
  ClusterAgent: {
    name: 'ClusterAgent',
    description: 'A cluster of machines that can be used to run jobs.'
  },
  ServiceAgent: {
    name: 'ServiceAgent',
    description: 'A service that can be used to run jobs.'
  },
  Supervisor: {
    name: 'Supervisor',
    description: 'A supervisor that can be used to run jobs.'
  }
};

export const members = Object.values(AgentMembers)
  .filter((x) => x.name !== AgentMembers.ServiceAgent.name)
  .map((x) => x.name);

export const options = [END, ...members];

export const getClusterMembersSummary = (): string[] => {
  return Object.values(AgentMembers).map(
    (member) => member.name + ':' + member.description
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
