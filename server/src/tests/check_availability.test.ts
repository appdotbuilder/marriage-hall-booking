import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, marriageHallsTable, bookingsTable } from '../db/schema';
import { type CheckAvailabilityInput } from '../schema';
import { checkAvailability } from '../handlers/check_availability';

describe('checkAvailability', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testHallId: number;
  const testEventDate = new Date('2024-06-15');

  beforeEach(async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        role: 'user'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create a test marriage hall
    const hallResult = await db.insert(marriageHallsTable)
      .values({
        name: 'Grand Palace',
        description: 'Elegant wedding venue',
        location: 'Downtown',
        capacity: 200,
        price_per_day: '5000.00',
        amenities: ['parking', 'catering', 'decoration'],
        contact_phone: '1234567890',
        contact_email: 'contact@grandpalace.com',
        images: ['image1.jpg'],
        is_active: true
      })
      .returning()
      .execute();
    testHallId = hallResult[0].id;
  });

  it('should return available when no approved bookings exist', async () => {
    const input: CheckAvailabilityInput = {
      hall_id: testHallId,
      event_date: testEventDate
    };

    const result = await checkAvailability(input);

    expect(result.hall_id).toEqual(testHallId);
    expect(result.event_date).toEqual(testEventDate);
    expect(result.is_available).toBe(true);
    expect(result.conflicting_booking_id).toBeNull();
  });

  it('should return unavailable when approved booking exists on same date', async () => {
    // Create an approved booking for the test date
    const bookingResult = await db.insert(bookingsTable)
      .values({
        user_id: testUserId,
        hall_id: testHallId,
        event_date: testEventDate,
        guest_count: 150,
        total_amount: '5000.00',
        status: 'approved',
        special_requirements: null,
        contact_name: 'Test Contact',
        contact_phone: '1234567890',
        contact_email: 'contact@test.com'
      })
      .returning()
      .execute();

    const input: CheckAvailabilityInput = {
      hall_id: testHallId,
      event_date: testEventDate
    };

    const result = await checkAvailability(input);

    expect(result.hall_id).toEqual(testHallId);
    expect(result.event_date).toEqual(testEventDate);
    expect(result.is_available).toBe(false);
    expect(result.conflicting_booking_id).toEqual(bookingResult[0].id);
  });

  it('should return available when only pending bookings exist', async () => {
    // Create a pending booking for the test date
    await db.insert(bookingsTable)
      .values({
        user_id: testUserId,
        hall_id: testHallId,
        event_date: testEventDate,
        guest_count: 150,
        total_amount: '5000.00',
        status: 'pending',
        special_requirements: null,
        contact_name: 'Test Contact',
        contact_phone: '1234567890',
        contact_email: 'contact@test.com'
      })
      .execute();

    const input: CheckAvailabilityInput = {
      hall_id: testHallId,
      event_date: testEventDate
    };

    const result = await checkAvailability(input);

    expect(result.hall_id).toEqual(testHallId);
    expect(result.event_date).toEqual(testEventDate);
    expect(result.is_available).toBe(true);
    expect(result.conflicting_booking_id).toBeNull();
  });

  it('should return available when only rejected bookings exist', async () => {
    // Create a rejected booking for the test date
    await db.insert(bookingsTable)
      .values({
        user_id: testUserId,
        hall_id: testHallId,
        event_date: testEventDate,
        guest_count: 150,
        total_amount: '5000.00',
        status: 'rejected',
        special_requirements: null,
        contact_name: 'Test Contact',
        contact_phone: '1234567890',
        contact_email: 'contact@test.com'
      })
      .execute();

    const input: CheckAvailabilityInput = {
      hall_id: testHallId,
      event_date: testEventDate
    };

    const result = await checkAvailability(input);

    expect(result.hall_id).toEqual(testHallId);
    expect(result.event_date).toEqual(testEventDate);
    expect(result.is_available).toBe(true);
    expect(result.conflicting_booking_id).toBeNull();
  });

  it('should return available when only cancelled bookings exist', async () => {
    // Create a cancelled booking for the test date
    await db.insert(bookingsTable)
      .values({
        user_id: testUserId,
        hall_id: testHallId,
        event_date: testEventDate,
        guest_count: 150,
        total_amount: '5000.00',
        status: 'cancelled',
        special_requirements: null,
        contact_name: 'Test Contact',
        contact_phone: '1234567890',
        contact_email: 'contact@test.com'
      })
      .execute();

    const input: CheckAvailabilityInput = {
      hall_id: testHallId,
      event_date: testEventDate
    };

    const result = await checkAvailability(input);

    expect(result.hall_id).toEqual(testHallId);
    expect(result.event_date).toEqual(testEventDate);
    expect(result.is_available).toBe(true);
    expect(result.conflicting_booking_id).toBeNull();
  });

  it('should return available for different date even with approved booking', async () => {
    // Create an approved booking for a different date
    await db.insert(bookingsTable)
      .values({
        user_id: testUserId,
        hall_id: testHallId,
        event_date: new Date('2024-06-16'), // Different date
        guest_count: 150,
        total_amount: '5000.00',
        status: 'approved',
        special_requirements: null,
        contact_name: 'Test Contact',
        contact_phone: '1234567890',
        contact_email: 'contact@test.com'
      })
      .execute();

    const input: CheckAvailabilityInput = {
      hall_id: testHallId,
      event_date: testEventDate // Original date
    };

    const result = await checkAvailability(input);

    expect(result.hall_id).toEqual(testHallId);
    expect(result.event_date).toEqual(testEventDate);
    expect(result.is_available).toBe(true);
    expect(result.conflicting_booking_id).toBeNull();
  });

  it('should return available for different hall even with approved booking on same date', async () => {
    // Create another hall
    const anotherHallResult = await db.insert(marriageHallsTable)
      .values({
        name: 'Royal Gardens',
        description: 'Beautiful garden venue',
        location: 'Suburbs',
        capacity: 300,
        price_per_day: '7000.00',
        amenities: ['garden', 'parking'],
        contact_phone: '0987654321',
        contact_email: 'contact@royalgardens.com',
        images: ['garden1.jpg'],
        is_active: true
      })
      .returning()
      .execute();

    // Create an approved booking for the first hall
    await db.insert(bookingsTable)
      .values({
        user_id: testUserId,
        hall_id: testHallId, // First hall
        event_date: testEventDate,
        guest_count: 150,
        total_amount: '5000.00',
        status: 'approved',
        special_requirements: null,
        contact_name: 'Test Contact',
        contact_phone: '1234567890',
        contact_email: 'contact@test.com'
      })
      .execute();

    const input: CheckAvailabilityInput = {
      hall_id: anotherHallResult[0].id, // Check availability for different hall
      event_date: testEventDate
    };

    const result = await checkAvailability(input);

    expect(result.hall_id).toEqual(anotherHallResult[0].id);
    expect(result.event_date).toEqual(testEventDate);
    expect(result.is_available).toBe(true);
    expect(result.conflicting_booking_id).toBeNull();
  });

  it('should return first conflicting booking ID when multiple approved bookings exist', async () => {
    // Create multiple approved bookings for the same date and hall
    const firstBookingResult = await db.insert(bookingsTable)
      .values({
        user_id: testUserId,
        hall_id: testHallId,
        event_date: testEventDate,
        guest_count: 150,
        total_amount: '5000.00',
        status: 'approved',
        special_requirements: null,
        contact_name: 'First Contact',
        contact_phone: '1111111111',
        contact_email: 'first@test.com'
      })
      .returning()
      .execute();

    await db.insert(bookingsTable)
      .values({
        user_id: testUserId,
        hall_id: testHallId,
        event_date: testEventDate,
        guest_count: 100,
        total_amount: '5000.00',
        status: 'approved',
        special_requirements: null,
        contact_name: 'Second Contact',
        contact_phone: '2222222222',
        contact_email: 'second@test.com'
      })
      .execute();

    const input: CheckAvailabilityInput = {
      hall_id: testHallId,
      event_date: testEventDate
    };

    const result = await checkAvailability(input);

    expect(result.hall_id).toEqual(testHallId);
    expect(result.event_date).toEqual(testEventDate);
    expect(result.is_available).toBe(false);
    expect(result.conflicting_booking_id).toEqual(firstBookingResult[0].id);
  });
});