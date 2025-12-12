import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Admin users table
export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  policeId: text("police_id").notNull(),
});

export const insertAdminSchema = createInsertSchema(admins).omit({ id: true });
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

// Parking zones table
export const parkingZones = pgTable("parking_zones", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  heavyLimit: integer("heavy_limit").notNull(),
  mediumLimit: integer("medium_limit").notNull(),
  lightLimit: integer("light_limit").notNull(),
});

export const insertParkingZoneSchema = createInsertSchema(parkingZones);
export type InsertParkingZone = z.infer<typeof insertParkingZoneSchema>;
export type ParkingZone = typeof parkingZones.$inferSelect;

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  number: text("number").notNull(),
  type: text("type").notNull(), // 'heavy', 'medium', 'light'
  zoneId: varchar("zone_id").notNull().references(() => parkingZones.id),
  slot: text("slot"),
  ticketId: text("ticket_id").notNull(),
  entryTime: timestamp("entry_time").notNull().defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true, entryTime: true });
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

// Parking events table - tracks historical entries and exits
export const parkingEvents = pgTable("parking_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleNumber: text("vehicle_number").notNull(),
  vehicleType: text("vehicle_type").notNull(), // 'heavy', 'medium', 'light'
  zoneId: varchar("zone_id").notNull(),
  eventType: text("event_type").notNull(), // 'entry' or 'exit'
  eventTime: timestamp("event_time").notNull().defaultNow(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  hourOfDay: integer("hour_of_day").notNull(), // 0-23
});

export const insertParkingEventSchema = createInsertSchema(parkingEvents).omit({ id: true });
export type InsertParkingEvent = z.infer<typeof insertParkingEventSchema>;
export type ParkingEvent = typeof parkingEvents.$inferSelect;

// Daily occupancy snapshots for analytics
export const dailySnapshots = pgTable("daily_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  zoneId: varchar("zone_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  dayOfWeek: integer("day_of_week").notNull(),
  peakOccupancy: integer("peak_occupancy").notNull().default(0),
  avgOccupancy: integer("avg_occupancy").notNull().default(0),
  totalEntries: integer("total_entries").notNull().default(0),
  totalExits: integer("total_exits").notNull().default(0),
  heavyCount: integer("heavy_count").notNull().default(0),
  mediumCount: integer("medium_count").notNull().default(0),
  lightCount: integer("light_count").notNull().default(0),
});

export const insertDailySnapshotSchema = createInsertSchema(dailySnapshots).omit({ id: true });
export type InsertDailySnapshot = z.infer<typeof insertDailySnapshotSchema>;
export type DailySnapshot = typeof dailySnapshots.$inferSelect;
