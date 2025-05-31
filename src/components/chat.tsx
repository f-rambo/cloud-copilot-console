'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Send, Bot, Plus, History, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Markdown } from '@/components/ui/markdown';
import { FormattedMessage, MessageRoles } from '@/lib/types/chat';
import { ChatSession } from '@/lib/types/chat';
import { useAuth } from '@/contexts/auth-context';

export function CardsChat() {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const [messages, setMessages] = React.useState([
    {
      role: MessageRoles.Ai,
      content: 'Hi, how can I help you today?',
      thinking: ''
    }
  ] as FormattedMessage[]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);
  const [currentThinking, setCurrentThinking] = React.useState('');

  // 聊天会话相关状态
  const [chatSessions, setChatSessions] = React.useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = React.useState(false);
  const [currentSessionId, setCurrentSessionId] = React.useState('');
  const [currentUserId, setCurrentUserId] = React.useState('');
  const [historyListOpen, setHistoryListOpen] = React.useState(false);
  const inputLength = input.trim().length;

  React.useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
      if (!currentSessionId) {
        setCurrentSessionId(`session_${user.id}_${Date.now()}`);
      }
    }
  }, [user, currentSessionId]);

  const setFirtstAiMessage = () => {
    setMessages([
      {
        role: MessageRoles.Ai,
        content: 'Hi, how can I help you today?',
        thinking: ''
      }
    ]);
  };

  // 获取聊天会话列表
  const fetchChatSessions = async (userId: string) => {
    if (!userId) return;
    setIsLoadingSessions(true);
    try {
      const response = await fetch(`/api/chat/v1/sessions?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setChatSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const switchToSession = async (sessionId: string, userId: string) => {
    if (!userId) return;
    setCurrentSessionId(sessionId);
    try {
      const response = await fetch(
        `/api/chat/v1/msg?sessionId=${sessionId}&userId=${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch session messages:', error);
    }
  };

  // 创建新会话
  const createNewSession = async (title?: string) => {
    if (!currentUserId) return;
    if (title === undefined) {
      title = 'Untitled Chat';
    }
    const newSessionId = `session_${currentUserId}_${Date.now()}`;
    try {
      const response = await fetch('/api/chat/v1/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: newSessionId,
          userId: currentUserId,
          title: title
        })
      });
      if (response.ok) {
        setCurrentSessionId(newSessionId);
        fetchChatSessions(currentUserId);
      }
    } catch (error) {
      console.error('Failed to create new session:', error);
    }
  };

  // 删除会话
  const deleteSession = async (sessionId: string, userId: string) => {
    if (!userId || !sessionId) return;
    try {
      const response = await fetch(
        `/api/chat/v1/session?sessionId=${sessionId}&userId=${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.ok) {
        fetchChatSessions(userId);
        if (sessionId === currentSessionId) {
          createNewSession();
          setFirtstAiMessage();
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inputLength === 0) return;

    if (messages.length === 1 && messages[0].role === MessageRoles.Ai) {
      createNewSession(input);
    }

    const userMessage = {
      role: MessageRoles.Human,
      content: input,
      thinking: ''
    };

    setMessages((prev) => [...prev, userMessage as FormattedMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);
    setCurrentThinking('');

    const assistantMessageIndex = messages.length + 1;
    setMessages(
      (prev) =>
        [
          ...prev,
          {
            role: MessageRoles.Ai,
            content: '',
            thinking: ''
          }
        ] as FormattedMessage[]
    );

    try {
      const response = await fetch('/api/chat/v1/mock-msg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input,
          sessionId: currentSessionId,
          userId: currentUserId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let currentMessage = '';
      let isThinking = false;
      let thinkingContent = '';
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim();

                if (!jsonStr || jsonStr === '[DONE]') {
                  if (jsonStr === '[DONE]') break;
                  continue;
                }

                if (!jsonStr.startsWith('{') && !jsonStr.startsWith('[')) {
                  console.warn('Skipping non-JSON data:', jsonStr);
                  continue;
                }

                const data = JSON.parse(jsonStr);

                if (data.content) {
                  const content = data.content;

                  if (
                    typeof content === 'string' &&
                    content.includes('<think>')
                  ) {
                    isThinking = true;
                    thinkingContent = '';
                    continue;
                  }

                  if (
                    typeof content === 'string' &&
                    content.includes('</think>')
                  ) {
                    isThinking = false;
                    setCurrentThinking('');
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      if (newMessages[assistantMessageIndex]) {
                        newMessages[assistantMessageIndex] = {
                          ...newMessages[assistantMessageIndex],
                          thinking: thinkingContent.trim()
                        };
                      }
                      return newMessages;
                    });
                    continue;
                  }

                  if (isThinking) {
                    thinkingContent += content;
                    setCurrentThinking(thinkingContent);
                    continue;
                  }

                  currentMessage += content;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    if (newMessages[assistantMessageIndex]) {
                      newMessages[assistantMessageIndex] = {
                        ...newMessages[assistantMessageIndex],
                        content: currentMessage
                      };
                    }
                    return newMessages;
                  });
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
                console.error('Problematic line:', line);
                console.error('JSON string:', line.slice(6).trim());
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error calling AI:', error);
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages[assistantMessageIndex]) {
          newMessages[assistantMessageIndex] = {
            role: MessageRoles.Ai,
            content: 'Sorry, something went wrong. Please try again.',
            thinking: ''
          };
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setCurrentThinking('');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Sheet>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button variant='outline' size='icon'>
                <Bot />
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Chat bot</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <SheetContent className='!w-[33vw] !max-w-[33vw]' side='right'>
        <SheetHeader className='flex flex-row items-center justify-between'>
          <div className='flex items-center gap-2'>
            <SheetTitle>Cloud copilot</SheetTitle>
          </div>
          <div className='mr-6 flex items-center gap-2'>
            <Button
              variant='outline'
              size='icon'
              onClick={() => {
                setFirtstAiMessage();
              }}
            >
              <Plus className='h-4 w-4' />
            </Button>

            <DropdownMenu
              open={historyListOpen}
              onOpenChange={(open) => {
                setHistoryListOpen(open);
                if (open && currentUserId) {
                  fetchChatSessions(currentUserId);
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='icon'>
                  <History className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-80' align='start'>
                {isLoadingSessions ? (
                  <DropdownMenuItem disabled>
                    <span className='text-muted-foreground text-sm'>
                      Loading...
                    </span>
                  </DropdownMenuItem>
                ) : chatSessions.length > 0 ? (
                  chatSessions.map((session) => (
                    <DropdownMenuItem
                      key={session.session_id}
                      className='flex cursor-pointer items-center justify-between p-3'
                      onSelect={(e) => e.preventDefault()}
                    >
                      <div
                        className='flex min-w-0 flex-1 flex-col items-start'
                        onClick={() => {
                          switchToSession(session.session_id, currentUserId);
                          setHistoryListOpen(false);
                        }}
                      >
                        <div className='w-full truncate text-sm font-medium'>
                          {session.title || 'Untitled Chat'}
                        </div>
                        <div className='text-muted-foreground mt-1 text-xs'>
                          {new Date(session.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='hover:bg-destructive hover:text-destructive-foreground h-8 w-8 p-0'
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.session_id, currentUserId);
                        }}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    <span className='text-muted-foreground text-sm'>
                      No chat history
                    </span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SheetHeader>
        <div className='mb-2 max-h-[calc(100vh-8rem)] flex-1 overflow-y-auto p-4'>
          <div className='mt-5 space-y-4'>
            {messages.map((message, index) => (
              <React.Fragment key={index}>
                <div
                  className={cn(
                    'flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm',
                    message.role === MessageRoles.Human
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  )}
                >
                  {message.role === MessageRoles.Human ? (
                    <div className='whitespace-pre-wrap'>{message.content}</div>
                  ) : (
                    <Markdown>{message.content}</Markdown>
                  )}
                </div>
                {message.role === MessageRoles.Human &&
                  messages[index + 1]?.thinking && (
                    <div className='bg-muted/50 max-h-[150px] overflow-y-auto rounded-lg p-3 text-sm italic'>
                      Thinking:{' '}
                      <Markdown>{messages[index + 1].thinking}</Markdown>
                    </div>
                  )}
              </React.Fragment>
            ))}
            {currentThinking && (
              <div className='bg-muted/50 max-h-[100px] overflow-y-auto rounded-lg p-3 text-sm italic'>
                Thinking: <Markdown>{currentThinking}</Markdown>
              </div>
            )}
            {isTyping && (
              <div className='bg-muted w-16 rounded-lg p-2 text-center'>
                <span className='animate-pulse'>...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <SheetFooter>
          <form
            onSubmit={handleSubmit}
            className='flex w-full items-center space-x-2'
          >
            <Input
              id='message'
              placeholder='Type your message...'
              className='flex-1'
              autoComplete='off'
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isLoading}
            />
            <Button
              type='submit'
              size='icon'
              disabled={inputLength === 0 || isLoading}
            >
              <Send />
              <span className='sr-only'>Send</span>
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
