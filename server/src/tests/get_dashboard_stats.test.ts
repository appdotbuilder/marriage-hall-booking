import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, marriageHallsTable, bookingsTable } from '../db/schema';
import { getDashboardStats } from '../handlers/get_dashboard_stats';

// Test data
const testUser = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    role: 'user' as const
};

const testHall1 = {
    name: 'Grand Palace',
    description: 'A beautiful wedding hall',
    location: 'Downtown',
    capacity: 200,
    price_per_day: '5000.00',
    amenities: ['parking', 'catering'],
    contact_phone: '1234567890',
    contact_email: 'contact@palace.com',
    images: ['image1.jpg'],
    is_active: true
};

const testHall2 = {
    name: 'Royal Garden',
    description: 'Garden wedding venue',
    location: 'Suburbs',
    capacity: 150,
    price_per_day: '3000.00',
    amenities: ['garden', 'lighting'],
    contact_phone: '0987654321',
    contact_email: 'info@garden.com',
    images: ['image2.jpg'],
    is_active: false
};

describe('getDashboardStats', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should return zero stats for empty database', async () => {
        const stats = await getDashboardStats();

        expect(stats.total_halls).toEqual(0);
        expect(stats.active_halls).toEqual(0);
        expect(stats.total_bookings).toEqual(0);
        expect(stats.pending_bookings).toEqual(0);
        expect(stats.approved_bookings).toEqual(0);
        expect(stats.rejected_bookings).toEqual(0);
        expect(stats.cancelled_bookings).toEqual(0);
        expect(stats.total_revenue).toEqual(0);
        expect(stats.recent_bookings).toEqual(0);
    });

    it('should count halls correctly', async () => {
        // Create test halls
        await db.insert(marriageHallsTable).values([testHall1, testHall2]).execute();

        const stats = await getDashboardStats();

        expect(stats.total_halls).toEqual(2);
        expect(stats.active_halls).toEqual(1); // Only testHall1 is active
    });

    it('should count bookings by status correctly', async () => {
        // Create prerequisite data
        const [user] = await db.insert(usersTable).values(testUser).returning().execute();
        const [hall] = await db.insert(marriageHallsTable).values(testHall1).returning().execute();

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Create bookings with different statuses
        const bookingsData = [
            {
                user_id: user.id,
                hall_id: hall.id,
                event_date: tomorrow,
                guest_count: 100,
                total_amount: '2500.00',
                status: 'pending' as const,
                contact_name: 'John Doe',
                contact_phone: '1234567890',
                contact_email: 'john@example.com'
            },
            {
                user_id: user.id,
                hall_id: hall.id,
                event_date: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000), // Day after tomorrow
                guest_count: 150,
                total_amount: '3000.00',
                status: 'approved' as const,
                contact_name: 'Jane Smith',
                contact_phone: '0987654321',
                contact_email: 'jane@example.com'
            },
            {
                user_id: user.id,
                hall_id: hall.id,
                event_date: new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000), // Two days later
                guest_count: 80,
                total_amount: '2000.00',
                status: 'rejected' as const,
                contact_name: 'Bob Johnson',
                contact_phone: '5555555555',
                contact_email: 'bob@example.com'
            },
            {
                user_id: user.id,
                hall_id: hall.id,
                event_date: new Date(tomorrow.getTime() + 3 * 24 * 60 * 60 * 1000), // Three days later
                guest_count: 120,
                total_amount: '2800.00',
                status: 'cancelled' as const,
                contact_name: 'Alice Brown',
                contact_phone: '7777777777',
                contact_email: 'alice@example.com'
            }
        ];

        await db.insert(bookingsTable).values(bookingsData).execute();

        const stats = await getDashboardStats();

        expect(stats.total_bookings).toEqual(4);
        expect(stats.pending_bookings).toEqual(1);
        expect(stats.approved_bookings).toEqual(1);
        expect(stats.rejected_bookings).toEqual(1);
        expect(stats.cancelled_bookings).toEqual(1);
    });

    it('should calculate total revenue from approved bookings only', async () => {
        // Create prerequisite data
        const [user] = await db.insert(usersTable).values(testUser).returning().execute();
        const [hall] = await db.insert(marriageHallsTable).values(testHall1).returning().execute();

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Create bookings with different statuses and amounts
        const bookingsData = [
            {
                user_id: user.id,
                hall_id: hall.id,
                event_date: tomorrow,
                guest_count: 100,
                total_amount: '2500.00', // Approved
                status: 'approved' as const,
                contact_name: 'John Doe',
                contact_phone: '1234567890',
                contact_email: 'john@example.com'
            },
            {
                user_id: user.id,
                hall_id: hall.id,
                event_date: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
                guest_count: 150,
                total_amount: '3500.00', // Approved
                status: 'approved' as const,
                contact_name: 'Jane Smith',
                contact_phone: '0987654321',
                contact_email: 'jane@example.com'
            },
            {
                user_id: user.id,
                hall_id: hall.id,
                event_date: new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000),
                guest_count: 80,
                total_amount: '2000.00', // Pending - should not count
                status: 'pending' as const,
                contact_name: 'Bob Johnson',
                contact_phone: '5555555555',
                contact_email: 'bob@example.com'
            }
        ];

        await db.insert(bookingsTable).values(bookingsData).execute();

        const stats = await getDashboardStats();

        expect(stats.total_revenue).toEqual(6000.00); // 2500 + 3500, pending booking excluded
        expect(typeof stats.total_revenue).toEqual('number');
    });

    it('should count recent bookings within last 30 days', async () => {
        // Create prerequisite data
        const [user] = await db.insert(usersTable).values(testUser).returning().execute();
        const [hall] = await db.insert(marriageHallsTable).values(testHall1).returning().execute();

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Create a recent booking
        const recentBooking = {
            user_id: user.id,
            hall_id: hall.id,
            event_date: tomorrow,
            guest_count: 100,
            total_amount: '2500.00',
            status: 'pending' as const,
            contact_name: 'Recent Booking',
            contact_phone: '1234567890',
            contact_email: 'recent@example.com'
        };

        await db.insert(bookingsTable).values(recentBooking).execute();

        const stats = await getDashboardStats();

        expect(stats.recent_bookings).toEqual(1);
        expect(stats.total_bookings).toEqual(1);
    });

    it('should handle complex scenario with mixed data', async () => {
        // Create users
        const users = await db.insert(usersTable).values([
            testUser,
            {
                name: 'Admin User',
                email: 'admin@example.com',
                phone: '9999999999',
                role: 'admin' as const
            }
        ]).returning().execute();

        // Create halls
        const halls = await db.insert(marriageHallsTable).values([
            testHall1,
            testHall2,
            {
                name: 'Crystal Ballroom',
                description: 'Luxury ballroom',
                location: 'City Center',
                capacity: 300,
                price_per_day: '8000.00',
                amenities: ['valet', 'luxury'],
                contact_phone: '1111111111',
                contact_email: 'crystal@example.com',
                images: null,
                is_active: true
            }
        ]).returning().execute();

        // Create bookings with various dates and statuses
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const oldDate = new Date(now);
        oldDate.setDate(oldDate.getDate() - 35); // 35 days ago - not recent

        const bookingsData = [
            // Recent approved booking
            {
                user_id: users[0].id,
                hall_id: halls[0].id,
                event_date: tomorrow,
                guest_count: 100,
                total_amount: '5000.00',
                status: 'approved' as const,
                contact_name: 'Recent Approved',
                contact_phone: '1234567890',
                contact_email: 'recent@example.com'
            },
            // Old approved booking (not recent)
            {
                user_id: users[1].id,
                hall_id: halls[2].id,
                event_date: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
                guest_count: 200,
                total_amount: '8000.00',
                status: 'approved' as const,
                contact_name: 'Old Approved',
                contact_phone: '0987654321',
                contact_email: 'old@example.com',
                created_at: oldDate
            },
            // Recent pending booking
            {
                user_id: users[0].id,
                hall_id: halls[1].id,
                event_date: new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000),
                guest_count: 120,
                total_amount: '3000.00',
                status: 'pending' as const,
                contact_name: 'Recent Pending',
                contact_phone: '5555555555',
                contact_email: 'pending@example.com'
            }
        ];

        // Insert the bookings with custom created_at for old booking
        for (const booking of bookingsData) {
            if (booking.contact_name === 'Old Approved') {
                await db.insert(bookingsTable).values({
                    ...booking,
                    created_at: oldDate
                }).execute();
            } else {
                await db.insert(bookingsTable).values(booking).execute();
            }
        }

        const stats = await getDashboardStats();

        expect(stats.total_halls).toEqual(3);
        expect(stats.active_halls).toEqual(2); // testHall1 and Crystal Ballroom
        expect(stats.total_bookings).toEqual(3);
        expect(stats.approved_bookings).toEqual(2);
        expect(stats.pending_bookings).toEqual(1);
        expect(stats.rejected_bookings).toEqual(0);
        expect(stats.cancelled_bookings).toEqual(0);
        expect(stats.total_revenue).toEqual(13000.00); // 5000 + 8000
        expect(stats.recent_bookings).toEqual(2); // Only recent bookings, not the old one
    });
});