import { db } from '../db';
import { marriageHallsTable, bookingsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function deleteMarriageHall(id: number): Promise<{ success: boolean; message: string }> {
  try {
    // First, check if the marriage hall exists
    const existingHall = await db.select()
      .from(marriageHallsTable)
      .where(eq(marriageHallsTable.id, id))
      .execute();

    if (existingHall.length === 0) {
      return {
        success: false,
        message: 'Marriage hall not found'
      };
    }

    // Check if the hall is already inactive
    if (!existingHall[0].is_active) {
      return {
        success: false,
        message: 'Marriage hall is already deactivated'
      };
    }

    // Check for existing approved or pending bookings
    const existingBookings = await db.select()
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.hall_id, id),
          eq(bookingsTable.status, 'approved')
        )
      )
      .execute();

    if (existingBookings.length > 0) {
      return {
        success: false,
        message: 'Cannot deactivate marriage hall with existing approved bookings'
      };
    }

    // Soft delete by setting is_active to false
    await db.update(marriageHallsTable)
      .set({
        is_active: false,
        updated_at: new Date()
      })
      .where(eq(marriageHallsTable.id, id))
      .execute();

    return {
      success: true,
      message: 'Marriage hall deactivated successfully'
    };
  } catch (error) {
    console.error('Marriage hall deletion failed:', error);
    throw error;
  }
}