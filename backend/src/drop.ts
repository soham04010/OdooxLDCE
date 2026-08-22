import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  await sql`DROP SCHEMA public CASCADE;`;
  await sql`CREATE SCHEMA public;`;
  await sql`GRANT ALL ON SCHEMA public TO postgres;`;
  await sql`GRANT ALL ON SCHEMA public TO public;`;
  console.log("Dropped schema");
  process.exit(0);
}
run();
