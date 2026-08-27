import { z } from 'zod';

export const clientStatusValues = ['ON_TRACK', 'NEEDS_ATTENTION', 'AT_RISK', 'INACTIVE'] as const;

// An empty HTML number input submits "" (never undefined). z.coerce.number()
// would turn that into 0, which then fails .positive() — so blank optional
// weight fields must be normalized to undefined before coercion.
const optionalWeightKg = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.coerce.number().positive().max(500).optional(),
);

export const addClientFormSchema = z.object({
  fullName: z.string().trim().min(1, "Enter the client's name").max(120),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  goalText: z.string().trim().max(500).optional().or(z.literal('')),
  startingWeightKg: optionalWeightKg,
  goalWeightKg: optionalWeightKg,
});
export type AddClientFormValues = z.infer<typeof addClientFormSchema>;
