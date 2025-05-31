import { Pool } from 'pg';
import { ChatSession } from '@/lib/types/chat';
import { ensureLangchainDatabase } from '@/lib/langchain/checkpoint';

export class ChatSessionManager {
  private pool: Pool;
  private schema: string = 'langchain';

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.POSTGRESQL + '/langchain'
    });
  }

  async initializeTable(): Promise<void> {
    await ensureLangchainDatabase();

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.schema}.chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255) NOT NULL UNIQUE,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(500),
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      );
      
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON ${this.schema}.chat_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON ${this.schema}.chat_sessions(session_id);
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_deleted ON ${this.schema}.chat_sessions(is_deleted);
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON ${this.schema}.chat_sessions(created_at);
    `;

    await this.pool.query(createTableQuery);
  }

  async createSession(
    sessionId: string,
    userId: string,
    title?: string
  ): Promise<ChatSession> {
    const query = `
      INSERT INTO ${this.schema}.chat_sessions (session_id, user_id, title)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const result = await this.pool.query(query, [sessionId, userId, title]);
    return result.rows[0];
  }

  async getUserSessions(
    userId: string,
    includeDeleted: boolean = false
  ): Promise<ChatSession[]> {
    let query = `
      SELECT * FROM ${this.schema}.chat_sessions 
      WHERE user_id = $1
    `;

    if (!includeDeleted) {
      query += ' AND is_deleted = FALSE';
    }

    query += ' ORDER BY updated_at DESC';

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  // 根据session_id获取会话
  async getSessionById(sessionId: string): Promise<ChatSession | null> {
    const query = `
      SELECT * FROM ${this.schema}.chat_sessions 
      WHERE session_id = $1 AND is_deleted = FALSE;
    `;

    const result = await this.pool.query(query, [sessionId]);
    return result.rows[0] || null;
  }

  // 更新会话标题
  async updateSessionTitle(
    sessionId: string,
    title: string
  ): Promise<ChatSession | null> {
    const query = `
      UPDATE ${this.schema}.chat_sessions 
      SET title = $1, updated_at = CURRENT_TIMESTAMP
      WHERE session_id = $2 AND is_deleted = FALSE
      RETURNING *;
    `;

    const result = await this.pool.query(query, [title, sessionId]);
    return result.rows[0] || null;
  }

  // 软删除会话
  async deleteSession(sessionId: string): Promise<boolean> {
    const query = `
      UPDATE ${this.schema}.chat_sessions 
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE session_id = $1 AND is_deleted = FALSE;
    `;

    const result = await this.pool.query(query, [sessionId]);
    return (result.rowCount ?? 0) > 0;
  }

  // 恢复已删除的会话
  async restoreSession(sessionId: string): Promise<boolean> {
    const query = `
      UPDATE ${this.schema}.chat_sessions 
      SET is_deleted = FALSE, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE session_id = $1 AND is_deleted = TRUE;
    `;

    const result = await this.pool.query(query, [sessionId]);
    return (result.rowCount ?? 0) > 0;
  }

  // 永久删除会话
  async permanentDeleteSession(sessionId: string): Promise<boolean> {
    const query = `
      DELETE FROM ${this.schema}.chat_sessions 
      WHERE session_id = $1;
    `;

    const result = await this.pool.query(query, [sessionId]);
    return (result.rowCount ?? 0) > 0;
  }

  // 清理过期的已删除会话（例如删除30天前的记录）
  async cleanupDeletedSessions(daysOld: number = 30): Promise<number> {
    const query = `
      DELETE FROM ${this.schema}.chat_sessions 
      WHERE is_deleted = TRUE 
      AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days';
    `;

    const result = await this.pool.query(query);
    return result.rowCount ?? 0;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

let chatSessionManagerInstance: ChatSessionManager | null = null;

export async function getChatSessionManager(): Promise<ChatSessionManager> {
  if (!chatSessionManagerInstance) {
    chatSessionManagerInstance = new ChatSessionManager();
    await chatSessionManagerInstance.initializeTable();
  }
  return chatSessionManagerInstance;
}
