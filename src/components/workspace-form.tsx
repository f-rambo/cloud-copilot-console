'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Workspace, WorkspaceClusterRelationship } from '@/lib/types/workspace';
import { ResourceQuota } from '@/lib/types/common';
import { ClusterListArgs, Cluster, ClusterList } from '@/lib/types/cluster';
import { useAuth } from '@/contexts/auth-context';
import { Check, ChevronDown, X } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

// Kubernetes name validation regex
const k8sNameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

// Resource validation schema
const resourceLimitSchema = z.object({
  request: z
    .number()
    .min(0, { message: 'Request must be a non-negative number' }),
  limit: z.number().min(0, { message: 'Limit must be a non-negative number' }),
  used: z.number().min(0, { message: 'Used must be a non-negative number' })
});

// Resource quota validation schema
const resourceQuotaSchema = z.object({
  cpu: resourceLimitSchema,
  memory: resourceLimitSchema,
  gpu: resourceLimitSchema,
  storage: resourceLimitSchema,
  pods: resourceLimitSchema,
  replicas: z
    .number()
    .min(0, { message: 'Replicas must be a non-negative number' })
});

// Workspace form schema
const workspaceFormSchema = z.object({
  id: z.number().optional(),
  name: z
    .string()
    .min(1, { message: 'Workspace name is required.' })
    .max(63, { message: 'Workspace name must not exceed 63 characters.' })
    .regex(k8sNameRegex, {
      message:
        'Workspace name must follow Kubernetes naming rules: lowercase alphanumeric characters or hyphens, start and end with alphanumeric.'
    }),
  description: z.string().optional(),
  git_repository: z
    .string()
    .url({ message: 'Must be a valid URL' })
    .optional()
    .or(z.literal('')),
  image_repository: z
    .string()
    .url({ message: 'Must be a valid URL' })
    .optional()
    .or(z.literal('')),
  resource_quota: resourceQuotaSchema,
  cluster_ids: z
    .array(z.number())
    .min(1, { message: 'At least one cluster must be selected' })
});

type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>;

export function WorkspaceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loadingClusters, setLoadingClusters] = useState(false);

  const [clusterPage, setClusterPage] = useState(0);
  const [hasMoreClusters, setHasMoreClusters] = useState(true);
  const PAGE_SIZE = 10;
  const [searchClusterName, setSearchClusterName] = useState('');

  const workspaceId = searchParams.get('workspaceid');
  const isEditing = !!workspaceId;

  // Default resource quota values
  const defaultResourceQuota: ResourceQuota = {
    cpu: { request: 1, limit: 2, used: 0 },
    memory: { request: 1024, limit: 2048, used: 0 },
    gpu: { request: 0, limit: 0, used: 0 },
    storage: { request: 10, limit: 20, used: 0 },
    pods: { request: 5, limit: 10, used: 0 },
    replicas: 0
  };

  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      name: '',
      description: '',
      git_repository: '',
      image_repository: '',
      resource_quota: defaultResourceQuota,
      cluster_ids: []
    },
    mode: 'onChange'
  });

  useEffect(() => {
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      const firstError = Object.entries(errors)[0];
      const fieldName = firstError[0];
      const errorMessage = firstError[1]?.message;
      if (errorMessage) {
        toast.error(`${fieldName}: ${errorMessage}`);
      }
    }
  }, [form.formState.errors]);

  const loadClusters = useCallback(
    async (searchClusterName: string, page: number) => {
      if (!user?.token) {
        return;
      }

      setLoadingClusters(true);
      setSearchClusterName(searchClusterName);
      setClusterPage(page);

      const params: ClusterListArgs = {
        page: page,
        page_size: PAGE_SIZE
      };
      if (searchClusterName !== '') {
        params.name = searchClusterName;
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

      try {
        const response = await fetch(
          `/api/server/cluster/list?${queryString}`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`
            }
          }
        );

        if (response.ok) {
          const data: ClusterList = await response.json();
          if (page === 1) {
            const newClusters = data.clusters || [];
            setHasMoreClusters(newClusters.length < data.total);
            setClusters(newClusters);
            console.log(newClusters.length);
            return;
          }
          setClusters((prevClusters) => {
            const uniqueClusters = new Map();
            prevClusters.forEach((cluster) => {
              uniqueClusters.set(cluster.id, cluster);
            });
            (data.clusters || []).forEach((cluster) => {
              uniqueClusters.set(cluster.id, cluster);
            });
            const newClusters = Array.from(uniqueClusters.values());
            setHasMoreClusters(newClusters.length < data.total);
            return newClusters;
          });
        } else {
          toast.error('Failed to load more clusters');
        }
      } catch (error) {
        console.error('Failed to fetch more clusters:', error);
        toast.error('Failed to load more clusters');
      } finally {
        setLoadingClusters(false);
      }
    },
    [user?.token, PAGE_SIZE]
  );

  // Load workspace data for editing
  useEffect(() => {
    if (!user?.token) {
      return;
    }
    if (isEditing && workspaceId) {
      const fetchWorkspace = async () => {
        try {
          const response = await fetch(
            `/api/server/workspace?id=${workspaceId}`,
            {
              headers: {
                Authorization: `Bearer ${user?.token}`
              }
            }
          );

          if (response.ok) {
            const workspace: Workspace = await response.json();

            // Extract cluster IDs and permissions from relationships
            const clusterIds = workspace.cluster_relationships.map((rel) =>
              Number(rel.cluster_id)
            );

            form.reset({
              id: Number(workspace.id),
              name: workspace.name,
              description: workspace.description,
              git_repository: workspace.git_repository,
              image_repository: workspace.image_repository,
              resource_quota: workspace.resource_quota,
              cluster_ids: clusterIds
            });
          }
        } catch (error) {
          console.error('Failed to fetch workspace:', error);
          toast.error('Failed to load workspace data');
        }
      };

      fetchWorkspace();
    }
  }, [isEditing, workspaceId, user?.token, form]);

  const onSubmit = async (data: WorkspaceFormValues) => {
    setLoading(true);
    if (data.cluster_ids.length === 0) {
      toast.error('Clusters is a must ! ');
      return;
    }
    try {
      // Transform form data to match API expectations
      const clusterRelationships: WorkspaceClusterRelationship[] =
        data.cluster_ids.map((clusterId) => ({
          id: 0, // Will be assigned by the server
          workspace_id: isEditing ? Number(workspaceId) : 0, // Will be assigned by the server for new workspaces
          cluster_id: clusterId
        }));

      const payload: Partial<Workspace> = {
        id: isEditing ? Number(workspaceId) : undefined,
        name: data.name,
        description: data.description || '',
        resource_quota: data.resource_quota,
        git_repository: data.git_repository || '',
        image_repository: data.image_repository || '',
        cluster_relationships: clusterRelationships
      };

      const response = await fetch('/api/server/workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(
          isEditing
            ? 'Workspace updated successfully'
            : 'Workspace created successfully'
        );
        router.push('/home/workspace');
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to save workspace');
      }
    } catch (error) {
      console.error('Failed to save workspace:', error);
      toast.error('Failed to save workspace');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle cluster selection
  // Helper function to handle cluster selection
  const handleClusterSelection = (clusterId: number, checked: boolean) => {
    const currentIds = form.getValues('cluster_ids');
    if (checked && !currentIds.includes(clusterId)) {
      form.setValue('cluster_ids', [...currentIds, Number(clusterId)]);
    } else if (!checked) {
      form.setValue(
        'cluster_ids',
        currentIds.filter((id) => Number(id) !== Number(clusterId))
      );
    }
  };

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>
          {isEditing ? 'Edit Workspace' : 'Create New Workspace'}
        </h1>
        <p className='text-muted-foreground'>
          {isEditing
            ? 'Update workspace configuration'
            : 'Configure your new workspace settings'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workspace Name</FormLabel>
                <FormControl>
                  <Input placeholder='my-workspace' {...field} />
                </FormControl>
                <FormDescription>
                  Must follow Kubernetes naming rules: lowercase alphanumeric
                  characters or hyphens, start and end with alphanumeric.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='git_repository'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Git Repository URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder='https://github.com/username/repo'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  URL to the Git repository for this workspace
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='image_repository'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image Repository URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder='https://registry.example.com/username/repo'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  URL to the container image repository for this workspace
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='space-y-4'>
            <h3 className='text-lg font-medium'>Resource Quota</h3>

            {/* CPU Resources */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='resource_quota.cpu.request'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPU Request</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        step='0.1'
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? ''
                              : parseFloat(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='resource_quota.cpu.limit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPU Limit</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        step='0.1'
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? ''
                              : parseFloat(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Memory Resources */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='resource_quota.memory.request'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Memory Request (MB)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        step='128'
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? ''
                              : parseFloat(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='resource_quota.memory.limit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Memory Limit (MB)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        step='128'
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? ''
                              : parseFloat(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* GPU Resources */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='resource_quota.gpu.request'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GPU Request</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        step='1'
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? ''
                              : parseFloat(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='resource_quota.gpu.limit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GPU Limit</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        step='1'
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? ''
                              : parseFloat(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Storage Resources */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='resource_quota.storage.request'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Request (GB)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        step='1'
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? ''
                              : parseFloat(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='resource_quota.storage.limit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Limit (GB)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        step='1'
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? ''
                              : parseFloat(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pods Resources */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='resource_quota.pods.request'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pods Request</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        step='1'
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? ''
                              : parseFloat(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='resource_quota.pods.limit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pods Limit</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        step='1'
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? ''
                              : parseFloat(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-lg font-medium'>Cluster Assignment</h3>
            <p className='text-muted-foreground text-sm'>
              Select clusters to associate with this workspace
            </p>

            {
              <FormField
                control={form.control}
                name='cluster_ids'
                render={() => (
                  <FormItem>
                    <div className='space-y-2'>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant='outline'
                            role='combobox'
                            className='min-h-10 w-full justify-between'
                            onClick={() => {
                              loadClusters('', 1);
                            }}
                          >
                            <div className='flex flex-1 flex-wrap gap-1'>
                              {form.getValues('cluster_ids').length === 0 ? (
                                <span className='text-muted-foreground'>
                                  Select clusters...
                                </span>
                              ) : (
                                form
                                  .getValues('cluster_ids')
                                  .map((clusterId) => {
                                    const cluster = clusters.find(
                                      (c) => Number(c.id) === Number(clusterId)
                                    );
                                    return (
                                      <Badge
                                        key={clusterId}
                                        variant='secondary'
                                        className='text-xs'
                                      >
                                        {cluster?.name ||
                                          `Cluster ${clusterId}`}
                                        <span
                                          className='ring-offset-background focus:ring-ring ml-1 cursor-pointer rounded-full outline-none focus:ring-2 focus:ring-offset-2'
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              handleClusterSelection(
                                                Number(clusterId),
                                                false
                                              );
                                            }
                                          }}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                          }}
                                          onClick={() =>
                                            handleClusterSelection(
                                              Number(clusterId),
                                              false
                                            )
                                          }
                                        >
                                          <X className='text-muted-foreground hover:text-foreground h-3 w-3' />
                                        </span>
                                      </Badge>
                                    );
                                  })
                              )}
                            </div>
                            <ChevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className='w-full p-0'
                          style={{
                            width: 'var(--radix-popover-trigger-width)'
                          }}
                        >
                          <Command>
                            <CommandInput
                              placeholder='Search clusters...'
                              onValueChange={(e) => loadClusters(e, 1)}
                            />
                            <CommandList>
                              {loadingClusters ? (
                                <div className='flex items-center justify-center p-4'>
                                  <div className='text-muted-foreground text-sm'>
                                    Loading...
                                  </div>
                                </div>
                              ) : (
                                <CommandEmpty>No cluster found.</CommandEmpty>
                              )}
                              <CommandGroup>
                                {clusters.map((cluster) => {
                                  const isSelected = form
                                    .getValues('cluster_ids')
                                    .includes(Number(cluster.id));
                                  return (
                                    <CommandItem
                                      key={cluster.id}
                                      value={cluster.id.toString()}
                                      onSelect={(value) => {
                                        const clusterId = parseInt(value, 10);
                                        handleClusterSelection(
                                          clusterId,
                                          !isSelected
                                        );
                                      }}
                                    >
                                      <div className='mr-2 h-4 w-4'>
                                        {isSelected && (
                                          <Check className='text-primary' />
                                        )}
                                      </div>
                                      {cluster.name}
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                              {hasMoreClusters && (
                                <div className='p-2 text-center'>
                                  <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      loadClusters(
                                        searchClusterName,
                                        clusterPage + 1
                                      );
                                    }}
                                    disabled={loadingClusters}
                                    className='w-full'
                                  >
                                    {loadingClusters
                                      ? 'Loading...'
                                      : 'Load More Clusters'}
                                  </Button>
                                </div>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            }

            {
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Workspace description...'
                        className='resize-none'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Brief description of the workspace purpose
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            }
          </div>

          <div className='flex gap-4'>
            {/* <div className='text-xs text-gray-500'>
              Form valid: {form.formState.isValid ? 'Yes' : 'No'}
              err: {JSON.stringify(form.formState.errors)}
            </div> */}
            <Button type='submit' disabled={loading}>
              {loading
                ? 'Saving...'
                : isEditing
                  ? 'Update Workspace'
                  : 'Create Workspace'}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/home/workspace')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
