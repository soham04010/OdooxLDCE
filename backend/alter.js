
const postgres = require("postgres");
require("dotenv").config();
const sql = postgres(process.env.DATABASE_URL);
sql`ALTER TABLE posts RENAME COLUMN image_url TO image_urls`
  .then(() => sql`ALTER TABLE posts ALTER COLUMN image_urls TYPE text[] USING ARRAY[image_urls]`)
  .then(() => { console.log("done"); process.exit(0); })
  .catch(console.error);

