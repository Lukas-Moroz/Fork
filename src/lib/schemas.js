import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(60, 'Name must be 60 characters or fewer'),
  username: z.string().max(30, 'Username must be 30 characters or fewer').optional(),
  bio: z.string().max(200, 'Bio must be 200 characters or fewer').optional(),
  location: z.string().max(100, 'Location must be 100 characters or fewer').optional(),
});

export const placeSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required').max(120, 'Name must be 120 characters or fewer'),
  cuisine: z.string().max(60, 'Cuisine must be 60 characters or fewer').optional(),
  address: z.string().max(200, 'Address must be 200 characters or fewer').optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or fewer').optional(),
});

export const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});
