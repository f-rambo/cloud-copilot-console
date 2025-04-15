'use client';

import * as React from 'react';
import { Send, Bot, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';

export function CardsChat() {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const [messages, setMessages] = React.useState([
    {
      role: 'agent',
      content: 'Hi, how can I help you today?'
    },
    {
      role: 'user',
      content: "Hey, I'm having trouble with my account."
    },
    {
      role: 'agent',
      content: 'What seems to be the problem?'
    },
    {
      role: 'user',
      content: "I can't log in."
    }
  ]);
  const [input, setInput] = React.useState('');
  const inputLength = input.trim().length;

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

      <SheetContent>
        <SheetHeader>
          <SheetTitle>Cloud Copilot bot chat</SheetTitle>
          <SheetDescription>Lets chat</SheetDescription>
          <div className='mt-3 flex flex-row items-center'>
            <div className='flex items-center space-x-4'>
              <Avatar>
                <AvatarImage src='https://github.com/shadcn.png' alt='Image' />
                <AvatarFallback>OM</AvatarFallback>
              </Avatar>
              <div>
                <p className='text-sm leading-none font-medium'>Sofia Davis</p>
                <p className='text-muted-foreground text-sm'>m@example.com</p>
              </div>
            </div>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size='icon'
                    variant='outline'
                    className='ml-auto rounded-full'
                    onClick={() => setMessages([])}
                  >
                    <Eraser />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={10}>Clear message</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </SheetHeader>
        <div className='mb-2 max-h-[calc(100vh-8rem)] flex-1 overflow-y-auto p-4'>
          <div className='mt-5 space-y-4'>
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                )}
              >
                {message.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <SheetFooter>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (inputLength === 0) return;
              setMessages([
                ...messages,
                {
                  role: 'user',
                  content: input
                }
              ]);
              setInput('');
            }}
            className='flex w-full items-center space-x-2'
          >
            <Input
              id='message'
              placeholder='Type your message...'
              className='flex-1'
              autoComplete='off'
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <Button type='submit' size='icon' disabled={inputLength === 0}>
              <Send />
              <span className='sr-only'>Send</span>
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
