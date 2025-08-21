import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { HallList } from '@/components/HallList';
import { HallDetails } from '@/components/HallDetails';
import { BookingForm } from '@/components/BookingForm';
import { UserBookings } from '@/components/UserBookings';
import { AdminPanel } from '@/components/AdminPanel';
import { LandingPage } from '@/components/LandingPage';
// Using type-only imports for better TypeScript compliance
import type { MarriageHall, User } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedHall, setSelectedHall] = useState<MarriageHall | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState('browse');

  // Mock current user for demonstration (in real app, this would come from auth)
  useEffect(() => {
    // Mock user login - in a real app, this would be handled by authentication
    const mockUser: User = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      role: 'user',
      created_at: new Date()
    };
    setCurrentUser(mockUser);
  }, []);

  const handleHallSelect = (hall: MarriageHall) => {
    setSelectedHall(hall);
  };

  const handleBookNow = (hall: MarriageHall) => {
    setSelectedHall(hall);
    setShowBookingForm(true);
  };

  const handleBookingComplete = () => {
    setShowBookingForm(false);
    setSelectedHall(null);
    // Refresh user bookings by switching tabs
    if (activeTab === 'browse') {
      setActiveTab('bookings');
    }
  };

  const handleEnterApp = (targetTab: string = 'browse') => {
    setCurrentView('app');
    setActiveTab(targetTab);
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setSelectedHall(null);
    setShowBookingForm(false);
  };

  // Show landing page by default
  if (currentView === 'landing') {
    return (
      <LandingPage 
        currentUser={currentUser}
        onEnterApp={handleEnterApp}
      />
    );
  }

  // Show main application
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={handleBackToLanding}
                className="flex items-center space-x-2 text-rose-600 hover:text-rose-700"
              >
                <span className="text-xl">💒</span>
                <span className="text-xl font-bold">DreamVenue</span>
              </Button>
            </div>
            {currentUser && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {currentUser.name}</span>
                <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'}>
                  {currentUser.role === 'admin' ? '👑 Admin' : '👤 User'}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-1/2 mx-auto mb-8">
            <TabsTrigger value="browse" className="flex items-center space-x-1">
              <span>🏰</span>
              <span>Browse Halls</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center space-x-1">
              <span>📅</span>
              <span>My Bookings</span>
            </TabsTrigger>
            {currentUser?.role === 'admin' && (
              <>
                <TabsTrigger value="admin" className="flex items-center space-x-1">
                  <span>⚙️</span>
                  <span>Admin</span>
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="flex items-center space-x-1">
                  <span>📊</span>
                  <span>Dashboard</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="browse">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Venue</h2>
                <p className="text-gray-600">Discover beautiful marriage halls for your special day</p>
              </div>
              <HallList onHallSelect={handleHallSelect} onBookNow={handleBookNow} />
            </div>
          </TabsContent>

          <TabsContent value="bookings">
            {currentUser && <UserBookings userId={currentUser.id} />}
          </TabsContent>

          {currentUser?.role === 'admin' && (
            <>
              <TabsContent value="admin">
                <AdminPanel />
              </TabsContent>
              <TabsContent value="dashboard">
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-4">📊 Admin Dashboard</h2>
                  <p className="text-gray-600">Dashboard statistics will be displayed here</p>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Hall Details Modal */}
        {selectedHall && !showBookingForm && (
          <Dialog open={true} onOpenChange={() => setSelectedHall(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedHall.name}</DialogTitle>
                <DialogDescription>{selectedHall.location}</DialogDescription>
              </DialogHeader>
              <HallDetails 
                hall={selectedHall} 
                onBookNow={handleBookNow}
                currentUser={currentUser}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Booking Form Modal */}
        {showBookingForm && selectedHall && currentUser && (
          <Dialog open={true} onOpenChange={() => setShowBookingForm(false)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Book {selectedHall.name}</DialogTitle>
                <DialogDescription>Complete your booking details</DialogDescription>
              </DialogHeader>
              <BookingForm
                hall={selectedHall}
                user={currentUser}
                onComplete={handleBookingComplete}
                onCancel={() => setShowBookingForm(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">💒 DreamVenue - Making your special day perfect</p>
            <p className="text-sm">© 2024 DreamVenue. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;