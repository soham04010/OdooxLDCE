
const { db } = require("./backend/src/db");
const { users } = require("./backend/src/db/schema");
const { eq } = require("drizzle-orm");

async function test() {
  // Register a user to get a cookie
  const registerRes = await fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test User", email: "testpatch2@example.com", password: "password123" })
  });
  
  let cookie = registerRes.headers.get("set-cookie");
  const userData = await registerRes.json();
  
  // Delete user from DB
  await db.delete(users).where(eq(users.id, userData.user.id));
  
  const patchRes = await fetch("http://localhost:5000/api/auth/me", {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "Origin": "http://localhost:3000",
      "Cookie": cookie
    },
    body: JSON.stringify({ avatarUrl: "https://example.com/avatar.jpg" })
  });
  
  console.log("Status:", patchRes.status);
  console.log("Headers:", patchRes.headers);
  console.log("Body:", await patchRes.text());
}
test().catch(console.error);

