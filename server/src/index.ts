import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  createMarriageHallInputSchema,
  updateMarriageHallInputSchema,
  createBookingInputSchema,
  updateBookingStatusInputSchema,
  getHallsQuerySchema,
  getBookingsQuerySchema,
  checkAvailabilityInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { createMarriageHall } from './handlers/create_marriage_hall';
import { getMarriageHalls, getMarriageHallById } from './handlers/get_marriage_halls';
import { updateMarriageHall } from './handlers/update_marriage_hall';
import { deleteMarriageHall } from './handlers/delete_marriage_hall';
import { checkAvailability } from './handlers/check_availability';
import { createBooking } from './handlers/create_booking';
import { getBookings, getBookingById } from './handlers/get_bookings';
import { updateBookingStatus, cancelBooking } from './handlers/update_booking_status';
import { getDashboardStats } from './handlers/get_dashboard_stats';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),

  // Marriage hall routes
  createMarriageHall: publicProcedure
    .input(createMarriageHallInputSchema)
    .mutation(({ input }) => createMarriageHall(input)),

  getMarriageHalls: publicProcedure
    .input(getHallsQuerySchema.optional())
    .query(({ input }) => getMarriageHalls(input)),

  getMarriageHallById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getMarriageHallById(input.id)),

  updateMarriageHall: publicProcedure
    .input(updateMarriageHallInputSchema)
    .mutation(({ input }) => updateMarriageHall(input)),

  deleteMarriageHall: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteMarriageHall(input.id)),

  // Availability check
  checkAvailability: publicProcedure
    .input(checkAvailabilityInputSchema)
    .query(({ input }) => checkAvailability(input)),

  // Booking routes
  createBooking: publicProcedure
    .input(createBookingInputSchema)
    .mutation(({ input }) => createBooking(input)),

  getBookings: publicProcedure
    .input(getBookingsQuerySchema.optional())
    .query(({ input }) => getBookings(input)),

  getBookingById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getBookingById(input.id)),

  updateBookingStatus: publicProcedure
    .input(updateBookingStatusInputSchema)
    .mutation(({ input }) => updateBookingStatus(input)),

  cancelBooking: publicProcedure
    .input(z.object({ id: z.number(), userId: z.number() }))
    .mutation(({ input }) => cancelBooking(input.id, input.userId)),

  // Admin dashboard
  getDashboardStats: publicProcedure
    .query(() => getDashboardStats()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  
  server.listen(port);
  console.log(`🚀 Marriage Hall Booking TRPC server listening at port: ${port}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   • Health: GET /healthcheck`);
  console.log(`   • Users: /createUser, /getUsers`);
  console.log(`   • Halls: /createMarriageHall, /getMarriageHalls, /getMarriageHallById`);
  console.log(`   • Bookings: /createBooking, /getBookings, /checkAvailability`);
  console.log(`   • Admin: /updateBookingStatus, /getDashboardStats`);
}

start();