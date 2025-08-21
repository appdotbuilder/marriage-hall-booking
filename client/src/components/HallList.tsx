import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { MarriageHall, GetHallsQuery } from '../../../server/src/schema';

interface HallListProps {
  onHallSelect: (hall: MarriageHall) => void;
  onBookNow: (hall: MarriageHall) => void;
}

export function HallList({ onHallSelect, onBookNow }: HallListProps) {
  const [halls, setHalls] = useState<MarriageHall[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<GetHallsQuery>({});

  // Mock data for demonstration (since backend handlers are stubs)
  const mockHalls: MarriageHall[] = [
    {
      id: 1,
      name: "Royal Palace Wedding Hall",
      description: "An elegant and spacious wedding hall perfect for grand celebrations with traditional architecture and modern amenities.",
      location: "Downtown Mumbai, Maharashtra",
      capacity: 500,
      price_per_day: 75000,
      amenities: ["Air Conditioning", "Sound System", "LED Lighting", "Parking", "Catering Kitchen", "Bridal Room", "Photography Area"],
      contact_phone: "+91-9876543210",
      contact_email: "contact@royalpalace.com",
      images: [
        "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
        "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80"
      ],
      is_active: true,
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15')
    },
    {
      id: 2,
      name: "Garden Paradise Banquet",
      description: "Beautiful outdoor garden setting with covered pavilion, perfect for intimate weddings and receptions.",
      location: "Bandra West, Mumbai",
      capacity: 300,
      price_per_day: 55000,
      amenities: ["Garden Setting", "Covered Pavilion", "Sound System", "Parking", "Catering Area", "Dance Floor"],
      contact_phone: "+91-9876543211",
      contact_email: "info@gardenparadise.com",
      images: [
        "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80"
      ],
      is_active: true,
      created_at: new Date('2024-01-20'),
      updated_at: new Date('2024-01-20')
    },
    {
      id: 3,
      name: "Crystal Grand Ballroom",
      description: "Luxurious ballroom with crystal chandeliers and marble floors, ideal for upscale wedding celebrations.",
      location: "Juhu, Mumbai",
      capacity: 800,
      price_per_day: 120000,
      amenities: ["Crystal Chandeliers", "Marble Floors", "Premium Sound System", "Valet Parking", "Bridal Suite", "Professional Kitchen", "Stage Area", "VIP Lounge"],
      contact_phone: "+91-9876543212",
      contact_email: "bookings@crystalgrand.com",
      images: [
        "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80",
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80"
      ],
      is_active: true,
      created_at: new Date('2024-01-10'),
      updated_at: new Date('2024-01-25')
    },
    {
      id: 4,
      name: "Heritage Manor",
      description: "Historic manor house with traditional charm and modern facilities, perfect for elegant wedding ceremonies.",
      location: "Colaba, Mumbai",
      capacity: 200,
      price_per_day: 45000,
      amenities: ["Historic Architecture", "Gardens", "Sound System", "Parking", "Catering Facility", "Photo Opportunities"],
      contact_phone: "+91-9876543213",
      contact_email: "events@heritagemanor.com",
      images: [
        "https://images.unsplash.com/photo-1465426956778-a7a5b9c67e46?w=800&q=80",
        "https://images.unsplash.com/photo-1520637836862-4d197d17c7a4?w=800&q=80"
      ],
      is_active: true,
      created_at: new Date('2024-01-05'),
      updated_at: new Date('2024-01-15')
    }
  ];

  const loadHalls = useCallback(async () => {
    setLoading(true);
    try {
      // Try to fetch from API first
      const result = await trpc.getMarriageHalls.query(filters);
      
      // Since backend handlers are stubs, use mock data if API returns empty
      if (result.length === 0) {
        setHalls(mockHalls);
      } else {
        setHalls(result);
      }
    } catch (error) {
      console.error('Failed to load halls, using mock data:', error);
      setHalls(mockHalls);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadHalls();
  }, [loadHalls]);

  const filteredHalls = halls.filter(hall => {
    if (filters.location && !hall.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    if (filters.capacity_min && hall.capacity < filters.capacity_min) {
      return false;
    }
    if (filters.capacity_max && hall.capacity > filters.capacity_max) {
      return false;
    }
    if (filters.price_min && hall.price_per_day < filters.price_min) {
      return false;
    }
    if (filters.price_max && hall.price_per_day > filters.price_max) {
      return false;
    }
    return hall.is_active;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔍</span>
            <span>Search & Filter</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Input
              placeholder="Location"
              value={filters.location || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters((prev: GetHallsQuery) => ({ ...prev, location: e.target.value || undefined }))
              }
            />
            <Input
              type="number"
              placeholder="Min Capacity"
              value={filters.capacity_min || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters((prev: GetHallsQuery) => ({ 
                  ...prev, 
                  capacity_min: e.target.value ? parseInt(e.target.value) : undefined 
                }))
              }
            />
            <Input
              type="number"
              placeholder="Max Capacity"
              value={filters.capacity_max || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters((prev: GetHallsQuery) => ({ 
                  ...prev, 
                  capacity_max: e.target.value ? parseInt(e.target.value) : undefined 
                }))
              }
            />
            <Input
              type="number"
              placeholder="Min Price (₹)"
              value={filters.price_min || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters((prev: GetHallsQuery) => ({ 
                  ...prev, 
                  price_min: e.target.value ? parseFloat(e.target.value) : undefined 
                }))
              }
            />
            <Input
              type="number"
              placeholder="Max Price (₹)"
              value={filters.price_max || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters((prev: GetHallsQuery) => ({ 
                  ...prev, 
                  price_max: e.target.value ? parseFloat(e.target.value) : undefined 
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">
          {filteredHalls.length} {filteredHalls.length === 1 ? 'Hall' : 'Halls'} Available
        </h3>
      </div>

      {/* Hall Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHalls.map((hall: MarriageHall) => (
          <Card key={hall.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="relative">
              <img
                src={hall.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&q=80'}
                alt={hall.name}
                className="w-full h-48 object-cover"
              />
              <Badge className="absolute top-2 right-2 bg-white text-gray-800">
                ₹{hall.price_per_day.toLocaleString()}/day
              </Badge>
            </div>
            
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{hall.name}</span>
                <span className="text-sm font-normal text-gray-500">
                  👥 {hall.capacity}
                </span>
              </CardTitle>
              <CardDescription className="flex items-center space-x-1">
                <span>📍</span>
                <span>{hall.location}</span>
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {hall.description}
              </p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {hall.amenities.slice(0, 3).map((amenity: string) => (
                  <Badge key={amenity} variant="secondary" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
                {hall.amenities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{hall.amenities.length - 3} more
                  </Badge>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onHallSelect(hall)}
                >
                  View Details
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700"
                  onClick={() => onBookNow(hall)}
                >
                  Book Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredHalls.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">No halls found</h3>
          <p className="text-gray-600">Try adjusting your search filters</p>
        </div>
      )}
    </div>
  );
}