import {
  HumanMessage,
  AIMessage,
  SystemMessage
} from '@langchain/core/messages';

// 角色接口定义
export interface MessageRoles {
  Human: 'Human';
  Ai: 'Ai';
  System: 'System';
}

// 角色类型
export type MessageRole = MessageRoles[keyof MessageRoles];

// 联合类型
export type ChatMessage = HumanMessage | AIMessage | SystemMessage;

// 格式化后的消息接口（用于API返回）
export interface FormattedMessage {
  id?: string;
  role: MessageRole;
  content: string;
  name?: string;
  thinking: string;
}

// 消息列表响应接口
export interface MessagesResponse {
  messages: FormattedMessage[];
  total: number;
  error?: string;
}

// 聊天会话接口
export interface ChatSession {
  sessionId: string;
  userId: string;
  messages: ChatMessage[];
}
