import { useParking } from "@/lib/parking-context";
import { ZoneCard } from "@/components/parking/ZoneCard";
import { MapPin } from "lucide-react";
import heroImage from '@assets/generated_images/sabarimala_parking_entrance_atmospheric_shot.png';

export default function Home() {
  const { zones, totalCapacity, totalOccupied } = useParking();
  const availabilityPercentage = Math.round(((totalCapacity - totalOccupied) / totalCapacity) * 100);

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