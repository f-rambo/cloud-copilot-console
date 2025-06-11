'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface Node {
  id: string;
  type: 'logic' | 'input' | 'output' | 'request';
  title: string;
  value?: string;
  x: number;
  y: number;
}

// 首先定义原始节点的接口类型
interface RawNode {
  id: string;
  type: 'logic' | 'input' | 'output' | 'request';
  title: string;
  value?: string;
}

interface Node extends RawNode {
  x: number;
  y: number;
}

// 节点位置计算函数
const calculateNodePosition = (
  index: number,
  nodeType: string,
  allRawNodes: RawNode[] // 使用正确的类型替代any[]
) => {
  const containerWidth = 1000; // 容器宽度
  const containerHeight = 700; // 容器高度
  const nodeWidth = 160; // 节点宽度
  const nodeHeight = 60; // 节点高度
  const padding = 60; // 边距
  const minSpacing = 20; // 节点间最小间距

  // 根据节点类型分层布局
  const typeLayerMap = {
    logic: 0, // 第一层：逻辑节点
    input: 1, // 第二层：输入节点
    request: 1, // 第二层：请求节点
    output: 2 // 第三层：输出节点
  };

  const layer = typeLayerMap[nodeType as keyof typeof typeLayerMap] || 0;
  const layerWidth = (containerWidth - padding * 2) / 3; // 分为3层

  // 计算同类型节点的数量和当前节点在同类型中的索引
  const sameTypeNodes = allRawNodes.filter((node) => {
    const nodeLayer = typeLayerMap[node.type as keyof typeof typeLayerMap] || 0;
    return nodeLayer === layer;
  });
  const sameTypeIndex = sameTypeNodes.findIndex(
    (node) => node.id === allRawNodes[index].id
  );
  const sameTypeCount = sameTypeNodes.length;

  // X坐标：根据层级分布
  const x = padding + layer * layerWidth;

  // Y坐标：在该层内垂直分布，确保有足够间距
  const availableHeight = containerHeight - padding * 2;
  const totalNodeHeight =
    sameTypeCount * nodeHeight + (sameTypeCount - 1) * minSpacing;

  let y;
  if (totalNodeHeight <= availableHeight) {
    // 如果总高度小于可用高度，均匀分布
    const ySpacing =
      sameTypeCount > 1
        ? (availableHeight - nodeHeight) / (sameTypeCount - 1)
        : availableHeight / 2;
    y =
      padding +
      (sameTypeCount > 1
        ? sameTypeIndex * ySpacing
        : availableHeight / 2 - nodeHeight / 2);
  } else {
    // 如果空间不够，紧密排列
    y = padding + sameTypeIndex * (nodeHeight + minSpacing);
  }

  return {
    x: Math.max(padding, Math.min(x, containerWidth - nodeWidth - padding)),
    y: Math.max(padding, Math.min(y, containerHeight - nodeHeight - padding))
  };
};

// 原始节点数据（不包含x, y坐标）
const rawNodes: RawNode[] = [
  { id: '1', type: 'logic', title: 'Logic' },
  {
    id: '2',
    type: 'input',
    title: 'Input',
    value: 'logic was resolved to TRUE'
  },
  {
    id: '3',
    type: 'input',
    title: 'Input',
    value: 'logic was resolved to FAIL'
  },
  { id: '4', type: 'input', title: 'Input', value: '2500' },
  {
    id: '5',
    type: 'request',
    title: 'Request',
    value: 'https://api.example.com/v1/data'
  },
  { id: '6', type: 'output', title: 'Output', value: '2500' },
  { id: '7', type: 'output', title: 'Output' }
];

// 使用位置计算函数生成完整的节点数据
const nodes: Node[] = rawNodes.map((node, index) => {
  const position = calculateNodePosition(
    index,
    node.type,
    rawNodes // 移除了totalNodes参数
  );
  return {
    ...node,
    x: position.x,
    y: position.y
  };
});

const connections = [
  { from: '1', to: '2' },
  { from: '1', to: '3' },
  { from: '1', to: '4' },
  { from: '1', to: '5' },
  { from: '2', to: '7' },
  { from: '3', to: '7' },
  { from: '4', to: '6' },
  { from: '6', to: '7' },
  { from: '5', to: '7' }
];

const transition = {
  duration: 0.5,
  ease: 'easeInOut'
};

const colors = [
  'rgb(59 130 246)', // blue-500
  'rgb(168 85 247)', // purple-500
  'rgb(34 197 94)', // green-500
  'rgb(245 158 11)', // amber-500
  'rgb(239 68 68)', // red-500
  'rgb(6 182 212)', // cyan-500
  'rgb(236 72 153)', // pink-500
  'rgb(139 69 19)', // orange-600
  'rgb(16 185 129)', // emerald-500
  'rgb(99 102 241)' // indigo-500
];

// 在WorkflowComponent中，更新节点的宽度样式
export function WorkflowComponent() {
  const [connectionColors, setConnectionColors] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Generate random colors only on client side
    const randomColors = connections.map(
      () => colors[Math.floor(Math.random() * colors.length)]
    );
    setConnectionColors(randomColors);
    setIsClient(true);
  }, []);

  const getNodeById = (id: string) => nodes.find((node) => node.id === id);

  const createPath = (
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => {
    const midX = (startX + endX) / 2;
    return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
  };

  return (
    <div className='relative h-[800px] w-full overflow-hidden p-4'>
      <div className='absolute inset-0 grid grid-cols-[repeat(40,1fr)] grid-rows-[repeat(40,1fr)] opacity-10'>
        {Array.from({ length: 1600 }).map((_, i) => (
          <div
            key={i}
            className='border-[0.5px] border-neutral-500/30 dark:border-neutral-600/30'
          />
        ))}
      </div>

      <svg className='pointer-events-none absolute inset-0 size-full'>
        {connections.map((connection, index) => {
          const fromNode = getNodeById(connection.from)!;
          const toNode = getNodeById(connection.to)!;
          const path = createPath(
            fromNode.x + 100,
            fromNode.y + 30,
            toNode.x,
            toNode.y + 30
          );

          // Use a default color during SSR, then switch to random color on client
          const strokeColor =
            isClient && connectionColors[index]
              ? connectionColors[index]
              : 'rgb(156 163 175)'; // gray-400 as fallback

          return (
            <motion.path
              key={index}
              d={path}
              stroke={strokeColor}
              strokeWidth={2}
              fill='none'
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ ...transition, delay: index * 0.1 }}
            />
          );
        })}
      </svg>

      {nodes.map((node) => (
        <motion.div
          key={node.id}
          className='absolute'
          style={{ left: node.x, top: node.y }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: parseInt(node.id) * 0.1 }}
        >
          <Card
            className={cn(
              'w-[160px] border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900', // 宽度从200px改为160px
              node.type === 'logic' && 'border-blue-500 dark:border-blue-400',
              node.type === 'request' &&
                'border-amber-500 dark:border-amber-400',
              node.type === 'input' && 'border-green-500 dark:border-green-400',
              node.type === 'output' &&
                'border-purple-500 dark:border-purple-400'
            )}
          >
            <CardContent className='p-3'>
              {' '}
              {/* padding从p-4改为p-3 */}
              <div className='mb-1 flex items-center gap-2'>
                {' '}
                {/* margin从mb-2改为mb-1 */}
                <div
                  className={cn(
                    'size-2 rounded-full',
                    node.type === 'logic' && 'bg-blue-500',
                    node.type === 'input' && 'bg-green-500',
                    node.type === 'output' && 'bg-purple-500',
                    node.type === 'request' && 'bg-amber-500'
                  )}
                />
                <span className='text-sm text-neutral-600 dark:text-neutral-400'>
                  {node.title}
                </span>
              </div>
              {node.value && (
                <p className='line-clamp-2 text-xs break-all text-neutral-500 dark:text-neutral-500'>
                  {' '}
                  {/* 添加line-clamp-2限制行数 */}
                  {node.value}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
