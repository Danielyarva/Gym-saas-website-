'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegister } from '@/hooks/use-auth';
import { registerFormSchema, type RegisterFormValues } from '@/schemas/auth.schema';
import { ApiError } from '@/services/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const registerCoach = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerFormSchema) });

  const onSubmit = (values: RegisterFormValues) => {
    registerCoach.mutate(values, {
      onSuccess: () => {
        toast.success('Account created — check your email to verify your address.');
        router.replace('/dashboard');
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : 'Something went wrong');
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold text-foreground">Create your coach account</h1>
        <p className="text-sm text-muted-foreground">Start managing your clients with AI Coach OS</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" autoComplete="name" {...register('fullName')} />
          {errors.fullName ? <p className="text-xs text-destructive">{errors.fullName.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">At least 10 characters, with an uppercase letter, lowercase letter, and number.</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={registerCoach.isPending}>
          {registerCoach.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
