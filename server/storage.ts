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
}

export const storage = new DatabaseStorage();
