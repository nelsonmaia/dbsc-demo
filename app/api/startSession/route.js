// app/api/startSession/route.js
export async function POST(request) {
  console.log("Request received at /api/startSession");

  const crypto = require("crypto");

  let uuid = crypto.randomUUID();

  // For now, ignore JWT validation.
  // Generate a fixed base64 encoded string.
  const cookieValue = uuid.toString("base64");
  console.log("Setting cookie 'auth0' with value:", cookieValue);

  // Create session information after (simulated) verification.
  const sessionInfo = {
    sessionId: Math.floor(Math.random() * 100000),
    status: "active",
    refreshUrl: "https://your-deployed-domain.com/api/refreshSession",
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(sessionInfo), {
    status: 200,
    headers: { 
      "Content-Type": "application/json",
      // Set the 'auth0' cookie with the base64 value.
      "Set-Cookie": `auth0=${cookieValue}; Path=/; HttpOnly; Secure; SameSite=Strict`
    }
  });
}
