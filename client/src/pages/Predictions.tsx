import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, TrendingUp, Database, RefreshCw, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";
import { api } from "@/lib/api";

interface AnalyticsData {
  currentOccupancy: number;
  totalVehicles: number;
  totalCapacity: number;
  weeklyTrend: Array<{ day: string; occupancy: number }>;
  tomorrowHourly: Array<{ time: string; prob: number }>;
  zonePredictions: Array<{ id: string; name: string; prob: number }>;
  tomorrowOverall: {
    probability: number;
    peakTime: string;
    confidence: string;
  };
  dataPoints: number;
}

export default function Predictions() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getAnalyticsSummary();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    try {
      setSeeding(true);
      const result = await api.seedAnalyticsData();
      if (result.success) {
        await fetchAnalytics();
      } else {
        setError(result.message || 'Failed to seed data');
      }
    } catch (err) {
      setError('Failed to seed historical data');
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const weeklyData = data?.weeklyTrend || [
    { day: "Mon", occupancy: 50 },
    { day: "Tue", occupancy: 50 },
    { day: "Wed", occupancy: 50 },
    { day: "Thu", occupancy: 50 },
    { day: "Fri", occupancy: 50 },
    { day: "Sat", occupancy: 50 },
    { day: "Sun", occupancy: 50 },
  ];

  const tomorrowHourlyData = data?.tomorrowHourly || [
    { time: "4am", prob: 30 },
    { time: "8am", prob: 50 },
    { time: "12pm", prob: 80 },
    { time: "4pm", prob: 70 },
    { time: "8pm", prob: 50 },
    { time: "12am", prob: 20 },
  ];

  const zonePredictions = data?.zonePredictions || [];
  const tomorrowProb = data?.tomorrowOverall?.probability || 50;
  const peakTime = data?.tomorrowOverall?.peakTime || '12:00 PM';
  const confidence = data?.tomorrowOverall?.confidence || 'low';
  const dataPoints = data?.dataPoints || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="predictions-page">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Forecast & Analytics</h1>
            <p className="text-muted-foreground">Smart parking predictions based on historical data</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchAnalytics}
          data-testid="button-refresh"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-4 flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {dataPoints < 10 && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">Limited Historical Data</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Only {dataPoints} data points. Seed historical data for better predictions.
                  </p>
                </div>
              </div>
              <Button 
                onClick={seedData} 
                disabled={seeding}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700"
                data-testid="button-seed-data"
              >
                {seeding ? 'Seeding...' : 'Generate Sample Data'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-br from-primary to-blue-600 text-white border-none shadow-lg">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 text-blue-100 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium uppercase tracking-wider">Tomorrow's Outlook</span>
              </div>
              <h2 className="text-4xl font-bold mb-1" data-testid="text-tomorrow-probability">
                {tomorrowProb}% Probability
              </h2>
              <p className="text-blue-100">Expected to reach full capacity by {peakTime}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  confidence === 'high' ? 'bg-green-500/30 text-green-100' :
                  confidence === 'medium' ? 'bg-yellow-500/30 text-yellow-100' :
                  'bg-red-500/30 text-red-100'
                }`}>
                  {confidence === 'high' ? 'High Confidence' : confidence === 'medium' ? 'Medium Confidence' : 'Low Confidence'}
                </span>
                <span className="text-xs text-blue-200">Based on {dataPoints} historical records</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="h-[150px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tomorrowHourlyData}>
                <defs>
                  <linearGradient id="colorProbWhite" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none',
                    backgroundColor: 'white',
                    color: '#333',
                    padding: '10px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }} 
                  cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2 }} 
                  isAnimationActive={false}
                  labelStyle={{ color: '#666', marginBottom: '5px', fontSize: '12px' }}
                  itemStyle={{ color: '#2563eb', fontWeight: 'bold' }}
                  formatter={(value) => [`${value}%`, 'Probability']}
                />
                <Area type="monotone" dataKey="prob" stroke="#fff" strokeWidth={2} fill="url(#colorProbWhite)" activeDot={{ r: 4, fill: 'white' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Past 7 Days Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  formatter={(value) => [`${value}%`, 'Occupancy']}
                />
                <Bar dataKey="occupancy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="font-semibold mb-4 ml-1">Zone-wise Probability (Tomorrow)</h3>
        {zonePredictions.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {zonePredictions.map((zone) => (
              <div 
                key={zone.id} 
                className="bg-card border p-3 rounded-lg flex justify-between items-center"
                data-testid={`zone-prediction-${zone.id}`}
              >
                <span className="font-medium text-sm" title={zone.name}>{zone.id}</span>
                <div className={`text-sm font-bold px-2 py-0.5 rounded ${
                  zone.prob > 85 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  zone.prob > 60 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                }`}>
                  {zone.prob}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>No zones available. Initialize zones from the Police Control panel.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
