import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { db } from './db';
import { users, trips, cities, tripStops, activities, tripActivities } from './db/schema';
import { eq, ilike, and, desc, asc } from 'drizzle-orm';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const requireAuth = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/', (req, res) => res.send('GlobeTrotter API is running!'));

// --- AUTH ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, city, country } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) return res.status(400).json({ error: 'User already exists, try logging in' });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await db.insert(users).values({ name, email, passwordHash, phone, city, country }).returning();

    const token = jwt.sign({ userId: newUser[0].id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    res.status(201).json({ user: { id: newUser[0].id, name: newUser[0].name, email: newUser[0].email } });
  } catch (err) { res.status(500).json({ error: 'Registration failed' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const found = await db.select().from(users).where(eq(users.email, email));
    if (!found.length || !(await bcrypt.compare(password, found[0].passwordHash))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: found[0].id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    res.json({ user: { id: found[0].id, name: found[0].name, email: found[0].email } });
  } catch (err) { res.status(500).json({ error: 'Login failed' }); }
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', requireAuth, async (req: any, res: any) => {
  const found = await db.select().from(users).where(eq(users.id, req.user.userId));
  if (!found.length) return res.status(404).json({ error: 'Not found' });
  const { passwordHash, ...safe } = found[0];
  res.json({ user: safe });
});

// --- DASHBOARD & CITIES ---
app.get('/api/dashboard', requireAuth, async (req: any, res: any) => {
  const recentTrips = await db.select().from(trips).where(eq(trips.userId, req.user.userId)).orderBy(desc(trips.createdAt)).limit(3);
  const popularCities = await db.select().from(cities).orderBy(desc(cities.popularity)).limit(5);
  res.json({ recentTrips, popularCities });
});

app.get('/api/cities', requireAuth, async (req: any, res: any) => {
  const results = await db.select().from(cities);
  res.json({ cities: results });
});

app.post('/api/cities', requireAuth, async (req: any, res: any) => {
  try {
    const { name, country, region } = req.body;
    const newCity = await db.insert(cities).values({
      name, country, region, costIndex: 50, popularity: 0
    }).returning();
    res.status(201).json(newCity[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- TRIPS ---
app.post('/api/trips', requireAuth, async (req: any, res: any) => {
  try {
    const { name, description, startDate, endDate, coverPhotoUrl } = req.body;
    const newTrip = await db.insert(trips).values({
      userId: req.user.userId, name, description, startDate, endDate, coverPhotoUrl
    }).returning();
    res.status(201).json(newTrip[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/trips/:tripId/stops', requireAuth, async (req: any, res: any) => {
  try {
    const { cityId, orderIndex, startDate, endDate, budget } = req.body;
    const newStop = await db.insert(tripStops).values({
      tripId: req.params.tripId, cityId, orderIndex, startDate, endDate, budget
    }).returning();
    res.status(201).json({ stop: newStop[0] });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/trips/:tripId/stops/:stopId', requireAuth, async (req: any, res: any) => {
  require('fs').appendFileSync('patch_debug.log', `\n[${new Date().toISOString()}] POST request received! tripId: ${req.params.tripId}, stopId: ${req.params.stopId}, budget: ${req.body.budget}\n`);
  try {
    const { budget } = req.body;
    const updated = await db.update(tripStops)
      .set({ budget })
      .where(eq(tripStops.id, req.params.stopId))
      .returning();
    require('fs').appendFileSync('patch_debug.log', `[${new Date().toISOString()}] Update successful.\n`);
    res.json(updated[0]);
  } catch (err: any) { 
    require('fs').appendFileSync('patch_debug.log', `[${new Date().toISOString()}] Error: ${err.message}\n`);
    res.status(500).json({ error: err.message }); 
  }
});

app.get('/api/trips', requireAuth, async (req: any, res: any) => {
  const userTrips = await db.select().from(trips).where(eq(trips.userId, req.user.userId)).orderBy(desc(trips.startDate));
  res.json(userTrips);
});

app.get('/api/public/trips/:slug', async (req: any, res: any) => {
  const tripData = await db.select().from(trips).where(eq(trips.shareSlug, req.params.slug));
  if (!tripData.length) return res.status(404).json({ error: 'Trip not found' });
  const tripStopsData = await db.select().from(tripStops).where(eq(tripStops.tripId, tripData[0].id));
  res.json({ trip: tripData[0], stops: tripStopsData });
});

app.get('/api/community/trips', async (req: any, res: any) => {
  const publicTrips = await db
    .select({ trip: trips, user: users.name })
    .from(trips)
    .leftJoin(users, eq(trips.userId, users.id))
    .where(eq(trips.isPublic, true))
    .orderBy(desc(trips.createdAt))
    .limit(50);
  res.json(publicTrips);
});

app.get('/api/trips/:id', requireAuth, async (req: any, res: any) => {
  const tripData = await db.select().from(trips).where(eq(trips.id, req.params.id));
  if (!tripData.length) return res.status(404).json({ error: 'Trip not found' });
  
  // Fetch stops with cities
  const stops = await db.select({
    stop: tripStops,
    city: cities
  }).from(tripStops).leftJoin(cities, eq(tripStops.cityId, cities.id)).where(eq(tripStops.tripId, req.params.id)).orderBy(asc(tripStops.orderIndex));
  
  // For each stop, fetch activities (in a real app, do one query and group, but this is fine for hackathon)
  const stopsWithActivities = await Promise.all(stops.map(async (s: any) => {
    const stopActivities = await db.select({
      item: tripActivities,
      activity: activities
    }).from(tripActivities).leftJoin(activities, eq(tripActivities.activityId, activities.id)).where(eq(tripActivities.stopId, s.stop.id)).orderBy(asc(tripActivities.dayNumber));
    return { ...s, activities: stopActivities };
  }));

  res.json({ trip: tripData[0], stops: stopsWithActivities });
});

// --- STOPS & ACTIVITIES ---
app.post('/api/trips/:id/stops', requireAuth, async (req: any, res: any) => {
  try {
    const { cityId, startDate, endDate, budget } = req.body;
    // Get current max order
    const existingStops = await db.select().from(tripStops).where(eq(tripStops.tripId, req.params.id));
    const orderIndex = existingStops.length;
    
    const stop = await db.insert(tripStops).values({
      tripId: req.params.id, cityId, startDate, endDate, budget, orderIndex
    }).returning();
    res.status(201).json(stop[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/cities/:cityId/activities', requireAuth, async (req: any, res: any) => {
  const cityActivities = await db.select().from(activities).where(eq(activities.cityId, req.params.cityId));
  res.json(cityActivities);
});

app.post('/api/activities', requireAuth, async (req: any, res: any) => {
  try {
    const { cityId, name, type, cost, durationMinutes, description } = req.body;
    const newActivity = await db.insert(activities).values({
      cityId, name, type, cost: cost || 0, durationMinutes, description
    }).returning();
    res.status(201).json(newActivity[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/stops/:stopId/activities', requireAuth, async (req: any, res: any) => {
  try {
    const { activityId, dayNumber, startTime, category, notes, costOverride } = req.body;
    const item = await db.insert(tripActivities).values({
      stopId: req.params.stopId, activityId, dayNumber, startTime, category, notes, costOverride
    }).returning();
    res.status(201).json(item[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.listen(port, () => console.log(`API running on ${port}`));
