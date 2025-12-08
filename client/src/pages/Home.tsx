import { useParking, ParkingZone } from "@/lib/parking-context";
import { ZoneCard } from "@/components/parking/ZoneCard";
import { MapPin, Search, Ticket, BarChart3 } from "lucide-react";
import heroImage from '@assets/generated_images/sabarimala_parking_entrance_atmospheric_shot.png';
import policeLogo from '@assets/police-logo-transparent.png';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

export default function Home() {
  const { zones, totalCapacity, totalOccupied, isAdmin } = useParking();
  const availabilityPercentage = Math.round(((totalCapacity - totalOccupied) / totalCapacity) * 100);

  // Prepare chart data
  const chartData = zones.map(zone => ({
    name: zone.name.replace('Nilakkal Zone ', 'Z'),
    Heavy: zone.stats.heavy,
    Medium: zone.stats.medium,
    Light: zone.stats.light,
    occupied: zone.occupied,
    capacity: zone.capacity,
    // Calculate color based on availability
    fillColor: (zone.occupied / zone.capacity) > 0.8 ? '#ef4444' : (zone.occupied / zone.capacity) > 0.5 ? '#f97316' : '#22c55e'
  }));

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<{zone: ParkingZone, vehicle: any} | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    if (!searchQuery.trim()) {
      setSearchResult(null);
      return;
    }

    for (const zone of zones) {
      const vehicle = zone.vehicles.find(v => v.number.toLowerCase().includes(searchQuery.toLowerCase()));
      if (vehicle) {
        setSearchResult({ zone, vehicle });
        return;
      }
    }
    setSearchResult(null);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section - Smaller as requested */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-xl h-[300px]">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Nilakkal Entrance" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-900/60 to-transparent" />
        </div>
        
        <div className="relative z-10 p-8 h-full flex flex-row items-center justify-between w-full">
          <div className="flex flex-col justify-center text-white max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-1 leading-tight tracking-wide font-malayalam">
              കേരള പോലീസ്
            </h2>
            <h1 className="text-4xl md:text-5xl font-black mb-2 leading-tight tracking-wider uppercase">
              KERALA POLICE
            </h1>
            <p className="text-sm md:text-base text-white/90 font-medium tracking-widest uppercase mb-6">
              OFFICIAL WEBSITE OF KERALA POLICE
            </p>
            
            <div className="flex gap-8 mt-2">
              <div>
                <div className="text-xs text-white/60 uppercase tracking-wider font-medium mb-1">Vacant Spots</div>
                <div className="text-2xl font-bold text-white">{totalCapacity - totalOccupied}</div>
              </div>
              <div>
                <div className="text-xs text-white/60 uppercase tracking-wider font-medium mb-1">Status</div>
                <div className={`text-2xl font-bold ${availabilityPercentage < 20 ? 'text-red-400' : 'text-green-400'}`}>
                  {availabilityPercentage < 10 ? 'Critical' : availabilityPercentage < 30 ? 'Busy' : 'Available'}
                </div>
              </div>
            </div>
          </div>

          {/* Logo positioned on the top right side - Larger size */}
          <div className="absolute right-4 top-4 md:right-8 lg:right-16 h-32 w-32 md:h-48 md:w-48 flex items-center justify-center z-20">
             <img 
               src={policeLogo} 
               alt="Kerala Police Logo" 
               className="h-full w-full object-contain drop-shadow-2xl" 
             />
          </div>
        </div>
      </div>

      {/* Zone Capacity Graph */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Real-time Zone Vacancy by Vehicle Type</h2>
        </div>
        <div className="w-full overflow-x-auto pb-4">
          <div className="h-[300px] md:h-[400px] min-w-[800px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barGap={0} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#000000', 
                  borderColor: 'var(--border)', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  color: '#ffffff'
                }}
                cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
              />
              
              {/* Grouped Bars for Vehicle Composition - Removed stackId to unstack them */}
              <Bar dataKey="Heavy" fill="#a855f7" radius={[4, 4, 0, 0]} name="Heavy Vehicles" />
              <Bar dataKey="Medium" fill="#f97316" radius={[4, 4, 0, 0]} name="Medium Vehicles" />
              <Bar dataKey="Light" fill="#4ade80" radius={[4, 4, 0, 0]} name="Light Vehicles" />
              
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
        <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
           <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>Heavy (Bus/Truck)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span>Medium (Van/Minibus)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span>Light (Car/Jeep)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                <span>Vacant Space</span>
              </div>
           </div>
        </div>
      </div>

      {/* Search Section - Admin Only */}
      {isAdmin && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
               <Search className="w-5 h-5 text-primary" />
               Find Your Vehicle (Admin Only)
            </h2>
            <form onSubmit={handleSearch} className="flex gap-3 mb-4">
               <Input 
                 placeholder="Enter Vehicle Number (e.g. KL-01...)" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="flex-1"
               />
               <Button type="submit">Search</Button>
            </form>
  
            {hasSearched && (
              <div className="animate-in fade-in slide-in-from-top-2">
                {searchResult ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full">
                        <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-green-800 dark:text-green-300">Vehicle Found!</h3>
                        <div className="mt-2 space-y-1 text-sm text-green-700 dark:text-green-400">
                          <p>Vehicle: <span className="font-mono font-semibold">{searchResult.vehicle.number}</span></p>
                          <p>Location: <span className="font-bold">{searchResult.zone.name}</span></p>
                          <p>Ticket/Slot ID: <span className="font-mono font-semibold">{searchResult.vehicle.ticketId}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : searchQuery.trim() ? (
                   <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-4 text-center text-red-600 dark:text-red-400">
                     Vehicle not found in any active zone.
                   </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zones Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Parking Zones</h2>
          </div>
          
          {!isAdmin && (
            <Link href="/ticket">
              <Button className="gap-2 shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90">
                <Ticket className="w-4 h-4" />
                My Ticket
              </Button>
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {zones.map((zone) => (
            <ZoneCard key={zone.id} zone={zone} />
          ))}
        </div>
      </div>
    </div>
  );
}
