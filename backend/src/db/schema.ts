import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  date,
  numeric,
} from 'drizzle-orm/pg-core';

export const activityCategory = pgEnum('activity_category', [
  'activity',
  'transport',
  'stay',
  'meal',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  phone: varchar('phone', { length: 50 }),
  city: varchar('city', { length: 255 }),
  country: varchar('country', { length: 255 }),
  avatarUrl: text('avatar_url'),
  role: varchar('role', { length: 50 }).default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const cities = pgTable('cities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  country: varchar('country', { length: 255 }).notNull(),
  region: varchar('region', { length: 255 }),
  costIndex: integer('cost_index'),
  popularity: integer('popularity').default(0),
  imageUrl: text('image_url'),
});

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  cityId: uuid('city_id')
    .notNull()
    .references(() => cities.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }),
  cost: numeric('cost').default('0'),
  durationMinutes: integer('duration_minutes'),
  description: text('description'),
  imageUrl: text('image_url'),
});

export const trips = pgTable('trips', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  coverPhotoUrl: text('cover_photo_url'),
  isPublic: boolean('is_public').default(false),
  shareSlug: varchar('share_slug', { length: 255 }).unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tripStops = pgTable('trip_stops', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id')
    .notNull()
    .references(() => trips.id),
  cityId: uuid('city_id')
    .notNull()
    .references(() => cities.id),
  orderIndex: integer('order_index').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  budget: numeric('budget').default('0'),
});

export const tripActivities = pgTable('trip_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  stopId: uuid('stop_id')
    .notNull()
    .references(() => tripStops.id),
  activityId: uuid('activity_id').references(() => activities.id),
  dayNumber: integer('day_number').notNull(),
  startTime: varchar('start_time', { length: 50 }),
  category: activityCategory('category').default('activity'),
  costOverride: numeric('cost_override'),
  notes: text('notes'),
});
