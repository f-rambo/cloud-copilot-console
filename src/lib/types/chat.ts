export const MessageRoles = {
  Human: 'Human',
  Ai: 'Ai',
  System: 'System'
} as const;

export type MessageRole = (typeof MessageRoles)[keyof typeof MessageRoles];

export interface FormattedMessage {
  id?: string;
  role: MessageRole;
  content: string;
  name?: string;
  thinking: string;
}

export interface MessagesResponse {
  messages: FormattedMessage[];
  total: number;
  error?: string;
}

export interface ChatSession {
  id: string;
  session_id: string;
  user_id: string;
  title?: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}
