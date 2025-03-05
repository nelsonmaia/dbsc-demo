// app/api/startSession/route.js
import { supabase } from "../../../lib/supabaseClient";
import { Buffer } from "buffer";

export async function POST(request) {
  console.log("DEBUG: Request received at /api/startSession");

  // For demo, ignoring JWT validation.
  // Extract the session id from the cookie:
  const cookieHeader = request.headers.get("cookie");
  console.log("DEBUG: Cookie header:", cookieHeader);

  const jwtproof = request.headers.get("Sec-Session-Response");
  console.log("DEBUG: JWT proof of possession header:", jwtproof);

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

  // Retrieve the session from Supabase
  console.log("DEBUG: Fetching session record from Supabase for sessionId:", sessionId);
  const { data, error } = await supabase
    .from('dbsc_sessions')
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

  console.log("DEBUG: Retrieved session record from Supabase:", data);

  // Mark the session as bound
  // Instead of updating by sessionId, we use the row's primary key (id)
  console.log("DEBUG: Marking session as bound by row ID:", data.id);
  const { error: updateError } = await supabase
    .from('dbsc_sessions')
    .update({ bound: true })
    .eq("id", data.id);

  if (updateError) {
    console.log("ERROR: Failed to update session record:", updateError);
    return new Response(
      JSON.stringify({ error: "Failed to update session" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  console.log("DEBUG: Session record marked as bound.");

  // Build the Session Registration Instructions JSON
  const responseBody = {
    session_identifier: sessionId,
    refresh_url: "/api/refreshSession",
    scope: {
      origin: "vercel.app",
      include_site: true,
      defer_requests: true,
      scope_specification: [
        { type: "exclude", domain: "dbsc-demo.vercel.app", path: "/" }
      ]
    },
    credentials: [
      {
        type: "cookie",
        name: "auth0_dbsc",
        attributes: "Domain=dbsc-demo.vercel.app; Path=/; Max-Age=30; Secure; HttpOnly; SameSite=None"
      }
    ]
  };

  console.log("DEBUG: Prepared response body:", JSON.stringify(responseBody));

  // Return the response along with a Set-Cookie header (could be the same or updated cookie)
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store");
  headers.set(
    "Set-Cookie",
    `auth0_dbsc=${cookieValue}; Domain=dbsc-demo.vercel.app; Path=/; Max-Age=30; Secure; HttpOnly; SameSite=None`
  );

  console.log("DEBUG: Set-Cookie header prepared in response.");
  console.log("DEBUG: Sending response with session registration instructions.");

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers,
  });
}
