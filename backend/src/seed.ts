import { db } from './db';
import { cities, activities } from './db/schema';
import * as dotenv from 'dotenv';
dotenv.config();

const CITIES_DATA = [
  { name: 'Paris', country: 'France', region: 'Europe', costIndex: 85, popularity: 100, imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34' },
  { name: 'Tokyo', country: 'Japan', region: 'Asia', costIndex: 90, popularity: 98, imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26' },
  { name: 'New York', country: 'USA', region: 'North America', costIndex: 95, popularity: 99, imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9' },
  { name: 'Rome', country: 'Italy', region: 'Europe', costIndex: 80, popularity: 95, imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5' },
  { name: 'Bangkok', country: 'Thailand', region: 'Asia', costIndex: 40, popularity: 92, imageUrl: 'https://images.unsplash.com/photo-1508009603885-247a592d8471' },
];

const ACTIVITIES_DATA = [
  // Paris
  { name: 'Eiffel Tower Visit', type: 'sightseeing', cost: '35.00', durationMinutes: 120, description: 'Skip the line ticket to the top' },
  { name: 'Louvre Museum', type: 'sightseeing', cost: '20.00', durationMinutes: 180, description: 'World largest art museum' },
  { name: 'Seine River Cruise', type: 'activity', cost: '15.00', durationMinutes: 60, description: 'Beautiful evening cruise' },
  // Tokyo
  { name: 'Shibuya Crossing & Hachiko', type: 'sightseeing', cost: '0.00', durationMinutes: 60, description: 'World busiest intersection' },
  { name: 'Sushi Making Class', type: 'food', cost: '85.00', durationMinutes: 150, description: 'Learn from a master chef' },
  // New York
  { name: 'Statue of Liberty Ferry', type: 'activity', cost: '25.00', durationMinutes: 180, description: 'Ferry ride and island tour' },
  { name: 'Broadway Show', type: 'activity', cost: '150.00', durationMinutes: 150, description: 'Premium seats for a hit musical' },
  // Rome
  { name: 'Colosseum Tour', type: 'sightseeing', cost: '45.00', durationMinutes: 120, description: 'Guided tour of the ancient ruins' },
  { name: 'Pasta Cooking Class', type: 'food', cost: '70.00', durationMinutes: 180, description: 'Make authentic Italian pasta' },
  // Bangkok
  { name: 'Grand Palace Tour', type: 'sightseeing', cost: '15.00', durationMinutes: 120, description: 'Explore the stunning royal grounds' },
  { name: 'Street Food Tour', type: 'food', cost: '30.00', durationMinutes: 150, description: 'Taste the best local dishes' },
];

async function seed() {
  console.log("Seeding cities...");
  const insertedCities = await db.insert(cities).values(CITIES_DATA).returning();
  
  console.log("Seeding activities...");
  for (const activity of ACTIVITIES_DATA) {
    let cityId = insertedCities[0].id;
    if (activity.name.includes("Eiffel") || activity.name.includes("Louvre") || activity.name.includes("Seine")) {
      cityId = insertedCities.find(c => c.name === 'Paris')!.id;
    } else if (activity.name.includes("Shibuya") || activity.name.includes("Sushi")) {
      cityId = insertedCities.find(c => c.name === 'Tokyo')!.id;
    } else if (activity.name.includes("Liberty") || activity.name.includes("Broadway")) {
      cityId = insertedCities.find(c => c.name === 'New York')!.id;
    } else if (activity.name.includes("Colosseum") || activity.name.includes("Pasta")) {
      cityId = insertedCities.find(c => c.name === 'Rome')!.id;
    } else if (activity.name.includes("Grand") || activity.name.includes("Street")) {
      cityId = insertedCities.find(c => c.name === 'Bangkok')!.id;
    }

    await db.insert(activities).values({
      ...activity,
      cityId,
    });
  }
  console.log("Seeding complete!");
  process.exit(0);
}

seed();
