import { db } from '../db';
import { marriageHallsTable } from '../db/schema';
import { type CreateMarriageHallInput, type MarriageHall } from '../schema';

export const createMarriageHall = async (input: CreateMarriageHallInput): Promise<MarriageHall> => {
  try {
    // Insert marriage hall record
    const result = await db.insert(marriageHallsTable)
      .values({
        name: input.name,
        description: input.description,
        location: input.location,
        capacity: input.capacity,
        price_per_day: input.price_per_day.toString(), // Convert number to string for numeric column
        amenities: input.amenities ?? [], // Ensure amenities is never null/undefined
        contact_phone: input.contact_phone,
        contact_email: input.contact_email,
        images: input.images ?? null, // Ensure images defaults to null
        is_active: input.is_active ?? true // Ensure is_active defaults to true
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const marriageHall = result[0];
    return {
      ...marriageHall,
      price_per_day: parseFloat(marriageHall.price_per_day) // Convert string back to number
    };
  } catch (error) {
    console.error('Marriage hall creation failed:', error);
    throw error;
  }
};