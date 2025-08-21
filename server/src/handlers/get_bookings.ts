import { db } from '../db';
import { bookingsTable, usersTable, marriageHallsTable } from '../db/schema';
import { type Booking, type GetBookingsQuery } from '../schema';
import { eq, and, gte, lte, between } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getBookings(query?: GetBookingsQuery): Promise<Booking[]> {
  try {
    // Start with base query
    let baseQuery = db.select()
      .from(bookingsTable);

    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (query?.user_id !== undefined) {
      conditions.push(eq(bookingsTable.user_id, query.user_id));
    }

    if (query?.hall_id !== undefined) {
      conditions.push(eq(bookingsTable.hall_id, query.hall_id));
    }

    if (query?.status !== undefined) {
      conditions.push(eq(bookingsTable.status, query.status));
    }

    if (query?.date_from !== undefined && query?.date_to !== undefined) {
      conditions.push(between(bookingsTable.event_date, query.date_from, query.date_to));
    } else if (query?.date_from !== undefined) {
      conditions.push(gte(bookingsTable.event_date, query.date_from));
    } else if (query?.date_to !== undefined) {
      conditions.push(lte(bookingsTable.event_date, query.date_to));
    }

    // Apply conditions if any exist
    const finalQuery = conditions.length > 0
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const results = await finalQuery.execute();

    // Convert numeric fields back to numbers
    return results.map(booking => ({
      ...booking,
      total_amount: parseFloat(booking.total_amount)
    }));
  } catch (error) {
    console.error('Get bookings failed:', error);
    throw error;
  }
}

export async function getBookingById(id: number): Promise<Booking | null> {
  try {
    const results = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const booking = results[0];

    // Convert numeric fields back to numbers
    return {
      ...booking,
      total_amount: parseFloat(booking.total_amount)
    };
  } catch (error) {
    console.error('Get booking by ID failed:', error);
    throw error;
  }
}