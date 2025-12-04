import { useParams, Link } from "wouter";
import { useParking } from "@/lib/parking-context";
import { ArrowLeft, Car, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AreaDetails() {
  const { id } = useParams();
  const { zones } = useParking();
  const zone = zones.find(z => z.id === id);

  if (!zone) return <div>Zone not found</div>;

  const percentage = Math.round((zone.occupied / zone.capacity) * 100);
  const isFull = percentage >= 100;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Area {zone.id}</h1>
          <p className="text-muted-foreground">{zone.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{zone.capacity}</div>
            <div className="text-xs text-muted-foreground uppercase">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center border-primary/20 bg-primary/5">
            <div className="text-2xl font-bold text-primary">{zone.occupied}</div>
            <div className="text-xs text-muted-foreground uppercase">Occupied</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center border-green-500/20 bg-green-500/5">
            <div className="text-2xl font-bold text-green-600">{zone.capacity - zone.occupied}</div>
            <div className="text-xs text-muted-foreground uppercase">Vacant</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Live Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Occupancy Level</span>
              <span className="font-bold">{percentage}%</span>
            </div>
            <Progress value={percentage} className={`h-4 ${isFull ? "bg-red-100 [&>div]:bg-red-500" : "bg-primary/10 [&>div]:bg-primary"}`} />
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
             {Array.from({ length: zone.capacity }).map((_, i) => (
               <div 
                 key={i}
                 className={`aspect-square rounded-sm flex items-center justify-center text-[10px] font-mono transition-all ${
                   i < zone.occupied 
                     ? "bg-red-500 text-white" 
                     : "bg-green-100 text-green-700 hover:bg-green-200"
                 }`}
                 title={i < zone.occupied ? "Occupied" : `Slot ${i+1} Free`}
               >
                 {i+1}
               </div>
             ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Car className="w-5 h-5" />
            Parked Vehicles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {zone.vehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No vehicles currently parked in this zone.
            </div>
          ) : (
            <div className="divide-y">
              {zone.vehicles.map((v, i) => (
                <div key={i} className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Car className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-mono font-medium">{v.number}</div>
                      <div className="text-xs text-muted-foreground">Ticket: {v.ticketId}</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {v.entryTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}