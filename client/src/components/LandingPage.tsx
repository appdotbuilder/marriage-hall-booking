import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { User, MarriageHall } from '../../../server/src/schema';

interface LandingPageProps {
  currentUser: User | null;
  onEnterApp: (targetTab?: string) => void;
}

export function LandingPage({ currentUser, onEnterApp }: LandingPageProps) {
  const [featuredHalls, setFeaturedHalls] = useState<MarriageHall[]>([]);
  const [stats, setStats] = useState({
    totalHalls: 0,
    totalBookings: 0,
    happyCustomers: 0
  });

  // Load featured halls and stats
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get featured halls (first 3)
        const halls = await trpc.getMarriageHalls.query({ is_active: true });
        setFeaturedHalls(halls.slice(0, 3));
        
        // Mock stats - in real app, this would come from a dedicated endpoint
        setStats({
          totalHalls: halls.length,
          totalBookings: Math.floor(Math.random() * 500) + 200,
          happyCustomers: Math.floor(Math.random() * 1000) + 500
        });
      } catch (error) {
        console.error('Failed to load landing page data:', error);
      }
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="text-3xl animate-pulse">💒</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  DreamVenue
                </h1>
                <p className="text-xs text-gray-500">Where Dreams Come True</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Welcome back, {currentUser.name}!</span>
                  <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'}>
                    {currentUser.role === 'admin' ? '👑 Admin' : '👤 User'}
                  </Badge>
                </div>
              )}
              <Button 
                onClick={() => onEnterApp('browse')}
                className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Browse Venues
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-100/50 via-purple-100/30 to-indigo-100/50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,113,133,0.1),transparent),radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent)]"></div>
        
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-rose-100 to-purple-100 rounded-full border border-rose-200/50">
                  <span className="text-sm text-rose-700 font-medium">✨ Trusted by 1000+ Couples</span>
                </div>
                
                <h2 className="text-4xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                    Your Perfect
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Wedding Venue
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                    Awaits
                  </span>
                </h2>
                
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Discover extraordinary marriage halls that transform your special day into an unforgettable celebration. 
                  From intimate gatherings to grand celebrations, find the perfect venue that matches your vision.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg"
                  onClick={() => onEnterApp('browse')}
                  className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 px-8 py-6 text-lg"
                >
                  🏰 Explore Venues
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => onEnterApp('bookings')}
                  className="border-2 border-purple-200 hover:bg-gradient-to-r hover:from-rose-50 hover:to-purple-50 px-8 py-6 text-lg transition-all duration-300"
                >
                  📅 My Bookings
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200/50">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-purple-600">{stats.totalHalls}+</div>
                  <div className="text-sm text-gray-600">Premium Venues</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-rose-600">{stats.totalBookings}+</div>
                  <div className="text-sm text-gray-600">Successful Events</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-indigo-600">{stats.happyCustomers}+</div>
                  <div className="text-sm text-gray-600">Happy Couples</div>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 transform rotate-3 hover:rotate-1 transition-transform duration-500">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-purple-500 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">💒</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Royal Palace Hall</h3>
                        <p className="text-sm text-gray-500">Mumbai, Maharashtra</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Available</Badge>
                  </div>
                  
                  <div className="aspect-video bg-gradient-to-br from-rose-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <span className="text-4xl">🏰</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Capacity</span>
                      <span className="font-semibold">500 guests</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Price per day</span>
                      <span className="font-semibold text-purple-600">₹25,000</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">AC</Badge>
                      <Badge variant="secondary" className="text-xs">Parking</Badge>
                      <Badge variant="secondary" className="text-xs">Catering</Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-full opacity-60 animate-bounce"></div>
              <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-gradient-to-br from-blue-200 to-purple-300 rounded-full opacity-60 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Venues Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Featured Venues
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Handpicked venues that have hosted countless memorable celebrations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredHalls.map((hall: MarriageHall) => (
              <Card key={hall.id} className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="aspect-video bg-gradient-to-br from-rose-100 via-purple-100 to-indigo-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-4xl">🏰</span>
                  </div>
                  <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                    {hall.name}
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-1">
                    <span>📍</span>
                    <span>{hall.location}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Capacity</span>
                    <span className="font-semibold">{hall.capacity} guests</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Price</span>
                    <span className="font-semibold text-purple-600">₹{hall.price_per_day.toLocaleString()}/day</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hall.amenities.slice(0, 3).map((amenity: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                    onClick={() => onEnterApp('browse')}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg"
              variant="outline"
              onClick={() => onEnterApp('browse')}
              className="border-2 border-purple-200 hover:bg-gradient-to-r hover:from-rose-50 hover:to-purple-50 px-8 py-4 text-lg transition-all duration-300"
            >
              View All Venues →
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-rose-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose DreamVenue?
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We make venue booking simple, secure, and stress-free
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '🔍',
                title: 'Easy Discovery',
                description: 'Browse through curated venues with detailed information and photos'
              },
              {
                icon: '📅',
                title: 'Real-time Booking',
                description: 'Check availability and book your preferred dates instantly'
              },
              {
                icon: '💰',
                title: 'Transparent Pricing',
                description: 'No hidden fees. See all costs upfront with detailed breakdowns'
              },
              {
                icon: '🛡️',
                title: 'Secure & Reliable',
                description: 'Your bookings are protected with our secure payment system'
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-gray-900 group-hover:text-purple-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 text-center">
          <h3 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Ready to Find Your Perfect Venue?
          </h3>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-10">
            Join thousands of couples who found their dream wedding venue with us. 
            Start your journey today and make your special day unforgettable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => onEnterApp('browse')}
              className="bg-white text-purple-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 px-10 py-6 text-lg font-semibold"
            >
              🚀 Start Exploring
            </Button>
            {currentUser?.role === 'admin' && (
              <Button 
                size="lg"
                variant="outline"
                onClick={() => onEnterApp('admin')}
                className="border-2 border-white text-white hover:bg-white hover:text-purple-600 px-10 py-6 text-lg font-semibold transition-all duration-300"
              >
                👑 Admin Panel
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                <span className="text-2xl">💒</span>
                <h4 className="text-xl font-bold">DreamVenue</h4>
              </div>
              <p className="text-gray-400">
                Making your special day perfect with the most beautiful venues and seamless booking experience.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => onEnterApp('browse')} className="hover:text-white transition-colors">Browse Venues</button></li>
                <li><button onClick={() => onEnterApp('bookings')} className="hover:text-white transition-colors">My Bookings</button></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">About Us</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Contact</span></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Contact Info</h5>
              <ul className="space-y-2 text-gray-400">
                <li>📞 +91 98765 43210</li>
                <li>✉️ hello@dreamvenue.com</li>
                <li>📍 Mumbai, Maharashtra, India</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2024 DreamVenue. All rights reserved. Made with ❤️ for your special day.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}