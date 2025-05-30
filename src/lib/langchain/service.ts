import { ChatOpenAI } from '@langchain/openai';

interface LangChainServiceConfig {
  model?: string;
}

export class LangChainService {
  private llm!: ChatOpenAI;
  private model: string;

  constructor(config: LangChainServiceConfig = {}) {
    this.model = config.model || 'gpt-4';

    this.initializeLLM();
  }

  private initializeLLM() {
    this.llm = new ChatOpenAI({
      model: this.model,
      temperature: 0,
      maxRetries: 5,
      streaming: true,
      apiKey: process.env.OPENAI_API_KEY,
      configuration: {
        baseURL: process.env.OPENAI_API_BASE_URL,
        timeout: 60000
      }
    });
  }

  public getLLM() {
    return this.llm;
  }
}
