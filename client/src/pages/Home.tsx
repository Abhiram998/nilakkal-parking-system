import { useParking } from "@/lib/parking-context";
import { ZoneCard } from "@/components/parking/ZoneCard";
import { MapPin, Search, MoreHorizontal, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link } from "wouter";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LabelList
} from 'recharts';

export default function Home() {
  const { zones, totalCapacity, totalOccupied, isAdmin } = useParking();
  
  // Calculate vacancy
  const totalVacancy = totalCapacity - totalOccupied;
  
  // State for interactive graph
  const [hoveredZone, setHoveredZone] = useState<any>(null);

  // Chart Data Preparation
  const barChartData = zones.map(zone => {
    // Calculate percentages for each vehicle type based on total capacity of the zone
    // If capacity is 0, avoid division by zero
    const heavyPct = zone.capacity > 0 ? (zone.stats.heavy / zone.capacity) * 100 : 0;
    const mediumPct = zone.capacity > 0 ? (zone.stats.medium / zone.capacity) * 100 : 0;
    const lightPct = zone.capacity > 0 ? (zone.stats.light / zone.capacity) * 100 : 0;

    return {
      name: zone.name.replace('Nilakkal Zone ', 'Z'),
      Heavy: heavyPct,
      Medium: mediumPct,
      Light: lightPct,
      occupied: zone.occupied,
      capacity: zone.capacity,
      originalZone: zone // Store original zone object to access stats on hover
    };
  });

  // Calculate Pie Data based on hovered zone or total
  const activeStats = hoveredZone ? hoveredZone.stats : {
    heavy: zones.reduce((acc, z) => acc + z.stats.heavy, 0),
    medium: zones.reduce((acc, z) => acc + z.stats.medium, 0),
    light: zones.reduce((acc, z) => acc + z.stats.light, 0)
  };

  const activeOccupied = hoveredZone ? hoveredZone.occupied : totalOccupied;
  const activeCapacity = hoveredZone ? hoveredZone.capacity : totalCapacity;
  const activeOccupancyRate = activeCapacity > 0 ? Math.round((activeOccupied / activeCapacity) * 100) : 0;

  const pieData = [
    { name: 'Heavy', value: activeStats.heavy, color: '#1e293b' },
    { name: 'Medium', value: activeStats.medium, color: '#f59e0b' },
    { name: 'Light', value: activeStats.light, color: '#3b82f6' },
  ];

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
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

  const TopCard = ({ title, value, subValue, dark = false, isVacancy = false }: any) => (
    <div className={`rounded-xl p-6 shadow-sm border relative overflow-hidden group hover:shadow-md transition-all ${dark ? 'bg-[#1a233a] text-white border-none' : 'bg-white border-slate-100 text-slate-800'}`}>
      <div className="flex justify-between items-start mb-4">
        <span className={`font-medium ${dark ? 'text-slate-300' : 'text-slate-500'}`}>{title}</span>
      </div>
      <div className={`text-4xl font-bold mb-1 ${isVacancy ? 'text-green-500' : ''}`}>
        {value}
      </div>
      {subValue && <div className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-400'}`}>{subValue}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Parking</h1>
        </div>
        <div className="flex items-center gap-4">
           {/* Mobile Menu Trigger is handled in Layout */}
           <Button variant="ghost" size="icon" className="md:hidden">
             <MoreHorizontal />
           </Button>
        </div>
      </div>

      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Vacancy */}
        <TopCard 
          title="Vacancy" 
          value={totalVacancy}
          dark={true}
          isVacancy={true}
        />
        {/* Card 2: Occupancy */}
        <TopCard 
          title="Occupancy" 
          value={totalOccupied} 
        />
        {/* Card 3: Total Capacity */}
        <TopCard 
          title="Total Capacity" 
          value={totalCapacity} 
        />
        
        {/* Card 4: Composition (Moved from right column) */}
        <div className="rounded-xl p-4 shadow-sm border bg-white border-slate-100 flex flex-col justify-between h-full">
           <div className="flex justify-between items-start mb-2">
             <span className="font-medium text-slate-500">Composition</span>
             <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-full">
               {hoveredZone ? `Z${hoveredZone.name.replace('Nilakkal Zone ', '')}` : "Total"}
             </span>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="w-[80px] h-[80px] relative flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={25}
                      outerRadius={35}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <span className="text-xs font-bold text-slate-700">{activeOccupancyRate}%</span>
                </div>
              </div>
              
              <div className="flex-1 space-y-1">
                 {pieData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                       <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-500">{item.name}</span>
                       </div>
                       <span className="font-bold text-slate-700">{item.value}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 h-full">
        {/* Full Width Column */}
        <div className="space-y-6">
          
          {/* Bar Chart Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-700">Live Zone Status (Occupancy %)</h3>
              {/* Legend for the chart - Inline on desktop */}
              <div className="hidden md:flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#1e293b] rounded-sm"></div>
                    <span className="text-xs text-slate-500">Heavy</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#f59e0b] rounded-sm"></div>
                    <span className="text-xs text-slate-500">Medium</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#3b82f6] rounded-sm"></div>
                    <span className="text-xs text-slate-500">Light</span>
                 </div>
              </div>
            </div>
            
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={barChartData} 
                  barSize={12} // Smaller bars since there are 3 per zone
                  margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                  onMouseMove={(state: any) => {
                    if (state.activePayload) {
                      setHoveredZone(state.activePayload[0].payload.originalZone);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredZone(null);
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} 
                    dy={10} 
                    interval={0} // Show all zones
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    unit="%"
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg text-sm">
                            <p className="font-bold text-slate-800 mb-2">{label}</p>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-4 text-xs">
                                <span className="flex items-center gap-1.5 text-slate-500">
                                  <div className="w-2 h-2 rounded-full bg-[#1e293b]"></div>
                                  Heavy
                                </span>
                                <span className="font-mono font-medium">{data.Heavy.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-xs">
                                <span className="flex items-center gap-1.5 text-slate-500">
                                  <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                                  Medium
                                </span>
                                <span className="font-mono font-medium">{data.Medium.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-xs">
                                <span className="flex items-center gap-1.5 text-slate-500">
                                  <div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div>
                                  Light
                                </span>
                                <span className="font-mono font-medium">{data.Light.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Unstacked bars (side by side) */}
                  <Bar dataKey="Heavy" fill="#1e293b" radius={[4, 4, 0, 0]} name="Heavy" />
                  <Bar dataKey="Medium" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Medium" />
                  <Bar dataKey="Light" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Light" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Section: Live Zone Status (Zone Cards) & Search */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
             {/* Zone Cards */}
             <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center gap-2">
                   <Activity className="w-5 h-5 text-orange-500" />
                   <h3 className="font-bold text-slate-700">Live Zone Overview</h3>
                </div>
                
                {/* 4 columns as requested */}
                <div className="max-h-[500px] overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                   {zones.map((zone) => (
                     <ZoneCard key={zone.id} zone={zone} />
                   ))}
                </div>
             </div>

             {/* Admin Search Widget (Moved here) */}
             <div className="lg:col-span-1">
              {isAdmin && (
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
                    <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider">Quick Search</h3>
                    <form onSubmit={handleSearch} className="flex flex-col gap-3">
                        <Input 
                            placeholder="Vehicle No." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-50"
                        />
                        <Button type="submit" className="w-full bg-slate-900 text-white">Find Vehicle</Button>
                    </form>
                    {searchResult && (
                        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-sm border border-green-100">
                            <p className="font-bold">{searchResult.vehicle.number}</p>
                            <p>Loc: {searchResult.zone.name}</p>
                        </div>
                    )}
                 </div>
              )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
