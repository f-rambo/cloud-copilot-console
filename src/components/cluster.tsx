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
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
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
import { ClusterListArgs, ClusterList, Cluster } from '@/lib/types/cluster';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

export function ClusterTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [clusterData, setClusterData] = React.useState<ClusterList>({
    clusters: [],
    total: 0
  });
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10
  });
  const [nameFilter, setNameFilter] = React.useState('');
  const router = useRouter();
  const { user } = useAuth();

  // 获取集群列表的函数
  const fetchClusters = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: ClusterListArgs = {
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        ...(nameFilter && { name: nameFilter })
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

      const response = await fetch(`/api/server/cluster/list?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        }
      });
      if (!response.ok) {
        throw new Error('Get cluster list error');
      }

      const data: ClusterList = await response.json();
      setClusterData(data);
    } catch (error) {
      console.error(error);
      toast.error('Get cluster list error');
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, nameFilter, user?.token]);

  // 初始加载和依赖变化时重新获取数据
  React.useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  // 处理名称过滤
  const handleNameFilterChange = React.useCallback((value: string) => {
    setNameFilter(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 })); // 重置到第一页
  }, []);

  const columns: ColumnDef<Cluster>[] = [
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
        <div className='capitalize'>
          <Button
            variant='link'
            onClick={() => {
              router.push(
                `/dashboard/cluster/detail?clusterid=${row.getValue('id')}`
              );
            }}
          >
            {row.getValue('name')}
          </Button>{' '}
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className='capitalize'>{row.getValue('status')}</div>
      )
    },
    {
      accessorKey: 'provider',
      header: 'Provider',
      cell: ({ row }) => (
        <div className='capitalize'>{row.getValue('provider')}</div>
      )
    },
    {
      accessorKey: 'region',
      header: 'Region'
    },
    {
      accessorKey: 'api_server_address',
      header: 'API Server Address',
      cell: ({ row }) => (
        <div className='font-mono text-sm'>
          {row.getValue('api_server_address')}
        </div>
      )
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const cluster = row.original;

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
                  navigator.clipboard.writeText(cluster.id.toString())
                }
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  router.push(
                    `/dashboard/cluster/detail?clusterid=${cluster.id}`
                  );
                }}
              >
                Detail
              </DropdownMenuItem>
              <DropdownMenuItem>Edit</DropdownMenuItem>
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
  const pageCount = Math.ceil(clusterData.total / pagination.pageSize);

  const table = useReactTable({
    data: clusterData.clusters,
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
          placeholder='By Cluster name...'
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
          onClick={() => router.push('/dashboard/cluster/create')}
        >
          <PlusIcon />
          <span className='hidden lg:inline'>Add Cluster</span>
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
          row, {clusterData.total} rows in total
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
