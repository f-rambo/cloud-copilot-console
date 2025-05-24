import { END, Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';

export interface AgentMember {
  name: string;
  description: string;
}

export const Cluster = 'ClusterAgent' as const;
export const Service = 'ServiceAgent' as const;
export const Supervisor = 'Supervisor' as const;

export const AgentMembers: AgentMember[] = [
  {
    name: Cluster,
    description: 'A cluster of machines that can be used to run jobs.'
  },
  {
    name: Service,
    description: 'A service that can be used to run jobs.'
  }
];

export const members = AgentMembers.map((x) => x.name);
export const options = [END, ...members];

export const getClusterMembersSummary = (): string[] => {
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
