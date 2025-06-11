'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  MoreHorizontal,
  CheckCircle2Icon,
  LoaderIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  PlusIcon
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import {
  WorkspaceListParam,
  WorkspaceList,
  Workspace,
  ResourceQuota
} from '@/lib/types/workspace';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';
import { ClusterIdsArgs, Cluster, ClusterList } from '@/lib/types/cluster';

export function WorkspaceTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [workspaceData, setWorkspaceData] = React.useState<WorkspaceList>({
    items: [],
    total: 0
  });
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10
  });
  const [nameFilter, setNameFilter] = React.useState('');
  const [clusters, setClusters] = React.useState<Cluster[]>([]);
  const loadedClusterIdsRef = React.useRef<Set<number>>(new Set());
  const router = useRouter();
  const { user } = useAuth();

  const fetchClustersByIds = async (ids: number[]) => {
    if (!user?.token) {
      return;
    }
    if (ids.length === 0) {
      return;
    }

    // 过滤出尚未加载的集群 ID
    const unloadedIds = ids.filter(
      (id) => !loadedClusterIdsRef.current.has(id)
    );
    if (unloadedIds.length === 0) {
      return; // 所有集群 ID 都已加载，无需再次调用接口
    }

    try {
      const params: ClusterIdsArgs = {
        ids: unloadedIds
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
      const response = await fetch(`/api/server/cluster/ids?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      });
      if (!response.ok) {
        throw new Error('Get workspace list error');
      }
      const data: ClusterList = await response.json();
      // 更新已加载的集群 ID 集合
      unloadedIds.forEach((id) => loadedClusterIdsRef.current.add(id));
      // 合并新旧数据，避免覆盖
      setClusters((prevClusters) => {
        const newClusterMap = new Map(data.clusters.map((c) => [c.id, c]));
        const existingClusters = prevClusters.filter(
          (c) => !newClusterMap.has(c.id)
        );
        return [...existingClusters, ...data.clusters];
      });
    } catch (error) {
      console.error(error);
      toast.error('Get workspace list error');
    }
  };

  // 获取工作空间列表的函数
  const fetchWorkspaces = React.useCallback(async () => {
    if (!user?.token) {
      return;
    }

    setLoading(true);
    try {
      const params: WorkspaceListParam = {
        workspace_name: nameFilter,
        page: pagination.pageIndex + 1,
        size: pagination.pageSize
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
        `/api/server/workspace/list?${queryString}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`
          }
        }
      );
      if (!response.ok) {
        throw new Error('Get workspace list error');
      }

      const data: WorkspaceList = await response.json();
      setWorkspaceData(data);
    } catch (error) {
      console.error(error);
      toast.error('Get workspace list error');
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, nameFilter, user?.token]);

  // 初始加载和依赖变化时重新获取数据
  React.useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // 处理名称过滤
  const handleNameFilterChange = React.useCallback((value: string) => {
    setNameFilter(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 })); // 重置到第一页
  }, []);

  const columns: ColumnDef<Workspace>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
        />
      ),
      enableSorting: false,
      enableHiding: false
    },
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <div className='font-mono text-sm'>{row.getValue('id')}</div>
      )
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className='capitalize'>{row.getValue('name')}</div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant='outline'
          className='text-muted-foreground flex gap-1 px-1.5 capitalize [&_svg]:size-3'
        >
          {row.original.status === 'active' ? (
            <CheckCircle2Icon className='text-green-500 dark:text-green-400' />
          ) : (
            <LoaderIcon />
          )}
          {row.getValue('status')}
        </Badge>
      )
    },
    {
      accessorKey: 'resource_quota',
      header: 'Resource Quota',
      cell: ({ row }) => {
        const quota = row.original.resource_quota;
        if (!quota) {
          return <span className='text-muted-foreground'>Not set</span>;
        }

        const formatQuota = (quota: ResourceQuota) => {
          const parts = [];
          if (quota.cpu)
            parts.push(`CPU: ${quota.cpu.request}/${quota.cpu.limit}`);
          if (quota.memory)
            parts.push(`Memory: ${quota.memory.request}/${quota.memory.limit}`);
          if (quota.gpu)
            parts.push(`GPU: ${quota.gpu.request}/${quota.gpu.limit}`);
          if (quota.storage)
            parts.push(
              `Storage: ${quota.storage.request}/${quota.storage.limit}`
            );
          if (quota.pods)
            parts.push(`Pods: ${quota.pods.request}/${quota.pods.limit}`);
          return parts.join(', ');
        };

        const formatDetailedQuota = (quota: ResourceQuota) => {
          const details = [];
          if (quota.cpu)
            details.push(
              `CPU:\n  Request: ${quota.cpu.request}\n  Limit: ${quota.cpu.limit}`
            );
          if (quota.memory)
            details.push(
              `Memory:\n  Request: ${quota.memory.request}\n  Limit: ${quota.memory.limit}`
            );
          if (quota.gpu)
            details.push(
              `GPU:\n  Request: ${quota.gpu.request}\n  Limit: ${quota.gpu.limit}`
            );
          if (quota.storage)
            details.push(
              `Storage:\n  Request: ${quota.storage.request}\n  Limit: ${quota.storage.limit}`
            );
          if (quota.pods)
            details.push(
              `Pods:\n  Request: ${quota.pods.request}\n  Limit: ${quota.pods.limit}`
            );
          return details.join('\n\n');
        };

        const shortDisplay = formatQuota(quota);
        const truncatedDisplay =
          shortDisplay.length > 50
            ? shortDisplay.substring(0, 25) + '...'
            : shortDisplay;

        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className='cursor-help truncate font-mono text-xs'>
                {truncatedDisplay || 'No limits'}
              </div>
            </HoverCardTrigger>
            <HoverCardContent className='w-30'>
              <div className='text-xs whitespace-pre-line'>
                {formatDetailedQuota(quota)}
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      }
    },
    {
      accessorKey: 'cluster_relationships',
      header: 'Clusters',
      cell: ({ row }) => {
        // fetchClustersByIds()

        const clusterIds: number[] = row.original.cluster_relationships.map(
          (relationship) => relationship.cluster_id
        );

        if (clusterIds.length === 0) {
          return (
            <Badge variant='outline' className='text-muted-foreground px-1.5'>
              0 clusters
            </Badge>
          );
        }

        return (
          <HoverCard
            onOpenChange={(e) => {
              if (e && clusterIds.length > 0) {
                fetchClustersByIds(clusterIds);
              }
            }}
          >
            <HoverCardTrigger asChild>
              <Badge
                variant='outline'
                className='text-muted-foreground cursor-help px-1.5'
              >
                {clusterIds?.length || 0} clusters
              </Badge>
            </HoverCardTrigger>
            <HoverCardContent className='w-80'>
              <div className='space-y-2 text-xs'>
                {clusters.map((cluster) => (
                  <div key={cluster.id} className='flex items-center gap-2'>
                    <span className='font-medium'>ID: {cluster.id}</span>
                    <span>Name: {cluster.name}</span>
                  </div>
                ))}
                {clusters.length === 0 && (
                  <div className='text-muted-foreground'>No clusters found</div>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      }
    },
    {
      accessorKey: 'git_repository',
      header: 'Git Repository',
      cell: ({ row }) => (
        <div className='max-w-[200px] truncate font-mono text-sm'>
          {row.getValue('git_repository') || 'Not configured'}
        </div>
      )
    },
    {
      accessorKey: 'image_repository',
      header: 'Image Repository',
      cell: ({ row }) => (
        <div className='max-w-[200px] truncate font-mono text-sm'>
          {row.getValue('image_repository') || 'Not configured'}
        </div>
      )
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const description = row.getValue('description') as string;
        const displayText = description || 'No description';
        const truncatedText =
          displayText.length > 30
            ? displayText.substring(0, 30) + '...'
            : displayText;

        if (!description || description.length <= 30) {
          return <div className='max-w-[200px] truncate'>{displayText}</div>;
        }

        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className='max-w-[200px] cursor-help truncate'>
                {truncatedText}
              </div>
            </HoverCardTrigger>
            <HoverCardContent className='w-80'>
              <div className='text-sm break-words whitespace-pre-wrap'>
                {description}
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      }
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const workspace = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Action</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(workspace.id.toString())
                }
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  router.push(`workspace/create?workspaceid=` + workspace.id);
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className='text-red-600'>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  // 计算总页数
  const pageCount = Math.ceil(workspaceData.total / pagination.pageSize);

  const table = useReactTable({
    data: workspaceData.items,
    columns,
    pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true, // 启用手动分页
    manualFiltering: true // 启用手动过滤
  });

  return (
    <div className='w-full'>
      <div className='flex items-center gap-2 py-4'>
        <Input
          placeholder='By Workspace name...'
          value={nameFilter}
          onChange={(event) => handleNameFilterChange(event.target.value)}
          className='max-w-sm'
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' className='ml-auto'>
              <ColumnsIcon />
              <span className='hidden lg:inline'>Custom columns</span>
              <span className='lg:hidden'>column</span>
              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className='capitalize'
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant='outline'
          size='sm'
          onClick={() => router.push('workspace/create')}
        >
          <PlusIcon />
          <span className='hidden lg:inline'>Add Workspace</span>
        </Button>
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader className='bg-muted sticky top-0 z-10'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No data yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-between p-3 px-4'>
        <div className='text-muted-foreground hidden flex-1 text-sm lg:flex'>
          Already selected {table.getFilteredSelectedRowModel().rows.length}{' '}
          row, {workspaceData.total} rows in total
        </div>
        <div className='flex w-full items-center gap-8 lg:w-fit'>
          <div className='hidden items-center gap-2 lg:flex'>
            <Label htmlFor='rows-per-page' className='text-sm font-medium'>
              Rows per page
            </Label>
            <Select
              value={`${pagination.pageSize}`}
              onValueChange={(value) => {
                setPagination((prev) => ({
                  ...prev,
                  pageSize: Number(value),
                  pageIndex: 0 // 重置到第一页
                }));
              }}
            >
              <SelectTrigger className='w-20' id='rows-per-page'>
                <SelectValue placeholder={pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side='top'>
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex w-fit items-center justify-center text-sm font-medium'>
            {pagination.pageIndex + 1} page {pageCount} of
          </div>
          <div className='ml-auto flex items-center gap-2 lg:ml-0'>
            <Button
              variant='outline'
              className='hidden h-8 w-8 p-0 lg:flex'
              onClick={() =>
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }
              disabled={pagination.pageIndex === 0 || loading}
            >
              <span className='sr-only'>Jump to first page </span>
              <ChevronsLeftIcon />
            </Button>
            <Button
              variant='outline'
              className='size-8'
              size='icon'
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  pageIndex: prev.pageIndex - 1
                }))
              }
              disabled={pagination.pageIndex === 0 || loading}
            >
              <span className='sr-only'>Previous page</span>
              <ChevronLeftIcon />
            </Button>
            <Button
              variant='outline'
              className='size-8'
              size='icon'
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  pageIndex: prev.pageIndex + 1
                }))
              }
              disabled={pagination.pageIndex >= pageCount - 1 || loading}
            >
              <span className='sr-only'>Next page</span>
              <ChevronRightIcon />
            </Button>
            <Button
              variant='outline'
              className='hidden size-8 lg:flex'
              size='icon'
              onClick={() =>
                setPagination((prev) => ({ ...prev, pageIndex: pageCount - 1 }))
              }
              disabled={pagination.pageIndex >= pageCount - 1 || loading}
            >
              <span className='sr-only'>Jump to the last page</span>
              <ChevronsRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
