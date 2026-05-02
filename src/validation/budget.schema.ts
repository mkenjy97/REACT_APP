import { z } from 'zod';
import type { ExpenseCategory } from '@/types/budget.types';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'alimentari',
  'trasporti',
  'casa',
  'salute',
  'intrattenimento',
  'abbigliamento',
  'ristoranti',
  'tecnologia',
  'istruzione',
  'altro',
];

export const expenseSchema = z.object({
  amount: z
    .number({ error: 'Inserisci un importo valido' })
    .positive('L\'importo deve essere positivo')
    .max(99999, 'Importo troppo alto'),
  category: z.enum([
    'alimentari',
    'trasporti',
    'casa',
    'salute',
    'intrattenimento',
    'abbigliamento',
    'ristoranti',
    'tecnologia',
    'istruzione',
    'altro',
  ] as const),
  date: z.string().optional(),
  description: z.string().min(1, 'Inserisci una descrizione').max(100),
  isFixed: z.boolean(),
  billingDay: z.number().min(1).max(31).optional().nullable(),
  accountSource: z.string().optional().nullable(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      label: z.string().optional(),
    })
    .optional()
    .nullable(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

export const budgetSchema = z.object({
  monthlyLimit: z
    .number({ error: 'Inserisci un importo valido' })
    .positive()
    .max(999999),
  weeklyLimit: z
    .number({ error: 'Inserisci un importo valido' })
    .positive()
    .max(999999),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;

export const incomeSchema = z.object({
  amount: z
    .number({ error: 'Inserisci un importo valido' })
    .positive('L\'importo deve essere positivo')
    .max(999999, 'Importo troppo alto'),
  date: z.string().min(1, 'Seleziona una data'),
  description: z.string().min(1, 'Inserisci una descrizione').max(100),
});

export type IncomeFormData = z.infer<typeof incomeSchema>;
