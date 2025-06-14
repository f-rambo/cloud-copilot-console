'use client';

import * as React from 'react';
import { Server, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClusterListArgs, ClusterList, Cluster } from '@/lib/types/cluster';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

interface ClusterSelectProps {
  onSelect?: (cluster: Cluster) => void;
  selectedClusterId?: number;
}

export function ClusterSelect({
  onSelect,
  selectedClusterId
}: ClusterSelectProps) {
  const [loading, setLoading] = React.useState(false);
  const [clusterData, setClusterData] = React.useState<ClusterList>({
    clusters: [],
    total: 0
  });
  const [searchValue, setSearchValue] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize] = React.useState(1);
  const { user } = useAuth();

  // 获取集群列表的函数
  const fetchClusters = React.useCallback(
    async (name?: string, page: number = 1) => {
      if (!user?.token) {
        return;
      }

      setLoading(true);
      try {
        const params: ClusterListArgs = {
          page,
          page_size: pageSize,
          ...(name && { name })
        };

        const queryString = new URLSearchParams(
          Object.entries(params)
            .filter(
              ([key, value]) =>
                value !== undefined &&
                value !== '' &&
                key !== undefined &&
                key !== ''
            )
            .map(([key, value]) => [key, value.toString()])
        ).toString();

        const response = await fetch(
          `/api/server/cluster/list?${queryString}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('获取集群列表失败');
        }

        const data: ClusterList = await response.json();
        setClusterData(data);
      } catch (error) {
        console.error(error);
        toast.error('获取集群列表失败');
      } finally {
        setLoading(false);
      }
    },
    [pageSize, user?.token]
  );

  // 初始加载
  React.useEffect(() => {
    fetchClusters(searchValue, currentPage);
  }, [fetchClusters, searchValue, currentPage]);

  // 处理搜索
  const handleSearch = React.useCallback((value: string) => {
    setSearchValue(value);
    setCurrentPage(1); // 搜索时重置到第一页
  }, []);

  // 处理集群选择
  const handleClusterSelect = React.useCallback(
    (cluster: Cluster) => {
      onSelect?.(cluster);
    },
    [onSelect]
  );

  // 获取状态显示样式
  const getStatusBadge = (status: string) => {
    const statusMap = {
      running: { variant: 'default' as const, text: '运行中' },
      creating: { variant: 'secondary' as const, text: '创建中' },
      starting: { variant: 'secondary' as const, text: '启动中' },
      stopping: { variant: 'secondary' as const, text: '停止中' },
      stopped: { variant: 'outline' as const, text: '已停止' },
      deleted: { variant: 'destructive' as const, text: '已删除' },
      error: { variant: 'destructive' as const, text: '错误' },
      unspecified: { variant: 'outline' as const, text: '未指定' }
    };

    const statusInfo =
      statusMap[status as keyof typeof statusMap] || statusMap.unspecified;
    return (
      <Badge variant={statusInfo.variant} className='text-xs'>
        {statusInfo.text}
      </Badge>
    );
  };

  // 计算分页信息
  const totalPages = Math.ceil(clusterData.total / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <Command className='rounded-lg border shadow-md md:min-w-[450px]'>
      <CommandInput
        placeholder='搜索集群名称...'
        value={searchValue}
        onValueChange={handleSearch}
      />
      <CommandList>
        {loading ? (
          <div className='flex items-center justify-center p-4'>
            <div className='text-muted-foreground text-sm'>加载中...</div>
          </div>
        ) : (
          <>
            <CommandEmpty>未找到匹配的集群</CommandEmpty>
            {clusterData.clusters.length > 0 && (
              <CommandGroup heading={`集群列表 (${clusterData.total} 个)`}>
                {clusterData.clusters.map((cluster) => (
                  <CommandItem
                    key={cluster.id}
                    value={cluster.name}
                    onSelect={() => handleClusterSelect(cluster)}
                    className={`flex items-center justify-between p-3 ${
                      selectedClusterId === cluster.id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className='flex items-center space-x-3'>
                      <Server className='h-4 w-4' />
                      <div className='flex flex-col'>
                        <span className='font-medium'>{cluster.name}</span>
                        <span className='text-muted-foreground text-xs'>
                          {cluster.provider} • {cluster.region} •{' '}
                          {cluster.node_number} 节点
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      {getStatusBadge(cluster.status)}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>

      {/* 分页控制 */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between border-t px-4 py-2'>
          <div className='text-muted-foreground text-xs'>
            第 {currentPage} 页，共 {totalPages} 页
          </div>
          <div className='flex items-center space-x-1'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={!hasPrevPage || loading}
            >
              <ChevronLeft className='h-3 w-3' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={!hasNextPage || loading}
            >
              <ChevronRight className='h-3 w-3' />
            </Button>
          </div>
        </div>
      )}
    </Command>
  );
}
