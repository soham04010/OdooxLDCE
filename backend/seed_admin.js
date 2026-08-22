const postgres = require("postgres");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const sql = postgres(process.env.DATABASE_URL);
async function seed() {
  const email = 'admin@gmail.com';
  const pass = '12345678';
  const hash = await bcrypt.hash(pass, 10);
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length === 0) {
    await sql`INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', ${email}, ${hash}, 'admin')`;
    console.log("Admin user created.");
  } else {
    await sql`UPDATE users SET role = 'admin', password_hash = ${hash} WHERE email = ${email}`;
    console.log("Admin user updated.");
  }
  process.exit(0);
}
seed().catch(console.error);
