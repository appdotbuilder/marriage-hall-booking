import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, marriageHallsTable, bookingsTable } from '../db/schema';
import { type GetBookingsQuery } from '../schema';
import { getBookings, getBookingById } from '../handlers/get_bookings';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  role: 'user' as const
};

const testUser2 = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '0987654321',
  role: 'user' as const
};

const testHall = {
  name: 'Grand Palace',
  description: 'A beautiful wedding hall',
  location: 'Downtown',
  capacity: 200,
  price_per_day: '1500.00',
  amenities: ['parking', 'catering'],
  contact_phone: '5551234567',
  contact_email: 'contact@grandpalace.com',
  images: ['image1.jpg', 'image2.jpg'],
  is_active: true
};

const testBooking1 = {
  user_id: 1,
  hall_id: 1,
  event_date: new Date('2024-06-15'),
  guest_count: 150,
  total_amount: '1500.00',
  status: 'pending' as const,
  special_requirements: 'Vegetarian menu',
  contact_name: 'John Doe',
  contact_phone: '1234567890',
  contact_email: 'john@example.com'
};

const testBooking2 = {
  user_id: 2,
  hall_id: 1,
  event_date: new Date('2024-07-20'),
  guest_count: 180,
  total_amount: '1500.00',
  status: 'approved' as const,
  special_requirements: null,
  contact_name: 'Jane Smith',
  contact_phone: '0987654321',
  contact_email: 'jane@example.com'
};

describe('getBookings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all bookings when no query filters provided', async () => {
    // Create test data
    await db.insert(usersTable).values([testUser, testUser2]).execute();
    await db.insert(marriageHallsTable).values(testHall).execute();
    await db.insert(bookingsTable).values([testBooking1, testBooking2]).execute();

    const results = await getBookings();

    expect(results).toHaveLength(2);
    expect(results[0].user_id).toEqual(1);
    expect(results[0].hall_id).toEqual(1);
    expect(results[0].guest_count).toEqual(150);
    expect(results[0].total_amount).toEqual(1500);
    expect(typeof results[0].total_amount).toBe('number');
    expect(results[0].status).toEqual('pending');
    expect(results[0].event_date).toBeInstanceOf(Date);
  });

  it('should filter bookings by user_id', async () => {
    // Create test data
    await db.insert(usersTable).values([testUser, testUser2]).execute();
    await db.insert(marriageHallsTable).values(testHall).execute();
    await db.insert(bookingsTable).values([testBooking1, testBooking2]).execute();

    const query: GetBookingsQuery = { user_id: 1 };
    const results = await getBookings(query);

    expect(results).toHaveLength(1);
    expect(results[0].user_id).toEqual(1);
    expect(results[0].contact_name).toEqual('John Doe');
  });

  it('should filter bookings by hall_id', async () => {
    // Create test data
    await db.insert(usersTable).values([testUser, testUser2]).execute();
    await db.insert(marriageHallsTable).values(testHall).execute();
    await db.insert(bookingsTable).values([testBooking1, testBooking2]).execute();

    const query: GetBookingsQuery = { hall_id: 1 };
    const results = await getBookings(query);

    expect(results).toHaveLength(2);
    results.forEach(booking => {
      expect(booking.hall_id).toEqual(1);
    });
  });

  it('should filter bookings by status', async () => {
    // Create test data
    await db.insert(usersTable).values([testUser, testUser2]).execute();
    await db.insert(marriageHallsTable).values(testHall).execute();
    await db.insert(bookingsTable).values([testBooking1, testBooking2]).execute();

    const query: GetBookingsQuery = { status: 'approved' };
    const results = await getBookings(query);

    expect(results).toHaveLength(1);
    expect(results[0].status).toEqual('approved');
    expect(results[0].user_id).toEqual(2);
  });

  it('should filter bookings by date range', async () => {
    // Create test data
    await db.insert(usersTable).values([testUser, testUser2]).execute();
    await db.insert(marriageHallsTable).values(testHall).execute();
    await db.insert(bookingsTable).values([testBooking1, testBooking2]).execute();

    const query: GetBookingsQuery = {
      date_from: new Date('2024-06-01'),
      date_to: new Date('2024-06-30')
    };
    const results = await getBookings(query);

    expect(results).toHaveLength(1);
    expect(results[0].event_date).toEqual(new Date('2024-06-15'));
  });

  it('should filter bookings from a specific date', async () => {
    // Create test data
    await db.insert(usersTable).values([testUser, testUser2]).execute();
    await db.insert(marriageHallsTable).values(testHall).execute();
    await db.insert(bookingsTable).values([testBooking1, testBooking2]).execute();

    const query: GetBookingsQuery = { date_from: new Date('2024-07-01') };
    const results = await getBookings(query);

    expect(results).toHaveLength(1);
    expect(results[0].event_date).toEqual(new Date('2024-07-20'));
  });

  it('should filter bookings to a specific date', async () => {
    // Create test data
    await db.insert(usersTable).values([testUser, testUser2]).execute();
    await db.insert(marriageHallsTable).values(testHall).execute();
    await db.insert(bookingsTable).values([testBooking1, testBooking2]).execute();

    const query: GetBookingsQuery = { date_to: new Date('2024-06-30') };
    const results = await getBookings(query);

    expect(results).toHaveLength(1);
    expect(results[0].event_date).toEqual(new Date('2024-06-15'));
  });

  it('should apply multiple filters correctly', async () => {
    // Create test data
    await db.insert(usersTable).values([testUser, testUser2]).execute();
    await db.insert(marriageHallsTable).values(testHall).execute();
    await db.insert(bookingsTable).values([testBooking1, testBooking2]).execute();

    const query: GetBookingsQuery = {
      user_id: 2,
      status: 'approved',
      hall_id: 1
    };
    const results = await getBookings(query);

    expect(results).toHaveLength(1);
    expect(results[0].user_id).toEqual(2);
    expect(results[0].status).toEqual('approved');
    expect(results[0].hall_id).toEqual(1);
  });

  it('should return empty array when no bookings match filters', async () => {
    // Create test data
    await db.insert(usersTable).values([testUser, testUser2]).execute();
    await db.insert(marriageHallsTable).values(testHall).execute();
    await db.insert(bookingsTable).values([testBooking1, testBooking2]).execute();

    const query: GetBookingsQuery = { user_id: 999 };
    const results = await getBookings(query);

    expect(results).toHaveLength(0);
  });

  it('should return empty array when no bookings exist', async () => {
    const results = await getBookings();
    expect(results).toHaveLength(0);
  });
});

describe('getBookingById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return booking by ID', async () => {
    // Create test data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(marriageHallsTable).values(testHall).execute();
    const bookingResult = await db.insert(bookingsTable).values(testBooking1).returning().execute();
    
    const bookingId = bookingResult[0].id;
    const result = await getBookingById(bookingId);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(bookingId);
    expect(result!.user_id).toEqual(1);
    expect(result!.hall_id).toEqual(1);
    expect(result!.guest_count).toEqual(150);
    expect(result!.total_amount).toEqual(1500);
    expect(typeof result!.total_amount).toBe('number');
    expect(result!.status).toEqual('pending');
    expect(result!.contact_name).toEqual('John Doe');
    expect(result!.special_requirements).toEqual('Vegetarian menu');
    expect(result!.event_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent booking ID', async () => {
    const result = await getBookingById(999);
    expect(result).toBeNull();
  });

  it('should handle bookings with null special requirements', async () => {
    // Create test data - need to create both users to ensure user_id 2 exists
    await db.insert(usersTable).values([testUser, testUser2]).execute();
    await db.insert(marriageHallsTable).values(testHall).execute();
    const bookingResult = await db.insert(bookingsTable).values(testBooking2).returning().execute();
    
    const bookingId = bookingResult[0].id;
    const result = await getBookingById(bookingId);

    expect(result).toBeTruthy();
    expect(result!.special_requirements).toBeNull();
    expect(result!.status).toEqual('approved');
  });

  it('should verify booking exists in database after retrieval', async () => {
    // Create test data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(marriageHallsTable).values(testHall).execute();
    const bookingResult = await db.insert(bookingsTable).values(testBooking1).returning().execute();
    
    const bookingId = bookingResult[0].id;
    const result = await getBookingById(bookingId);

    // Verify in database
    const dbBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .execute();

    expect(dbBookings).toHaveLength(1);
    expect(result!.id).toEqual(dbBookings[0].id);
    expect(result!.total_amount).toEqual(parseFloat(dbBookings[0].total_amount));
  });
});