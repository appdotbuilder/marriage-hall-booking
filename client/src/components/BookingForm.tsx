import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { MarriageHall, User, CreateBookingInput } from '../../../server/src/schema';

interface BookingFormProps {
  hall: MarriageHall;
  user: User;
  onComplete: () => void;
  onCancel: () => void;
}

export function BookingForm({ hall, user, onComplete, onCancel }: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<Omit<CreateBookingInput, 'user_id' | 'hall_id'>>({
    event_date: new Date(),
    guest_count: 100,
    special_requirements: null,
    contact_name: user.name,
    contact_phone: user.phone,
    contact_email: user.email
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const bookingData: CreateBookingInput = {
        user_id: user.id,
        hall_id: hall.id,
        event_date: formData.event_date,
        guest_count: formData.guest_count,
        special_requirements: formData.special_requirements,
        contact_name: formData.contact_name,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email
      };

      await trpc.createBooking.mutate(bookingData);
      setSuccess(true);
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      console.error('Failed to create booking:', error);
      setError(error instanceof Error ? error.message : 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-green-600 mb-2">Booking Submitted!</h3>
        <p className="text-gray-600 mb-4">
          Your booking request has been submitted successfully. 
          You'll receive a confirmation email shortly.
        </p>
        <p className="text-sm text-gray-500">
          Our team will review your request and get back to you within 24 hours.
        </p>
      </div>
    );
  }

  const totalAmount = hall.price_per_day;
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Hall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🏰</span>
            <span>{hall.name}</span>
          </CardTitle>
          <CardDescription>{hall.location}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Capacity</p>
              <p className="font-semibold">{hall.capacity} guests</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Price per day</p>
              <p className="font-semibold">₹{hall.price_per_day.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event-date">Event Date *</Label>
              <input
                id="event-date"
                type="date"
                min={today}
                required
                value={formData.event_date.toISOString().split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, event_date: new Date(e.target.value) }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <Label htmlFor="guest-count">Number of Guests *</Label>
              <Input
                id="guest-count"
                type="number"
                min="1"
                max={hall.capacity}
                required
                value={formData.guest_count}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, guest_count: parseInt(e.target.value) || 0 }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum capacity: {hall.capacity} guests
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="special-requirements">Special Requirements</Label>
            <Textarea
              id="special-requirements"
              placeholder="Any special arrangements, decorations, or requirements..."
              value={formData.special_requirements || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev) => ({ ...prev, special_requirements: e.target.value || null }))
              }
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            We'll use this information to contact you about your booking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="contact-name">Contact Name *</Label>
            <Input
              id="contact-name"
              required
              value={formData.contact_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({ ...prev, contact_name: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact-phone">Contact Phone *</Label>
              <Input
                id="contact-phone"
                type="tel"
                required
                value={formData.contact_phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Contact Email *</Label>
              <Input
                id="contact-email"
                type="email"
                required
                value={formData.contact_email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, contact_email: e.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>💰</span>
            <span>Booking Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Hall rental (1 day)</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Guests</span>
              <span>{formData.guest_count}</span>
            </div>
            <div className="flex justify-between">
              <span>Date</span>
              <span>{formData.event_date.toLocaleDateString()}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total Amount</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700"
          disabled={isSubmitting || formData.guest_count > hall.capacity}
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Submitting...</span>
            </div>
          ) : (
            'Submit Booking Request'
          )}
        </Button>
      </div>

      <div className="text-xs text-center text-gray-500">
        By submitting this form, you agree to our terms and conditions. 
        Your booking is subject to availability and approval.
      </div>
    </form>
  );
}