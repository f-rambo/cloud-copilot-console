'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ClusterSaveArgs } from '@/lib/types/cluster';
import { useAuth } from '@/contexts/auth-context';

// Kubernetes cluster name validation regex
const k8sNameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

// IPv4 validation regex
const ipv4Regex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// Username validation (English letters only)
const usernameRegex = /^[a-zA-Z]+$/;

const clusterFormSchema = z
  .object({
    id: z.number().optional(),
    name: z
      .string()
      .min(1, { message: 'Cluster name is required.' })
      .max(63, { message: 'Cluster name must not exceed 63 characters.' })
      .regex(k8sNameRegex, {
        message:
          'Cluster name must follow Kubernetes naming rules: lowercase alphanumeric characters or hyphens, start and end with alphanumeric.'
      }),
    provider: z.enum(['baremetal', 'aws', 'ali_cloud'], {
      required_error: 'Please select a provider.'
    }),
    public_key: z.string().min(1, {
      message: 'Public key is required.'
    }),
    private_key: z.string().min(1, {
      message: 'Private key is required.'
    }),
    access_id: z.string().optional(),
    access_key: z.string().optional(),
    region: z.string().optional(),
    node_username: z.string().optional(),
    node_start_ip: z.string().optional(),
    node_end_ip: z.string().optional()
  })
  .superRefine((data, ctx) => {
    // Conditional validation based on provider
    if (data.provider === 'baremetal') {
      if (!data.node_username) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Node username is required for baremetal provider.',
          path: ['node_username']
        });
      } else if (!usernameRegex.test(data.node_username)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Node username must contain only English letters.',
          path: ['node_username']
        });
      }

      if (!data.node_start_ip) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Node start IP is required for baremetal provider.',
          path: ['node_start_ip']
        });
      } else if (!ipv4Regex.test(data.node_start_ip)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Node start IP must be a valid IPv4 address.',
          path: ['node_start_ip']
        });
      }

      if (!data.node_end_ip) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Node end IP is required for baremetal provider.',
          path: ['node_end_ip']
        });
      } else if (!ipv4Regex.test(data.node_end_ip)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Node end IP must be a valid IPv4 address.',
          path: ['node_end_ip']
        });
      }
    } else {
      // For cloud providers (aws, ali_cloud)
      if (!data.access_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Access ID is required for cloud providers.',
          path: ['access_id']
        });
      }

      if (!data.access_key) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Access key is required for cloud providers.',
          path: ['access_key']
        });
      }
    }
  });

type ClusterFormValues = z.infer<typeof clusterFormSchema>;

interface Region {
  id: string;
  name: string;
}

export function ClusterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);

  const clusterId = searchParams.get('clusterid');
  const isEditing = !!clusterId;

  const form = useForm<ClusterFormValues>({
    resolver: zodResolver(clusterFormSchema),
    defaultValues: {
      name: '',
      provider: undefined,
      public_key: '',
      private_key: '',
      access_id: '',
      access_key: '',
      region: '',
      node_username: '',
      node_start_ip: '',
      node_end_ip: ''
    },
    mode: 'onChange'
  });

  const watchedProvider = form.watch('provider');
  const watchedAccessId = form.watch('access_id');
  const watchedAccessKey = form.watch('access_key');

  // Load cluster data for editing
  useEffect(() => {
    if (isEditing && clusterId) {
      const fetchCluster = async () => {
        if (!user) {
          return;
        }
        try {
          const response = await fetch(`/api/server/cluster?id=${clusterId}`, {
            headers: {
              Authorization: `Bearer ${user?.token}`
            }
          });

          if (response.ok) {
            const cluster = await response.json();
            form.reset({
              id: cluster.id,
              name: cluster.name,
              provider: cluster.provider,
              public_key: cluster.public_key,
              private_key: cluster.private_key,
              access_id: cluster.access_id || '',
              access_key: cluster.access_key || '',
              region: cluster.region || '',
              node_username: cluster.node_username || '',
              node_start_ip: cluster.node_start_ip || '',
              node_end_ip: cluster.node_end_ip || ''
            });
          }
        } catch (error) {
          console.error('Failed to fetch cluster:', error);
          toast.error('Failed to load cluster data');
        }
      };

      fetchCluster();
    }
  }, [isEditing, clusterId, user, form]);

  // Load regions when access credentials change
  useEffect(() => {
    if (
      watchedProvider &&
      watchedProvider !== 'baremetal' &&
      watchedAccessId &&
      watchedAccessKey
    ) {
      const fetchRegions = async () => {
        setLoadingRegions(true);
        try {
          const params = new URLSearchParams({
            access_id: watchedAccessId,
            access_key: watchedAccessKey,
            provider: watchedProvider
          });

          const response = await fetch(
            `/api/server/cluster/regions?${params}`,
            {
              headers: {
                Authorization: `Bearer ${user?.token}`
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            setRegions(data.regions || []);
          } else {
            setRegions([]);
            toast.error('Failed to load regions');
          }
        } catch (error) {
          console.error('Failed to fetch regions:', error);
          setRegions([]);
          toast.error('Failed to load regions');
        } finally {
          setLoadingRegions(false);
        }
      };

      fetchRegions();
    } else {
      setRegions([]);
    }
  }, [watchedProvider, watchedAccessId, watchedAccessKey, user?.token]);

  const onSubmit = async (data: ClusterFormValues) => {
    setLoading(true);
    try {
      const payload: ClusterSaveArgs = {
        ...data,
        id: isEditing ? Number(clusterId) : undefined
      };

      const response = await fetch('/api/server/cluster', {
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
            ? 'Cluster updated successfully'
            : 'Cluster created successfully'
        );
        router.push('/home/cluster');
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to save cluster');
      }
    } catch (error) {
      console.error('Failed to save cluster:', error);
      toast.error('Failed to save cluster');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>
          {isEditing ? 'Edit Cluster' : 'Create New Cluster'}
        </h1>
        <p className='text-muted-foreground'>
          {isEditing
            ? 'Update cluster configuration'
            : 'Configure your new cluster settings'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cluster Name</FormLabel>
                <FormControl>
                  <Input placeholder='my-cluster' {...field} />
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
            name='provider'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provider</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a provider' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='baremetal'>Bare Metal</SelectItem>
                    <SelectItem value='aws'>AWS</SelectItem>
                    <SelectItem value='ali_cloud'>Alibaba Cloud</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='public_key'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Public Key</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='ssh-rsa AAAAB3NzaC1yc2E...'
                    className='resize-none'
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  SSH public key for cluster access
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='private_key'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Private Key</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='-----BEGIN PRIVATE KEY-----...'
                    className='resize-none'
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  SSH private key for cluster access
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cloud provider fields */}
          {watchedProvider && watchedProvider !== 'baremetal' && (
            <>
              <FormField
                control={form.control}
                name='access_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access ID</FormLabel>
                    <FormControl>
                      <Input placeholder='Access ID' {...field} />
                    </FormControl>
                    <FormDescription>Cloud provider access ID</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='access_key'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Key</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='Access Key'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Cloud provider access key</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='region'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loadingRegions || regions.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingRegions
                                ? 'Loading regions...'
                                : 'Select a region'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {regions.length === 0 &&
                      !loadingRegions &&
                      watchedAccessId &&
                      watchedAccessKey
                        ? 'No regions available. Please check your access credentials.'
                        : 'Select the region for your cluster'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Bare metal fields */}
          {watchedProvider === 'baremetal' && (
            <>
              <FormField
                control={form.control}
                name='node_username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Node Username</FormLabel>
                    <FormControl>
                      <Input placeholder='ubuntu' {...field} />
                    </FormControl>
                    <FormDescription>
                      Username for SSH access to nodes (English letters only)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='node_start_ip'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Node Start IP</FormLabel>
                    <FormControl>
                      <Input placeholder='192.168.1.10' {...field} />
                    </FormControl>
                    <FormDescription>
                      Starting IP address for the node range
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='node_end_ip'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Node End IP</FormLabel>
                    <FormControl>
                      <Input placeholder='192.168.1.20' {...field} />
                    </FormControl>
                    <FormDescription>
                      Ending IP address for the node range
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <div className='flex gap-4'>
            <Button type='submit' disabled={loading}>
              {loading
                ? 'Saving...'
                : isEditing
                  ? 'Update Cluster'
                  : 'Create Cluster'}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/cluster')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
