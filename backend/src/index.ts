import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { db } from './db';
import { users, trips, cities, tripStops, activities, tripActivities, posts, postLikes, postComments, tripMembers, invitations, tripMessages } from './db/schema';
import { eq, ilike, and, or, desc, asc, sql, inArray } from 'drizzle-orm';

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
    res.status(201).json({ user: { id: newUser[0].id, name: newUser[0].name, email: newUser[0].email, role: newUser[0].role, avatarUrl: newUser[0].avatarUrl } });
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
    res.json({ user: { id: found[0].id, name: found[0].name, email: found[0].email, role: found[0].role, avatarUrl: found[0].avatarUrl } });
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

app.patch('/api/auth/me', requireAuth, async (req: any, res: any) => {
  try {
    const { name, avatarUrl } = req.body;
    const updated = await db.update(users).set({ name, avatarUrl }).where(eq(users.id, req.user.userId)).returning();
    const { passwordHash, ...safe } = updated[0];
    res.json({ user: safe });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/me', requireAuth, async (req: any, res: any) => {
  try {
    const { name, avatarUrl } = req.body;
    const updated = await db.update(users).set({ name, avatarUrl }).where(eq(users.id, req.user.userId)).returning();
    const { passwordHash, ...safe } = updated[0];
    res.json({ user: safe });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users/me/posts', requireAuth, async (req: any, res: any) => {
  try {
    const p = await db.select({ post: posts, user: users.name, userAvatar: users.avatarUrl })
      .from(posts).leftJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.userId, req.user.userId))
      .orderBy(desc(posts.createdAt));
      
    const enriched = await Promise.all(p.map(async (item: any) => {
      const likes = await db.select().from(postLikes).where(eq(postLikes.postId, item.post.id));
      const comments = await db.select().from(postComments).where(eq(postComments.postId, item.post.id));
      return { ...item, likesCount: likes.length, commentsCount: comments.length };
    }));

    res.json(enriched);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/community/posts', async (req: any, res: any) => {
  const { q } = req.query;
  let query: any = db
    .select({ post: posts, user: users.name, userAvatar: users.avatarUrl })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id));

  if (q) {
    query = query.where(
      or(
        ilike(posts.title, `%${q}%`),
        ilike(posts.content, `%${q}%`),
        ilike(posts.city, `%${q}%`),
        ilike(posts.country, `%${q}%`)
      )
    );
  }

  const p = await query.orderBy(desc(posts.createdAt)).limit(50);
  
  const enriched = await Promise.all(p.map(async (item: any) => {
    const likes = await db.select().from(postLikes).where(eq(postLikes.postId, item.post.id));
    const comments = await db.select().from(postComments).where(eq(postComments.postId, item.post.id));
    return { ...item, likesCount: likes.length, commentsCount: comments.length };
  }));

  res.json(enriched);
});

app.post('/api/community/posts', requireAuth, async (req: any, res: any) => {
  try {
    const { title, content, imageUrls, country, city } = req.body;
    const inserted = await db.insert(posts).values({
      userId: req.user.userId,
      title,
      content,
      imageUrls,
      country,
      city
    }).returning();
    res.json(inserted[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/community/posts/:id', requireAuth, async (req: any, res: any) => {
  try {
    const postData = await db.select({ post: posts, user: users.name, userAvatar: users.avatarUrl })
      .from(posts).leftJoin(users, eq(posts.userId, users.id)).where(eq(posts.id, req.params.id));
      
    if (!postData.length) return res.status(404).json({ error: "Not found" });
    
    const comments = await db.select({ comment: postComments, user: users.name, userAvatar: users.avatarUrl })
      .from(postComments).leftJoin(users, eq(postComments.userId, users.id)).where(eq(postComments.postId, req.params.id)).orderBy(asc(postComments.createdAt));
      
    const likes = await db.select().from(postLikes).where(eq(postLikes.postId, req.params.id));
    const hasLiked = likes.some(l => l.userId === req.user.userId);
    
    res.json({ ...postData[0], comments, likesCount: likes.length, hasLiked });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/community/posts/:id/like', requireAuth, async (req: any, res: any) => {
  try {
    const existing = await db.select().from(postLikes).where(and(eq(postLikes.postId, req.params.id), eq(postLikes.userId, req.user.userId)));
    if (existing.length > 0) {
      await db.delete(postLikes).where(eq(postLikes.id, existing[0].id));
      res.json({ liked: false });
    } else {
      await db.insert(postLikes).values({ postId: req.params.id, userId: req.user.userId });
      res.json({ liked: true });
    }
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/community/posts/:id/comments', requireAuth, async (req: any, res: any) => {
  try {
    const { content } = req.body;
    const inserted = await db.insert(postComments).values({ postId: req.params.id, userId: req.user.userId, content }).returning();
    res.json(inserted[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/search', async (req: any, res: any) => {
  try {
    const { q, type } = req.query; // type: 'city' or 'activity'
    let results = [];
    if (type === 'city' || !type) {
      const c = await db.select().from(cities).where(ilike(cities.name, `%${q || ''}%`)).limit(20);
      results.push(...c.map(x => ({ ...x, _resultType: 'city' })));
    }
    if (type === 'activity' || !type) {
      const a = await db.select({ activity: activities, city: cities }).from(activities).leftJoin(cities, eq(activities.cityId, cities.id)).where(ilike(activities.name, `%${q || ''}%`)).limit(20);
      results.push(...a.map(x => ({ ...x.activity, cityName: x.city?.name, _resultType: 'activity' })));
    }
    res.json(results);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/trips/:id/visibility', requireAuth, async (req: any, res: any) => {
  try {
    const { isPublic, description } = req.body;
    const updated = await db.update(trips).set({ isPublic, description }).where(eq(trips.id, req.params.id)).returning();
    res.json(updated[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/trips/:id/public', async (req: any, res: any) => {
  try {
    const tripData = await db.select().from(trips).where(eq(trips.id, req.params.id));
    if (!tripData.length || !tripData[0].isPublic) return res.status(404).json({ error: 'Trip not found or not public' });
    const stops = await db.select().from(tripStops).where(eq(tripStops.tripId, req.params.id)).orderBy(asc(tripStops.orderIndex));
    const stopIds = stops.map(s => s.id);
    const acts = stopIds.length > 0 ? await db.select().from(tripActivities).where(inArray(tripActivities.stopId, stopIds)) : [];
    res.json({ trip: tripData[0], stops, activities: acts });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/trips/:id/clone', requireAuth, async (req: any, res: any) => {
  try {
    const tripData = await db.select().from(trips).where(eq(trips.id, req.params.id));
    if (!tripData.length || !tripData[0].isPublic) return res.status(404).json({ error: 'Trip not found' });
    
    // 1. Clone Trip
    const newTrip = await db.insert(trips).values({
      userId: req.user.userId,
      name: `Copy of ${tripData[0].name}`,
      startDate: tripData[0].startDate,
      endDate: tripData[0].endDate,
      coverImage: tripData[0].coverImage,
      isPublic: false
    }).returning();
    
    // 2. Clone Stops
    const stops = await db.select().from(tripStops).where(eq(tripStops.tripId, req.params.id));
    for (const stop of stops) {
      const newStop = await db.insert(tripStops).values({
        tripId: newTrip[0].id,
        cityId: stop.cityId,
        startDate: stop.startDate,
        endDate: stop.endDate,
        budget: stop.budget,
        orderIndex: stop.orderIndex
      }).returning();
      
      // 3. Clone Activities for this stop
      const acts = await db.select().from(tripActivities).where(eq(tripActivities.stopId, stop.id));
      for (const act of acts) {
        await db.insert(tripActivities).values({
          stopId: newStop[0].id,
          activityId: act.activityId,
          plannedDate: act.plannedDate,
          orderIndex: act.orderIndex
        });
      }
    }
    res.json({ tripId: newTrip[0].id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
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

app.get('/api/activities', requireAuth, async (req: any, res: any) => {
  try {
    const { cityId } = req.query;
    let results;
    if (cityId) {
      results = await db.select().from(activities).where(eq(activities.cityId, cityId as string));
    } else {
      results = await db.select().from(activities);
    }
    res.json({ activities: results });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
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
  const { q } = req.query;
  let query: any = db
    .selectDistinct({ trip: trips, user: users.name })
    .from(trips)
    .leftJoin(users, eq(trips.userId, users.id))
    .leftJoin(tripStops, eq(trips.id, tripStops.tripId))
    .leftJoin(cities, eq(tripStops.cityId, cities.id));
    
  if (q) {
    query = query.where(
      and(
        eq(trips.isPublic, true),
        or(
          ilike(trips.name, `%${q}%`),
          ilike(cities.name, `%${q}%`),
          ilike(cities.country, `%${q}%`)
        )
      )
    );
  } else {
    query = query.where(eq(trips.isPublic, true));
  }

  const publicTrips = await query.orderBy(desc(trips.createdAt)).limit(50);
  res.json(publicTrips);
});

// Auto-migrate tables for members, invitations, and chat
db.execute(sql`
  CREATE TABLE IF NOT EXISTS trip_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160),
    role VARCHAR(20) DEFAULT 'member',
    created_at TIMESTAMP DEFAULT NOW()
  );
  ALTER TABLE trip_activities ADD COLUMN IF NOT EXISTS paid_by_member_name VARCHAR(120);

  CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    sender_name VARCHAR(120) NOT NULL,
    receiver_email VARCHAR(160) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS trip_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    sender_name VARCHAR(120) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
`).catch((err) => console.log('Auto migration note:', err.message));

app.get('/api/trips/:id', requireAuth, async (req: any, res: any) => {
  try {
    const tripData = await db.select().from(trips).where(eq(trips.id, req.params.id));
    if (!tripData.length) return res.status(404).json({ error: 'Trip not found' });
    
    // Fetch stops with cities
    const stops = await db.select({
      stop: tripStops,
      city: cities
    }).from(tripStops).leftJoin(cities, eq(tripStops.cityId, cities.id)).where(eq(tripStops.tripId, req.params.id)).orderBy(asc(tripStops.orderIndex));
    
    // For each stop, fetch activities
    const stopsWithActivities = await Promise.all(stops.map(async (s: any) => {
      const stopActivities = await db.select({
        item: tripActivities,
        activity: activities
      }).from(tripActivities).leftJoin(activities, eq(tripActivities.activityId, activities.id)).where(eq(tripActivities.stopId, s.stop.id)).orderBy(asc(tripActivities.dayNumber));
      return { ...s, activities: stopActivities };
    }));

    // Fetch members safely
    let members: any[] = [];
    try {
      members = await db.select().from(tripMembers).where(eq(tripMembers.tripId, req.params.id));
    } catch (e) {
      members = [];
    }

    res.json({ trip: tripData[0], stops: stopsWithActivities, members });
  } catch (err: any) {
    console.error("GET trip error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- INBOX & CHAT ENDPOINTS ---
app.get('/api/inbox/invitations', requireAuth, async (req: any, res: any) => {
  try {
    const userObj = await db.select().from(users).where(eq(users.id, req.user.userId));
    const userEmail = userObj[0]?.email || '';

    const list = await db.select({
      invitation: invitations,
      trip: trips
    })
    .from(invitations)
    .leftJoin(trips, eq(invitations.tripId, trips.id))
    .where(or(eq(invitations.receiverEmail, userEmail), eq(invitations.receiverEmail, req.user.userId)))
    .orderBy(desc(invitations.createdAt));

    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/inbox/invitations/:id/respond', requireAuth, async (req: any, res: any) => {
  try {
    const { status } = req.body; // 'accepted' | 'declined'
    const inv = await db.select().from(invitations).where(eq(invitations.id, req.params.id));
    if (!inv.length) return res.status(404).json({ error: 'Invitation not found' });

    await db.update(invitations).set({ status }).where(eq(invitations.id, req.params.id));

    if (status === 'accepted') {
      const userObj = await db.select().from(users).where(eq(users.id, req.user.userId));
      const userName = userObj[0]?.name || 'Member';
      await db.insert(tripMembers).values({
        tripId: inv[0].tripId,
        name: userName,
        email: inv[0].receiverEmail,
        role: 'member'
      });
    }

    res.json({ success: true, status });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Trip Chat Messages
app.get('/api/trips/:id/messages', requireAuth, async (req: any, res: any) => {
  try {
    const msgs = await db.select().from(tripMessages).where(eq(tripMessages.tripId, req.params.id)).orderBy(asc(tripMessages.createdAt));
    res.json(msgs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/trips/:id/messages', requireAuth, async (req: any, res: any) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message content required' });

    const userObj = await db.select().from(users).where(eq(users.id, req.user.userId));
    const senderName = userObj[0]?.name || 'Traveler';

    const newMsg = await db.insert(tripMessages).values({
      tripId: req.params.id,
      senderId: req.user.userId,
      senderName,
      content: content.trim()
    }).returning();

    res.status(201).json(newMsg[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- TRIP MEMBERS & SPLIT ---
app.post('/api/trips/:id/members', requireAuth, async (req: any, res: any) => {
  try {
    const { name, email, role } = req.body;
    if (!name) return res.status(400).json({ error: 'Member name required' });
    const newMember = await db.insert(tripMembers).values({
      tripId: req.params.id,
      name,
      email: email || null,
      role: role || 'member'
    }).returning();

    if (email) {
      const userObj = await db.select().from(users).where(eq(users.id, req.user.userId));
      const senderName = userObj[0]?.name || 'A traveler';
      await db.insert(invitations).values({
        tripId: req.params.id,
        senderId: req.user.userId,
        senderName,
        receiverEmail: email.trim(),
        status: 'pending'
      });
    }

    res.status(201).json(newMember[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/trips/:id/members/:memberId', requireAuth, async (req: any, res: any) => {
  try {
    await db.delete(tripMembers).where(and(eq(tripMembers.id, req.params.memberId), eq(tripMembers.tripId, req.params.id)));
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/stops/:stopId/activities', requireAuth, async (req: any, res: any) => {
  try {
    const { activityId, dayNumber, startTime, category, costOverride, notes, paidByMemberName } = req.body;
    const newAct = await db.insert(tripActivities).values({
      stopId: req.params.stopId,
      activityId,
      dayNumber: dayNumber || 1,
      startTime,
      category: category || 'activity',
      costOverride,
      notes,
      paidByMemberName: paidByMemberName || null
    }).returning();
    res.status(201).json(newAct[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
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

app.post('/api/trips/:id/copy', requireAuth, async (req: any, res: any) => {
  try {
    const originalTrip = await db.select().from(trips).where(eq(trips.id, req.params.id));
    if (!originalTrip.length) return res.status(404).json({ error: 'Trip not found' });
    
    // Strip trailing (Copy) patterns
    const baseName = originalTrip[0].name.replace(/(\s*\(Copy(\s*\d+)?\))+$/gi, '').trim();

    const newTrip = await db.insert(trips).values({
      userId: req.user.userId,
      name: `${baseName} (Copy)`,
      description: originalTrip[0].description,
      startDate: originalTrip[0].startDate,
      endDate: originalTrip[0].endDate,
      coverPhotoUrl: originalTrip[0].coverPhotoUrl,
      isPublic: false
    }).returning();

    const originalStops = await db.select().from(tripStops).where(eq(tripStops.tripId, originalTrip[0].id));
    for (const stop of originalStops) {
      const newStop = await db.insert(tripStops).values({
        tripId: newTrip[0].id,
        cityId: stop.cityId,
        orderIndex: stop.orderIndex,
        startDate: stop.startDate,
        endDate: stop.endDate,
        budget: stop.budget
      }).returning();

      const origActs = await db.select().from(tripActivities).where(eq(tripActivities.stopId, stop.id));
      for (const act of origActs) {
        await db.insert(tripActivities).values({
          stopId: newStop[0].id,
          activityId: act.activityId,
          dayNumber: act.dayNumber,
          startTime: act.startTime,
          category: act.category,
          costOverride: act.costOverride,
          notes: act.notes
        });
      }
    }

    res.status(201).json(newTrip[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/stats', requireAuth, async (req: any, res: any) => {
  try {
    const adminCheck = await db.select().from(users).where(eq(users.id, req.user.userId));
    if (!adminCheck.length || adminCheck[0].role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const totalUsers = await db.select({ count: sql`count(*)` }).from(users);
    const totalTrips = await db.select({ count: sql`count(*)` }).from(trips);
    const totalPosts = await db.select({ count: sql`count(*)` }).from(posts);
    
    const userList = await db.select({
      id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl,
      tripCount: sql`(SELECT COUNT(*) FROM trips WHERE trips.user_id = users.id)`,
      postCount: sql`(SELECT COUNT(*) FROM posts WHERE posts.user_id = users.id)`
    }).from(users).orderBy(desc(sql`(SELECT COUNT(*) FROM trips WHERE trips.user_id = users.id)`));

    const popCities = await db.select({
      cityId: cities.id, name: cities.name, imageUrl: cities.imageUrl,
      visitCount: sql`count(${tripStops.id})`
    }).from(cities).leftJoin(tripStops, eq(tripStops.cityId, cities.id))
    .groupBy(cities.id, cities.name, cities.imageUrl).orderBy(desc(sql`count(${tripStops.id})`)).limit(10);

    const popActivities = await db.select({
      activityId: activities.id, name: activities.name, type: activities.type,
      bookingCount: sql`count(${tripActivities.id})`
    }).from(activities).leftJoin(tripActivities, eq(tripActivities.activityId, activities.id))
    .groupBy(activities.id, activities.name, activities.type).orderBy(desc(sql`count(${tripActivities.id})`)).limit(10);

    res.json({
      totals: { users: totalUsers[0].count, trips: totalTrips[0].count, posts: totalPosts[0].count },
      users: userList,
      popularCities: popCities,
      popularActivities: popActivities
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.listen(port, () => console.log(`API running on ${port}`));
