'use client';

import * as React from 'react';
import { Send, Bot, Plus, History } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { ChatOllama } from '@langchain/ollama';
import { ChatPromptTemplate } from '@langchain/core/prompts';

// role
// - system : 系统消息，用于设置AI助手的行为和角色定位
// - user : 用户的输入消息
// - assistant : AI助手的回复消息
// - agent : AI助手的内部消息，用于指示AI助手的行为和状态
// - function : AI助手的内部消息，用于指示AI助手调用函数
// - tool : AI助手的内部消息，用于指示AI助手调用工具
const Systemrole = 'system';
const Userrole = 'user';
// const Assistantrole = 'assistant';
const Agentrole = 'agent';

export function CardsChat() {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const llm = new ChatOllama({
    model: 'deepseek-r1:7b',
    temperature: 0,
    maxRetries: 2
  });

  const [messages, setMessages] = React.useState([
    {
      role: Agentrole,
      content: 'Hi, how can I help you today?',
      thinking: ''
    }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);
  const [currentThinking, setCurrentThinking] = React.useState('');
  const inputLength = input.trim().length;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inputLength === 0) return;

    setMessages((prev) => [
      ...prev,
      {
        role: Userrole,
        content: input,
        thinking: ''
      }
    ]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const systemTemplate =
        'You are a helpful assistant that translates {input_language} to {output_language}.';
      const prompt = ChatPromptTemplate.fromMessages([
        [Systemrole, systemTemplate],
        [Userrole, '{input}']
      ]);
      const chain = prompt.pipe(llm);

      const stream = await chain.stream({
        input_language: 'English',
        output_language: 'German',
        input: input
      });

      let currentMessage = '';
      let isThinking = false;
      let thinkingContent = '';

      for await (const chunk of stream) {
        if (chunk.content) {
          const content = chunk.content;

          if (typeof content === 'string' && content.includes('<think>')) {
            isThinking = true;
            thinkingContent = '';
            continue;
          }

          if (typeof content === 'string' && content.includes('</think>')) {
            isThinking = false;
            setCurrentThinking('');
            if (!currentMessage) {
              setMessages((prev) => [
                ...prev,
                {
                  role: Agentrole,
                  content: '',
                  thinking: thinkingContent.trim()
                }
              ]);
            }
            continue;
          }

          if (isThinking) {
            thinkingContent += content;
            setCurrentThinking(thinkingContent);
            continue;
          }

          currentMessage += content;
          setMessages((prev) => [
            ...prev.slice(0, -1),
            {
              role: Agentrole,
              content: currentMessage,
              thinking: thinkingContent.trim()
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Error calling AI:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: Agentrole,
          content: 'sorry, something went wrong',
          thinking: ''
        }
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
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
            <Button variant='outline' size='icon'>
              <Plus className='h-4 w-4' />
            </Button>
            <Button variant='outline' size='icon'>
              <History className='h-4 w-4' />
            </Button>
          </div>
        </SheetHeader>
        <div className='mb-2 max-h-[calc(100vh-8rem)] flex-1 overflow-y-auto p-4'>
          <div className='mt-5 space-y-4'>
            {messages.map((message, index) => (
              <React.Fragment key={index}>
                <div
                  className={cn(
                    'flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm',
                    message.role === Userrole
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  )}
                >
                  {message.content}
                </div>
                {message.role === Userrole && messages[index + 1]?.thinking && (
                  <div className='bg-muted/50 max-h-[150px] overflow-y-auto rounded-lg p-3 text-sm italic'>
                    Thinking: {messages[index + 1].thinking}
                  </div>
                )}
              </React.Fragment>
            ))}
            {currentThinking && (
              <div className='bg-muted/50 max-h-[100px] overflow-y-auto rounded-lg p-3 text-sm italic'>
                Thinking: {currentThinking}
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
