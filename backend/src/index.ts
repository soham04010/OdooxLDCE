import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123'; // Temporary

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// --- AUTH ENDPOINTS ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
       res.status(400).json({ error: 'All fields are required' });
       return;
    }

    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    if (existingUsers.length > 0) {
       res.status(400).json({ error: 'User already exists, try logging in' });
       return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.insert(users).values({
      name,
      email,
      passwordHash: hashedPassword
    }).returning();

    const token = jwt.sign({ userId: newUser[0].id }, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({ user: { id: newUser[0].id, name: newUser[0].name, email: newUser[0].email }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
       res.status(400).json({ error: 'Email and password are required' });
       return;
    }

    const foundUsers = await db.select().from(users).where(eq(users.email, email));
    if (foundUsers.length === 0) {
       res.status(400).json({ error: 'User does not exist, please sign up' });
       return;
    }

    const user = foundUsers[0];
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) {
       res.status(400).json({ error: 'Invalid password' });
       return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });

    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
