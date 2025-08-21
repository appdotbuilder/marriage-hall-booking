import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

// Test user inputs
const testUser1: CreateUserInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '1234567890',
  role: 'user'
};

const testUser2: CreateUserInput = {
  name: 'Jane Admin',
  email: 'jane.admin@example.com',
  phone: '0987654321',
  role: 'admin'
};

const testUser3: CreateUserInput = {
  name: 'Bob Smith',
  email: 'bob.smith@example.com',
  phone: '5555555555',
  role: 'user'
};

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return single user when one exists', async () => {
    // Create a test user
    await db.insert(usersTable)
      .values({
        name: testUser1.name,
        email: testUser1.email,
        phone: testUser1.phone,
        role: testUser1.role
      })
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('John Doe');
    expect(result[0].email).toEqual('john.doe@example.com');
    expect(result[0].phone).toEqual('1234567890');
    expect(result[0].role).toEqual('user');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return all users when multiple exist', async () => {
    // Create multiple test users
    await db.insert(usersTable)
      .values([
        {
          name: testUser1.name,
          email: testUser1.email,
          phone: testUser1.phone,
          role: testUser1.role
        },
        {
          name: testUser2.name,
          email: testUser2.email,
          phone: testUser2.phone,
          role: testUser2.role
        },
        {
          name: testUser3.name,
          email: testUser3.email,
          phone: testUser3.phone,
          role: testUser3.role
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);

    // Verify all users are returned
    const userNames = result.map(user => user.name).sort();
    expect(userNames).toEqual(['Bob Smith', 'Jane Admin', 'John Doe']);

    const userEmails = result.map(user => user.email).sort();
    expect(userEmails).toEqual(['bob.smith@example.com', 'jane.admin@example.com', 'john.doe@example.com']);

    // Verify different roles are included
    const roles = result.map(user => user.role);
    expect(roles).toContain('user');
    expect(roles).toContain('admin');

    // Verify all users have required fields
    result.forEach(user => {
      expect(user.id).toBeDefined();
      expect(typeof user.id).toBe('number');
      expect(user.name).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.phone).toBeDefined();
      expect(user.role).toBeDefined();
      expect(['user', 'admin']).toContain(user.role);
      expect(user.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return users ordered by creation time (default database order)', async () => {
    // Create users with slight delays to ensure different timestamps
    await db.insert(usersTable)
      .values({
        name: testUser1.name,
        email: testUser1.email,
        phone: testUser1.phone,
        role: testUser1.role
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(usersTable)
      .values({
        name: testUser2.name,
        email: testUser2.email,
        phone: testUser2.phone,
        role: testUser2.role
      })
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);

    // Verify chronological order (first created should have smaller ID)
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(result[1].created_at.getTime());
  });

  it('should handle users with default role correctly', async () => {
    // Create user without explicitly setting role (should default to 'user')
    await db.insert(usersTable)
      .values({
        name: 'Default Role User',
        email: 'default@example.com',
        phone: '1111111111',
        // role defaults to 'user' in the schema
      })
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    expect(result[0].role).toEqual('user');
    expect(result[0].name).toEqual('Default Role User');
  });
});