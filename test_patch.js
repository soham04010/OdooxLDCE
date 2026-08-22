
const http = require("http");

async function test() {
  // Register a user to get a cookie
  const registerRes = await fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test User", email: "testpatch@example.com", password: "password123", phone: "123", city: "NYC", country: "USA" })
  });
  
  let cookie = registerRes.headers.get("set-cookie");
  if (!cookie) {
    // try login
    const loginRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "testpatch@example.com", password: "password123" })
    });
    cookie = loginRes.headers.get("set-cookie");
  }
  
  console.log("Cookie:", cookie);
  
  const patchRes = await fetch("http://localhost:5000/api/auth/me", {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": cookie
    },
    body: JSON.stringify({ avatarUrl: "https://example.com/avatar.jpg" })
  });
  
  console.log("Patch status:", patchRes.status);
  console.log("Patch body:", await patchRes.text());
}
test().catch(console.error);

