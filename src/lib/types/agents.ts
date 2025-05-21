export interface AgentMember {
  name: string;
  description: string;
}

export const ClusterAgent = 'ClusterAgent';
export const ServiceAgent = 'ServiceAgent';
export const Supervisor = 'Supervisor';

export const AgentMembers: AgentMember[] = [
  {
    name: ClusterAgent,
    description: 'A cluster of machines that can be used to run jobs.'
  },
  {
    name: ServiceAgent,
    description: 'A service that can be used to run jobs.'
  }
];
