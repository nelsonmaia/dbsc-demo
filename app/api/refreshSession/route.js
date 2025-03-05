// app/api/refreshSession/route.js
import { supabase } from "../../../lib/supabaseClient";
import { Buffer } from "buffer";

export async function POST(request) {
  console.log("DEBUG: Request received at /api/refreshSession");

  // Extract the cookie header
  const cookieHeader = request.headers.get("cookie");
  console.log("DEBUG: Cookie header:", cookieHeader);
  if (!cookieHeader) {
    console.log("ERROR: No cookies in request.");
    return new Response(
      JSON.stringify({ error: "No cookies" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse the auth0_dbsc cookie (format: auth0_dbsc=base64(sessionId))
  const match = cookieHeader.match(/auth0_dbsc=([^;]+)/);
  if (!match) {
    console.log("ERROR: No auth0_dbsc cookie found in the request.");
    return new Response(
      JSON.stringify({ error: "No auth0_dbsc cookie found" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const cookieValue = match[1];
  console.log("DEBUG: Extracted cookie value:", cookieValue);
  const sessionId = Buffer.from(cookieValue, "base64").toString("utf8");
  console.log("DEBUG: Decoded sessionId:", sessionId);

  // Retrieve the session record from Supabase using sessionId
  console.log("DEBUG: Fetching session record from Supabase for sessionId:", sessionId);
  const { data, error } = await supabase
    .from("dbsc_sessions")
    .select("*")
    .eq("sessionId", sessionId)
    .single();
  if (error || !data) {
    console.log("ERROR: Session not found or DB error:", error);
    return new Response(
      JSON.stringify({ error: "Session not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
  console.log("DEBUG: Retrieved session record:", data);

  // Check for Sec-Session-Response header containing the JWT proof.
  const jwtProof = request.headers.get("Sec-Session-Response");
  console.log("DEBUG: JWT proof header:", jwtProof);

  if (!jwtProof) {
    // No proof provided: issue a challenge.
    const newChallenge = "challenge-" + Math.random().toString(36).substring(2, 15);
    console.log("DEBUG: No JWT proof provided. Issuing challenge:", newChallenge);
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    // The challenge header includes the new challenge and the session identifier.
    headers.set("Sec-Session-Challenge", `"${newChallenge}";id="${sessionId}"`);
    return new Response(
      JSON.stringify({ error: "Challenge required" }),
      { status: 401, headers }
    );
  }

  // For demo purposes, validate the JWT proof.
  // In production you would verify the JWT properly.
  if (jwtProof !== "dummy-proof") {
    console.log("ERROR: Invalid JWT proof provided:", jwtProof);
    return new Response(
      JSON.stringify({ error: "Invalid JWT proof" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  console.log("DEBUG: JWT proof validated.");

  // Simulate session refresh by reissuing the same cookie with updated expiration.
  const newMaxAge = 60; // 600 seconds
  // (Optionally, update any session record fields like 'refreshedAt' in Supabase.)

  // Build the Session Registration Instructions JSON (same as /startSession).
  const responseBody = {
    session_identifier: sessionId,
    refresh_url: "/api/refreshSession",
    scope: {
      origin: "dbsc-demo.vercel.app",
      include_site: true,
      defer_requests: true,
      scope_specification: [
        { type: "include", domain: "dbsc-demo.vercel.app", path: "/api/*" }
      ]
    },
    credentials: [
      {
        type: "cookie",
        name: "auth0_dbsc",
        attributes: `Domain=dbsc-demo.vercel.app; Path=/; Max-Age=${newMaxAge}; Secure; HttpOnly; SameSite=None`
      }
    ]
  };
  console.log("DEBUG: Prepared refresh response body:", JSON.stringify(responseBody));

  // Prepare response headers with a new Set-Cookie header.
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store");
  headers.append(
    "Set-Cookie",
    `auth0_dbsc=${cookieValue}; Domain=dbsc-demo.vercel.app; Path=/; Max-Age=${newMaxAge}; Secure; HttpOnly; SameSite=None`
  );
  console.log("DEBUG: Set-Cookie header for refresh prepared.");

  console.log("DEBUG: Sending refresh session response.");
  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers,
  });
}
