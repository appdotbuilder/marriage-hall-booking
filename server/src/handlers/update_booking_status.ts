import { db } from '../db';
import { bookingsTable, marriageHallsTable } from '../db/schema';
import { type UpdateBookingStatusInput, type Booking } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export async function updateBookingStatus(input: UpdateBookingStatusInput): Promise<Booking> {
  try {
    // First, get the current booking to validate it exists
    const existingBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, input.id))
      .execute();

    if (existingBookings.length === 0) {
      throw new Error('Booking not found');
    }

    const existingBooking = existingBookings[0];

    // If approving a booking, check for conflicts
    if (input.status === 'approved') {
      // Check if there are any other approved bookings for the same hall on the same date
      const conflictingBookings = await db.select()
        .from(bookingsTable)
        .where(
          and(
            eq(bookingsTable.hall_id, existingBooking.hall_id),
            eq(bookingsTable.event_date, existingBooking.event_date),
            eq(bookingsTable.status, 'approved'),
            ne(bookingsTable.id, input.id)
          )
        )
        .execute();

      if (conflictingBookings.length > 0) {
        throw new Error('Hall is already booked for this date');
      }
    }

    // Update the booking status
    const result = await db.update(bookingsTable)
      .set({
        status: input.status,
        updated_at: new Date()
      })
      .where(eq(bookingsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers
    const updatedBooking = result[0];
    return {
      ...updatedBooking,
      total_amount: parseFloat(updatedBooking.total_amount)
    };
  } catch (error) {
    console.error('Booking status update failed:', error);
    throw error;
  }
}

export async function cancelBooking(id: number, userId: number): Promise<Booking> {
  try {
    // Get the booking to validate it exists and belongs to the user
    const existingBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .execute();

    if (existingBookings.length === 0) {
      throw new Error('Booking not found');
    }

    const existingBooking = existingBookings[0];

    // Validate that the booking belongs to the user
    if (existingBooking.user_id !== userId) {
      throw new Error('You can only cancel your own bookings');
    }

    // Check if booking is in a cancellable state
    if (existingBooking.status === 'cancelled') {
      throw new Error('Booking is already cancelled');
    }

    // Check if the event date is at least 24 hours in the future
    const eventDate = new Date(existingBooking.event_date);
    const now = new Date();
    const timeDifference = eventDate.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 3600);

    if (hoursDifference < 24) {
      throw new Error('Bookings can only be cancelled at least 24 hours before the event date');
    }

    // Update the booking status to cancelled
    const result = await db.update(bookingsTable)
      .set({
        status: 'cancelled',
        updated_at: new Date()
      })
      .where(eq(bookingsTable.id, id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers
    const cancelledBooking = result[0];
    return {
      ...cancelledBooking,
      total_amount: parseFloat(cancelledBooking.total_amount)
    };
  } catch (error) {
    console.error('Booking cancellation failed:', error);
    throw error;
  }
}