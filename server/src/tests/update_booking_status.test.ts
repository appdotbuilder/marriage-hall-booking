import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, marriageHallsTable, bookingsTable } from '../db/schema';
import { type UpdateBookingStatusInput } from '../schema';
import { updateBookingStatus, cancelBooking } from '../handlers/update_booking_status';
import { eq } from 'drizzle-orm';

describe('updateBookingStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUser: any;
  let testHall: any;
  let testBooking: any;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        role: 'user'
      })
      .returning()
      .execute();
    testUser = userResult[0];

    // Create test marriage hall
    const hallResult = await db.insert(marriageHallsTable)
      .values({
        name: 'Test Hall',
        description: 'A beautiful test hall',
        location: 'Test City',
        capacity: 200,
        price_per_day: '15000.00',
        amenities: ['parking', 'ac'],
        contact_phone: '9876543210',
        contact_email: 'hall@test.com',
        images: ['test1.jpg', 'test2.jpg'],
        is_active: true
      })
      .returning()
      .execute();
    testHall = hallResult[0];

    // Create test booking
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 30); // 30 days in the future

    const bookingResult = await db.insert(bookingsTable)
      .values({
        user_id: testUser.id,
        hall_id: testHall.id,
        event_date: eventDate,
        guest_count: 150,
        total_amount: '15000.00',
        status: 'pending',
        special_requirements: 'Special decorations needed',
        contact_name: 'Test Contact',
        contact_phone: '1234567890',
        contact_email: 'contact@test.com'
      })
      .returning()
      .execute();
    testBooking = bookingResult[0];
  });

  it('should update booking status to approved', async () => {
    const input: UpdateBookingStatusInput = {
      id: testBooking.id,
      status: 'approved'
    };

    const result = await updateBookingStatus(input);

    expect(result.id).toEqual(testBooking.id);
    expect(result.status).toEqual('approved');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.total_amount).toBe('number');
    expect(result.total_amount).toEqual(15000);
  });

  it('should update booking status to rejected', async () => {
    const input: UpdateBookingStatusInput = {
      id: testBooking.id,
      status: 'rejected'
    };

    const result = await updateBookingStatus(input);

    expect(result.id).toEqual(testBooking.id);
    expect(result.status).toEqual('rejected');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save status update to database', async () => {
    const input: UpdateBookingStatusInput = {
      id: testBooking.id,
      status: 'approved'
    };

    await updateBookingStatus(input);

    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, testBooking.id))
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].status).toEqual('approved');
    expect(bookings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent booking', async () => {
    const input: UpdateBookingStatusInput = {
      id: 99999,
      status: 'approved'
    };

    await expect(updateBookingStatus(input)).rejects.toThrow(/booking not found/i);
  });

  it('should prevent double booking when approving', async () => {
    // First, approve the existing booking
    const firstInput: UpdateBookingStatusInput = {
      id: testBooking.id,
      status: 'approved'
    };
    await updateBookingStatus(firstInput);

    // Create another booking for the same hall and date
    const secondBookingResult = await db.insert(bookingsTable)
      .values({
        user_id: testUser.id,
        hall_id: testHall.id,
        event_date: testBooking.event_date,
        guest_count: 100,
        total_amount: '15000.00',
        status: 'pending',
        special_requirements: null,
        contact_name: 'Another Contact',
        contact_phone: '9876543210',
        contact_email: 'another@test.com'
      })
      .returning()
      .execute();

    const secondInput: UpdateBookingStatusInput = {
      id: secondBookingResult[0].id,
      status: 'approved'
    };

    // Should throw error due to conflict
    await expect(updateBookingStatus(secondInput)).rejects.toThrow(/hall is already booked/i);
  });

  it('should allow approving if conflicting booking is not approved', async () => {
    // Create another booking for the same hall and date but keep it pending
    const secondBookingResult = await db.insert(bookingsTable)
      .values({
        user_id: testUser.id,
        hall_id: testHall.id,
        event_date: testBooking.event_date,
        guest_count: 100,
        total_amount: '15000.00',
        status: 'rejected', // This booking is rejected, so no conflict
        special_requirements: null,
        contact_name: 'Another Contact',
        contact_phone: '9876543210',
        contact_email: 'another@test.com'
      })
      .returning()
      .execute();

    const input: UpdateBookingStatusInput = {
      id: testBooking.id,
      status: 'approved'
    };

    // Should succeed since the other booking is rejected
    const result = await updateBookingStatus(input);
    expect(result.status).toEqual('approved');
  });
});

describe('cancelBooking', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUser: any;
  let testHall: any;
  let testBooking: any;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        role: 'user'
      })
      .returning()
      .execute();
    testUser = userResult[0];

    // Create test marriage hall
    const hallResult = await db.insert(marriageHallsTable)
      .values({
        name: 'Test Hall',
        description: 'A beautiful test hall',
        location: 'Test City',
        capacity: 200,
        price_per_day: '15000.00',
        amenities: ['parking', 'ac'],
        contact_phone: '9876543210',
        contact_email: 'hall@test.com',
        images: ['test1.jpg', 'test2.jpg'],
        is_active: true
      })
      .returning()
      .execute();
    testHall = hallResult[0];

    // Create test booking with event date 48 hours in the future
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 2); // 2 days in the future

    const bookingResult = await db.insert(bookingsTable)
      .values({
        user_id: testUser.id,
        hall_id: testHall.id,
        event_date: eventDate,
        guest_count: 150,
        total_amount: '15000.00',
        status: 'pending',
        special_requirements: 'Special decorations needed',
        contact_name: 'Test Contact',
        contact_phone: '1234567890',
        contact_email: 'contact@test.com'
      })
      .returning()
      .execute();
    testBooking = bookingResult[0];
  });

  it('should cancel user booking successfully', async () => {
    const result = await cancelBooking(testBooking.id, testUser.id);

    expect(result.id).toEqual(testBooking.id);
    expect(result.status).toEqual('cancelled');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.total_amount).toBe('number');
    expect(result.total_amount).toEqual(15000);
  });

  it('should save cancellation to database', async () => {
    await cancelBooking(testBooking.id, testUser.id);

    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, testBooking.id))
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].status).toEqual('cancelled');
    expect(bookings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent booking', async () => {
    await expect(cancelBooking(99999, testUser.id)).rejects.toThrow(/booking not found/i);
  });

  it('should throw error when user tries to cancel another user booking', async () => {
    // Create another user
    const otherUserResult = await db.insert(usersTable)
      .values({
        name: 'Other User',
        email: 'other@example.com',
        phone: '0987654321',
        role: 'user'
      })
      .returning()
      .execute();

    await expect(cancelBooking(testBooking.id, otherUserResult[0].id))
      .rejects.toThrow(/you can only cancel your own bookings/i);
  });

  it('should throw error when booking is already cancelled', async () => {
    // First cancel the booking
    await cancelBooking(testBooking.id, testUser.id);

    // Try to cancel again
    await expect(cancelBooking(testBooking.id, testUser.id))
      .rejects.toThrow(/booking is already cancelled/i);
  });

  it('should throw error when trying to cancel booking too close to event date', async () => {
    // Create a booking with event date in 12 hours (less than 24 hours)
    const soonEventDate = new Date();
    soonEventDate.setHours(soonEventDate.getHours() + 12);

    const soonBookingResult = await db.insert(bookingsTable)
      .values({
        user_id: testUser.id,
        hall_id: testHall.id,
        event_date: soonEventDate,
        guest_count: 100,
        total_amount: '10000.00',
        status: 'approved',
        special_requirements: null,
        contact_name: 'Soon Contact',
        contact_phone: '1111111111',
        contact_email: 'soon@test.com'
      })
      .returning()
      .execute();

    await expect(cancelBooking(soonBookingResult[0].id, testUser.id))
      .rejects.toThrow(/bookings can only be cancelled at least 24 hours/i);
  });

  it('should allow cancellation exactly 25 hours before event', async () => {
    // Create a booking with event date exactly 25 hours in the future
    const futureEventDate = new Date();
    futureEventDate.setHours(futureEventDate.getHours() + 25);

    const futureBookingResult = await db.insert(bookingsTable)
      .values({
        user_id: testUser.id,
        hall_id: testHall.id,
        event_date: futureEventDate,
        guest_count: 100,
        total_amount: '10000.00',
        status: 'approved',
        special_requirements: null,
        contact_name: 'Future Contact',
        contact_phone: '2222222222',
        contact_email: 'future@test.com'
      })
      .returning()
      .execute();

    const result = await cancelBooking(futureBookingResult[0].id, testUser.id);
    expect(result.status).toEqual('cancelled');
  });
});