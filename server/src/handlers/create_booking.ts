import { db } from '../db';
import { bookingsTable, marriageHallsTable, usersTable } from '../db/schema';
import { type CreateBookingInput, type Booking } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createBooking = async (input: CreateBookingInput): Promise<Booking> => {
  try {
    // Check if the event date is in the future
    const currentDate = new Date();
    const eventDate = new Date(input.event_date);
    
    if (eventDate <= currentDate) {
      throw new Error('Event date must be in the future');
    }

    // Verify that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Verify that the hall exists and is active
    const hall = await db.select()
      .from(marriageHallsTable)
      .where(eq(marriageHallsTable.id, input.hall_id))
      .execute();

    if (hall.length === 0) {
      throw new Error('Marriage hall not found');
    }

    if (!hall[0].is_active) {
      throw new Error('Marriage hall is not active');
    }

    // Check if the hall is available on the requested date
    const existingBookings = await db.select()
      .from(bookingsTable)
      .where(and(
        eq(bookingsTable.hall_id, input.hall_id),
        eq(bookingsTable.event_date, input.event_date),
        eq(bookingsTable.status, 'approved')
      ))
      .execute();

    if (existingBookings.length > 0) {
      throw new Error('Hall is not available on the requested date');
    }

    // Calculate total amount based on hall price per day
    const totalAmount = parseFloat(hall[0].price_per_day);

    // Create the booking
    const result = await db.insert(bookingsTable)
      .values({
        user_id: input.user_id,
        hall_id: input.hall_id,
        event_date: input.event_date,
        guest_count: input.guest_count,
        total_amount: totalAmount.toString(), // Convert number to string for numeric column
        status: 'pending',
        special_requirements: input.special_requirements,
        contact_name: input.contact_name,
        contact_phone: input.contact_phone,
        contact_email: input.contact_email
      })
      .returning()
      .execute();

    // Convert numeric field back to number before returning
    const booking = result[0];
    return {
      ...booking,
      total_amount: parseFloat(booking.total_amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Booking creation failed:', error);
    throw error;
  }
};