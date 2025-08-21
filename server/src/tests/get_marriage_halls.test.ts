import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marriageHallsTable } from '../db/schema';
import { type GetHallsQuery, type CreateMarriageHallInput } from '../schema';
import { getMarriageHalls, getMarriageHallById } from '../handlers/get_marriage_halls';

// Test data for marriage halls
const testHall1: CreateMarriageHallInput = {
  name: 'Grand Palace',
  description: 'Luxurious wedding venue with elegant decor',
  location: 'Downtown',
  capacity: 500,
  price_per_day: 25000.00,
  amenities: ['Air Conditioning', 'Parking', 'Catering', 'DJ System'],
  contact_phone: '1234567890',
  contact_email: 'contact@grandpalace.com',
  images: ['hall1.jpg', 'hall2.jpg'],
  is_active: true
};

const testHall2: CreateMarriageHallInput = {
  name: 'Garden View Hall',
  description: 'Beautiful outdoor wedding venue with garden views',
  location: 'Suburbs',
  capacity: 300,
  price_per_day: 15000.00,
  amenities: ['Garden', 'Parking', 'Photography'],
  contact_phone: '9876543210',
  contact_email: 'info@gardenview.com',
  images: null,
  is_active: true
};

const testHall3: CreateMarriageHallInput = {
  name: 'City Center Hall',
  description: 'Modern venue in the heart of the city',
  location: 'Downtown',
  capacity: 200,
  price_per_day: 30000.00,
  amenities: ['Air Conditioning', 'Valet Parking', 'Premium Catering'],
  contact_phone: '5555555555',
  contact_email: 'bookings@citycenter.com',
  images: ['city1.jpg'],
  is_active: false
};

describe('getMarriageHalls', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all marriage halls when no query provided', async () => {
    // Create test data
    await db.insert(marriageHallsTable).values([
      {
        ...testHall1,
        price_per_day: testHall1.price_per_day.toString()
      },
      {
        ...testHall2,
        price_per_day: testHall2.price_per_day.toString()
      }
    ]).execute();

    const result = await getMarriageHalls();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Grand Palace');
    expect(result[1].name).toEqual('Garden View Hall');
    expect(typeof result[0].price_per_day).toBe('number');
    expect(result[0].price_per_day).toEqual(25000.00);
  });

  it('should filter by location', async () => {
    await db.insert(marriageHallsTable).values([
      {
        ...testHall1,
        price_per_day: testHall1.price_per_day.toString()
      },
      {
        ...testHall2,
        price_per_day: testHall2.price_per_day.toString()
      }
    ]).execute();

    const query: GetHallsQuery = { location: 'Downtown' };
    const result = await getMarriageHalls(query);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Grand Palace');
    expect(result[0].location).toEqual('Downtown');
  });

  it('should filter by capacity range', async () => {
    await db.insert(marriageHallsTable).values([
      {
        ...testHall1,
        price_per_day: testHall1.price_per_day.toString()
      },
      {
        ...testHall2,
        price_per_day: testHall2.price_per_day.toString()
      },
      {
        ...testHall3,
        price_per_day: testHall3.price_per_day.toString()
      }
    ]).execute();

    const query: GetHallsQuery = { 
      capacity_min: 250,
      capacity_max: 400
    };
    const result = await getMarriageHalls(query);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Garden View Hall');
    expect(result[0].capacity).toEqual(300);
  });

  it('should filter by price range', async () => {
    await db.insert(marriageHallsTable).values([
      {
        ...testHall1,
        price_per_day: testHall1.price_per_day.toString()
      },
      {
        ...testHall2,
        price_per_day: testHall2.price_per_day.toString()
      },
      {
        ...testHall3,
        price_per_day: testHall3.price_per_day.toString()
      }
    ]).execute();

    const query: GetHallsQuery = { 
      price_min: 20000,
      price_max: 28000
    };
    const result = await getMarriageHalls(query);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Grand Palace');
    expect(result[0].price_per_day).toEqual(25000.00);
  });

  it('should filter by active status', async () => {
    await db.insert(marriageHallsTable).values([
      {
        ...testHall1,
        price_per_day: testHall1.price_per_day.toString()
      },
      {
        ...testHall3,
        price_per_day: testHall3.price_per_day.toString()
      }
    ]).execute();

    const query: GetHallsQuery = { is_active: true };
    const result = await getMarriageHalls(query);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Grand Palace');
    expect(result[0].is_active).toBe(true);
  });

  it('should filter by amenities', async () => {
    await db.insert(marriageHallsTable).values([
      {
        ...testHall1,
        price_per_day: testHall1.price_per_day.toString()
      },
      {
        ...testHall2,
        price_per_day: testHall2.price_per_day.toString()
      }
    ]).execute();

    const query: GetHallsQuery = { amenities: ['Air Conditioning', 'Parking'] };
    const result = await getMarriageHalls(query);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Grand Palace');
    expect(result[0].amenities).toContain('Air Conditioning');
    expect(result[0].amenities).toContain('Parking');
  });

  it('should apply multiple filters correctly', async () => {
    await db.insert(marriageHallsTable).values([
      {
        ...testHall1,
        price_per_day: testHall1.price_per_day.toString()
      },
      {
        ...testHall2,
        price_per_day: testHall2.price_per_day.toString()
      },
      {
        ...testHall3,
        price_per_day: testHall3.price_per_day.toString()
      }
    ]).execute();

    const query: GetHallsQuery = { 
      location: 'Downtown',
      capacity_min: 400,
      is_active: true
    };
    const result = await getMarriageHalls(query);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Grand Palace');
    expect(result[0].location).toEqual('Downtown');
    expect(result[0].capacity).toEqual(500);
    expect(result[0].is_active).toBe(true);
  });

  it('should return empty array when no halls match filters', async () => {
    await db.insert(marriageHallsTable).values([
      {
        ...testHall1,
        price_per_day: testHall1.price_per_day.toString()
      }
    ]).execute();

    const query: GetHallsQuery = { location: 'Nonexistent Location' };
    const result = await getMarriageHalls(query);

    expect(result).toHaveLength(0);
  });
});

describe('getMarriageHallById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return marriage hall by ID', async () => {
    const insertResult = await db.insert(marriageHallsTable).values({
      ...testHall1,
      price_per_day: testHall1.price_per_day.toString()
    }).returning().execute();

    const hallId = insertResult[0].id;
    const result = await getMarriageHallById(hallId);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('Grand Palace');
    expect(result?.description).toEqual(testHall1.description);
    expect(result?.location).toEqual('Downtown');
    expect(result?.capacity).toEqual(500);
    expect(typeof result?.price_per_day).toBe('number');
    expect(result?.price_per_day).toEqual(25000.00);
    expect(result?.amenities).toEqual(['Air Conditioning', 'Parking', 'Catering', 'DJ System']);
    expect(result?.contact_phone).toEqual('1234567890');
    expect(result?.contact_email).toEqual('contact@grandpalace.com');
    expect(result?.images).toEqual(['hall1.jpg', 'hall2.jpg']);
    expect(result?.is_active).toBe(true);
    expect(result?.id).toBeDefined();
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent ID', async () => {
    const result = await getMarriageHallById(999);
    expect(result).toBeNull();
  });

  it('should handle halls with null images', async () => {
    const insertResult = await db.insert(marriageHallsTable).values({
      ...testHall2,
      price_per_day: testHall2.price_per_day.toString()
    }).returning().execute();

    const hallId = insertResult[0].id;
    const result = await getMarriageHallById(hallId);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('Garden View Hall');
    expect(result?.images).toBeNull();
    expect(typeof result?.price_per_day).toBe('number');
    expect(result?.price_per_day).toEqual(15000.00);
  });

  it('should return inactive halls by ID', async () => {
    const insertResult = await db.insert(marriageHallsTable).values({
      ...testHall3,
      price_per_day: testHall3.price_per_day.toString()
    }).returning().execute();

    const hallId = insertResult[0].id;
    const result = await getMarriageHallById(hallId);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('City Center Hall');
    expect(result?.is_active).toBe(false);
    expect(typeof result?.price_per_day).toBe('number');
    expect(result?.price_per_day).toEqual(30000.00);
  });
});