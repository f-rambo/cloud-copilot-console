import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div
      className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <pre className='bg-muted overflow-x-auto rounded-md p-4'>
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className='bg-muted rounded px-1 py-0.5 text-sm' {...props}>
                {children}
              </code>
            );
          },
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary hover:underline'
              {...props}
            >
              {children}
            </a>
          ),
          table: ({ children, ...props }) => (
            <div className='overflow-x-auto'>
              <table
                className='border-border min-w-full border-collapse border'
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th
              className='border-border bg-muted border px-4 py-2 text-left font-medium'
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className='border-border border px-4 py-2' {...props}>
              {children}
            </td>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote
              className='border-primary text-muted-foreground border-l-4 pl-4 italic'
              {...props}
            >
              {children}
            </blockquote>
          )
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
