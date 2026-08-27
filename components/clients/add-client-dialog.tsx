'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateClient } from '@/hooks/use-clients';
import { addClientFormSchema, type AddClientFormValues } from '@/schemas/client.schema';
import { ApiError } from '@/services/api-client';

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddClientDialog({ open, onOpenChange }: AddClientDialogProps) {
  const createClient = useCreateClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof addClientFormSchema>, undefined, AddClientFormValues>({ resolver: zodResolver(addClientFormSchema) });

  const onSubmit = (values: AddClientFormValues) => {
    createClient.mutate(
      {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || undefined,
        goalText: values.goalText || undefined,
        startingWeightKg: values.startingWeightKg,
        goalWeightKg: values.goalWeightKg,
      },
      {
        onSuccess: (client) => {
          toast.success(`${client.fullName} added`);
          reset();
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error instanceof ApiError ? error.message : 'Something went wrong');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" {...register('fullName')} />
            {errors.fullName ? <p className="text-xs text-destructive">{errors.fullName.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" {...register('phone')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goalText">Goal (optional)</Label>
            <Input id="goalText" placeholder="e.g. Fat loss" {...register('goalText')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startingWeightKg">Starting weight (kg)</Label>
              <Input id="startingWeightKg" type="number" step="0.1" {...register('startingWeightKg')} />
              {errors.startingWeightKg ? <p className="text-xs text-destructive">{errors.startingWeightKg.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="goalWeightKg">Goal weight (kg)</Label>
              <Input id="goalWeightKg" type="number" step="0.1" {...register('goalWeightKg')} />
              {errors.goalWeightKg ? <p className="text-xs text-destructive">{errors.goalWeightKg.message}</p> : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createClient.isPending}>
              {createClient.isPending ? 'Adding…' : 'Add client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
