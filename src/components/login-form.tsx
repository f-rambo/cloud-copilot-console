'use client';
import { GalleryVerticalEnd } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MD5 } from 'crypto-js';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type FormValues = z.infer<typeof formSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { login } = useAuth();
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const userApi = process.env.NEXT_PUBLIC_API_URL + `/user/`;

  const onSubmit = async (values: FormValues) => {
    try {
      const submitData = {
        email: values.email,
        password: MD5(values.password).toString()
      };

      const response = await fetch(userApi + 'signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const data = await response.json();
        login(data);
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        if (errorData.field) {
          form.setError(errorData.field as 'email' | 'password', {
            type: 'server',
            message: errorData.message
          });
        } else {
          toast.error(
            errorData.message || 'Login failed, please try again later'
          );
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed, please check your network connection');
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className='flex flex-col gap-6'>
          <div className='flex flex-col items-center gap-2'>
            <a
              href='#'
              className='flex flex-col items-center gap-2 font-medium'
            >
              <div className='flex size-8 items-center justify-center rounded-md'>
                <GalleryVerticalEnd className='size-6' />
              </div>
              <span className='sr-only'>Acme Inc.</span>
            </a>
            <h1 className='text-xl font-bold'>Welcome to Cloud Copilot.</h1>
          </div>
          <div className='flex flex-col gap-6'>
            <div className='grid gap-3'>
              <Label htmlFor='email'>Email</Label>
              <Input
                {...form.register('email')}
                id='email'
                type='email'
                placeholder='m@example.com'
                autoComplete='username'
              />
              {form.formState.errors.email && (
                <p className='text-sm text-red-500'>
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className='grid gap-3'>
              <Label htmlFor='password'>Password</Label>
              <Input
                {...form.register('password')}
                id='password'
                type='password'
                autoComplete='current-password'
              />
              {form.formState.errors.password && (
                <p className='text-sm text-red-500'>
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button type='submit' className='w-full'>
              Login
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
