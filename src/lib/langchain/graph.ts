import { START, StateGraph } from '@langchain/langgraph';
import { AgentState } from '@/lib/langchain/agents/supervisor';
import { clusterNode } from '@/lib/langchain/agents/cluster';
import { serviceNode } from '@/lib/langchain/agents/service';
import { supervisorNode } from '@/lib/langchain/agents/supervisor';
import { MemorySaver } from '@langchain/langgraph';
import { ClusterAgent, ServiceAgent, Supervisor } from '@/lib/types/agents';

// 1. Create the graph
export const graph = new StateGraph(AgentState)
  // 2. Add the nodes; these will do the work
  .addNode(ClusterAgent, clusterNode)
  .addNode(ServiceAgent, serviceNode)
  .addNode(Supervisor, supervisorNode)
  // 3. Define the edges. We will define both regular and conditional ones
  // After a worker completes, report to supervisor
  .addEdge(ClusterAgent, Supervisor)
  .addEdge(ServiceAgent, Supervisor)
  .addConditionalEdges(Supervisor, (x: typeof AgentState.State) => x.next)
  .addEdge(START, Supervisor)
  .compile({ checkpointer: new MemorySaver() });
