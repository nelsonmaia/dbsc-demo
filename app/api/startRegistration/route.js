// app/api/startRegistration/route.js
import { randomUUID } from "crypto";
import { getRedisClient } from "../../../lib/redisClient";

export async function GET(request) {
  // Generate a unique session ID and challenge value
  const sessionId = randomUUID();
  const challenge = "challenge-" + randomUUID();

  // Get the Redis client
  const client = await getRedisClient();

  // Store the session record in Redis (with a TTL of 600 seconds for demo)
  const sessionRecord = JSON.stringify({
    sessionId,
    challenge,
    createdAt: Date.now(),
    bound: false, // not yet bound to a device key
  });
  await client.set(`session:${sessionId}`, sessionRecord, { EX: 600 });

  // For this demo, we encode the sessionId as a base64 cookie value.
  const cookieValue = Buffer.from(sessionId).toString("base64");

  // Prepare an authorization code (could be part of a prior flow)
  const authCode = "auth-code-123";

  // Build the Sec-Session-Registration header.
  // This tells DBSC-enabled browsers the allowed algorithms,
  // the endpoint to call next (startSession),
  // the challenge to sign, and the authorization value.
  const secHeaderValue = `(ES256 RS256); path="${encodeURIComponent(
    "startSession"
  )}"; challenge="${challenge}"; authorization="${authCode}"`;

  // Build response headers.
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store");
  headers.set("Sec-Session-Registration", secHeaderValue);
  headers.append(
    "Set-Cookie",
    `auth0=${cookieValue}; Domain=example.com; Path=/; Max-Age=600; Secure; HttpOnly; SameSite=None`
  );

  // Return a minimal response; full session registration details come later.
  return new Response(
    JSON.stringify({ message: "Registration initiated" }),
    { status: 200, headers }
  );
}
