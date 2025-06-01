'use client';

import React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState
} from '@tanstack/react-table';
import { TrendingUpIcon, ArrowUpDown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { Separator } from '@/components/ui/separator';
import { Cluster, Node, NodeGroup } from '@/lib/types/cluster';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { ChartAreaInteractive } from '@/components/cluster-chart-area-interactive';

// Node columns definition
const nodeColumns: ColumnDef<Node>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <div>{row.getValue('id')}</div>
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
    cell: ({ row }) => {
      return <NodeTableCellViewer item={row.original} />;
    }
  },
  {
    accessorKey: 'ip',
    header: 'IP Address',
    cell: ({ row }) => <div>{row.getValue('ip')}</div>
  },
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }) => <div>{row.getValue('user')}</div>
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => <div className='capitalize'>{row.getValue('role')}</div>
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <div className='capitalize'>{row.getValue('status')}</div>
    )
  },
  {
    accessorKey: 'instance_id',
    header: 'Instance ID',
    cell: ({ row }) => <div>{row.getValue('instance_id')}</div>
  }
];

// NodeGroup columns definition
const nodeGroupColumns: ColumnDef<NodeGroup>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <div>{row.getValue('id')}</div>
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
    cell: ({ row }) => <div>{row.getValue('name')}</div>
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => <div className='capitalize'>{row.getValue('type')}</div>
  },
  {
    accessorKey: 'os',
    header: 'OS',
    cell: ({ row }) => <div>{row.getValue('os')}</div>
  },
  {
    accessorKey: 'arch',
    header: 'Architecture',
    cell: ({ row }) => <div>{row.getValue('arch')}</div>
  },
  {
    accessorKey: 'cpu',
    header: 'CPU',
    cell: ({ row }) => <div>{row.getValue('cpu')} cores</div>
  },
  {
    accessorKey: 'memory',
    header: 'Memory',
    cell: ({ row }) => <div>{row.getValue('memory')} GB</div>
  },
  {
    accessorKey: 'target_size',
    header: 'Target Size',
    cell: ({ row }) => <div>{row.getValue('target_size')}</div>
  }
];

export function ClusterDetails({ clusterId }: { clusterId: string }) {
  const [cluster, setCluster] = React.useState<Cluster | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [nodeSorting, setNodeSorting] = React.useState<SortingState>([]);
  const [nodeColumnFilters, setNodeColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [nodeColumnVisibility, setNodeColumnVisibility] =
    React.useState<VisibilityState>({});
  const [nodeGroupSorting, setNodeGroupSorting] = React.useState<SortingState>(
    []
  );
  const [nodeGroupColumnFilters, setNodeGroupColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [nodeGroupColumnVisibility, setNodeGroupColumnVisibility] =
    React.useState<VisibilityState>({});

  const { user } = useAuth();

  // Fetch cluster details
  const fetchClusterDetails = React.useCallback(async () => {
    if (!clusterId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/server/cluster?id=${clusterId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token && { Authorization: `Bearer ${user.token}` })
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cluster details');
      }

      const data: Cluster = await response.json();
      setCluster(data);
    } catch (error) {
      console.error('Error fetching cluster details:', error);
      toast.error('Failed to load cluster details');
    } finally {
      setLoading(false);
    }
  }, [clusterId, user?.token]);

  React.useEffect(() => {
    fetchClusterDetails();
  }, [fetchClusterDetails]);

  // Node table configuration
  const nodeTable = useReactTable({
    data: cluster?.nodes || [],
    columns: nodeColumns,
    onSortingChange: setNodeSorting,
    onColumnFiltersChange: setNodeColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setNodeColumnVisibility,
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    state: {
      sorting: nodeSorting,
      columnFilters: nodeColumnFilters,
      columnVisibility: nodeColumnVisibility
    }
  });

  // NodeGroup table configuration
  const nodeGroupTable = useReactTable({
    data: cluster?.node_groups || [],
    columns: nodeGroupColumns,
    onSortingChange: setNodeGroupSorting,
    onColumnFiltersChange: setNodeGroupColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setNodeGroupColumnVisibility,
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    state: {
      sorting: nodeGroupSorting,
      columnFilters: nodeGroupColumnFilters,
      columnVisibility: nodeGroupColumnVisibility
    }
  });

  if (loading) {
    return <div className='p-6'>Loading cluster details...</div>;
  }

  if (!cluster) {
    return <div className='p-6'>Cluster not found</div>;
  }

  return (
    <div>
      <div className='space-y-1'>
        <h4 className='text-sm leading-none font-medium'>{cluster.name}</h4>
        <p className='text-muted-foreground text-sm'>
          {cluster.provider} provider cluster in {cluster.region || 'local'}
        </p>
      </div>
      <Separator className='my-4' />
      {/* Cluster Resource Information */}
      <div className='flex h-5 items-center space-x-4 text-sm'>
        <div>CPU: {cluster.cluster_resource.cpu} cores</div>
        <Separator orientation='vertical' />
        <div>Memory: {cluster.cluster_resource.memory} GB</div>
        <Separator orientation='vertical' />
        <div>GPU: {cluster.cluster_resource.gpu}</div>
        <Separator orientation='vertical' />
        <div>Disk: {cluster.cluster_resource.disk} GB</div>
        <Separator orientation='vertical' />
        <div>Node Groups: ({cluster.node_groups.length})</div>
        <Separator orientation='vertical' />
        <div>Nodes: ({cluster.nodes.length})</div>
      </div>

      <div className='my-4'>
        <ChartAreaInteractive />
      </div>

      {/* Node Groups Table */}
      <div className='my-4'>
        <div className='w-full'>
          <div className='flex items-center py-4'>
            <Input
              placeholder='Filter node groups by name...'
              value={
                (nodeGroupTable
                  .getColumn('name')
                  ?.getFilterValue() as string) ?? ''
              }
              onChange={(event) =>
                nodeGroupTable
                  .getColumn('name')
                  ?.setFilterValue(event.target.value)
              }
              className='max-w-sm'
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' className='ml-auto'>
                  Columns <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {nodeGroupTable
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
          </div>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                {nodeGroupTable.getHeaderGroups().map((headerGroup) => (
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
                {nodeGroupTable.getRowModel().rows?.length ? (
                  nodeGroupTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
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
                      colSpan={nodeGroupColumns.length}
                      className='h-24 text-center'
                    >
                      No node groups found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className='flex items-center justify-end space-x-2 py-4'>
            <div className='text-muted-foreground flex-1 text-sm'>
              Page {nodeGroupTable.getState().pagination.pageIndex + 1} of{' '}
              {nodeGroupTable.getPageCount()}
            </div>
            <div className='space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => nodeGroupTable.previousPage()}
                disabled={!nodeGroupTable.getCanNextPage()}
              >
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => nodeGroupTable.nextPage()}
                disabled={!nodeGroupTable.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Nodes Table */}
      <div className='my-4'>
        <div className='w-full'>
          <div className='flex items-center py-4'>
            <Input
              placeholder='Filter nodes by name...'
              value={
                (nodeTable.getColumn('name')?.getFilterValue() as string) ?? ''
              }
              onChange={(event) =>
                nodeTable.getColumn('name')?.setFilterValue(event.target.value)
              }
              className='max-w-sm'
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' className='ml-auto'>
                  Columns <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {nodeTable
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
          </div>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                {nodeTable.getHeaderGroups().map((headerGroup) => (
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
                {nodeTable.getRowModel().rows?.length ? (
                  nodeTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
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
                      colSpan={nodeColumns.length}
                      className='h-24 text-center'
                    >
                      No nodes found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className='flex items-center justify-end space-x-2 py-4'>
            <div className='text-muted-foreground flex-1 text-sm'>
              Page {nodeTable.getState().pagination.pageIndex + 1} of{' '}
              {nodeTable.getPageCount()}
            </div>
            <div className='space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => nodeTable.previousPage()}
                disabled={!nodeTable.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => nodeTable.nextPage()}
                disabled={!nodeTable.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 }
];

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'var(--primary)'
  },
  mobile: {
    label: 'Mobile',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

function NodeTableCellViewer({ item }: { item: Node }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='link' className='text-foreground w-fit px-0 text-left'>
          {item.name}
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='flex flex-col p-3'>
        <SheetHeader className='gap-1'>
          <SheetTitle>{item.name}</SheetTitle>
          <SheetDescription>
            Showing total visitors for the last 6 months
          </SheetDescription>
        </SheetHeader>
        <div className='flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm'>
          <ChartContainer config={chartConfig}>
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 0,
                right: 10
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='month'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
                hide
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator='dot' />}
              />
              <Area
                dataKey='mobile'
                type='natural'
                fill='var(--color-mobile)'
                fillOpacity={0.6}
                stroke='var(--color-mobile)'
                stackId='a'
              />
              <Area
                dataKey='desktop'
                type='natural'
                fill='var(--color-desktop)'
                fillOpacity={0.4}
                stroke='var(--color-desktop)'
                stackId='a'
              />
            </AreaChart>
          </ChartContainer>
          <Separator />
          <div className='grid gap-2'>
            <div className='flex gap-2 leading-none font-medium'>
              Trending up by 5.2% this month{' '}
              <TrendingUpIcon className='size-4' />
            </div>
            <div className='text-muted-foreground'>
              Showing total visitors for the last 6 months. This is just some
              random text to test the layout. It spans multiple lines and should
              wrap around.
            </div>
          </div>
          <Separator />
        </div>
      </SheetContent>
    </Sheet>
  );
}
