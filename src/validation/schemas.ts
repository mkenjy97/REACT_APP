import { z } from 'zod';

export const AUTH_SCHEMAS = {
  login: z.object({
    email: z.string().email('Email non valida'),
    password: z.string().min(6, 'La password deve avere almeno 6 caratteri'),
  }),
  register: z.object({
    fullName: z.string().min(2, 'Nome troppo corto'),
    email: z.string().email('Email non valida'),
    password: z.string().min(6, 'La password deve avere almeno 6 caratteri'),
  }),
  profile: z.object({
    displayName: z.string().min(2, 'Nome troppo corto'),
    phoneNumber: z.string().optional(),
  })
};

export const COMMON_SCHEMAS = {
  id: z.string().min(1),
  email: z.string().email(),
  search: z.string().min(1),
};
