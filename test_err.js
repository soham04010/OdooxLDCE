
const http = require("http");

async function test() {
  const patchRes = await fetch("http://localhost:5000/api/auth/me", {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "Origin": "http://localhost:3000"
    },
    body: JSON.stringify({ avatarUrl: "test" })
  });
  console.log("Headers:", patchRes.headers);
  console.log("Body:", await patchRes.text());
}
test().catch(console.error);

