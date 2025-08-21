import { db } from '../db';
import { marriageHallsTable, bookingsTable } from '../db/schema';
import { eq, count, sum, gte } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export interface DashboardStats {
    total_halls: number;
    active_halls: number;
    total_bookings: number;
    pending_bookings: number;
    approved_bookings: number;
    rejected_bookings: number;
    cancelled_bookings: number;
    total_revenue: number;
    recent_bookings: number; // Last 30 days
}

export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        // Calculate date for 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get hall statistics
        const [totalHallsResult] = await db
            .select({ count: count() })
            .from(marriageHallsTable)
            .execute();

        const [activeHallsResult] = await db
            .select({ count: count() })
            .from(marriageHallsTable)
            .where(eq(marriageHallsTable.is_active, true))
            .execute();

        // Get total bookings count
        const [totalBookingsResult] = await db
            .select({ count: count() })
            .from(bookingsTable)
            .execute();

        // Get booking counts by status
        const [pendingBookingsResult] = await db
            .select({ count: count() })
            .from(bookingsTable)
            .where(eq(bookingsTable.status, 'pending'))
            .execute();

        const [approvedBookingsResult] = await db
            .select({ count: count() })
            .from(bookingsTable)
            .where(eq(bookingsTable.status, 'approved'))
            .execute();

        const [rejectedBookingsResult] = await db
            .select({ count: count() })
            .from(bookingsTable)
            .where(eq(bookingsTable.status, 'rejected'))
            .execute();

        const [cancelledBookingsResult] = await db
            .select({ count: count() })
            .from(bookingsTable)
            .where(eq(bookingsTable.status, 'cancelled'))
            .execute();

        // Get total revenue from approved bookings
        const [totalRevenueResult] = await db
            .select({ 
                total: sql<string>`COALESCE(SUM(${bookingsTable.total_amount}), 0)::text`
            })
            .from(bookingsTable)
            .where(eq(bookingsTable.status, 'approved'))
            .execute();

        // Get recent bookings count (last 30 days)
        const [recentBookingsResult] = await db
            .select({ count: count() })
            .from(bookingsTable)
            .where(gte(bookingsTable.created_at, thirtyDaysAgo))
            .execute();

        return {
            total_halls: totalHallsResult.count,
            active_halls: activeHallsResult.count,
            total_bookings: totalBookingsResult.count,
            pending_bookings: pendingBookingsResult.count,
            approved_bookings: approvedBookingsResult.count,
            rejected_bookings: rejectedBookingsResult.count,
            cancelled_bookings: cancelledBookingsResult.count,
            total_revenue: parseFloat(totalRevenueResult.total),
            recent_bookings: recentBookingsResult.count
        };
    } catch (error) {
        console.error('Dashboard stats calculation failed:', error);
        throw error;
    }
}