import { db } from '../db';
import { bookingsTable } from '../db/schema';
import { type CheckAvailabilityInput, type AvailabilityResponse } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function checkAvailability(input: CheckAvailabilityInput): Promise<AvailabilityResponse> {
  try {
    // Query for existing approved bookings for the hall on the given date
    const conflictingBookings = await db.select()
      .from(bookingsTable)
      .where(and(
        eq(bookingsTable.hall_id, input.hall_id),
        eq(bookingsTable.event_date, input.event_date),
        eq(bookingsTable.status, 'approved')
      ))
      .execute();

    // If there are any approved bookings, the hall is not available
    const isAvailable = conflictingBookings.length === 0;
    const conflictingBookingId = isAvailable ? null : conflictingBookings[0].id;

    return {
      hall_id: input.hall_id,
      event_date: input.event_date,
      is_available: isAvailable,
      conflicting_booking_id: conflictingBookingId
    };
  } catch (error) {
    console.error('Availability check failed:', error);
    throw error;
  }
}