import {
  type User,
  type InsertUser,
  type Admin,
  type InsertAdmin,
  type ParkingZone,
  type InsertParkingZone,
  type Vehicle,
  type InsertVehicle,
  type ParkingEvent,
  type InsertParkingEvent,
  type DailySnapshot,
  type InsertDailySnapshot,
  users,
  admins,
  parkingZones,
  vehicles,
  parkingEvents,
  dailySnapshots,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, gte, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Admin methods
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  
  // Parking zone methods
  getAllZones(): Promise<ParkingZone[]>;
  getZone(id: string): Promise<ParkingZone | undefined>;
  createZone(zone: InsertParkingZone): Promise<ParkingZone>;
  updateZone(id: string, updates: Partial<InsertParkingZone>): Promise<ParkingZone | undefined>;
  deleteZone(id: string): Promise<void>;
  
  // Vehicle methods
  getAllVehicles(): Promise<Vehicle[]>;
  getVehiclesByZone(zoneId: string): Promise<Vehicle[]>;
  getVehicleByNumber(number: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  deleteVehicle(id: string): Promise<void>;
  getVehicleById(id: string): Promise<Vehicle | undefined>;
  
  // Event tracking methods
  createParkingEvent(event: InsertParkingEvent): Promise<ParkingEvent>;
  getRecentEvents(days: number): Promise<ParkingEvent[]>;
  getEventsByDayOfWeek(dayOfWeek: number): Promise<ParkingEvent[]>;
  
  // Analytics methods
  getDailySnapshots(days: number): Promise<DailySnapshot[]>;
  upsertDailySnapshot(snapshot: InsertDailySnapshot): Promise<DailySnapshot>;
  
  // Forecast methods - get daily peak occupancy per zone for last N days
  getZoneDailyPeakOccupancy(zoneId: string, days: number): Promise<Array<{ date: string; peakCount: number; dayOfWeek: number }>>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Admin methods
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin || undefined;
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const [admin] = await db.insert(admins).values(insertAdmin).returning();
    return admin;
  }

  // Parking zone methods
  async getAllZones(): Promise<ParkingZone[]> {
    return await db.select().from(parkingZones);
  }

  async getZone(id: string): Promise<ParkingZone | undefined> {
    const [zone] = await db.select().from(parkingZones).where(eq(parkingZones.id, id));
    return zone || undefined;
  }

  async createZone(zone: InsertParkingZone): Promise<ParkingZone> {
    const [newZone] = await db.insert(parkingZones).values(zone).returning();
    return newZone;
  }

  async updateZone(id: string, updates: Partial<InsertParkingZone>): Promise<ParkingZone | undefined> {
    const [updated] = await db
      .update(parkingZones)
      .set(updates)
      .where(eq(parkingZones.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteZone(id: string): Promise<void> {
    await db.delete(parkingZones).where(eq(parkingZones.id, id));
  }

  // Vehicle methods
  async getAllVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async getVehiclesByZone(zoneId: string): Promise<Vehicle[]> {
    return await db.select().from(vehicles).where(eq(vehicles.zoneId, zoneId));
  }

  async getVehicleByNumber(number: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.number, number));
    return vehicle || undefined;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  async deleteVehicle(id: string): Promise<void> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  async getVehicleById(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  // Event tracking methods
  async createParkingEvent(event: InsertParkingEvent): Promise<ParkingEvent> {
    const [newEvent] = await db.insert(parkingEvents).values(event).returning();
    return newEvent;
  }

  async getRecentEvents(days: number): Promise<ParkingEvent[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return await db.select().from(parkingEvents)
      .where(gte(parkingEvents.eventTime, cutoffDate))
      .orderBy(desc(parkingEvents.eventTime));
  }

  async getEventsByDayOfWeek(dayOfWeek: number): Promise<ParkingEvent[]> {
    return await db.select().from(parkingEvents)
      .where(eq(parkingEvents.dayOfWeek, dayOfWeek));
  }

  // Analytics methods
  async getDailySnapshots(days: number): Promise<DailySnapshot[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    return await db.select().from(dailySnapshots)
      .where(gte(dailySnapshots.date, cutoffStr))
      .orderBy(desc(dailySnapshots.date));
  }

  async upsertDailySnapshot(snapshot: InsertDailySnapshot): Promise<DailySnapshot> {
    const [existing] = await db.select().from(dailySnapshots)
      .where(and(
        eq(dailySnapshots.zoneId, snapshot.zoneId),
        eq(dailySnapshots.date, snapshot.date)
      ));
    
    if (existing) {
      const [updated] = await db.update(dailySnapshots)
        .set(snapshot)
        .where(eq(dailySnapshots.id, existing.id))
        .returning();
      return updated;
    }
    
    const [newSnapshot] = await db.insert(dailySnapshots).values(snapshot).returning();
    return newSnapshot;
  }

  // Forecast method: Calculate daily peak occupancy per zone from parking events
  // Returns data for completed days only (excludes today) sorted by date descending
  async getZoneDailyPeakOccupancy(zoneId: string, days: number): Promise<Array<{ date: string; peakCount: number; dayOfWeek: number; daysAgo: number }>> {
    // Get today's date string to exclude incomplete day
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Request one extra day to account for filtering out today
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (days + 1));
    
    // Get all events for this zone in the date range
    const events = await db.select().from(parkingEvents)
      .where(and(
        eq(parkingEvents.zoneId, zoneId),
        gte(parkingEvents.eventTime, cutoffDate)
      ))
      .orderBy(parkingEvents.eventTime);
    
    // Group events by date and calculate peak occupancy for each day
    const dailyData = new Map<string, { peakCount: number; dayOfWeek: number }>();
    
    events.forEach(event => {
      const eventDate = new Date(event.eventTime);
      const dateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
      
      if (!dailyData.has(dateStr)) {
        dailyData.set(dateStr, { peakCount: 0, dayOfWeek: eventDate.getDay() });
      }
    });
    
    // For each date, simulate the day's occupancy to find peak
    Array.from(dailyData.entries()).forEach(([dateStr, data]) => {
      const dayEvents = events.filter(e => {
        const d = new Date(e.eventTime);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === dateStr;
      }).sort((a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime());
      
      let balance = 0;
      let peak = 0;
      
      dayEvents.forEach(event => {
        if (event.eventType === 'entry') {
          balance++;
        } else {
          balance = Math.max(0, balance - 1);
        }
        peak = Math.max(peak, balance);
      });
      
      data.peakCount = peak;
    });
    
    // Convert to array, filter out today, calculate daysAgo, and sort by date (most recent first)
    const todayMs = new Date(todayStr).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    return Array.from(dailyData.entries())
      .filter(([date]) => date !== todayStr) // Exclude today (incomplete data)
      .map(([date, data]) => {
        // Calculate how many days ago this date is (1 = yesterday, 2 = two days ago, etc.)
        const dateMs = new Date(date).getTime();
        const daysAgo = Math.round((todayMs - dateMs) / oneDayMs);
        return { date, ...data, daysAgo };
      })
      .sort((a, b) => a.daysAgo - b.daysAgo) // Sort by daysAgo ascending (yesterday first)
      .slice(0, days); // Limit to requested number of days
  }
}

export const storage = new DatabaseStorage();
