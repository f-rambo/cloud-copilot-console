import { START, StateGraph } from '@langchain/langgraph';
import { InMemoryStore } from '@langchain/langgraph';
import { AgentState } from '@/lib/types/agents';
import { ClusterAgent } from '@/lib/langchain/agents/cluster';
import { ServiceAgent } from '@/lib/langchain/agents/service';
import { SupervisorAgent } from '@/lib/langchain/agents/supervisor';
import { LangChainService } from '@/lib/langchain/service';
import { AgentMembers } from '@/lib/types/agents';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

export class LangchainStateGraph {
  private clusterAgent!: ClusterAgent;
  private serviceAgent!: ServiceAgent;
  private supervisorAgent!: SupervisorAgent;
  private sessionId: string;
  private checkpointer: PostgresSaver;

  constructor(sessionId: string, checkpointer: PostgresSaver) {
    this.sessionId = sessionId;
    this.checkpointer = checkpointer;
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
      .addNode(AgentMembers.ClusterAgent.name, this.clusterAgent.clusterNode)
      .addNode(AgentMembers.ServiceAgent.name, this.serviceAgent.serviceNode)
      .addNode(
        AgentMembers.ServiceAgent.name,
        this.supervisorAgent.superviseNode
      )
      .addEdge(AgentMembers.ClusterAgent.name, AgentMembers.ServiceAgent.name)
      .addEdge(AgentMembers.ServiceAgent.name, AgentMembers.ServiceAgent.name)
      .addConditionalEdges(
        AgentMembers.ServiceAgent.name,
        (x: typeof AgentState.State) => x.next
      )
      .addEdge(START, AgentMembers.ServiceAgent.name);
    const graph = workflow.compile({
      checkpointer: this.checkpointer,
      store: new InMemoryStore()
    });
    return graph;
  }
}
