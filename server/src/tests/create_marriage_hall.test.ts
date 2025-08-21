import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marriageHallsTable } from '../db/schema';
import { type CreateMarriageHallInput } from '../schema';
import { createMarriageHall } from '../handlers/create_marriage_hall';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateMarriageHallInput = {
  name: 'Grand Palace Hall',
  description: 'A luxurious marriage hall perfect for grand celebrations',
  location: '123 Wedding Street, Marriage City',
  capacity: 500,
  price_per_day: 25000.50,
  amenities: ['AC', 'Parking', 'Catering', 'Sound System'],
  contact_phone: '9876543210',
  contact_email: 'contact@grandpalace.com',
  images: ['hall1.jpg', 'hall2.jpg', 'hall3.jpg'],
  is_active: true
};

// Test input with minimal required fields (using defaults)
const minimalInput: CreateMarriageHallInput = {
  name: 'Simple Hall',
  description: 'A basic hall for small gatherings',
  location: '456 Simple Street, Basic City',
  capacity: 100,
  price_per_day: 5000.00,
  contact_phone: '1234567890',
  contact_email: 'simple@hall.com',
  amenities: [], // Required field with default value
  images: null, // Required field with default value
  is_active: true // Required field with default value
};

describe('createMarriageHall', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a marriage hall with all fields', async () => {
    const result = await createMarriageHall(testInput);

    // Verify all field values
    expect(result.name).toEqual('Grand Palace Hall');
    expect(result.description).toEqual(testInput.description);
    expect(result.location).toEqual(testInput.location);
    expect(result.capacity).toEqual(500);
    expect(result.price_per_day).toEqual(25000.50);
    expect(typeof result.price_per_day).toBe('number'); // Verify numeric conversion
    expect(result.amenities).toEqual(['AC', 'Parking', 'Catering', 'Sound System']);
    expect(result.contact_phone).toEqual('9876543210');
    expect(result.contact_email).toEqual('contact@grandpalace.com');
    expect(result.images).toEqual(['hall1.jpg', 'hall2.jpg', 'hall3.jpg']);
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a marriage hall with default values', async () => {
    const result = await createMarriageHall(minimalInput);

    // Verify required fields
    expect(result.name).toEqual('Simple Hall');
    expect(result.description).toEqual(minimalInput.description);
    expect(result.location).toEqual(minimalInput.location);
    expect(result.capacity).toEqual(100);
    expect(result.price_per_day).toEqual(5000.00);
    expect(typeof result.price_per_day).toBe('number'); // Verify numeric conversion
    expect(result.contact_phone).toEqual('1234567890');
    expect(result.contact_email).toEqual('simple@hall.com');
    
    // Verify default values applied by Zod schema
    expect(result.amenities).toEqual([]);
    expect(result.images).toBeNull();
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save marriage hall to database', async () => {
    const result = await createMarriageHall(testInput);

    // Query the database to verify the record was saved
    const halls = await db.select()
      .from(marriageHallsTable)
      .where(eq(marriageHallsTable.id, result.id))
      .execute();

    expect(halls).toHaveLength(1);
    const savedHall = halls[0];
    
    // Verify database storage
    expect(savedHall.name).toEqual('Grand Palace Hall');
    expect(savedHall.description).toEqual(testInput.description);
    expect(savedHall.location).toEqual(testInput.location);
    expect(savedHall.capacity).toEqual(500);
    expect(parseFloat(savedHall.price_per_day)).toEqual(25000.50); // Database stores as string
    expect(savedHall.amenities).toEqual(['AC', 'Parking', 'Catering', 'Sound System']);
    expect(savedHall.contact_phone).toEqual('9876543210');
    expect(savedHall.contact_email).toEqual('contact@grandpalace.com');
    expect(savedHall.images).toEqual(['hall1.jpg', 'hall2.jpg', 'hall3.jpg']);
    expect(savedHall.is_active).toBe(true);
    expect(savedHall.created_at).toBeInstanceOf(Date);
    expect(savedHall.updated_at).toBeInstanceOf(Date);
  });

  it('should handle decimal prices correctly', async () => {
    const decimalPriceInput: CreateMarriageHallInput = {
      ...testInput,
      price_per_day: 15750.75 // Test decimal precision
    };

    const result = await createMarriageHall(decimalPriceInput);

    // Verify numeric conversion maintains precision
    expect(result.price_per_day).toEqual(15750.75);
    expect(typeof result.price_per_day).toBe('number');

    // Verify database storage and retrieval
    const halls = await db.select()
      .from(marriageHallsTable)
      .where(eq(marriageHallsTable.id, result.id))
      .execute();

    expect(parseFloat(halls[0].price_per_day)).toEqual(15750.75);
  });

  it('should handle empty amenities array', async () => {
    const emptyAmenitiesInput: CreateMarriageHallInput = {
      ...testInput,
      amenities: []
    };

    const result = await createMarriageHall(emptyAmenitiesInput);

    expect(result.amenities).toEqual([]);
    expect(Array.isArray(result.amenities)).toBe(true);
  });

  it('should handle null images', async () => {
    const nullImagesInput: CreateMarriageHallInput = {
      ...testInput,
      images: null
    };

    const result = await createMarriageHall(nullImagesInput);

    expect(result.images).toBeNull();
  });

  it('should create multiple halls without conflict', async () => {
    const input1: CreateMarriageHallInput = {
      ...testInput,
      name: 'Hall One',
      contact_email: 'hall1@test.com'
    };

    const input2: CreateMarriageHallInput = {
      ...testInput,
      name: 'Hall Two',
      contact_email: 'hall2@test.com'
    };

    const result1 = await createMarriageHall(input1);
    const result2 = await createMarriageHall(input2);

    // Verify both halls were created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Hall One');
    expect(result2.name).toEqual('Hall Two');
    expect(result1.contact_email).toEqual('hall1@test.com');
    expect(result2.contact_email).toEqual('hall2@test.com');
  });
});