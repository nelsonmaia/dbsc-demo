// app/api/startSession/route.js
import { getRedisClient } from "../../../lib/redisClient";
import { Buffer } from "buffer";

export async function POST(request) {
  console.log("DEBUG: Request received at /api/startSession");

  // For demo, we ignore JWT validation.
  // Extract the session id from the cookie:
  const cookieHeader = request.headers.get("cookie");
  console.log("DEBUG: Cookie header:", cookieHeader);
  if (!cookieHeader) {
    console.log("ERROR: No cookies in request.");
    return new Response(
      JSON.stringify({ error: "No cookies" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse the auth0 cookie (assumes format: auth0=base64(sessionId))
  const match = cookieHeader.match(/auth0=([^;]+)/);
  if (!match) {
    console.log("ERROR: No auth0 cookie found in cookie header.");
    return new Response(
      JSON.stringify({ error: "No auth0 cookie found" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const cookieValue = match[1];
  console.log("DEBUG: Extracted cookie value:", cookieValue);
  const sessionId = Buffer.from(cookieValue, "base64").toString("utf8");
  console.log("DEBUG: Decoded sessionId from cookie:", sessionId);

  // Get the session record from Redis
  console.log("DEBUG: Connecting to Redis and fetching session record for sessionId:", sessionId);
  const client = await getRedisClient();
  const sessionData = await client.get(`session:${sessionId}`);
  console.log("DEBUG: Retrieved session data from Redis:", sessionData);
  if (!sessionData) {
    console.log("ERROR: Session not found in Redis for sessionId:", sessionId);
    return new Response(
      JSON.stringify({ error: "Session not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
  const sessionRecord = JSON.parse(sessionData);
  console.log("DEBUG: Parsed session record:", sessionRecord);

  // Simulate binding the session by marking it as bound
  console.log("DEBUG: Marking session as bound.");
  sessionRecord.bound = true;
  await client.set(`session:${sessionId}`, JSON.stringify(sessionRecord), {
    EX: 600,
  });
  console.log("DEBUG: Updated session record stored in Redis.");

  // Build the Session Registration Instructions JSON.
  const responseBody = {
    session_identifier: sessionId,
    refresh_url: "/api/refreshSession",
    scope: {
      origin: "example.com",
      include_site: true,
      defer_requests: true,
      scope_specification: [
        { type: "include", domain: "trusted.example.com", path: "/only_trusted_path" },
        { type: "exclude", domain: "untrusted.example.com", path: "/" },
        { type: "exclude", domain: "*.example.com", path: "/static" }
      ]
    },
    credentials: [
      {
        type: "cookie",
        name: "auth0",
        attributes: "Domain=example.com; Path=/; Secure; SameSite=None"
      }
    ]
  };
  console.log("DEBUG: Prepared response body:", JSON.stringify(responseBody));

  // Return the response along with a Set-Cookie header (could be the same or updated cookie)
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store");
  headers.append(
    "Set-Cookie",
    `auth0=${cookieValue}; Domain=example.com; Path=/; Max-Age=600; Secure; HttpOnly; SameSite=None`
  );
  console.log("DEBUG: Set-Cookie header prepared in response.");

  console.log("DEBUG: Sending response with session registration instructions.");
  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers,
  });
}
