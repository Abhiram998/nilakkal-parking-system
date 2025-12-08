import { useParking } from "@/lib/parking-context";
import { ZoneCard } from "@/components/parking/ZoneCard";
import { MapPin, Search, MoreHorizontal, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link } from "wouter";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Vacancy (was Revenue) - Dark Blue */}
        <TopCard 
          title="Vacancy" 
          value={totalVacancy}
          dark={true}
          isVacancy={true}
        />
        {/* Card 2: Occupancy (was Share) */}
        <TopCard 
          title="Occupancy" 
          value={totalOccupied} 
        />
        {/* Card 3: Total Capacity (was Likes) */}
        <TopCard 
          title="Total Capacity" 
          value={totalCapacity} 
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Bar Chart Section (The "Result" graph) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-700">Live Zone Status (Occupancy %)</h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={barChartData} 
                  barSize={12}
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
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    unit="%"
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: '#f1f5f9' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Occupancy']}
                  />
                  {/* Separate bars for each type - no stackId */}
                  <Bar dataKey="Heavy" fill="#1e293b" radius={[4, 4, 0, 0]} name="Heavy" />
                  <Bar dataKey="Medium" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Medium" />
                  <Bar dataKey="Light" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Light" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Legend for the chart */}
            <div className="flex items-center justify-center gap-6 mt-4">
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

          {/* Bottom Section: Live Zone Status (Zone Cards) */}
          <div className="space-y-4">
             <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-slate-700">Live Zone Overview</h3>
             </div>
             
             {/* 5 columns as requested */}
             <div className="h-[400px] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {zones.map((zone) => (
                  <ZoneCard key={zone.id} zone={zone} />
                ))}
             </div>
          </div>

        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          {/* Donut Chart Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-auto">
            <h3 className="font-bold text-slate-700 mb-4 text-center">
              {hoveredZone ? `Zone ${hoveredZone.name.replace('Nilakkal Zone ', '')}` : "Total"} Composition
            </h3>
            <div className="relative h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
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
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-slate-800">{activeOccupancyRate}%</span>
                <span className="text-xs text-slate-400">Occupied</span>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-500">{item.name} Vehicles</span>
                  </div>
                  <span className="font-bold text-slate-700">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Admin Search Widget (Mini) */}
          {isAdmin && (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
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
  );
}
