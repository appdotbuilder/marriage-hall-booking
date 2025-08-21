import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marriageHallsTable, usersTable, bookingsTable } from '../db/schema';
import { deleteMarriageHall } from '../handlers/delete_marriage_hall';
import { eq } from 'drizzle-orm';

describe('deleteMarriageHall', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should deactivate an active marriage hall', async () => {
    // Create a marriage hall
    const hallResult = await db.insert(marriageHallsTable)
      .values({
        name: 'Test Hall',
        description: 'A test hall',
        location: 'Test Location',
        capacity: 100,
        price_per_day: '1000.00',
        amenities: ['parking', 'catering'],
        contact_phone: '1234567890',
        contact_email: 'test@example.com',
        images: ['image1.jpg'],
        is_active: true
      })
      .returning()
      .execute();

    const hallId = hallResult[0].id;

    // Delete the hall
    const result = await deleteMarriageHall(hallId);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Marriage hall deactivated successfully');

    // Verify the hall is now inactive
    const updatedHall = await db.select()
      .from(marriageHallsTable)
      .where(eq(marriageHallsTable.id, hallId))
      .execute();

    expect(updatedHall[0].is_active).toBe(false);
    expect(updatedHall[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return error for non-existent marriage hall', async () => {
    const result = await deleteMarriageHall(999);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Marriage hall not found');
  });

  it('should return error when trying to delete already inactive hall', async () => {
    // Create an inactive marriage hall
    const hallResult = await db.insert(marriageHallsTable)
      .values({
        name: 'Inactive Hall',
        description: 'An inactive test hall',
        location: 'Test Location',
        capacity: 100,
        price_per_day: '1000.00',
        amenities: ['parking'],
        contact_phone: '1234567890',
        contact_email: 'test@example.com',
        images: null,
        is_active: false
      })
      .returning()
      .execute();

    const result = await deleteMarriageHall(hallResult[0].id);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Marriage hall is already deactivated');
  });

  it('should prevent deletion when hall has approved bookings', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        role: 'user'
      })
      .returning()
      .execute();

    // Create a marriage hall
    const hallResult = await db.insert(marriageHallsTable)
      .values({
        name: 'Test Hall with Bookings',
        description: 'A test hall',
        location: 'Test Location',
        capacity: 100,
        price_per_day: '1000.00',
        amenities: ['parking'],
        contact_phone: '1234567890',
        contact_email: 'test@example.com',
        images: null,
        is_active: true
      })
      .returning()
      .execute();

    // Create an approved booking
    await db.insert(bookingsTable)
      .values({
        user_id: userResult[0].id,
        hall_id: hallResult[0].id,
        event_date: new Date('2024-12-25'),
        guest_count: 50,
        total_amount: '1000.00',
        status: 'approved',
        special_requirements: null,
        contact_name: 'Test Contact',
        contact_phone: '1234567890',
        contact_email: 'contact@example.com'
      })
      .execute();

    const result = await deleteMarriageHall(hallResult[0].id);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Cannot deactivate marriage hall with existing approved bookings');

    // Verify the hall is still active
    const hall = await db.select()
      .from(marriageHallsTable)
      .where(eq(marriageHallsTable.id, hallResult[0].id))
      .execute();

    expect(hall[0].is_active).toBe(true);
  });

  it('should allow deletion when hall has only rejected or cancelled bookings', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        role: 'user'
      })
      .returning()
      .execute();

    // Create a marriage hall
    const hallResult = await db.insert(marriageHallsTable)
      .values({
        name: 'Test Hall with Cancelled Bookings',
        description: 'A test hall',
        location: 'Test Location',
        capacity: 100,
        price_per_day: '1000.00',
        amenities: ['parking'],
        contact_phone: '1234567890',
        contact_email: 'test@example.com',
        images: null,
        is_active: true
      })
      .returning()
      .execute();

    // Create rejected and cancelled bookings
    await db.insert(bookingsTable)
      .values([
        {
          user_id: userResult[0].id,
          hall_id: hallResult[0].id,
          event_date: new Date('2024-12-25'),
          guest_count: 50,
          total_amount: '1000.00',
          status: 'rejected',
          special_requirements: null,
          contact_name: 'Test Contact',
          contact_phone: '1234567890',
          contact_email: 'contact@example.com'
        },
        {
          user_id: userResult[0].id,
          hall_id: hallResult[0].id,
          event_date: new Date('2024-12-26'),
          guest_count: 75,
          total_amount: '1500.00',
          status: 'cancelled',
          special_requirements: null,
          contact_name: 'Test Contact 2',
          contact_phone: '1234567890',
          contact_email: 'contact2@example.com'
        }
      ])
      .execute();

    const result = await deleteMarriageHall(hallResult[0].id);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Marriage hall deactivated successfully');

    // Verify the hall is now inactive
    const hall = await db.select()
      .from(marriageHallsTable)
      .where(eq(marriageHallsTable.id, hallResult[0].id))
      .execute();

    expect(hall[0].is_active).toBe(false);
  });

  it('should allow deletion when hall has no bookings at all', async () => {
    // Create a marriage hall without any bookings
    const hallResult = await db.insert(marriageHallsTable)
      .values({
        name: 'Test Hall No Bookings',
        description: 'A test hall with no bookings',
        location: 'Test Location',
        capacity: 100,
        price_per_day: '1000.00',
        amenities: ['parking', 'catering'],
        contact_phone: '1234567890',
        contact_email: 'test@example.com',
        images: ['image1.jpg', 'image2.jpg'],
        is_active: true
      })
      .returning()
      .execute();

    const result = await deleteMarriageHall(hallResult[0].id);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Marriage hall deactivated successfully');

    // Verify the hall is now inactive
    const hall = await db.select()
      .from(marriageHallsTable)
      .where(eq(marriageHallsTable.id, hallResult[0].id))
      .execute();

    expect(hall[0].is_active).toBe(false);
  });
});