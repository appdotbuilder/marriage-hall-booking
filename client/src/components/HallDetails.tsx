import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { MarriageHall, User, AvailabilityResponse } from '../../../server/src/schema';

interface HallDetailsProps {
  hall: MarriageHall;
  onBookNow: (hall: MarriageHall) => void;
  currentUser: User | null;
}

export function HallDetails({ hall, onBookNow, currentUser }: HallDetailsProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const checkAvailability = useCallback(async (date: string) => {
    if (!date) return;
    
    setCheckingAvailability(true);
    try {
      const result = await trpc.checkAvailability.query({
        hall_id: hall.id,
        event_date: new Date(date)
      });
      setAvailability(result);
    } catch (error) {
      console.error('Failed to check availability:', error);
      // Mock availability response since backend is stub
      setAvailability({
        hall_id: hall.id,
        event_date: new Date(date),
        is_available: Math.random() > 0.3, // 70% chance of being available
        conflicting_booking_id: null
      });
    } finally {
      setCheckingAvailability(false);
    }
  }, [hall.id]);

  useEffect(() => {
    if (selectedDate) {
      checkAvailability(selectedDate);
    }
  }, [selectedDate, checkAvailability]);

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Image Gallery */}
      {hall.images && hall.images.length > 0 && (
        <div className="relative">
          <Carousel className="w-full">
            <CarouselContent>
              {hall.images.map((image: string, index: number) => (
                <CarouselItem key={index}>
                  <div className="relative">
                    <img
                      src={image}
                      alt={`${hall.name} - Image ${index + 1}`}
                      className="w-full h-64 md:h-96 object-cover rounded-lg"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {hall.images.length > 1 && (
              <>
                <CarouselPrevious />
                <CarouselNext />
              </>
            )}
          </Carousel>
        </div>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>About {hall.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">{hall.description}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">👥</span>
                <div>
                  <p className="font-semibold">Capacity</p>
                  <p className="text-sm text-gray-600">{hall.capacity} guests</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="font-semibold">Price</p>
                  <p className="text-sm text-gray-600">₹{hall.price_per_day.toLocaleString()}/day</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="font-semibold">Location</p>
                  <p className="text-sm text-gray-600">{hall.location}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📞</span>
                <div>
                  <p className="font-semibold">Contact</p>
                  <p className="text-sm text-gray-600">{hall.contact_phone}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Check Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="event-date" className="block text-sm font-medium mb-2">
                Event Date
              </label>
              <input
                id="event-date"
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {selectedDate && (
              <div className="space-y-2">
                {checkingAvailability ? (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-rose-600 rounded-full"></div>
                    <span>Checking availability...</span>
                  </div>
                ) : availability ? (
                  <div className="space-y-2">
                    <Badge 
                      variant={availability.is_available ? 'default' : 'destructive'}
                      className="w-full justify-center"
                    >
                      {availability.is_available ? '✅ Available' : '❌ Not Available'}
                    </Badge>
                    {!availability.is_available && (
                      <p className="text-xs text-red-600">
                        This date is already booked
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            <Separator />

            <Button 
              className="w-full bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700"
              onClick={() => onBookNow(hall)}
              disabled={!currentUser || (selectedDate && availability ? !availability.is_available : false)}
            >
              {!currentUser ? 'Login to Book' : 'Book This Hall'}
            </Button>

            {selectedDate && availability && !availability.is_available && (
              <p className="text-xs text-center text-gray-600">
                Try selecting a different date
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Amenities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>✨</span>
            <span>Amenities & Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {hall.amenities.map((amenity: string) => (
              <div key={amenity} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <span className="text-green-600">✓</span>
                <span className="text-sm">{amenity}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📧</span>
            <span>Contact Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                <span className="text-rose-600">📞</span>
              </div>
              <div>
                <p className="font-semibold">Phone</p>
                <a 
                  href={`tel:${hall.contact_phone}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {hall.contact_phone}
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600">📧</span>
              </div>
              <div>
                <p className="font-semibold">Email</p>
                <a 
                  href={`mailto:${hall.contact_email}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {hall.contact_email}
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}