import { useState } from "react";
import { useParking, ParkingZone } from "@/lib/parking-context";
import { ZoneCard } from "@/components/parking/ZoneCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, Camera, Printer, BarChart3, LayoutDashboard, Car, Truck, Bus, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Admin() {
  const { zones, enterVehicle, totalCapacity, totalOccupied } = useParking();
  const [vehicleNumber, setVehicleNumber] = useState("");
  const { toast } = useToast();
  const [lastTicket, setLastTicket] = useState<any>(null);
  const [selectedZone, setSelectedZone] = useState<ParkingZone | null>(null);

  const handleEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) return;

    const result = enterVehicle(vehicleNumber.toUpperCase());
    
    if (result.success) {
      setLastTicket(result.ticket);
      setVehicleNumber("");
      toast({
        title: "Vehicle Entry Recorded",
        description: `Assigned to ${result.ticket.zoneName}`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Entry Failed",
        description: result.message,
      });
    }
  };

  const getVehicleIcon = (type: string) => {
    switch(type) {
      case 'heavy': return <Bus className="w-4 h-4" />;
      case 'medium': return <Truck className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Police Control Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Manage vehicle entries and monitor zone status.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-card border border-border px-4 py-2 rounded-lg text-center">
            <div className="text-xs text-muted-foreground uppercase font-bold">Total Capacity</div>
            <div className="text-xl font-mono font-bold">{totalCapacity}</div>
          </div>
          <div className="bg-card border border-border px-4 py-2 rounded-lg text-center">
            <div className="text-xs text-muted-foreground uppercase font-bold">Occupied</div>
            <div className="text-xl font-mono font-bold text-primary">{totalOccupied}</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Entry Simulation */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-primary/20 shadow-lg shadow-primary/5">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Camera className="w-5 h-5" />
                Vehicle Entry
              </CardTitle>
              <CardDescription>Simulate ANPR camera read</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleEntry} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vnum">Vehicle Number</Label>
                  <Input 
                    id="vnum" 
                    placeholder="KL-01-AB-1234" 
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="font-mono uppercase text-lg tracking-widest"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full text-lg h-12" size="lg">
                  Generate Ticket
                </Button>
              </form>
            </CardContent>
          </Card>

          {lastTicket && (
            <Card className="border-dashed border-2 bg-yellow-50/50 dark:bg-yellow-900/10 animate-in fade-in zoom-in duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Printer className="w-4 h-4" />
                  Last Ticket Generated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 font-mono text-sm">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Vehicle</span>
                    <span className="font-bold text-lg">{lastTicket.vehicleNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Zone</span>
                    <span className="font-bold text-primary">{lastTicket.zoneName}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Ticket ID</span>
                    <span>{lastTicket.ticketId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span>{lastTicket.time}</span>
                  </div>
                  <div className="pt-4 text-center">
                    <div className="inline-block bg-black text-white px-2 py-1 text-xs rounded">
                      AUTHORIZED PARKING
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Zone Dashboard */}
        <div className="lg:col-span-2">
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-xl font-serif font-bold">Zone Overview</h3>
            </div>
            
            <div className="mt-0 flex-1 h-[600px]">
              <Card className="h-full flex flex-col">
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto">
                    <table className="w-full text-sm text-left relative">
                      <thead className="bg-muted text-muted-foreground sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="p-4 font-medium">Zone ID</th>
                          <th className="p-4 font-medium">Name</th>
                          <th className="p-4 font-medium text-right">Capacity</th>
                          <th className="p-4 font-medium text-right">Occupied</th>
                          <th className="p-4 font-medium text-right">Status</th>
                          <th className="p-4 font-medium text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {zones.map((zone) => (
                          <tr key={zone.id} className="hover:bg-muted/50 transition-colors">
                            <td className="p-4 font-mono font-medium">{zone.id}</td>
                            <td className="p-4">{zone.name}</td>
                            <td className="p-4 text-right text-muted-foreground">{zone.capacity}</td>
                            <td className="p-4 text-right font-medium">{zone.occupied}</td>
                            <td className="p-4 text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                zone.occupied >= zone.capacity 
                                  ? "bg-red-100 text-red-700" 
                                  : zone.occupied > zone.capacity * 0.8 
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-green-100 text-green-700"
                              }`}>
                                {Math.round((zone.occupied / zone.capacity) * 100)}%
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setSelectedZone(zone)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="w-4 h-4 text-muted-foreground hover:text-primary" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedZone} onOpenChange={(open) => !open && setSelectedZone(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Zone {selectedZone?.id} - Vehicles</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
             {selectedZone?.vehicles.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No vehicles parked</div>
             ) : (
               <div className="space-y-2">
                 {selectedZone?.vehicles.map((v, i) => (
                   <div key={i} className="flex justify-between items-center p-3 rounded-lg border bg-card">
                     <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                          v.type === 'heavy' ? 'bg-red-500' : v.type === 'medium' ? 'bg-amber-500' : 'bg-primary'
                        }`}>
                          {getVehicleIcon(v.type)}
                        </div>
                        <div>
                          <div className="font-mono font-bold text-sm">{v.number}</div>
                          <div className="text-xs text-muted-foreground">{v.ticketId}</div>
                        </div>
                     </div>
                     <div className="text-xs font-mono text-muted-foreground">
                        {v.entryTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}