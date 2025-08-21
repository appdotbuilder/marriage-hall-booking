import { z } from 'zod';

// Enum schemas
export const bookingStatusSchema = z.enum(['pending', 'approved', 'rejected', 'cancelled']);
export const userRoleSchema = z.enum(['user', 'admin']);

export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  role: userRoleSchema,
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schema for creating users
export const createUserInputSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
  role: userRoleSchema.default('user')
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Marriage hall schema
export const marriageHallSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  location: z.string(),
  capacity: z.number().int(),
  price_per_day: z.number(),
  amenities: z.array(z.string()),
  contact_phone: z.string(),
  contact_email: z.string().email(),
  images: z.array(z.string()).nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type MarriageHall = z.infer<typeof marriageHallSchema>;

// Input schema for creating marriage halls
export const createMarriageHallInputSchema = z.object({
  name: z.string().min(3, 'Hall name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(5, 'Location must be at least 5 characters'),
  capacity: z.number().int().positive('Capacity must be positive'),
  price_per_day: z.number().positive('Price must be positive'),
  amenities: z.array(z.string()).default([]),
  contact_phone: z.string().min(10, 'Contact phone must be at least 10 characters'),
  contact_email: z.string().email('Invalid contact email format'),
  images: z.array(z.string()).nullable().default(null),
  is_active: z.boolean().default(true)
});

export type CreateMarriageHallInput = z.infer<typeof createMarriageHallInputSchema>;

// Input schema for updating marriage halls
export const updateMarriageHallInputSchema = z.object({
  id: z.number(),
  name: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  location: z.string().min(5).optional(),
  capacity: z.number().int().positive().optional(),
  price_per_day: z.number().positive().optional(),
  amenities: z.array(z.string()).optional(),
  contact_phone: z.string().min(10).optional(),
  contact_email: z.string().email().optional(),
  images: z.array(z.string()).nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateMarriageHallInput = z.infer<typeof updateMarriageHallInputSchema>;

// Booking schema
export const bookingSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  hall_id: z.number(),
  event_date: z.coerce.date(),
  guest_count: z.number().int(),
  total_amount: z.number(),
  status: bookingStatusSchema,
  special_requirements: z.string().nullable(),
  contact_name: z.string(),
  contact_phone: z.string(),
  contact_email: z.string().email(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Booking = z.infer<typeof bookingSchema>;

// Input schema for creating bookings
export const createBookingInputSchema = z.object({
  user_id: z.number(),
  hall_id: z.number(),
  event_date: z.coerce.date(),
  guest_count: z.number().int().positive('Guest count must be positive'),
  special_requirements: z.string().nullable().default(null),
  contact_name: z.string().min(2, 'Contact name must be at least 2 characters'),
  contact_phone: z.string().min(10, 'Contact phone must be at least 10 characters'),
  contact_email: z.string().email('Invalid contact email format')
});

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;

// Input schema for updating booking status (admin)
export const updateBookingStatusInputSchema = z.object({
  id: z.number(),
  status: bookingStatusSchema
});

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusInputSchema>;

// Query schemas
export const getHallsQuerySchema = z.object({
  location: z.string().optional(),
  capacity_min: z.number().int().optional(),
  capacity_max: z.number().int().optional(),
  price_min: z.number().optional(),
  price_max: z.number().optional(),
  amenities: z.array(z.string()).optional(),
  is_active: z.boolean().optional()
});

export type GetHallsQuery = z.infer<typeof getHallsQuerySchema>;

export const getBookingsQuerySchema = z.object({
  user_id: z.number().optional(),
  hall_id: z.number().optional(),
  status: bookingStatusSchema.optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional()
});

export type GetBookingsQuery = z.infer<typeof getBookingsQuerySchema>;

// Check availability schema
export const checkAvailabilityInputSchema = z.object({
  hall_id: z.number(),
  event_date: z.coerce.date()
});

export type CheckAvailabilityInput = z.infer<typeof checkAvailabilityInputSchema>;

// Availability response schema
export const availabilityResponseSchema = z.object({
  hall_id: z.number(),
  event_date: z.coerce.date(),
  is_available: z.boolean(),
  conflicting_booking_id: z.number().nullable()
});

export type AvailabilityResponse = z.infer<typeof availabilityResponseSchema>;