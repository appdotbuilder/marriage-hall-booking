import { serial, text, pgTable, timestamp, numeric, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'approved', 'rejected', 'cancelled']);
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Marriage halls table
export const marriageHallsTable = pgTable('marriage_halls', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  location: text('location').notNull(),
  capacity: integer('capacity').notNull(),
  price_per_day: numeric('price_per_day', { precision: 10, scale: 2 }).notNull(),
  amenities: jsonb('amenities').notNull().$type<string[]>(),
  contact_phone: text('contact_phone').notNull(),
  contact_email: text('contact_email').notNull(),
  images: jsonb('images').$type<string[]>(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Bookings table
export const bookingsTable = pgTable('bookings', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  hall_id: integer('hall_id').notNull().references(() => marriageHallsTable.id),
  event_date: timestamp('event_date').notNull(),
  guest_count: integer('guest_count').notNull(),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: bookingStatusEnum('status').notNull().default('pending'),
  special_requirements: text('special_requirements'),
  contact_name: text('contact_name').notNull(),
  contact_phone: text('contact_phone').notNull(),
  contact_email: text('contact_email').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  bookings: many(bookingsTable),
}));

export const marriageHallsRelations = relations(marriageHallsTable, ({ many }) => ({
  bookings: many(bookingsTable),
}));

export const bookingsRelations = relations(bookingsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [bookingsTable.user_id],
    references: [usersTable.id],
  }),
  hall: one(marriageHallsTable, {
    fields: [bookingsTable.hall_id],
    references: [marriageHallsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type MarriageHall = typeof marriageHallsTable.$inferSelect;
export type NewMarriageHall = typeof marriageHallsTable.$inferInsert;

export type Booking = typeof bookingsTable.$inferSelect;
export type NewBooking = typeof bookingsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  marriageHalls: marriageHallsTable,
  bookings: bookingsTable
};

export const relationTables = {
  usersRelations,
  marriageHallsRelations,
  bookingsRelations
};