import { db } from '../db';
import { marriageHallsTable } from '../db/schema';
import { type UpdateMarriageHallInput, type MarriageHall } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMarriageHall = async (input: UpdateMarriageHallInput): Promise<MarriageHall> => {
  try {
    // First, check if the marriage hall exists
    const existingHall = await db.select()
      .from(marriageHallsTable)
      .where(eq(marriageHallsTable.id, input.id))
      .execute();

    if (existingHall.length === 0) {
      throw new Error(`Marriage hall with ID ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.location !== undefined) {
      updateData.location = input.location;
    }
    if (input.capacity !== undefined) {
      updateData.capacity = input.capacity;
    }
    if (input.price_per_day !== undefined) {
      updateData.price_per_day = input.price_per_day.toString(); // Convert number to string for numeric column
    }
    if (input.amenities !== undefined) {
      updateData.amenities = input.amenities;
    }
    if (input.contact_phone !== undefined) {
      updateData.contact_phone = input.contact_phone;
    }
    if (input.contact_email !== undefined) {
      updateData.contact_email = input.contact_email;
    }
    if (input.images !== undefined) {
      updateData.images = input.images;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Perform the update
    const result = await db.update(marriageHallsTable)
      .set(updateData)
      .where(eq(marriageHallsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const updatedHall = result[0];
    return {
      ...updatedHall,
      price_per_day: parseFloat(updatedHall.price_per_day) // Convert string back to number
    };
  } catch (error) {
    console.error('Marriage hall update failed:', error);
    throw error;
  }
};