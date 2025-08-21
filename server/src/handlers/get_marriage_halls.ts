import { db } from '../db';
import { marriageHallsTable } from '../db/schema';
import { type MarriageHall, type GetHallsQuery } from '../schema';
import { eq, gte, lte, and, type SQL } from 'drizzle-orm';

export async function getMarriageHalls(query?: GetHallsQuery): Promise<MarriageHall[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (query) {
      // Filter by location (case-insensitive partial match)
      if (query.location) {
        conditions.push(eq(marriageHallsTable.location, query.location));
      }

      // Filter by capacity range
      if (query.capacity_min !== undefined) {
        conditions.push(gte(marriageHallsTable.capacity, query.capacity_min));
      }

      if (query.capacity_max !== undefined) {
        conditions.push(lte(marriageHallsTable.capacity, query.capacity_max));
      }

      // Filter by price range
      if (query.price_min !== undefined) {
        conditions.push(gte(marriageHallsTable.price_per_day, query.price_min.toString()));
      }

      if (query.price_max !== undefined) {
        conditions.push(lte(marriageHallsTable.price_per_day, query.price_max.toString()));
      }

      // Filter by active status
      if (query.is_active !== undefined) {
        conditions.push(eq(marriageHallsTable.is_active, query.is_active));
      }
    }

    // Build and execute query
    const dbQuery = conditions.length > 0
      ? db.select().from(marriageHallsTable).where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : db.select().from(marriageHallsTable);

    const results = await dbQuery.execute();

    // Convert numeric fields and filter by amenities if specified
    return results
      .map(hall => ({
        ...hall,
        price_per_day: parseFloat(hall.price_per_day)
      }))
      .filter(hall => {
        // Filter by amenities (if hall has all required amenities)
        if (query?.amenities && query.amenities.length > 0) {
          const hallAmenities = hall.amenities || [];
          return query.amenities.every(amenity => 
            hallAmenities.some(hallAmenity => 
              hallAmenity.toLowerCase().includes(amenity.toLowerCase())
            )
          );
        }
        return true;
      });
  } catch (error) {
    console.error('Failed to fetch marriage halls:', error);
    throw error;
  }
}

export async function getMarriageHallById(id: number): Promise<MarriageHall | null> {
  try {
    const results = await db.select()
      .from(marriageHallsTable)
      .where(eq(marriageHallsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const hall = results[0];
    return {
      ...hall,
      price_per_day: parseFloat(hall.price_per_day)
    };
  } catch (error) {
    console.error('Failed to fetch marriage hall by ID:', error);
    throw error;
  }
}