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
  LoaderIcon,
  AlertCircleIcon,
  SearchIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ColumnsIcon
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import {
  ContinuousIntegrationsRequest,
  ContinuousIntegrations,
  ContinuousIntegration,
  Workflow
} from '@/lib/types/service';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface ContinuousIntegrationTableProps {
  serviceId?: number; // 改为可选
}

export function ContinuousIntegrationTable({
  serviceId
}: ContinuousIntegrationTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [ciData, setCiData] = React.useState<ContinuousIntegrations>({
    continuous_integrations: [],
    total: 0
  });
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10
  });
  // 添加搜索状态
  const [versionSearch, setVersionSearch] = React.useState('');
  const [searchInput, setSearchInput] = React.useState('');

  const router = useRouter();
  const { user } = useAuth();

  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [selectedCI, setSelectedCI] =
    React.useState<ContinuousIntegration | null>(null);

  // 获取持续集成列表的函数
  const fetchContinuousIntegrations = React.useCallback(async () => {
    if (!user?.token) {
      return;
    }

    setLoading(true);
    try {
      const params: ContinuousIntegrationsRequest = {
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize
      };

      // 只有当serviceId存在时才添加service_id参数
      if (serviceId !== undefined && serviceId !== null) {
        params.service_id = serviceId;
      }

      // 添加version搜索参数
      if (versionSearch.trim()) {
        params.version = versionSearch.trim();
      }

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
        `/api/server/service/continuousintegrations?${queryString}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`
          }
        }
      );
      if (!response.ok) {
        throw new Error('Get continuous integrations list error');
      }

      const data: ContinuousIntegrations = await response.json();
      setCiData(data);
    } catch (error) {
      console.error(error);
      toast.error('Get continuous integrations list error');
    } finally {
      setLoading(false);
    }
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    serviceId,
    versionSearch,
    user?.token
  ]);

  // 初始加载和依赖变化时重新获取数据
  React.useEffect(() => {
    fetchContinuousIntegrations();
  }, [fetchContinuousIntegrations]);

  const handleSearch = () => {
    setVersionSearch(searchInput);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return (
          <Badge variant='outline' className='border-green-600 text-green-600'>
            <CheckCircle2Icon className='mr-1 h-3 w-3' />
            {status}
          </Badge>
        );
      case 'running':
      case 'pending':
        return (
          <Badge variant='outline' className='border-blue-600 text-blue-600'>
            <LoaderIcon className='mr-1 h-3 w-3 animate-spin' />
            {status}
          </Badge>
        );
      case 'failed':
      case 'error':
        return (
          <Badge variant='outline' className='border-red-600 text-red-600'>
            <AlertCircleIcon className='mr-1 h-3 w-3' />
            {status}
          </Badge>
        );
      default:
        return (
          <Badge variant='outline' className='border-gray-600 text-gray-600'>
            {status}
          </Badge>
        );
    }
  };

  const columns: ColumnDef<ContinuousIntegration>[] = [
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
      accessorKey: 'version',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Version
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className='font-medium'>{row.getValue('version')}</div>
      )
    },
    {
      accessorKey: 'branch',
      header: 'Branch',
      cell: ({ row }) => {
        const branch = row.getValue('branch') as string;
        return (
          <Badge variant='secondary' className='font-mono text-xs'>
            {branch}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'tag',
      header: 'Tag',
      cell: ({ row }) => {
        const tag = row.getValue('tag') as string;
        if (!tag) {
          return <span className='text-muted-foreground'>No tag</span>;
        }
        return (
          <Badge variant='outline' className='font-mono text-xs'>
            {tag}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return getStatusBadge(status);
      }
    },
    {
      accessorKey: 'workflow',
      header: 'Workflow',
      cell: ({ row }) => {
        const workflow = row.original.workflow;
        if (!workflow) {
          return <span className='text-muted-foreground'>No workflow</span>;
        }

        const formatWorkflow = (workflow: Workflow) => {
          const details = [];
          details.push(`Name: ${workflow.name}`);
          details.push(`Type: ${workflow.workflow_type}`);
          details.push(`Namespace: ${workflow.namespace}`);
          if (workflow.description) {
            details.push(`Description: ${workflow.description}`);
          }
          if (workflow.workflow_steps && workflow.workflow_steps.length > 0) {
            details.push(`Steps: ${workflow.workflow_steps.length}`);
          }
          return details.join('\n');
        };

        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Badge
                variant='outline'
                className='cursor-help border-blue-600 text-blue-600'
              >
                {workflow.name}
              </Badge>
            </HoverCardTrigger>
            <HoverCardContent className='w-80'>
              <div className='space-y-2 text-xs'>
                <div className='font-medium'>Workflow Details:</div>
                <div className='whitespace-pre-line'>
                  {formatWorkflow(workflow)}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      }
    },
    {
      accessorKey: 'logs',
      header: 'Logs',
      cell: ({ row }) => {
        const logs = row.getValue('logs') as string;
        if (!logs) {
          return <span className='text-muted-foreground'>No logs</span>;
        }

        const truncatedLogs =
          logs.length > 50 ? logs.substring(0, 50) + '...' : logs;

        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className='max-w-[200px] cursor-help truncate font-mono text-xs'>
                {truncatedLogs}
              </div>
            </HoverCardTrigger>
            <HoverCardContent className='w-96'>
              <div className='space-y-2'>
                <div className='text-sm font-medium'>Build Logs:</div>
                <div className='max-h-60 overflow-y-auto rounded bg-gray-50 p-2 font-mono text-xs whitespace-pre-wrap'>
                  {logs}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      }
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
        const ci = row.original;

        const DeleteConfirm = () => {
          return (
            <AlertDialog
              open={showDeleteDialog && selectedCI?.id === ci.id}
              onOpenChange={(open) => {
                setShowDeleteDialog(open);
                if (!open) setSelectedCI(null);
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Are you sure you want to delete this continuous integration?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete continuous integration
                    version {ci.version} and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      if (!user?.token) {
                        return;
                      }
                      try {
                        const response = await fetch(
                          `/api/server/service/continuousintegration?id=${ci.id}`,
                          {
                            method: 'DELETE',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${user?.token}`
                            }
                          }
                        );

                        if (!response.ok) {
                          throw new Error(
                            'Delete continuous integration failed'
                          );
                        }

                        toast.success(
                          `Continuous integration ${ci.version} deleted successfully`
                        );
                        fetchContinuousIntegrations();
                        setShowDeleteDialog(false);
                        setSelectedCI(null);
                      } catch (error) {
                        console.error(error);
                        toast.error('Delete continuous integration failed');
                      }
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          );
        };

        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 p-0'>
                  <span className='sr-only'>Menu</span>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(ci.id.toString())
                  }
                >
                  Copy ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    // Navigate to CI detail page
                    router.push(`/home/project/service/ci/${ci.id}`);
                  }}
                >
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    // Navigate to CI logs page
                    router.push(`/home/project/service/ci/logs?ciid=${ci.id}`);
                  }}
                >
                  View Logs
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className='text-red-600'
                  onClick={() => {
                    setSelectedCI(ci);
                    setShowDeleteDialog(true);
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DeleteConfirm />
          </>
        );
      }
    }
  ];

  // 计算总页数
  const pageCount = Math.ceil(ciData.total / pagination.pageSize);

  const table = useReactTable({
    data: ciData.continuous_integrations,
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
        {/* 添加搜索框 */}
        <div className='flex flex-1 items-center gap-2'>
          <Input
            placeholder='Search version...'
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className='max-w-sm'
          />
          <Button onClick={handleSearch} variant='outline' size='sm'>
            <SearchIcon className='mr-2 h-4 w-4' />
          </Button>
        </div>

        <Button
          onClick={() => {
            // Navigate to create CI page
            const createUrl = serviceId
              ? `/home/project/service/ci/create?serviceid=${serviceId}`
              : '/home/project/service/ci/create';
            router.push(createUrl);
          }}
        >
          Go Build
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>
              <ColumnsIcon className='mr-2 h-4 w-4' />
              Columns
              <ChevronDownIcon className='ml-2 h-4 w-4' />
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
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
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
                  <LoaderIcon className='mx-auto h-6 w-6 animate-spin' />
                  <div className='mt-2'>Loading continuous integrations...</div>
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
                  No continuous integrations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-between space-x-2 py-4'>
        <div className='text-muted-foreground flex-1 text-sm'>
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className='flex items-center space-x-6 lg:space-x-8'>
          <div className='flex items-center space-x-2'>
            <p className='text-sm font-medium'>Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className='h-8 w-[70px]'>
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
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
          <div className='flex w-[100px] items-center justify-center text-sm font-medium'>
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              className='hidden h-8 w-8 p-0 lg:flex'
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className='sr-only'>Go to first page</span>
              <ChevronsLeftIcon className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className='sr-only'>Go to previous page</span>
              <ChevronLeftIcon className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className='sr-only'>Go to next page</span>
              <ChevronRightIcon className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='hidden h-8 w-8 p-0 lg:flex'
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className='sr-only'>Go to last page</span>
              <ChevronsRightIcon className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
