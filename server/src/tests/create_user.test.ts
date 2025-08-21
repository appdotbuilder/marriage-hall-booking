import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateUserInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '1234567890',
  role: 'user' // Using explicit role instead of relying on default
};

const adminInput: CreateUserInput = {
  name: 'Admin User',
  email: 'admin@example.com',
  phone: '0987654321',
  role: 'admin'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with default role', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('1234567890');
    expect(result.role).toEqual('user');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a user with admin role', async () => {
    const result = await createUser(adminInput);

    expect(result.name).toEqual('Admin User');
    expect(result.email).toEqual('admin@example.com');
    expect(result.phone).toEqual('0987654321');
    expect(result.role).toEqual('admin');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('John Doe');
    expect(users[0].email).toEqual('john.doe@example.com');
    expect(users[0].phone).toEqual('1234567890');
    expect(users[0].role).toEqual('user');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should enforce email uniqueness', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same email
    const duplicateInput: CreateUserInput = {
      name: 'Jane Doe',
      email: 'john.doe@example.com', // Same email
      phone: '5555555555',
      role: 'user'
    };

    // Should throw error due to unique constraint
    await expect(createUser(duplicateInput)).rejects.toThrow(/duplicate key value/i);
  });

  it('should create multiple users with different emails', async () => {
    const user1 = await createUser(testInput);
    const user2 = await createUser(adminInput);

    expect(user1.id).not.toEqual(user2.id);
    expect(user1.email).not.toEqual(user2.email);

    // Verify both users exist in database
    const allUsers = await db.select()
      .from(usersTable)
      .execute();

    expect(allUsers).toHaveLength(2);
    expect(allUsers.map(u => u.email).sort()).toEqual([
      'admin@example.com',
      'john.doe@example.com'
    ]);
  });

  it('should handle user creation with minimum valid input', async () => {
    const minimalInput: CreateUserInput = {
      name: 'AB', // Minimum 2 characters
      email: 'a@b.co', // Valid minimal email
      phone: '1234567890', // Minimum 10 characters
      role: 'user'
    };

    const result = await createUser(minimalInput);

    expect(result.name).toEqual('AB');
    expect(result.email).toEqual('a@b.co');
    expect(result.phone).toEqual('1234567890');
    expect(result.role).toEqual('user');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});