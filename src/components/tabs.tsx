'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

type Tab = {
  title: string;
  value: string;
  content?: string | React.ReactNode | any;
};

export const Tabs = ({
  tabs: propTabs,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName
}: {
  tabs: Tab[];
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
  contentClassName?: string;
}) => {
  const [active, setActive] = useState<Tab>(propTabs[0]);
  const [tabs, setTabs] = useState<Tab[]>(propTabs);

  const moveSelectedTabToTop = (idx: number) => {
    const newTabs = [...propTabs];
    const selectedTab = newTabs.splice(idx, 1);
    newTabs.unshift(selectedTab[0]);
    setTabs(newTabs);
    setActive(newTabs[0]);
  };

  const [hovering, setHovering] = useState(false);

  return (
    <>
      <div
        className={cn(
          'no-visible-scrollbar relative flex w-full max-w-full flex-row items-center justify-start overflow-auto [perspective:1000px] sm:overflow-visible',
          containerClassName
        )}
      >
        {propTabs.map((tab, idx) => (
          <button
            key={tab.title}
            onClick={() => {
              moveSelectedTabToTop(idx);
            }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            className={cn('relative rounded-full px-4 py-2', tabClassName)}
            style={{
              transformStyle: 'preserve-3d'
            }}
          >
            {active.value === tab.value && (
              <motion.div
                layoutId='clickedbutton'
                transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                className={cn(
                  'absolute inset-0 rounded-full bg-gray-200 dark:bg-zinc-800',
                  activeTabClassName
                )}
              />
            )}

            <span className='relative block text-black dark:text-white'>
              {tab.title}
            </span>
          </button>
        ))}
      </div>
      <FadeInDiv
        tabs={tabs}
        active={active}
        key={active.value}
        hovering={hovering}
        className={cn('mt-32', contentClassName)}
      />
    </>
  );
};

export const FadeInDiv = ({
  className,
  tabs,
  hovering
}: {
  className?: string;
  key?: string;
  tabs: Tab[];
  active: Tab;
  hovering?: boolean;
}) => {
  const isActive = (tab: Tab) => {
    return tab.value === tabs[0].value;
  };
  return (
    <div className='relative h-full w-full'>
      {tabs.map((tab, idx) => (
        <motion.div
          key={tab.value}
          layoutId={tab.value}
          style={{
            scale: 1 - idx * 0.1,
            top: hovering ? idx * -50 : 0,
            zIndex: -idx,
            opacity: idx < 3 ? 1 - idx * 0.1 : 0
          }}
          animate={{
            y: isActive(tab) ? [0, 40, 0] : 0
          }}
          className={cn('absolute top-0 left-0 h-full w-full', className)}
        >
          {tab.content}
        </motion.div>
      ))}
    </div>
  );
};

export function TabsDemo() {
  const tabs = [
    {
      title: 'Product',
      value: 'product',
      content: (
        <div className='relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-purple-700 to-violet-900 p-10 text-xl font-bold text-white md:text-4xl'>
          <p>Product Tab</p>
          <DummyContent />
        </div>
      )
    },
    {
      title: 'Services',
      value: 'services',
      content: (
        <div className='relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-purple-700 to-violet-900 p-10 text-xl font-bold text-white md:text-4xl'>
          <p>Services tab</p>
          <DummyContent />
        </div>
      )
    },
    {
      title: 'Playground',
      value: 'playground',
      content: (
        <div className='relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-purple-700 to-violet-900 p-10 text-xl font-bold text-white md:text-4xl'>
          <p>Playground tab</p>
          <DummyContent />
        </div>
      )
    },
    {
      title: 'Content',
      value: 'content',
      content: (
        <div className='relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-purple-700 to-violet-900 p-10 text-xl font-bold text-white md:text-4xl'>
          <p>Content tab</p>
          <DummyContent />
        </div>
      )
    },
    {
      title: 'Random',
      value: 'random',
      content: (
        <div className='relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-purple-700 to-violet-900 p-10 text-xl font-bold text-white md:text-4xl'>
          <p>Random tab</p>
          <DummyContent />
        </div>
      )
    }
  ];

  return (
    <div className='b relative mx-auto my-40 flex h-[20rem] w-full max-w-5xl flex-col items-start justify-start [perspective:1000px] md:h-[40rem]'>
      <Tabs tabs={tabs} />
    </div>
  );
}

const DummyContent = () => {
  return (
    <div className='absolute inset-x-0 -bottom-10 mx-auto h-[60%] w-[90%] rounded-xl object-cover object-left-top md:h-[90%]'>
      DummyContent
    </div>
  );
};
