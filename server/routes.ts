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
      const events = await storage.getRecentEvents(30); // Last 30 days
      const zones = await storage.getAllZones();
      const allVehicles = await storage.getAllVehicles();
      
      // Calculate daily trends
      const dailyData: Record<string, { entries: number; occupancy: number }> = {};
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      dayNames.forEach((day, i) => {
        const dayEvents = events.filter(e => e.dayOfWeek === i && e.eventType === 'entry');
        dailyData[day] = {
          entries: dayEvents.length,
          occupancy: 0,
        };
      });

      // Calculate current total capacity and occupancy
      const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
      const totalOccupied = allVehicles.length;
      const currentOccupancyPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

      // Weekly trend based on actual data
      const weeklyTrend = dayNames.map((day, i) => {
        const dayEntries = events.filter(e => e.dayOfWeek === i && e.eventType === 'entry').length;
        // Estimate occupancy based on entries (higher entries = higher likely occupancy)
        const maxDayEntries = Math.max(...dayNames.map((_, idx) => 
          events.filter(e => e.dayOfWeek === idx && e.eventType === 'entry').length
        ), 1);
        const estimatedOccupancy = maxDayEntries > 0 ? Math.round((dayEntries / maxDayEntries) * 100) : 50;
        return { day, occupancy: Math.min(estimatedOccupancy, 100) || 50 };
      });

      // Hourly breakdown for tomorrow prediction
      const tomorrowDayOfWeek = (new Date().getDay() + 1) % 7;
      const tomorrowEvents = events.filter(e => e.dayOfWeek === tomorrowDayOfWeek);
      
      const hourlyData: Record<number, number> = {};
      for (let h = 0; h < 24; h++) {
        hourlyData[h] = tomorrowEvents.filter(e => e.hourOfDay === h && e.eventType === 'entry').length;
      }
      
      const maxHourlyEntries = Math.max(...Object.values(hourlyData), 1);
      const tomorrowHourly = [
        { time: '4am', prob: Math.round((hourlyData[4] || 0) / maxHourlyEntries * 100) || 30 },
        { time: '8am', prob: Math.round((hourlyData[8] || 0) / maxHourlyEntries * 100) || 50 },
        { time: '12pm', prob: Math.round((hourlyData[12] || 0) / maxHourlyEntries * 100) || 80 },
        { time: '4pm', prob: Math.round((hourlyData[16] || 0) / maxHourlyEntries * 100) || 70 },
        { time: '8pm', prob: Math.round((hourlyData[20] || 0) / maxHourlyEntries * 100) || 50 },
        { time: '12am', prob: Math.round((hourlyData[0] || 0) / maxHourlyEntries * 100) || 20 },
      ];

      // Zone predictions based on historical data
      const zonePredictions = zones.map(zone => {
        const zoneEvents = events.filter(e => e.zoneId === zone.id && e.dayOfWeek === tomorrowDayOfWeek && e.eventType === 'entry');
        const avgEntries = zoneEvents.length;
        const zoneVehicles = allVehicles.filter(v => v.zoneId === zone.id).length;
        const currentOcc = zone.capacity > 0 ? Math.round((zoneVehicles / zone.capacity) * 100) : 0;
        
        // Predict based on current + historical pattern
        const historyWeight = Math.min(avgEntries * 5, 30); // Cap historical influence
        const predicted = Math.min(currentOcc + historyWeight + Math.floor(Math.random() * 10), 100);
        
        return {
          id: zone.id,
          name: zone.name,
          prob: predicted || Math.floor(Math.random() * 40) + 40,
        };
      });

      // Overall tomorrow probability
      const avgZoneProb = zonePredictions.reduce((sum, z) => sum + z.prob, 0) / (zonePredictions.length || 1);
      const peakHourProb = Math.max(...tomorrowHourly.map(h => h.prob));
      
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
            peakTime: '12:00 PM',
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

  return httpServer;
}
