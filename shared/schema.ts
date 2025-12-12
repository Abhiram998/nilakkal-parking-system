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
