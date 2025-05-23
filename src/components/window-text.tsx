'use client';
import { ReactNode, useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

interface TypingTextProps {
  /**
   * Text to type
   */
  text: string;

  /**
   * Delay between typing each character or word (smooth mode) in milliseconds
   * @default 32
   */
  delay?: number;

  /**
   * If true, the text will be erased after typing and then typed again.
   */
  repeat?: boolean;

  /**
   * Custom cursor to show at the end of the text.
   * Applies only when `smooth` is false.
   */
  cursor?: ReactNode;

  /**
   * Additional classes to apply to the container
   */
  className?: string;

  /**
   * If true, the container will grow to fit the text as it types
   */
  grow?: boolean;

  /**
   * Number of characters to keep always visible
   */
  alwaysVisibleCount?: number;

  /**
   * If true, the typing effect will be smooth instead of typing one character at a time.
   * Looks better for multiple words.
   */
  smooth?: boolean;

  /**
   * Time to wait before starting the next cycle of typing
   * Applies only when `repeat` is true.
   *
   * @default 1000
   *
   */
  waitTime?: number;

  /**
   * Callback function to be called when the typing is complete
   */
  onComplete?: () => void;

  /**
   * If true, the cursor will be hidden after typing is complete
   * @default false
   */
  hideCursorOnComplete?: boolean;
}

function Blinker() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setShow((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);
  return <span className={show ? '' : 'opacity-0'}>|</span>;
}

function SmoothEffect({
  words,
  index,
  alwaysVisibleCount
}: {
  words: string[];
  index: number;
  alwaysVisibleCount: number;
}) {
  return (
    <div className='flex flex-wrap whitespace-pre'>
      {words.map((word, wordIndex) => {
        return (
          <span
            key={wordIndex}
            className={cn('transition-opacity duration-300 ease-in-out', {
              'opacity-100': wordIndex < index,
              'opacity-0': wordIndex >= index + alwaysVisibleCount
            })}
          >
            {word}
            {wordIndex < words.length && <span>&nbsp;</span>}
          </span>
        );
      })}
    </div>
  );
}

function NormalEffect({
  text,
  index,
  alwaysVisibleCount
}: {
  text: string;
  index: number;
  alwaysVisibleCount: number;
}) {
  return (
    <>
      {text.slice(
        0,
        Math.max(index, Math.min(text.length, alwaysVisibleCount ?? 1))
      )}
    </>
  );
}

enum TypingDirection {
  Forward = 1,
  Backward = -1
}

function CursorWrapper({
  visible,
  children,
  waiting
}: {
  visible?: boolean;
  waiting?: boolean;
  children: ReactNode;
}): React.ReactElement | null {
  const [on, setOn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setOn((prev) => !prev);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (!visible || (!on && !waiting)) {
    return null; // 确保返回的是 null 而不是 undefined
  }

  return <>{children}</>; // 返回有效的 JSX 元素
}

function Type({
  text,
  repeat,
  cursor,
  delay,
  grow,
  className,
  alwaysVisibleCount,
  smooth,
  waitTime = 1000,
  onComplete,
  hideCursorOnComplete
}: TypingTextProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<TypingDirection>(
    TypingDirection.Forward
  );
  const [isComplete, setIsComplete] = useState(false);

  const words = useMemo(() => text.split(/\s+/), [text]);
  const total = smooth ? words.length : text.length;

  useEffect(() => {
    // eslint-disable-next-line prefer-const
    let interval: NodeJS.Timeout;

    const startTyping = () => {
      setIndex((prevDir) => {
        if (
          direction === TypingDirection.Backward &&
          prevDir === TypingDirection.Forward
        ) {
          clearInterval(interval);
        } else if (
          direction === TypingDirection.Forward &&
          prevDir === total - 1
        ) {
          clearInterval(interval);
        }
        return prevDir + direction;
      });
    };

    interval = setInterval(startTyping, delay);
    return () => clearInterval(interval);
  }, [total, direction, delay]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (index >= total && repeat) {
      timeout = setTimeout(() => {
        setDirection(-1);
      }, waitTime);
    }

    if (index <= 0 && repeat) {
      timeout = setTimeout(() => {
        setDirection(1);
      }, waitTime);
    }
    return () => clearTimeout(timeout);
  }, [index, total, repeat, waitTime]);

  useEffect(() => {
    if (index === total && !repeat) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [index, total, repeat, onComplete]);

  const waitingNextCycle = index === total || index === 0;

  return (
    <div className={cn('relative font-mono', className)}>
      {!grow && <div className='invisible'>{text}</div>}
      <div
        className={cn({
          'absolute inset-0 size-full': !grow
        })}
      >
        {smooth ? (
          <SmoothEffect
            words={words}
            index={index}
            alwaysVisibleCount={alwaysVisibleCount ?? 1}
          />
        ) : (
          <NormalEffect
            text={text}
            index={index}
            alwaysVisibleCount={alwaysVisibleCount ?? 1}
          />
        )}
        <CursorWrapper
          waiting={waitingNextCycle}
          visible={Boolean(
            !smooth && cursor && (!hideCursorOnComplete || !isComplete)
          )}
        >
          {cursor}
        </CursorWrapper>
      </div>
    </div>
  );
}

function TypingText({
  text,
  repeat = true,
  cursor = <Blinker />,
  delay = 32,
  className,
  grow = false,
  alwaysVisibleCount = 1,
  smooth = false,
  waitTime,
  onComplete,
  hideCursorOnComplete = false
}: TypingTextProps) {
  return (
    <Type
      key={text}
      delay={delay ?? 32}
      waitTime={waitTime ?? 1000}
      grow={grow}
      repeat={repeat}
      text={text}
      cursor={cursor}
      className={className}
      smooth={smooth}
      alwaysVisibleCount={alwaysVisibleCount}
      onComplete={onComplete}
      hideCursorOnComplete={hideCursorOnComplete}
    />
  );
}

export function WinTypingText() {
  return (
    <div className='border-border flex flex-col rounded-xl border bg-gray-100 lg:col-span-2 dark:border-zinc-600 dark:bg-zinc-700'>
      {/** Window */}
      <div className='border-border flex gap-1.5 border-b p-4 dark:border-zinc-600'>
        <span className='size-3 transform rounded-full bg-red-500 transition-transform duration-150 hover:scale-110' />
        <span className='size-3 transform rounded-full bg-yellow-500 transition-transform duration-150 hover:scale-110' />
        <span className='size-3 transform rounded-full bg-green-500 transition-transform duration-150 hover:scale-110' />
      </div>
      {/** Code */}
      <div className='group w-full p-4 font-mono text-sm'>
        <div className='mt-2 line-clamp-1'>
          <span className='font-medium text-yellow-600 dark:text-yellow-500'>
            import
          </span>{' '}
          <span className='transition-all group-hover:animate-pulse group-hover:text-blue-600 dark:group-hover:text-blue-400'>
            TypingText
          </span>{' '}
          <span className='font-medium text-yellow-600 dark:text-yellow-500'>
            from
          </span>{' '}
          &quot;@/components/typing-text&quot;
        </div>

        <TypingText
          className='my-2 w-full'
          text='<TypingText text="Here is Our Animation Components" />'
        />
      </div>
    </div>
  );
}
