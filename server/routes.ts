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
      const validatedData = insertParkingZoneSchema.parse(req.body);
      const zone = await storage.createZone(validatedData);
      res.json({ success: true, zone });
    } catch (error) {
      res.status(400).json({ success: false, message: "Failed to create zone" });
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
      await storage.deleteVehicle(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, message: "Failed to exit vehicle" });
    }
  });

  return httpServer;
}
