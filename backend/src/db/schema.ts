import { pgTable, uuid, varchar, text, timestamp, integer, numeric, boolean, date, pgEnum } from "drizzle-orm/pg-core";

export const activityCategory = pgEnum("activity_category", ["activity", "transport", "stay", "meal"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 160 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: varchar("phone", { length: 20 }),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  avatarUrl: text("avatar_url"),
  role: varchar("role", { length: 20 }).default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trips = pgTable("trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  coverPhotoUrl: text("cover_photo_url"),
  isPublic: boolean("is_public").default(false),
  shareSlug: varchar("share_slug", { length: 32 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cities = pgTable("cities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  country: varchar("country", { length: 120 }).notNull(),
  region: varchar("region", { length: 120 }),
  costIndex: integer("cost_index"),
  popularity: integer("popularity").default(0),
  imageUrl: text("image_url"),
});

export const tripStops = pgTable("trip_stops", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  cityId: uuid("city_id").references(() => cities.id).notNull(),
  orderIndex: integer("order_index").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  budget: numeric("budget", { precision: 10, scale: 2 }).default("0"),
});

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  cityId: uuid("city_id").references(() => cities.id).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  type: varchar("type", { length: 60 }),
  cost: numeric("cost", { precision: 10, scale: 2 }).default("0"),
  durationMinutes: integer("duration_minutes"),
  description: text("description"),
  imageUrl: text("image_url"),
});

export const tripActivities = pgTable("trip_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  stopId: uuid("stop_id").references(() => tripStops.id, { onDelete: "cascade" }).notNull(),
  activityId: uuid("activity_id").references(() => activities.id),
  dayNumber: integer("day_number").notNull(),
  startTime: varchar("start_time", { length: 5 }),
  category: activityCategory("category").default("activity"),
  costOverride: numeric("cost_override", { precision: 10, scale: 2 }),
  notes: text("notes"),
});

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content"),
  imageUrls: text("image_urls").array(),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postLikes = pgTable("post_likes", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postComments = pgTable("post_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
