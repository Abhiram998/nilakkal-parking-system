import { ParkingZone } from "@/lib/parking-context";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export function ZoneCard({ zone, detailed = false }: { zone: ParkingZone, detailed?: boolean }) {
  const percentage = Math.round((zone.occupied / zone.capacity) * 100);
  const isFull = percentage >= 100;
  const isNearFull = percentage > 85;

  const CardContent = (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 transition-all hover:shadow-md cursor-pointer",
        isFull ? "border-red-200 bg-red-50/30 dark:bg-red-900/10" : "border-border hover:border-primary/30"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-foreground">{zone.name}</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Status: <span className={cn(
              "font-bold",
              isFull ? "text-destructive" : isNearFull ? "text-orange-500" : "text-green-600"
            )}>
              {isFull ? "FULL" : isNearFull ? "FILLING FAST" : "AVAILABLE"}
            </span>
          </p>
        </div>
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border",
          isFull 
            ? "bg-destructive text-destructive-foreground border-destructive/20" 
            : "bg-primary/10 text-primary border-primary/10"
        )}>
          {zone.id}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Occupancy</span>
          <span className="font-medium tabular-nums">
            {zone.occupied} <span className="text-muted-foreground">/ {zone.capacity}</span>
          </span>
        </div>
        <Progress value={percentage} className={cn(
          "h-2",
          isFull ? "bg-red-100 [&>div]:bg-red-500" : "bg-primary/10 [&>div]:bg-primary"
        )} />
      </div>

      {detailed && zone.vehicles.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border/50">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3">RECENT ENTRIES</h4>
          <div className="space-y-2">
            {zone.vehicles.slice(0, 3).map((v, i) => (
              <div key={i} className="flex justify-between text-sm bg-background/50 p-2 rounded border border-border/50">
                <span className="font-mono font-medium">{v.number}</span>
                <span className="text-xs text-muted-foreground">{v.entryTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  // Only link if not in detailed admin view (where interaction might be different)
  if (detailed) return CardContent;

  return (
    <Link href={`/zone/${zone.id}`}>
      {CardContent}
    </Link>
  );
}