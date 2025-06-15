'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEffect, useState, useCallback, useMemo } from 'react';
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
import { Service, Port, Volume } from '@/lib/types/service';
import { ResourceQuota } from '@/lib/types/common';
import { Project, ProjectsRequest, Projects } from '@/lib/types/project';
import { useAuth } from '@/contexts/auth-context';
import { Check, ChevronDown, Plus, Trash2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  pods: resourceLimitSchema,
  replicas: z
    .number()
    .min(0, { message: 'Replicas must be a non-negative number' })
});

// Port validation schema
const portSchema = z.object({
  id: z.number().optional(),
  name: z
    .string()
    .min(1, { message: 'Port name is required' })
    .regex(k8sNameRegex, {
      message: 'Port name must follow Kubernetes naming rules'
    }),
  path: z.string().min(1, { message: 'Path is required' }),
  protocol: z.enum(['TCP', 'UDP'], { message: 'Protocol must be TCP or UDP' }),
  container_port: z
    .number()
    .min(1, { message: 'Container port must be between 1 and 65535' })
    .max(65535, { message: 'Container port must be between 1 and 65535' })
});

// Volume validation schema
const volumeSchema = z.object({
  id: z.number().optional(),
  name: z
    .string()
    .min(1, { message: 'Volume name is required' })
    .regex(k8sNameRegex, {
      message: 'Volume name must follow Kubernetes naming rules'
    }),
  mount_path: z.string().min(1, { message: 'Mount path is required' }),
  storage: z.number().min(1, { message: 'Storage must be at least 1GB' }),
  storage_class: z.string().min(1, { message: 'Storage class is required' })
});

// Service form schema
const serviceFormSchema = z.object({
  id: z.number().optional(),
  name: z
    .string()
    .min(1, { message: 'Service name is required.' })
    .max(63, { message: 'Service name must not exceed 63 characters.' })
    .regex(k8sNameRegex, {
      message:
        'Service name must follow Kubernetes naming rules: lowercase alphanumeric characters or hyphens, start and end with alphanumeric.'
    }),
  labels: z.string().optional(),
  description: z.string().optional(),
  user_id: z.number().min(0, { message: 'User ID is required' }),
  project_id: z.number().min(1, { message: 'Project must be selected' }),
  workspace_id: z.number().min(1, { message: 'Workspace ID is required' }),
  resource_quota: resourceQuotaSchema,
  ports: z
    .array(portSchema)
    .min(1, { message: 'At least one port is required' }),
  volumes: z.array(volumeSchema).optional()
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export function ServiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [projectPage, setProjectPage] = useState(1);
  const [hasMoreProjects, setHasMoreProjects] = useState(true);
  const PAGE_SIZE = 10;
  const [searchProjectName, setSearchProjectName] = useState('');

  const serviceId = searchParams.get('serviceid');
  const isEditing = !!serviceId;

  // Default resource quota values
  const defaultResourceQuota: ResourceQuota = {
    replicas: 1,
    cpu: { request: 1, limit: 2, used: 0 },
    memory: { request: 1, limit: 4, used: 0 },
    gpu: { request: 0, limit: 0, used: 0 },
    storage: { request: 1, limit: 10, used: 0 },
    pods: { request: 1, limit: 10, used: 0 }
  };

  // Default port
  const defaultPort = useMemo(
    (): Port => ({
      id: 0,
      name: 'service-name',
      path: '/',
      protocol: 'TCP',
      container_port: 8080
    }),
    []
  );

  // Default volume
  //   const defaultVolume = useMemo(
  //     (): Volume => ({
  //       id: 0,
  //       name: 'data',
  //       mount_path: '/data',
  //       storage: 30,
  //       storage_class: 'default'
  //     }),
  //     []
  //   );

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: '',
      labels: '',
      description: '',
      user_id: user?.id || 0,
      project_id: 0,
      workspace_id: 0,
      resource_quota: defaultResourceQuota,
      ports: [
        {
          name: defaultPort.name,
          path: defaultPort.path,
          protocol: defaultPort.protocol as 'TCP' | 'UDP',
          container_port: defaultPort.container_port
        }
      ],
      volumes: []
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

  const loadProjects = useCallback(
    async (searchName: string, page: number, reset: boolean = false) => {
      if (!user?.token) {
        return;
      }

      setLoadingProjects(true);

      const params: ProjectsRequest = {
        name: searchName,
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
          `/api/server/project/list?${queryString}`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`
            }
          }
        );

        if (response.ok) {
          const data: Projects = await response.json();
          if (reset || page === 1) {
            setProjects(data.projects || []);
          } else {
            setProjects((prev) => [...prev, ...(data.projects || [])]);
          }
          setHasMoreProjects(
            (data.projects?.length || 0) === PAGE_SIZE &&
              projects.length + (data.projects?.length || 0) < data.total
          );
        } else {
          toast.error('Failed to load projects');
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        toast.error('Failed to load projects');
      } finally {
        setLoadingProjects(false);
      }
    },
    [user?.token, PAGE_SIZE, projects.length]
  );

  // Initial load of projects
  useEffect(() => {
    loadProjects('', 1, true);
  }, [loadProjects]);

  // Load service data for editing
  useEffect(() => {
    if (!user?.token) {
      return;
    }
    if (isEditing && serviceId) {
      const fetchService = async () => {
        try {
          const response = await fetch(`/api/server/service?id=${serviceId}`, {
            headers: {
              Authorization: `Bearer ${user?.token}`
            }
          });

          if (response.ok) {
            const service: Service = await response.json();

            // Find and set the selected project
            const project = projects.find((p) => p.id === service.project_id);
            if (project) {
              setSelectedProject(project);
            }

            form.reset({
              id: service.id,
              name: service.name,
              labels: service.labels,
              description: service.description,
              user_id: service.user_id,
              project_id: service.project_id,
              workspace_id: service.workspace_id,
              resource_quota: service.resource_quota,
              ports:
                service.ports.length > 0
                  ? service.ports.map((port) => ({
                      ...port,
                      protocol: port.protocol as 'TCP' | 'UDP'
                    }))
                  : [defaultPort],
              volumes: service.volumes || []
            });
          }
        } catch (error) {
          console.error('Failed to fetch service:', error);
          toast.error('Failed to load service data');
        }
      };

      fetchService();
    }
  }, [isEditing, serviceId, user?.token, form, projects, defaultPort]);

  const onSubmit = async (data: ServiceFormValues) => {
    setLoading(true);
    try {
      const payload: Partial<Service> = {
        id: isEditing ? Number(serviceId) : undefined,
        name: data.name,
        labels: data.labels || '',
        description: data.description || '',
        user_id: user?.id,
        project_id: data.project_id,
        workspace_id: data.workspace_id,
        resource_quota: data.resource_quota,
        ports: data.ports.map((port) => ({
          ...port,
          id: port.id || 0
        })),
        volumes: (data.volumes || []).map((volume) => ({
          ...volume,
          id: volume.id || 0
        })),
        pods: [] // Will be populated by backend
      };

      const response = await fetch('/api/server/service', {
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
            ? 'Service updated successfully'
            : 'Service created successfully'
        );
        router.push('/home/project/service');
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to save service');
      }
    } catch (error) {
      console.error('Failed to save service:', error);
      toast.error('Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  // Handle project search
  const handleProjectSearch = useCallback(
    (searchValue: string) => {
      setSearchProjectName(searchValue);
      setProjectPage(1);
      loadProjects(searchValue, 1, true);
    },
    [loadProjects]
  );

  // Load more projects
  const loadMoreProjects = useCallback(() => {
    if (hasMoreProjects && !loadingProjects) {
      const nextPage = projectPage + 1;
      setProjectPage(nextPage);
      loadProjects(searchProjectName, nextPage, false);
    }
  }, [
    hasMoreProjects,
    loadingProjects,
    projectPage,
    searchProjectName,
    loadProjects
  ]);

  // Handle project selection
  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    form.setValue('project_id', project.id);
    form.setValue('workspace_id', project.workspace_id);
    setProjectOpen(false);
  };

  // Add port
  const addPort = () => {
    const currentPorts = form.getValues('ports');
    form.setValue('ports', [
      ...currentPorts,
      { ...defaultPort, name: `port-${currentPorts.length + 1}` }
    ]);
  };

  // Remove port
  const removePort = (index: number) => {
    const currentPorts = form.getValues('ports');
    if (currentPorts.length > 1) {
      form.setValue(
        'ports',
        currentPorts.filter((_, i) => i !== index)
      );
    }
  };

  // Add volume
  const addVolume = () => {
    const currentVolumes = form.getValues('volumes') || [];
    form.setValue('volumes', [
      ...currentVolumes,
      {
        id: 0,
        name: `volume-${currentVolumes.length + 1}`,
        mount_path: '/data',
        storage: 30,
        storage_class: 'standard'
      } as Volume
    ]);
  };

  // Remove volume
  const removeVolume = (index: number) => {
    const currentVolumes = form.getValues('volumes') || [];
    form.setValue(
      'volumes',
      currentVolumes.filter((_, i) => i !== index)
    );
  };

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>
          {isEditing ? 'Edit Service' : 'Create New Service'}
        </h1>
        <p className='text-muted-foreground'>
          {isEditing
            ? 'Update service configuration'
            : 'Configure your new service settings'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input placeholder='my-service' {...field} />
                    </FormControl>
                    <FormDescription>
                      Must follow Kubernetes naming rules: lowercase
                      alphanumeric characters or hyphens, start and end with
                      alphanumeric.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='project_id'
                render={() => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Popover open={projectOpen} onOpenChange={setProjectOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            role='combobox'
                            className='w-full justify-between'
                            aria-expanded={projectOpen}
                          >
                            {selectedProject ? (
                              <div className='flex items-center gap-2'>
                                <span>{selectedProject.name}</span>
                                <Badge variant='secondary' className='text-xs'>
                                  ID: {selectedProject.id}
                                </Badge>
                              </div>
                            ) : (
                              'Select project...'
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
                            placeholder='Search projects...'
                            value={searchProjectName}
                            onValueChange={handleProjectSearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {loadingProjects
                                ? 'Loading...'
                                : 'No projects found.'}
                            </CommandEmpty>
                            <CommandGroup>
                              {projects.map((project) => (
                                <CommandItem
                                  key={project.id}
                                  value={project.name}
                                  onSelect={() => handleProjectSelect(project)}
                                  className='flex items-center justify-between'
                                >
                                  <div className='flex items-center gap-2'>
                                    <Check
                                      className={`h-4 w-4 ${
                                        selectedProject?.id === project.id
                                          ? 'opacity-100'
                                          : 'opacity-0'
                                      }`}
                                    />
                                    <div>
                                      <div className='font-medium'>
                                        {project.name}
                                      </div>
                                      <div className='text-muted-foreground text-xs'>
                                        ID: {project.id} | Workspace:{' '}
                                        {project.workspace_id}
                                      </div>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                              {hasMoreProjects && (
                                <CommandItem
                                  onSelect={loadMoreProjects}
                                  className='text-muted-foreground justify-center'
                                  disabled={loadingProjects}
                                >
                                  {loadingProjects
                                    ? 'Loading...'
                                    : 'Load more projects'}
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select the project this service belongs to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='labels'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Labels</FormLabel>
                    <FormControl>
                      <Input placeholder='app=myapp,version=v1.0' {...field} />
                    </FormControl>
                    <FormDescription>
                      Comma-separated key=value pairs for Kubernetes labels
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
                        placeholder='Service description...'
                        className='resize-none'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description for this service
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Resource Quota */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Quota</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Replicas */}
              <FormField
                control={form.control}
                name='resource_quota.replicas'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Replicas</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='1'
                        step='1'
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? ''
                              : parseInt(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Number of pod replicas to run
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                      <FormLabel>Memory Request (GB)</FormLabel>
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
                  name='resource_quota.memory.limit'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Memory Limit (GB)</FormLabel>
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

              {/* Pod Resources */}
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='resource_quota.pods.request'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pod Request</FormLabel>
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
                      <FormLabel>Pod Limit</FormLabel>
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
            </CardContent>
          </Card>

          {/* Ports Configuration */}
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>Ports Configuration</CardTitle>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addPort}
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Add Port
                </Button>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              {form.watch('ports').map((_, index) => (
                <div key={index} className='grid grid-cols-5 items-end gap-4'>
                  <FormField
                    control={form.control}
                    name={`ports.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder='http' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`ports.${index}.path`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Path</FormLabel>
                        <FormControl>
                          <Input placeholder='/' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`ports.${index}.protocol`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protocol</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select protocol' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='TCP'>TCP</SelectItem>
                            <SelectItem value='UDP'>UDP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`ports.${index}.container_port`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Container Port</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min='1'
                            max='65535'
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ''
                                  ? ''
                                  : parseInt(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className='flex justify-end'>
                    {form.watch('ports').length > 1 && (
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => removePort(index)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Volumes Configuration */}
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>Volumes Configuration</CardTitle>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addVolume}
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Add Volume
                </Button>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              {(form.watch('volumes') || []).map((_, index) => (
                <div key={index} className='grid grid-cols-5 items-end gap-4'>
                  <FormField
                    control={form.control}
                    name={`volumes.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder='data-volume' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`volumes.${index}.mount_path`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mount Path</FormLabel>
                        <FormControl>
                          <Input placeholder='/data' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`volumes.${index}.storage`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage (GB)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min='1'
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ''
                                  ? ''
                                  : parseInt(e.target.value)
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
                    name={`volumes.${index}.storage_class`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Class</FormLabel>
                        <FormControl>
                          <Input placeholder='standard' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className='flex justify-end'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => removeVolume(index)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              ))}
              {(!form.watch('volumes') ||
                form.watch('volumes')?.length === 0) && (
                <p className='text-muted-foreground text-sm'>
                  No volumes configured
                </p>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className='flex justify-end space-x-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading
                ? isEditing
                  ? 'Updating...'
                  : 'Creating...'
                : isEditing
                  ? 'Update Service'
                  : 'Create Service'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
