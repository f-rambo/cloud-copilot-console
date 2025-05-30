import { START, StateGraph } from '@langchain/langgraph';
import { InMemoryStore } from '@langchain/langgraph';
import { AgentState } from '@/lib/types/agents';
import { ClusterAgent } from '@/lib/langchain/agents/cluster';
import { ServiceAgent } from '@/lib/langchain/agents/service';
import { SupervisorAgent } from '@/lib/langchain/agents/supervisor';
import { LangChainService } from '@/lib/langchain/service';
import { Cluster, Service, Supervisor } from '@/lib/types/agents';
import { getCheckpointer } from '@/lib/langchain/checkpoint';

export class LangchainStateGraph {
  private clusterAgent!: ClusterAgent;
  private serviceAgent!: ServiceAgent;
  private supervisorAgent!: SupervisorAgent;
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.initialize();
  }

  private initialize() {
    const llmService = new LangChainService();
    this.clusterAgent = new ClusterAgent(llmService, this.sessionId);
    this.serviceAgent = new ServiceAgent(llmService);
    this.supervisorAgent = new SupervisorAgent(llmService);
  }

  public async App() {
    const workflow = new StateGraph(AgentState)
      .addNode(Cluster, this.clusterAgent.clusterNode)
      .addNode(Service, this.serviceAgent.serviceNode)
      .addNode(Supervisor, this.supervisorAgent.superviseNode)
      .addEdge(Cluster, Supervisor)
      .addEdge(Service, Supervisor)
      .addConditionalEdges(Supervisor, (x: typeof AgentState.State) => x.next)
      .addEdge(START, Supervisor);
    const graph = workflow.compile({
      checkpointer: await getCheckpointer(),
      store: new InMemoryStore()
    });
    return graph;
  }
}
