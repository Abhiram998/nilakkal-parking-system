import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAdminSchema, insertParkingZoneSchema, insertVehicleSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Admin authentication
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const admin = await storage.getAdminByUsername(username);
      
      if (!admin || admin.password !== password) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
      
      res.json({ success: true, admin: { id: admin.id, username: admin.username, name: admin.name } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Login failed" });
    }
  });

  app.post("/api/admin/register", async (req, res) => {
    try {
      const validatedData = insertAdminSchema.parse(req.body);
      const existing = await storage.getAdminByUsername(validatedData.username);
      
      if (existing) {
        return res.status(400).json({ success: false, message: "Username already exists" });
      }
      
      const admin = await storage.createAdmin(validatedData);
      res.json({ success: true, admin: { id: admin.id, username: admin.username, name: admin.name } });
    } catch (error) {
      res.status(400).json({ success: false, message: "Registration failed" });
    }
  });

  // Initialize parking zones (seed)
  app.post("/api/zones/initialize", async (req, res) => {
    try {
      const existingZones = await storage.getAllZones();
      if (existingZones.length > 0) {
        return res.status(400).json({ success: false, message: "Zones already initialized" });
      }

      const zones = [];
      const ZONE_CAPACITY = 50;
      for (let i = 1; i <= 20; i++) {
        const heavyLimit = Math.floor(ZONE_CAPACITY * 0.2);
        const mediumLimit = Math.floor(ZONE_CAPACITY * 0.3);
        const lightLimit = ZONE_CAPACITY - heavyLimit - mediumLimit;

        const zone = await storage.createZone({
          id: `Z${i}`,
          name: `Parking Zone ${i}`,
          capacity: ZONE_CAPACITY,
          heavyLimit,
          mediumLimit,
          lightLimit,
        });
        zones.push(zone);
      }

      res.json({ success: true, zones });
    } catch (error) {
      res.status(500).json({ success: false, message: "Initialization failed" });
    }
  });

  // Get all zones with vehicle stats
  app.get("/api/zones", async (req, res) => {
    try {
      const zones = await storage.getAllZones();
      const allVehicles = await storage.getAllVehicles();

      const zonesWithStats = zones.map(zone => {
        const zoneVehicles = allVehicles.filter(v => v.zoneId === zone.id);
        const stats = {
          heavy: zoneVehicles.filter(v => v.type === 'heavy').length,
          medium: zoneVehicles.filter(v => v.type === 'medium').length,
          light: zoneVehicles.filter(v => v.type === 'light').length,
        };

        return {
          id: zone.id,
          name: zone.name,
          capacity: zone.capacity,
          occupied: zoneVehicles.length,
          limits: {
            heavy: zone.heavyLimit,
            medium: zone.mediumLimit,
            light: zone.lightLimit,
          },
          stats,
          vehicles: zoneVehicles.map(v => ({
            number: v.number,
            type: v.type,
            entryTime: v.entryTime,
            ticketId: v.ticketId,
            slot: v.slot,
          })),
        };
      });

      res.json(zonesWithStats);
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch zones" });
    }
  });

  // Create new zone
  app.post("/api/zones", async (req, res) => {
    try {
      console.log("Creating zone with data:", req.body);
      const validatedData = insertParkingZoneSchema.parse(req.body);
      const zone = await storage.createZone(validatedData);
      res.json({ success: true, zone });
    } catch (error) {
      console.error("Failed to create zone:", error);
      res.status(400).json({ success: false, message: "Failed to create zone", error: String(error) });
    }
  });

  // Update zone
  app.patch("/api/zones/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const zone = await storage.updateZone(id, updates);
      
      if (!zone) {
        return res.status(404).json({ success: false, message: "Zone not found" });
      }
      
      res.json({ success: true, zone });
    } catch (error) {
      res.status(400).json({ success: false, message: "Failed to update zone" });
    }
  });

  // Delete zone
  app.delete("/api/zones/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteZone(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, message: "Failed to delete zone" });
    }
  });

  // Enter vehicle (create ticket)
  app.post("/api/vehicles/enter", async (req, res) => {
    try {
      const { vehicleNumber, type = 'light', zoneId, slot } = req.body;

      if (!vehicleNumber) {
        return res.status(400).json({ success: false, message: "Vehicle number required" });
      }

      const zones = await storage.getAllZones();
      const allVehicles = await storage.getAllVehicles();

      let targetZone;
      if (zoneId) {
        targetZone = zones.find(z => z.id === zoneId);
        if (!targetZone) {
          return res.status(404).json({ success: false, message: "Zone not found" });
        }
        
        const zoneVehicles = allVehicles.filter(v => v.zoneId === zoneId);
        const typeCount = zoneVehicles.filter(v => v.type === type).length;
        
        if (zoneVehicles.length >= targetZone.capacity) {
          return res.status(400).json({ success: false, message: `Zone ${targetZone.name} is full!` });
        }
        
        const limitKey = `${type}Limit` as 'heavyLimit' | 'mediumLimit' | 'lightLimit';
        if (typeCount >= targetZone[limitKey]) {
          return res.status(400).json({ success: false, message: `Zone ${targetZone.name} is full for ${type} vehicles!` });
        }
      } else {
        // Find first available zone
        for (const zone of zones) {
          const zoneVehicles = allVehicles.filter(v => v.zoneId === zone.id);
          const typeCount = zoneVehicles.filter(v => v.type === type).length;
          const limitKey = `${type}Limit` as 'heavyLimit' | 'mediumLimit' | 'lightLimit';
          
          if (zoneVehicles.length < zone.capacity && typeCount < zone[limitKey]) {
            targetZone = zone;
            break;
          }
        }
        
        if (!targetZone) {
          return res.status(400).json({ success: false, message: `All parking zones are full for ${type} vehicles!` });
        }
      }

      const ticketId = `TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const vehicle = await storage.createVehicle({
        number: vehicleNumber,
        type,
        zoneId: targetZone.id,
        ticketId,
        slot: slot || undefined,
      });

      // Record entry event for analytics
      const now = new Date();
      await storage.createParkingEvent({
        vehicleNumber: vehicle.number,
        vehicleType: vehicle.type,
        zoneId: targetZone.id,
        eventType: 'entry',
        eventTime: now,
        dayOfWeek: now.getDay(),
        hourOfDay: now.getHours(),
      });

      res.json({
        success: true,
        ticket: {
          vehicleNumber: vehicle.number,
          zoneName: targetZone.name,
          ticketId: vehicle.ticketId,
          time: new Date(vehicle.entryTime).toLocaleTimeString(),
          type: vehicle.type,
          slot: vehicle.slot,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to enter vehicle" });
    }
  });

  // Search vehicle by number
  app.get("/api/vehicles/search", async (req, res) => {
    try {
      const { number } = req.query;
      
      if (!number || typeof number !== 'string') {
        return res.status(400).json({ success: false, message: "Vehicle number required" });
      }

      const allVehicles = await storage.getAllVehicles();
      const vehicle = allVehicles.find(v => v.number.toLowerCase().includes(number.toLowerCase()));
      
      if (!vehicle) {
        return res.json({ success: true, vehicle: null });
      }

      const zone = await storage.getZone(vehicle.zoneId);
      
      res.json({
        success: true,
        vehicle: {
          number: vehicle.number,
          type: vehicle.type,
          entryTime: vehicle.entryTime,
          ticketId: vehicle.ticketId,
          slot: vehicle.slot,
          zoneName: zone?.name || 'Unknown',
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Search failed" });
    }
  });

  // Exit vehicle (delete)
  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get vehicle info before deleting for event tracking
      const vehicle = await storage.getVehicleById(id);
      if (vehicle) {
        // Record exit event for analytics
        const now = new Date();
        await storage.createParkingEvent({
          vehicleNumber: vehicle.number,
          vehicleType: vehicle.type,
          zoneId: vehicle.zoneId,
          eventType: 'exit',
          eventTime: now,
          dayOfWeek: now.getDay(),
          hourOfDay: now.getHours(),
        });
      }
      
      await storage.deleteVehicle(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, message: "Failed to exit vehicle" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/summary", async (req, res) => {
    try {
      const events = await storage.getRecentEvents(30);
      const zones = await storage.getAllZones();
      const allVehicles = await storage.getAllVehicles();
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
      const totalOccupied = allVehicles.length;
      const currentOccupancyPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

      // Default trends when no historical data
      const defaultWeeklyTrend = [
        { day: 'Sun', occupancy: 75 }, { day: 'Mon', occupancy: 45 },
        { day: 'Tue', occupancy: 50 }, { day: 'Wed', occupancy: 55 },
        { day: 'Thu', occupancy: 60 }, { day: 'Fri', occupancy: 70 },
        { day: 'Sat', occupancy: 85 },
      ];
      const defaultHourlyProbs = { 4: 30, 8: 50, 12: 80, 16: 70, 20: 50, 0: 20 };

      // Helper: get date string from event
      const getDateStr = (e: { eventTime: Date }) => {
        const d = new Date(e.eventTime);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };

      // Step 1: Group events by zone + calendar date
      type DailyStats = { peak: number; hourly: Record<number, number> };
      const zoneDateStats = new Map<string, Map<string, DailyStats>>();
      
      zones.forEach(zone => {
        const dateMap = new Map<string, DailyStats>();
        const zoneEvents = events.filter(e => e.zoneId === zone.id);
        
        // Get unique dates for this zone
        const dates = Array.from(new Set(zoneEvents.map(e => getDateStr(e))));
        
        dates.forEach(dateStr => {
          const dayEvents = zoneEvents.filter(e => getDateStr(e) === dateStr)
            .sort((a, b) => a.hourOfDay - b.hourOfDay);
          
          // Compute per-day cumulative occupancy
          let balance = 0;
          let peak = 0;
          const hourly: Record<number, number> = {};
          
          for (let h = 0; h < 24; h++) {
            const entries = dayEvents.filter(e => e.hourOfDay === h && e.eventType === 'entry').length;
            const exits = dayEvents.filter(e => e.hourOfDay === h && e.eventType === 'exit').length;
            balance = Math.max(0, Math.min(balance + entries - exits, zone.capacity));
            hourly[h] = balance;
            peak = Math.max(peak, balance);
          }
          
          dateMap.set(dateStr, { 
            peak: zone.capacity > 0 ? Math.round((peak / zone.capacity) * 100) : 0,
            hourly 
          });
        });
        
        zoneDateStats.set(zone.id, dateMap);
      });

      // Step 2: Aggregate by day-of-week (average daily peaks)
      let weeklyTrend = defaultWeeklyTrend;
      
      if (events.length > 0 && zones.length > 0) {
        weeklyTrend = dayNames.map((day, dayIdx) => {
          const peaksForDay: number[] = [];
          
          zones.forEach(zone => {
            const dateMap = zoneDateStats.get(zone.id);
            if (!dateMap) return;
            
            dateMap.forEach((stats, dateStr) => {
              const d = new Date(dateStr);
              if (d.getDay() === dayIdx) {
                peaksForDay.push(stats.peak);
              }
            });
          });
          
          const avgPeak = peaksForDay.length > 0
            ? Math.round(peaksForDay.reduce((a, b) => a + b, 0) / peaksForDay.length)
            : defaultWeeklyTrend[dayIdx].occupancy;
          
          return { day, occupancy: avgPeak };
        });
      }

      // Step 3: Hourly forecast for tomorrow (average hourly curves for that weekday)
      const tomorrowDayOfWeek = (new Date().getDay() + 1) % 7;
      const hourlyAverages: Record<number, number[]> = {};
      for (let h = 0; h < 24; h++) hourlyAverages[h] = [];
      
      zones.forEach(zone => {
        const dateMap = zoneDateStats.get(zone.id);
        if (!dateMap) return;
        
        dateMap.forEach((stats, dateStr) => {
          const d = new Date(dateStr);
          if (d.getDay() === tomorrowDayOfWeek) {
            for (let h = 0; h < 24; h++) {
              const occPct = zone.capacity > 0 
                ? Math.round((stats.hourly[h] / zone.capacity) * 100) 
                : 0;
              hourlyAverages[h].push(occPct);
            }
          }
        });
      });
      
      const timeLabels: Record<number, string> = { 4: '4am', 8: '8am', 12: '12pm', 16: '4pm', 20: '8pm', 0: '12am' };
      const tomorrowHourly = [4, 8, 12, 16, 20, 0].map(h => {
        const values = hourlyAverages[h];
        const avgOcc = values.length > 0
          ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
          : defaultHourlyProbs[h as keyof typeof defaultHourlyProbs];
        return { time: timeLabels[h], prob: avgOcc };
      });

      // Step 4: Zone predictions (blend live + historical average peak)
      const zonePredictions = zones.map(zone => {
        const zoneVehicles = allVehicles.filter(v => v.zoneId === zone.id).length;
        const currentOcc = zone.capacity > 0 ? Math.round((zoneVehicles / zone.capacity) * 100) : 0;
        
        const dateMap = zoneDateStats.get(zone.id);
        const peaksForTomorrow: number[] = [];
        
        if (dateMap) {
          dateMap.forEach((stats, dateStr) => {
            const d = new Date(dateStr);
            if (d.getDay() === tomorrowDayOfWeek) {
              peaksForTomorrow.push(stats.peak);
            }
          });
        }
        
        const avgHistoricalPeak = peaksForTomorrow.length > 0
          ? Math.round(peaksForTomorrow.reduce((a, b) => a + b, 0) / peaksForTomorrow.length)
          : 0;
        
        // Blend: 50% current, 30% historical avg peak, 20% buffer (minimum 5%)
        const hasHistory = peaksForTomorrow.length > 0;
        const predicted = hasHistory
          ? Math.min(Math.round(currentOcc * 0.5 + avgHistoricalPeak * 0.3 + 10), 100)
          : Math.min(currentOcc + 15, 100);
        
        return { id: zone.id, name: zone.name, prob: Math.max(predicted, 5) };
      });

      const avgZoneProb = zonePredictions.length > 0 
        ? zonePredictions.reduce((sum, z) => sum + z.prob, 0) / zonePredictions.length : 50;
      const peakHourProb = Math.max(...tomorrowHourly.map(h => h.prob));
      const peakHour = tomorrowHourly.find(h => h.prob === peakHourProb);
      
      res.json({
        success: true,
        data: {
          currentOccupancy: currentOccupancyPercent,
          totalVehicles: totalOccupied,
          totalCapacity,
          weeklyTrend,
          tomorrowHourly,
          zonePredictions,
          tomorrowOverall: {
            probability: Math.round((avgZoneProb + peakHourProb) / 2),
            peakTime: peakHour ? peakHour.time.replace('am', ':00 AM').replace('pm', ':00 PM') : '12:00 PM',
            confidence: events.length > 50 ? 'high' : events.length > 10 ? 'medium' : 'low',
          },
          dataPoints: events.length,
        },
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ success: false, message: "Failed to fetch analytics" });
    }
  });

  // Seed historical data for demo
  app.post("/api/analytics/seed", async (req, res) => {
    try {
      const zones = await storage.getAllZones();
      if (zones.length === 0) {
        return res.status(400).json({ success: false, message: "Initialize zones first" });
      }

      const vehicleTypes = ['heavy', 'medium', 'light'];
      const now = new Date();
      let created = 0;

      // Create events for the past 14 days
      for (let daysAgo = 1; daysAgo <= 14; daysAgo++) {
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        const dayOfWeek = date.getDay();

        // More traffic on weekends
        const baseEvents = dayOfWeek === 0 || dayOfWeek === 6 ? 30 : 15;
        const eventCount = baseEvents + Math.floor(Math.random() * 20);

        for (let e = 0; e < eventCount; e++) {
          const zone = zones[Math.floor(Math.random() * zones.length)];
          const type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
          // Peak hours: 8am-12pm and 4pm-8pm
          const peakHours = [8, 9, 10, 11, 12, 16, 17, 18, 19, 20];
          const offPeakHours = [4, 5, 6, 7, 13, 14, 15, 21, 22, 23];
          const hourOfDay = Math.random() > 0.3 
            ? peakHours[Math.floor(Math.random() * peakHours.length)]
            : offPeakHours[Math.floor(Math.random() * offPeakHours.length)];
          
          date.setHours(hourOfDay, Math.floor(Math.random() * 60), 0, 0);

          await storage.createParkingEvent({
            vehicleNumber: `KL-${Math.floor(Math.random() * 100)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(1000 + Math.random() * 9000)}`,
            vehicleType: type,
            zoneId: zone.id,
            eventType: 'entry',
            eventTime: new Date(date),
            dayOfWeek,
            hourOfDay,
          });
          created++;
        }
      }

      res.json({ success: true, message: `Seeded ${created} historical events` });
    } catch (error) {
      console.error('Seed error:', error);
      res.status(500).json({ success: false, message: "Failed to seed data" });
    }
  });

  // ============================================================================
  // FORECAST ENDPOINT
  // Deterministic, weighted-average based occupancy forecast for tomorrow
  // Uses historical data from the last 7 days with recency-weighted averaging
  // ============================================================================
  app.get("/api/forecast", async (req, res) => {
    try {
      // Step 1: Get all zones and current vehicle counts
      const zones = await storage.getAllZones();
      const allVehicles = await storage.getAllVehicles();
      
      // Constants for forecast calculation
      const HISTORY_DAYS = 7; // Minimum 7 days of historical data
      
      // Weighted average weights (must sum to 1.0)
      // Yesterday: 40%, 2 days ago: 25%, 3 days ago: 15%, Remaining 4 days: 20% (5% each)
      const WEIGHTS = {
        day1: 0.40,  // Yesterday
        day2: 0.25,  // 2 days ago
        day3: 0.15,  // 3 days ago
        remaining: 0.20 // Remaining 4 days combined (0.05 each)
      };
      
      // Day-based adjustment factors
      // Weekend (Sat/Sun) and peak pilgrimage days get higher adjustment
      const WEEKEND_ADJUSTMENT = 1.15; // 15% increase for weekends
      const PEAK_DAY_ADJUSTMENT = 1.20; // 20% increase for peak days (Fri evening rush)
      
      // Determine tomorrow's date and day of week
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDayOfWeek = tomorrow.getDay(); // 0=Sun, 6=Sat
      const tomorrowDateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      // Determine if tomorrow is a peak day
      // Peak days: Saturday (6), Sunday (0), Friday (5)
      const isPeakDay = tomorrowDayOfWeek === 0 || tomorrowDayOfWeek === 5 || tomorrowDayOfWeek === 6;
      const isWeekend = tomorrowDayOfWeek === 0 || tomorrowDayOfWeek === 6;
      
      // Step 2: Calculate forecast for each zone
      const zoneForecastPromises = zones.map(async (zone) => {
        // Get daily peak occupancy for this zone over the last 7 days
        const dailyPeaks = await storage.getZoneDailyPeakOccupancy(zone.id, HISTORY_DAYS);
        
        // Get current occupancy for this zone
        const currentVehicles = allVehicles.filter(v => v.zoneId === zone.id).length;
        const currentOccupancyPercent = zone.capacity > 0 
          ? Math.round((currentVehicles / zone.capacity) * 100) 
          : 0;
        
        // If no historical data, use current occupancy as baseline
        if (dailyPeaks.length === 0) {
          const basePercent = Math.max(currentOccupancyPercent, 10); // Minimum 10%
          const adjustedPercent = isPeakDay 
            ? Math.min(Math.round(basePercent * (isWeekend ? WEEKEND_ADJUSTMENT : PEAK_DAY_ADJUSTMENT)), 100)
            : basePercent;
          
          return {
            zoneId: zone.id,
            zoneName: zone.name,
            capacity: zone.capacity,
            currentOccupancy: currentVehicles,
            currentOccupancyPercent,
            forecastedOccupancyPercent: adjustedPercent,
            forecastedVehicles: Math.round((adjustedPercent / 100) * zone.capacity),
            dataPoints: 0,
            confidence: 'low' as const,
            method: 'baseline_estimate'
          };
        }
        
        // Step 3: Calculate weighted average from historical data
        // Data is sorted by daysAgo (1=yesterday, 2=two days ago, etc.)
        let weightedSum = 0;
        let totalWeight = 0;
        
        // Count remaining days (days 4-7) for weight distribution
        const remainingDaysCount = dailyPeaks.filter(d => d.daysAgo >= 4 && d.daysAgo <= 7).length;
        
        dailyPeaks.forEach((day) => {
          // Calculate occupancy percentage for this day
          const dayOccupancyPercent = zone.capacity > 0 
            ? Math.round((day.peakCount / zone.capacity) * 100) 
            : 0;
          
          // Assign weight based on daysAgo (explicit day offset, not index)
          let weight: number;
          if (day.daysAgo === 1) {
            // Yesterday: 40% weight
            weight = WEIGHTS.day1;
          } else if (day.daysAgo === 2) {
            // 2 days ago: 25% weight
            weight = WEIGHTS.day2;
          } else if (day.daysAgo === 3) {
            // 3 days ago: 15% weight
            weight = WEIGHTS.day3;
          } else if (day.daysAgo >= 4 && day.daysAgo <= 7) {
            // Days 4-7: split the remaining 20% evenly among available days
            weight = remainingDaysCount > 0 ? WEIGHTS.remaining / remainingDaysCount : 0;
          } else {
            // Days beyond 7: no weight (shouldn't happen with 7-day limit)
            weight = 0;
          }
          
          weightedSum += dayOccupancyPercent * weight;
          totalWeight += weight;
        });
        
        // Normalize the weighted average if we don't have full 7 days
        let baseForecatPercent = totalWeight > 0 
          ? Math.round(weightedSum / totalWeight) 
          : currentOccupancyPercent;
        
        // Step 4: Apply day-based adjustment
        let adjustedPercent: number;
        if (isWeekend) {
          // Saturday or Sunday: increase by 15%
          adjustedPercent = Math.round(baseForecatPercent * WEEKEND_ADJUSTMENT);
        } else if (tomorrowDayOfWeek === 5) {
          // Friday: increase by 20% (pre-weekend rush)
          adjustedPercent = Math.round(baseForecatPercent * PEAK_DAY_ADJUSTMENT);
        } else {
          // Regular weekday: no adjustment
          adjustedPercent = baseForecatPercent;
        }
        
        // Step 5: Cap at 100% (cannot exceed zone capacity)
        adjustedPercent = Math.min(adjustedPercent, 100);
        
        // Calculate expected vehicles from percentage
        const forecastedVehicles = Math.round((adjustedPercent / 100) * zone.capacity);
        
        // Determine confidence level based on data availability
        let confidence: 'high' | 'medium' | 'low';
        if (dailyPeaks.length >= 7) {
          confidence = 'high';
        } else if (dailyPeaks.length >= 3) {
          confidence = 'medium';
        } else {
          confidence = 'low';
        }
        
        return {
          zoneId: zone.id,
          zoneName: zone.name,
          capacity: zone.capacity,
          currentOccupancy: currentVehicles,
          currentOccupancyPercent,
          forecastedOccupancyPercent: adjustedPercent,
          forecastedVehicles,
          dataPoints: dailyPeaks.length,
          confidence,
          method: 'weighted_average'
        };
      });
      
      const zoneForecast = await Promise.all(zoneForecastPromises);
      
      // Step 6: Calculate overall totals
      const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
      const totalCurrentOccupancy = allVehicles.length;
      const totalForecastedVehicles = zoneForecast.reduce((sum, z) => sum + z.forecastedVehicles, 0);
      const overallForecastPercent = totalCapacity > 0 
        ? Math.min(Math.round((totalForecastedVehicles / totalCapacity) * 100), 100)
        : 0;
      
      // Average data points for confidence calculation
      const avgDataPoints = zoneForecast.length > 0
        ? zoneForecast.reduce((sum, z) => sum + z.dataPoints, 0) / zoneForecast.length
        : 0;
      
      let overallConfidence: 'high' | 'medium' | 'low';
      if (avgDataPoints >= 7) {
        overallConfidence = 'high';
      } else if (avgDataPoints >= 3) {
        overallConfidence = 'medium';
      } else {
        overallConfidence = 'low';
      }
      
      // Step 7: Build and return response
      res.json({
        success: true,
        forecast: {
          // Forecast metadata
          generatedAt: new Date().toISOString(),
          forecastDate: tomorrowDateStr,
          forecastDayOfWeek: dayNames[tomorrowDayOfWeek],
          isPeakDay,
          isWeekend,
          
          // Overall forecast
          overall: {
            totalCapacity,
            currentOccupancy: totalCurrentOccupancy,
            currentOccupancyPercent: totalCapacity > 0 
              ? Math.round((totalCurrentOccupancy / totalCapacity) * 100) 
              : 0,
            forecastedOccupancyPercent: overallForecastPercent,
            forecastedVehicles: totalForecastedVehicles,
            confidence: overallConfidence
          },
          
          // Zone-wise forecast
          zones: zoneForecast,
          
          // Methodology explanation
          methodology: {
            description: 'Weighted average of last 7 days peak occupancy with day-based adjustments',
            weights: {
              yesterday: '40%',
              twoDaysAgo: '25%',
              threeDaysAgo: '15%',
              remainingDays: '20% (split equally)'
            },
            adjustments: {
              weekend: '+15% for Saturday/Sunday',
              friday: '+20% for Friday (pre-weekend rush)',
              weekday: 'No adjustment'
            },
            constraints: {
              maxPercent: '100% (capped at zone capacity)',
              minDataDays: '7 days recommended for high confidence'
            }
          }
        }
      });
    } catch (error) {
      console.error('Forecast error:', error);
      res.status(500).json({ success: false, message: "Failed to generate forecast" });
    }
  });

  return httpServer;
}
