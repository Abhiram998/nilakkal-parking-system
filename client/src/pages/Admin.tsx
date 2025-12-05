import { useState, useEffect } from "react";
import { useParking, ParkingZone } from "@/lib/parking-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Bus, Truck, Car, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

export default function Admin() {
  const { zones, totalCapacity, totalOccupied } = useParking();
  const [selectedZone, setSelectedZone] = useState<ParkingZone | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Slideshow state
  const [pageIndex, setPageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(zones.length / ITEMS_PER_PAGE);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-rotate slides
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setPageIndex((prev) => (prev + 1) % totalPages);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [isPaused, totalPages]);

  const handlePrev = () => {
    setPageIndex((prev) => (prev - 1 + totalPages) % totalPages);
    setIsPaused(true); // Pause on manual interaction
  };

  const handleNext = () => {
    setPageIndex((prev) => (prev + 1) % totalPages);
    setIsPaused(true); // Pause on manual interaction
  };

  const togglePause = () => setIsPaused(!isPaused);

  const getVehicleIcon = (type: string) => {
    switch(type) {
      case 'heavy': return <Bus className="w-4 h-4" />;
      case 'medium': return <Truck className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  const currentZones = zones.slice(pageIndex * ITEMS_PER_PAGE, (pageIndex + 1) * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 flex flex-col">
      {/* Header */}
      <div className="mb-8 border-b border-white/20 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">Nilakkal Parking – Live Admin Dashboard</h1>
          <div className="text-sm text-white/60">CONTROL ROOM • {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}</div>
        </div>
        <div className="border border-white p-4 min-w-[200px] text-right">
          <div className="text-xs uppercase tracking-widest mb-1 text-white/70">Total Capacity</div>
          <div className="text-3xl font-bold">{totalCapacity}</div>
        </div>
      </div>

      {/* Top Info Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border border-white p-6 flex justify-between items-center">
          <div>
            <div className="text-xs uppercase tracking-widest mb-2 text-white/70">Total Vehicles Inside</div>
            <div className="text-5xl font-bold">{totalOccupied}</div>
          </div>
          <div className="text-right">
             <div className="text-xs uppercase tracking-widest mb-2 text-white/70">Occupancy Rate</div>
             <div className="text-3xl font-bold">{Math.round((totalOccupied / totalCapacity) * 100)}%</div>
          </div>
        </div>
        <div className="border border-white p-6">
          <div className="text-xs uppercase tracking-widest mb-2 text-white/70">Total Vacancy (Available Spots)</div>
          <div className="text-5xl font-bold text-green-500">{totalCapacity - totalOccupied}</div>
        </div>
      </div>

      {/* Main Table Container - Flex grow to fill space */}
      <div className="flex-grow flex flex-col border border-white relative">
        <table className="w-full text-left border-collapse flex-grow">
          <thead>
            <tr className="border-b border-white bg-white/5">
              <th className="p-6 uppercase tracking-wider border-r border-white font-bold text-lg">Zone Name</th>
              <th className="p-6 uppercase tracking-wider border-r border-white font-bold text-right text-lg">Current Vehicles</th>
              <th className="p-6 uppercase tracking-wider border-r border-white font-bold text-right text-lg">Capacity</th>
              <th className="p-6 uppercase tracking-wider border-r border-white font-bold text-right text-lg">Vacant Slots</th>
              <th className="p-6 uppercase tracking-wider border-r border-white font-bold text-center text-lg">Status</th>
              <th className="p-6 uppercase tracking-wider font-bold text-center text-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentZones.map((zone) => {
              const vacant = zone.capacity - zone.occupied;
              const isFull = vacant === 0;
              
              return (
                <tr key={zone.id} className="border-b border-white/20 hover:bg-white/5 transition-colors h-24">
                  <td className="p-6 border-r border-white/20 font-bold text-2xl">{zone.name} ({zone.id})</td>
                  <td className="p-6 border-r border-white/20 text-right font-mono text-2xl">{zone.occupied}</td>
                  <td className="p-6 border-r border-white/20 text-right font-mono text-2xl text-white/50">{zone.capacity}</td>
                  <td className="p-6 border-r border-white/20 text-right font-mono text-2xl text-green-500 font-bold">{vacant}</td>
                  <td className="p-6 border-r border-white/20 text-center">
                    <span className={`px-4 py-2 text-lg font-bold border-2 ${
                      isFull 
                        ? "border-red-500 text-red-500 bg-red-500/10" 
                        : "border-green-500 text-green-500 bg-green-500/10"
                    }`}>
                      {isFull ? "FULL" : "FREE"}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <Button 
                      variant="ghost" 
                      size="lg" 
                      onClick={() => setSelectedZone(zone)}
                      className="h-12 w-12 p-0 text-white hover:text-black hover:bg-white rounded-none border border-white"
                    >
                      <Eye className="w-6 h-6" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {/* Fill empty rows to maintain height if last page has fewer items */}
            {Array.from({ length: ITEMS_PER_PAGE - currentZones.length }).map((_, i) => (
               <tr key={`empty-${i}`} className="border-b border-white/10 h-24">
                 <td colSpan={6} className="p-6 text-center text-white/10 uppercase tracking-widest">--- Empty Slot ---</td>
               </tr>
            ))}
          </tbody>
        </table>

        {/* Slideshow Controls */}
        <div className="border-t border-white p-4 flex justify-between items-center bg-black">
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={handlePrev}
              className="rounded-none border-white text-white hover:bg-white hover:text-black"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> PREV
            </Button>
            <Button 
              variant="outline" 
              onClick={togglePause}
              className="rounded-none border-white text-white hover:bg-white hover:text-black w-32"
            >
              {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
              {isPaused ? "RESUME" : "PAUSE"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleNext}
              className="rounded-none border-white text-white hover:bg-white hover:text-black"
            >
              NEXT <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-6">
             <span className="text-sm font-bold uppercase tracking-wider bg-white text-black px-3 py-1">
                Page {pageIndex + 1} / {totalPages}
             </span>
             {isPaused && <span className="text-xs bg-red-500 text-white px-2 py-1 font-bold uppercase animate-pulse">PAUSED</span>}
             <div className="text-xs uppercase tracking-widest text-white/50 border-l border-white/20 pl-6">
               Auto-rotating every 5 seconds
             </div>
          </div>
        </div>
      </div>

      {/* Vehicle Details Dialog */}
      <Dialog open={!!selectedZone} onOpenChange={(open) => !open && setSelectedZone(null)}>
        <DialogContent className="bg-black border border-white text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl uppercase tracking-wider font-bold border-b border-white pb-4">
              Zone {selectedZone?.id} - Vehicle Manifest
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
             {selectedZone?.vehicles.length === 0 ? (
                <div className="text-center py-8 text-white/50 uppercase tracking-widest border border-white/20">
                  No vehicles currently parked
                </div>
             ) : (
               <div className="border border-white">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="border-b border-white bg-white/10">
                       <th className="p-3 uppercase text-xs tracking-wider">Type</th>
                       <th className="p-3 uppercase text-xs tracking-wider">Vehicle No</th>
                       <th className="p-3 uppercase text-xs tracking-wider">Ticket ID</th>
                       <th className="p-3 uppercase text-xs tracking-wider text-right">Entry Time</th>
                     </tr>
                   </thead>
                   <tbody>
                     {selectedZone?.vehicles.map((v, i) => (
                       <tr key={i} className="border-b border-white/20 hover:bg-white/5">
                         <td className="p-3">
                           <div className="flex items-center gap-2">
                              {getVehicleIcon(v.type)}
                              <span className="uppercase text-xs">{v.type}</span>
                           </div>
                         </td>
                         <td className="p-3 font-mono font-bold">{v.number}</td>
                         <td className="p-3 font-mono text-sm opacity-70">{v.ticketId}</td>
                         <td className="p-3 font-mono text-sm text-right">
                            {v.entryTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
