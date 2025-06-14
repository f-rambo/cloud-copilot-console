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
import { Project } from '@/lib/types/project';
import { ResourceQuota } from '@/lib/types/common';
import {
  WorkspaceListParam,
  Workspace,
  WorkspaceList
} from '@/lib/types/workspace';
import { useAuth } from '@/contexts/auth-context';
import { Check, ChevronDown } from 'lucide-react';
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
  limit: z.number().min(0, { message: 'Limit must be a non-negative number' })
});

// Resource quota validation schema
const resourceQuotaSchema = z.object({
  cpu: resourceLimitSchema,
  memory: resourceLimitSchema,
  gpu: resourceLimitSchema,
  storage: resourceLimitSchema,
  pods: resourceLimitSchema
});

// Project form schema
const projectFormSchema = z.object({
  id: z.number().optional(),
  name: z
    .string()
    .min(1, { message: 'Project name is required.' })
    .max(63, { message: 'Project name must not exceed 63 characters.' })
    .regex(k8sNameRegex, {
      message:
        'Project name must follow Kubernetes naming rules: lowercase alphanumeric characters or hyphens, start and end with alphanumeric.'
    }),
  description: z.string().optional(),
  user_id: z.number().min(0, { message: 'User ID is required' }),
  workspace_id: z.number().min(1, { message: 'Workspace must be selected' }),
  resource_quota: resourceQuotaSchema
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export function ProjectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null
  );

  const [workspacePage, setWorkspacePage] = useState(1);
  const [hasMoreWorkspaces, setHasMoreWorkspaces] = useState(true);
  const PAGE_SIZE = 10;
  const [searchWorkspaceName, setSearchWorkspaceName] = useState('');

  const projectId = searchParams.get('projectid');
  const isEditing = !!projectId;

  // Default resource quota values
  const defaultResourceQuota: ResourceQuota = {
    cpu: { request: 10, limit: 50, used: 0 },
    memory: { request: 100, limit: 500, used: 0 },
    gpu: { request: 0, limit: 0, used: 0 },
    storage: { request: 10, limit: 100, used: 0 },
    pods: { request: 100, limit: 500, used: 0 }
  };

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      user_id: user?.id || 0,
      workspace_id: 0,
      resource_quota: defaultResourceQuota
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

  const loadWorkspaces = useCallback(
    async (searchName: string, page: number, reset: boolean = false) => {
      if (!user?.token) {
        return;
      }

      setLoadingWorkspaces(true);

      const params: WorkspaceListParam = {
        workspace_name: searchName,
        page: page,
        size: PAGE_SIZE
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

      try {
        const response = await fetch(
          `/api/server/workspace/list?${queryString}`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`
            }
          }
        );

        if (response.ok) {
          const data: WorkspaceList = await response.json();
          if (reset || page === 1) {
            setWorkspaces(data.items || []);
          } else {
            setWorkspaces((prev) => [...prev, ...(data.items || [])]);
          }
          setHasMoreWorkspaces(
            (data.items?.length || 0) === PAGE_SIZE &&
              workspaces.length + (data.items?.length || 0) < data.total
          );
        } else {
          toast.error('Failed to load workspaces');
        }
      } catch (error) {
        console.error('Failed to fetch workspaces:', error);
        toast.error('Failed to load workspaces');
      } finally {
        setLoadingWorkspaces(false);
      }
    },
    [user?.token, PAGE_SIZE, workspaces.length]
  );

  // Initial load of workspaces
  useEffect(() => {
    loadWorkspaces('', 1, true);
  }, [loadWorkspaces]);

  // Load project data for editing
  useEffect(() => {
    if (!user?.token) {
      return;
    }
    if (isEditing && projectId) {
      const fetchProject = async () => {
        try {
          const response = await fetch(`/api/server/project?id=${projectId}`, {
            headers: {
              Authorization: `Bearer ${user?.token}`
            }
          });

          if (response.ok) {
            const project: Project = await response.json();

            // Find and set the selected workspace
            const workspace = workspaces.find(
              (w) => w.id === project.workspace_id
            );
            if (workspace) {
              setSelectedWorkspace(workspace);
            }

            form.reset({
              id: project.id,
              name: project.name,
              description: project.description,
              user_id: project.user_id,
              workspace_id: project.workspace_id,
              resource_quota: project.resource_quota
            });
          }
        } catch (error) {
          console.error('Failed to fetch project:', error);
          toast.error('Failed to load project data');
        }
      };

      fetchProject();
    }
  }, [isEditing, projectId, user?.token, form, workspaces]);

  const onSubmit = async (data: ProjectFormValues) => {
    setLoading(true);
    try {
      const payload: Partial<Project> = {
        id: isEditing ? Number(projectId) : undefined,
        name: data.name,
        description: data.description || '',
        user_id: user?.id,
        workspace_id: data.workspace_id,
        resource_quota: data.resource_quota
      };

      const response = await fetch('/api/server/project', {
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
            ? 'Project updated successfully'
            : 'Project created successfully'
        );
        router.push('/home/project');
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to save project');
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  // Handle workspace search
  const handleWorkspaceSearch = useCallback(
    (searchValue: string) => {
      setSearchWorkspaceName(searchValue);
      setWorkspacePage(1);
      loadWorkspaces(searchValue, 1, true);
    },
    [loadWorkspaces]
  );

  // Load more workspaces
  const loadMoreWorkspaces = useCallback(() => {
    if (hasMoreWorkspaces && !loadingWorkspaces) {
      const nextPage = workspacePage + 1;
      setWorkspacePage(nextPage);
      loadWorkspaces(searchWorkspaceName, nextPage, false);
    }
  }, [
    hasMoreWorkspaces,
    loadingWorkspaces,
    workspacePage,
    searchWorkspaceName,
    loadWorkspaces
  ]);

  // Handle workspace selection
  const handleWorkspaceSelect = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    form.setValue('workspace_id', workspace.id);
    setWorkspaceOpen(false);
  };

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>
          {isEditing ? 'Edit Project' : 'Create New Project'}
        </h1>
        <p className='text-muted-foreground'>
          {isEditing
            ? 'Update project configuration'
            : 'Configure your new project settings'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name</FormLabel>
                <FormControl>
                  <Input placeholder='my-project' {...field} />
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
            name='workspace_id'
            render={() => (
              <FormItem>
                <FormLabel>Workspace</FormLabel>
                <Popover open={workspaceOpen} onOpenChange={setWorkspaceOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant='outline'
                        role='combobox'
                        className='w-full justify-between'
                        aria-expanded={workspaceOpen}
                      >
                        {selectedWorkspace ? (
                          <div className='flex items-center gap-2'>
                            <span>{selectedWorkspace.name}</span>
                            <Badge variant='secondary' className='text-xs'>
                              ID: {selectedWorkspace.id}
                            </Badge>
                          </div>
                        ) : (
                          'Select workspace...'
                        )}
                        <ChevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className='w-full p-0'
                    style={{
                      width: 'var(--radix-popover-trigger-width)'
                    }}
                  >
                    <Command>
                      <CommandInput
                        placeholder='Search workspaces...'
                        value={searchWorkspaceName}
                        onValueChange={handleWorkspaceSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {loadingWorkspaces
                            ? 'Loading...'
                            : 'No workspaces found.'}
                        </CommandEmpty>
                        <CommandGroup>
                          {workspaces.map((workspace) => (
                            <CommandItem
                              key={workspace.id}
                              value={workspace.name}
                              onSelect={() => handleWorkspaceSelect(workspace)}
                              className='flex items-center justify-between'
                            >
                              <div className='flex items-center gap-2'>
                                <Check
                                  className={`h-4 w-4 ${
                                    selectedWorkspace?.id === workspace.id
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  }`}
                                />
                                <div>
                                  <div className='font-medium'>
                                    {workspace.name}
                                  </div>
                                  <div className='text-muted-foreground text-xs'>
                                    ID: {workspace.id} | Status:{' '}
                                    {workspace.status}
                                  </div>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                          {hasMoreWorkspaces && (
                            <CommandItem
                              onSelect={loadMoreWorkspaces}
                              className='text-muted-foreground justify-center'
                              disabled={loadingWorkspaces}
                            >
                              {loadingWorkspaces
                                ? 'Loading...'
                                : 'Load more workspaces'}
                            </CommandItem>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Select the workspace this project belongs to
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Project description...'
                    className='resize-none'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Optional description for this project
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
                name='resource_quota.cpu.limit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPU Limit</FormLabel>
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

            {/* Memory Resources */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='resource_quota.memory.request'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Memory Request (GB)</FormLabel>
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
                name='resource_quota.memory.limit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Memory Limit (GB)</FormLabel>
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

          <div className='flex gap-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading
                ? 'Saving...'
                : isEditing
                  ? 'Update Project'
                  : 'Create Project'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
