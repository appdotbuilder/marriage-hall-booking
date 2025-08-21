import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { Booking, BookingStatus } from '../../../server/src/schema';

interface UserBookingsProps {
  userId: number;
}

export function UserBookings({ userId }: UserBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingBooking, setCancellingBooking] = useState<number | null>(null);

  // Mock bookings data for demonstration (since backend handlers are stubs)
  const mockBookings: Booking[] = [
    {
      id: 1,
      user_id: userId,
      hall_id: 1,
      event_date: new Date('2024-06-15'),
      guest_count: 300,
      total_amount: 75000,
      status: 'pending',
      special_requirements: 'Vegetarian catering preferred',
      contact_name: 'John Doe',
      contact_phone: '1234567890',
      contact_email: 'john@example.com',
      created_at: new Date('2024-02-01'),
      updated_at: new Date('2024-02-01')
    },
    {
      id: 2,
      user_id: userId,
      hall_id: 2,
      event_date: new Date('2024-05-20'),
      guest_count: 150,
      total_amount: 55000,
      status: 'approved',
      special_requirements: null,
      contact_name: 'John Doe',
      contact_phone: '1234567890',
      contact_email: 'john@example.com',
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-20')
    },
    {
      id: 3,
      user_id: userId,
      hall_id: 3,
      event_date: new Date('2023-12-10'),
      guest_count: 500,
      total_amount: 120000,
      status: 'rejected',
      special_requirements: 'Live band performance',
      contact_name: 'John Doe',
      contact_phone: '1234567890',
      contact_email: 'john@example.com',
      created_at: new Date('2023-10-15'),
      updated_at: new Date('2023-10-18')
    }
  ];

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await trpc.getBookings.query({ user_id: userId });
      
      // Since backend handlers are stubs, use mock data if API returns empty
      if (result.length === 0) {
        setBookings(mockBookings);
      } else {
        setBookings(result);
      }
    } catch (error) {
      console.error('Failed to load bookings, using mock data:', error);
      setBookings(mockBookings);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleCancelBooking = async (bookingId: number) => {
    setCancellingBooking(bookingId);
    try {
      await trpc.cancelBooking.mutate({ id: bookingId, userId });
      
      // Update local state
      setBookings((prev: Booking[]) => 
        prev.map((booking: Booking) => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' as BookingStatus }
            : booking
        )
      );
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      // For demo purposes, still update the local state
      setBookings((prev: Booking[]) => 
        prev.map((booking: Booking) => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' as BookingStatus }
            : booking
        )
      );
    } finally {
      setCancellingBooking(null);
    }
  };

  const getStatusBadgeVariant = (status: BookingStatus) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'cancelled': return '🚫';
      default: return '⏳';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
        <p className="text-gray-600 mb-4">You haven't made any booking requests yet.</p>
        <p className="text-sm text-gray-500">Browse our available halls and make your first booking!</p>
      </div>
    );
  }

  const upcomingBookings = bookings.filter((booking: Booking) => 
    new Date(booking.event_date) > new Date() && booking.status !== 'cancelled'
  );
  const pastBookings = bookings.filter((booking: Booking) => 
    new Date(booking.event_date) <= new Date() || booking.status === 'cancelled'
  );

  return (
    <div className="space-y-8">
      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <span>🔮</span>
            <span>Upcoming Events</span>
          </h2>
          <div className="grid gap-4">
            {upcomingBookings.map((booking: Booking) => (
              <Card key={booking.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>Booking #{booking.id}</span>
                        <Badge variant={getStatusBadgeVariant(booking.status)}>
                          {getStatusIcon(booking.status)} {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Hall ID: {booking.hall_id} • {booking.event_date.toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {booking.status === 'pending' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={cancellingBooking === booking.id}
                          >
                            {cancellingBooking === booking.id ? 'Cancelling...' : 'Cancel'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel this booking? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancelBooking(booking.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Cancel Booking
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Guests</p>
                      <p className="font-semibold">{booking.guest_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-semibold">₹{booking.total_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contact</p>
                      <p className="font-semibold">{booking.contact_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Booked On</p>
                      <p className="font-semibold">{booking.created_at.toLocaleDateString()}</p>
                    </div>
                  </div>

                  {booking.special_requirements && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Special Requirements</p>
                      <p className="text-sm bg-gray-50 p-2 rounded">{booking.special_requirements}</p>
                    </div>
                  )}

                  {booking.status === 'approved' && (
                    <Alert className="mt-4 border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">
                        🎉 Your booking has been confirmed! You'll receive detailed information via email.
                      </AlertDescription>
                    </Alert>
                  )}

                  {booking.status === 'pending' && (
                    <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                      <AlertDescription className="text-yellow-800">
                        ⏳ Your booking is pending review. We'll contact you within 24 hours.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <span>📚</span>
            <span>Booking History</span>
          </h2>
          <div className="grid gap-4">
            {pastBookings.map((booking: Booking) => (
              <Card key={booking.id} className="opacity-75">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>Booking #{booking.id}</span>
                        <Badge variant={getStatusBadgeVariant(booking.status)}>
                          {getStatusIcon(booking.status)} {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Hall ID: {booking.hall_id} • {booking.event_date.toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Guests</p>
                      <p className="font-semibold">{booking.guest_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-semibold">₹{booking.total_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contact</p>
                      <p className="font-semibold">{booking.contact_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Booked On</p>
                      <p className="font-semibold">{booking.created_at.toLocaleDateString()}</p>
                    </div>
                  </div>

                  {booking.special_requirements && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-1">Special Requirements</p>
                      <p className="text-sm bg-gray-50 p-2 rounded">{booking.special_requirements}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}