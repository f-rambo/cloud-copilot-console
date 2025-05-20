import { START, StateGraph } from '@langchain/langgraph';
import { AgentState } from '@/lib/langchain/agents/supervisor';
import { clusterNode } from '@/lib/langchain/agents/cluster';
import { serviceNode } from '@/lib/langchain/agents/service';
import { supervisorNode } from '@/lib/langchain/agents/supervisor';
import { MemorySaver } from '@langchain/langgraph';

// 1. Create the graph
export const graph = new StateGraph(AgentState)
  // 2. Add the nodes; these will do the work
  .addNode('cluster', clusterNode)
  .addNode('service', serviceNode)
  .addNode('supervisor', supervisorNode)
  // 3. Define the edges. We will define both regular and conditional ones
  // After a worker completes, report to supervisor
  .addEdge('cluster', 'supervisor')
  .addEdge('service', 'supervisor')
  .addConditionalEdges('supervisor', (x: typeof AgentState.State) => x.next)
  .addEdge(START, 'supervisor')
  .compile({ checkpointer: new MemorySaver() });
