import { useParking, ParkingZone } from "@/lib/parking-context";
import { ZoneCard } from "@/components/parking/ZoneCard";
import { MapPin, Search } from "lucide-react";
import heroImage from '@assets/generated_images/sabarimala_parking_entrance_atmospheric_shot.png';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Home() {
  const { zones, totalCapacity, totalOccupied, isAdmin } = useParking();
  const availabilityPercentage = Math.round(((totalCapacity - totalOccupied) / totalCapacity) * 100);

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
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-xl">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Nilakkal Entrance" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        </div>
        
        <div className="relative z-10 p-8 md:p-12 max-w-2xl text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-sm font-medium mb-6 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
            </span>
            Live Status
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">
            Nilakkal Parking
          </h1>
          <p className="text-lg text-white/80 mb-8 max-w-lg leading-relaxed">
            Real-time parking availability for Sabarimala pilgrims. Check slots, plan your visit, and park hassle-free.
          </p>
          
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            <div>
              <div className="text-sm text-white/60 uppercase tracking-wider font-medium mb-1">Vacant Spots</div>
              <div className="text-4xl font-bold text-white">{totalCapacity - totalOccupied}</div>
            </div>
            <div>
              <div className="text-sm text-white/60 uppercase tracking-wider font-medium mb-1">Status</div>
              <div className={`text-4xl font-bold ${availabilityPercentage < 20 ? 'text-red-400' : 'text-green-400'}`}>
                {availabilityPercentage < 10 ? 'Critical' : availabilityPercentage < 30 ? 'Busy' : 'Available'}
              </div>
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
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Parking Zones</h2>
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