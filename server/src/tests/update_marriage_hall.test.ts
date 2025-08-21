import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marriageHallsTable } from '../db/schema';
import { type CreateMarriageHallInput, type UpdateMarriageHallInput } from '../schema';
import { updateMarriageHall } from '../handlers/update_marriage_hall';
import { eq } from 'drizzle-orm';

// Test data for creating a marriage hall first
const testHallInput: CreateMarriageHallInput = {
  name: 'Test Marriage Hall',
  description: 'A beautiful hall for weddings and events',
  location: 'Test City, Test State',
  capacity: 200,
  price_per_day: 15000,
  amenities: ['parking', 'ac', 'catering'],
  contact_phone: '1234567890',
  contact_email: 'test@marriagehall.com',
  images: ['image1.jpg', 'image2.jpg'],
  is_active: true
};

// Helper function to create a test hall
const createTestHall = async () => {
  const result = await db.insert(marriageHallsTable)
    .values({
      ...testHallInput,
      price_per_day: testHallInput.price_per_day.toString()
    })
    .returning()
    .execute();
  
  return {
    ...result[0],
    price_per_day: parseFloat(result[0].price_per_day)
  };
};

describe('updateMarriageHall', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a marriage hall with all fields', async () => {
    // Create a test hall first
    const createdHall = await createTestHall();

    const updateInput: UpdateMarriageHallInput = {
      id: createdHall.id,
      name: 'Updated Hall Name',
      description: 'Updated description for the hall',
      location: 'Updated City, Updated State',
      capacity: 300,
      price_per_day: 20000,
      amenities: ['parking', 'ac', 'catering', 'decorations'],
      contact_phone: '9876543210',
      contact_email: 'updated@marriagehall.com',
      images: ['new_image1.jpg', 'new_image2.jpg', 'new_image3.jpg'],
      is_active: false
    };

    const result = await updateMarriageHall(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(createdHall.id);
    expect(result.name).toEqual('Updated Hall Name');
    expect(result.description).toEqual('Updated description for the hall');
    expect(result.location).toEqual('Updated City, Updated State');
    expect(result.capacity).toEqual(300);
    expect(result.price_per_day).toEqual(20000);
    expect(typeof result.price_per_day).toEqual('number');
    expect(result.amenities).toEqual(['parking', 'ac', 'catering', 'decorations']);
    expect(result.contact_phone).toEqual('9876543210');
    expect(result.contact_email).toEqual('updated@marriagehall.com');
    expect(result.images).toEqual(['new_image1.jpg', 'new_image2.jpg', 'new_image3.jpg']);
    expect(result.is_active).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should update only specified fields', async () => {
    // Create a test hall first
    const createdHall = await createTestHall();

    const partialUpdateInput: UpdateMarriageHallInput = {
      id: createdHall.id,
      name: 'Partially Updated Name',
      price_per_day: 25000
    };

    const result = await updateMarriageHall(partialUpdateInput);

    // Verify only specified fields were updated
    expect(result.id).toEqual(createdHall.id);
    expect(result.name).toEqual('Partially Updated Name');
    expect(result.price_per_day).toEqual(25000);
    expect(typeof result.price_per_day).toEqual('number');
    
    // Other fields should remain unchanged
    expect(result.description).toEqual(createdHall.description);
    expect(result.location).toEqual(createdHall.location);
    expect(result.capacity).toEqual(createdHall.capacity);
    expect(result.amenities).toEqual(createdHall.amenities);
    expect(result.contact_phone).toEqual(createdHall.contact_phone);
    expect(result.contact_email).toEqual(createdHall.contact_email);
    expect(result.images).toEqual(createdHall.images);
    expect(result.is_active).toEqual(createdHall.is_active);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated data to database', async () => {
    // Create a test hall first
    const createdHall = await createTestHall();

    const updateInput: UpdateMarriageHallInput = {
      id: createdHall.id,
      name: 'Database Test Hall',
      capacity: 400,
      price_per_day: 18000
    };

    await updateMarriageHall(updateInput);

    // Query database directly to verify changes
    const halls = await db.select()
      .from(marriageHallsTable)
      .where(eq(marriageHallsTable.id, createdHall.id))
      .execute();

    expect(halls).toHaveLength(1);
    expect(halls[0].name).toEqual('Database Test Hall');
    expect(halls[0].capacity).toEqual(400);
    expect(parseFloat(halls[0].price_per_day)).toEqual(18000);
    expect(halls[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null images field', async () => {
    // Create a test hall first
    const createdHall = await createTestHall();

    const updateInput: UpdateMarriageHallInput = {
      id: createdHall.id,
      images: null
    };

    const result = await updateMarriageHall(updateInput);

    expect(result.images).toBeNull();
  });

  it('should handle empty amenities array', async () => {
    // Create a test hall first
    const createdHall = await createTestHall();

    const updateInput: UpdateMarriageHallInput = {
      id: createdHall.id,
      amenities: []
    };

    const result = await updateMarriageHall(updateInput);

    expect(result.amenities).toEqual([]);
  });

  it('should throw error for non-existent marriage hall', async () => {
    const updateInput: UpdateMarriageHallInput = {
      id: 99999,
      name: 'Non-existent Hall'
    };

    expect(updateMarriageHall(updateInput)).rejects.toThrow(/Marriage hall with ID 99999 not found/i);
  });

  it('should always update the updated_at timestamp', async () => {
    // Create a test hall first
    const createdHall = await createTestHall();

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateMarriageHallInput = {
      id: createdHall.id,
      name: 'Timestamp Test Hall'
    };

    const result = await updateMarriageHall(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdHall.updated_at.getTime());
  });

  it('should handle price_per_day numeric conversion correctly', async () => {
    // Create a test hall first
    const createdHall = await createTestHall();

    const updateInput: UpdateMarriageHallInput = {
      id: createdHall.id,
      price_per_day: 22500.75 // Test with decimal places
    };

    const result = await updateMarriageHall(updateInput);

    expect(result.price_per_day).toEqual(22500.75);
    expect(typeof result.price_per_day).toEqual('number');

    // Verify in database
    const halls = await db.select()
      .from(marriageHallsTable)
      .where(eq(marriageHallsTable.id, createdHall.id))
      .execute();

    expect(parseFloat(halls[0].price_per_day)).toEqual(22500.75);
  });
});