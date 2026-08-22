
const http = require("http");

async function test() {
  const registerRes = await fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test User", email: "testpatchreal@example.com", password: "password123" })
  });
  
  let cookie = registerRes.headers.get("set-cookie");
  
  const patchRes = await fetch("http://localhost:5000/api/auth/me", {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": cookie
    },
    body: JSON.stringify({ avatarUrl: "https://res.cloudinary.com/dbwymmt1i/image/upload/v1787382342/vngeiw7ppktwhnlp9ctz.png" })
  });
  
  console.log("Patch status:", patchRes.status);
  console.log("Patch body:", await patchRes.text());
}
test().catch(console.error);

