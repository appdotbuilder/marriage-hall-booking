import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, marriageHallsTable, bookingsTable } from '../db/schema';
import { type CreateBookingInput } from '../schema';
import { createBooking } from '../handlers/create_booking';
import { eq, and } from 'drizzle-orm';

describe('createBooking', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test setup - create prerequisite data
  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        role: 'user'
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestHall = async () => {
    const result = await db.insert(marriageHallsTable)
      .values({
        name: 'Test Hall',
        description: 'A beautiful test hall',
        location: 'Test City',
        capacity: 200,
        price_per_day: '15000.00',
        amenities: ['parking', 'ac'],
        contact_phone: '9876543210',
        contact_email: 'hall@example.com',
        images: null,
        is_active: true
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestBookingInput = (userId: number, hallId: number): CreateBookingInput => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

    return {
      user_id: userId,
      hall_id: hallId,
      event_date: futureDate,
      guest_count: 150,
      special_requirements: 'Need vegetarian catering',
      contact_name: 'John Doe',
      contact_phone: '5555555555',
      contact_email: 'john@example.com'
    };
  };

  it('should create a booking successfully', async () => {
    const user = await createTestUser();
    const hall = await createTestHall();
    const input = createTestBookingInput(user.id, hall.id);

    const result = await createBooking(input);

    // Verify basic fields
    expect(result.user_id).toEqual(user.id);
    expect(result.hall_id).toEqual(hall.id);
    expect(result.guest_count).toEqual(150);
    expect(result.total_amount).toEqual(15000);
    expect(result.status).toEqual('pending');
    expect(result.special_requirements).toEqual('Need vegetarian catering');
    expect(result.contact_name).toEqual('John Doe');
    expect(result.contact_phone).toEqual('5555555555');
    expect(result.contact_email).toEqual('john@example.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.event_date).toBeInstanceOf(Date);
  });

  it('should save booking to database', async () => {
    const user = await createTestUser();
    const hall = await createTestHall();
    const input = createTestBookingInput(user.id, hall.id);

    const result = await createBooking(input);

    // Query the database to verify the booking was saved
    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, result.id))
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].user_id).toEqual(user.id);
    expect(bookings[0].hall_id).toEqual(hall.id);
    expect(parseFloat(bookings[0].total_amount)).toEqual(15000);
    expect(bookings[0].status).toEqual('pending');
  });

  it('should calculate total amount from hall price', async () => {
    const user = await createTestUser();
    
    // Create a hall with a different price
    const expensiveHall = await db.insert(marriageHallsTable)
      .values({
        name: 'Expensive Hall',
        description: 'A luxury hall',
        location: 'Premium City',
        capacity: 500,
        price_per_day: '50000.50',
        amenities: ['valet', 'champagne'],
        contact_phone: '9999999999',
        contact_email: 'luxury@example.com',
        images: null,
        is_active: true
      })
      .returning()
      .execute();

    const input = createTestBookingInput(user.id, expensiveHall[0].id);
    const result = await createBooking(input);

    expect(result.total_amount).toEqual(50000.50);
    expect(typeof result.total_amount).toBe('number');
  });

  it('should throw error if user does not exist', async () => {
    const hall = await createTestHall();
    const input = createTestBookingInput(99999, hall.id); // Non-existent user ID

    await expect(createBooking(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error if hall does not exist', async () => {
    const user = await createTestUser();
    const input = createTestBookingInput(user.id, 99999); // Non-existent hall ID

    await expect(createBooking(input)).rejects.toThrow(/marriage hall not found/i);
  });

  it('should throw error if hall is not active', async () => {
    const user = await createTestUser();
    
    // Create an inactive hall
    const inactiveHall = await db.insert(marriageHallsTable)
      .values({
        name: 'Inactive Hall',
        description: 'A closed hall',
        location: 'Old City',
        capacity: 100,
        price_per_day: '10000.00',
        amenities: ['none'],
        contact_phone: '1111111111',
        contact_email: 'inactive@example.com',
        images: null,
        is_active: false // Hall is not active
      })
      .returning()
      .execute();

    const input = createTestBookingInput(user.id, inactiveHall[0].id);

    await expect(createBooking(input)).rejects.toThrow(/marriage hall is not active/i);
  });

  it('should throw error if event date is in the past', async () => {
    const user = await createTestUser();
    const hall = await createTestHall();
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Yesterday

    const input: CreateBookingInput = {
      user_id: user.id,
      hall_id: hall.id,
      event_date: pastDate,
      guest_count: 100,
      special_requirements: null,
      contact_name: 'Past Event',
      contact_phone: '3333333333',
      contact_email: 'past@example.com'
    };

    await expect(createBooking(input)).rejects.toThrow(/event date must be in the future/i);
  });

  it('should throw error if hall is already booked on requested date', async () => {
    const user = await createTestUser();
    const hall = await createTestHall();
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 15);

    // Create an existing approved booking for the same date
    await db.insert(bookingsTable)
      .values({
        user_id: user.id,
        hall_id: hall.id,
        event_date: eventDate,
        guest_count: 100,
        total_amount: '15000.00',
        status: 'approved', // Important: approved booking blocks the date
        special_requirements: null,
        contact_name: 'Existing Booking',
        contact_phone: '2222222222',
        contact_email: 'existing@example.com'
      })
      .execute();

    const input: CreateBookingInput = {
      user_id: user.id,
      hall_id: hall.id,
      event_date: eventDate,
      guest_count: 80,
      special_requirements: null,
      contact_name: 'Conflicting Booking',
      contact_phone: '4444444444',
      contact_email: 'conflict@example.com'
    };

    await expect(createBooking(input)).rejects.toThrow(/hall is not available on the requested date/i);
  });

  it('should allow booking if existing booking is not approved', async () => {
    const user = await createTestUser();
    const hall = await createTestHall();
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 20);

    // Create an existing pending booking (not approved) for the same date
    await db.insert(bookingsTable)
      .values({
        user_id: user.id,
        hall_id: hall.id,
        event_date: eventDate,
        guest_count: 100,
        total_amount: '15000.00',
        status: 'pending', // Pending booking doesn't block the date
        special_requirements: null,
        contact_name: 'Pending Booking',
        contact_phone: '6666666666',
        contact_email: 'pending@example.com'
      })
      .execute();

    const input: CreateBookingInput = {
      user_id: user.id,
      hall_id: hall.id,
      event_date: eventDate,
      guest_count: 120,
      special_requirements: 'DJ setup needed',
      contact_name: 'New Booking',
      contact_phone: '7777777777',
      contact_email: 'new@example.com'
    };

    const result = await createBooking(input);

    expect(result).toBeDefined();
    expect(result.guest_count).toEqual(120);
    expect(result.special_requirements).toEqual('DJ setup needed');
    expect(result.status).toEqual('pending');
  });

  it('should handle null special requirements', async () => {
    const user = await createTestUser();
    const hall = await createTestHall();
    
    const input: CreateBookingInput = {
      user_id: user.id,
      hall_id: hall.id,
      event_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      guest_count: 75,
      special_requirements: null,
      contact_name: 'Simple Booking',
      contact_phone: '8888888888',
      contact_email: 'simple@example.com'
    };

    const result = await createBooking(input);

    expect(result.special_requirements).toBeNull();
    expect(result.guest_count).toEqual(75);
    expect(result.status).toEqual('pending');
  });
});