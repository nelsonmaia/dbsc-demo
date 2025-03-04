// app/api/protect/route.js
import { supabase } from "../../../lib/supabaseClient";
import { Buffer } from "buffer";

export async function GET(request) {
  console.log("DEBUG: Request received at /api/protect");

  // Require a proof of possession header.
  const proof = request.headers.get("Sec-Session-Response");
  console.log("DEBUG all headers:", request.headers);
  console.log("DEBUG: Proof of possession header:", proof);
  if (!proof) {
    console.log("ERROR: Missing proof of possession header.");
    return new Response(
      JSON.stringify({ error: "Missing proof of possession header" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Extract the auth0 cookie from the request
  const cookieHeader = request.headers.get("cookie");
  console.log("DEBUG: Cookie header:", cookieHeader);
  if (!cookieHeader) {
    console.log("ERROR: No cookies found in request.");
    return new Response(
      JSON.stringify({ error: "No cookies found" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse the auth0 cookie (expects format: auth0=base64(sessionId))
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

  // Retrieve the session record from Supabase
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

  // Check if the session is bound
  if (!data.bound) {
    console.log("DEBUG: Session is not bound.");
    return new Response(
      JSON.stringify({ error: "Session is not bound", session: data }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // If bound, consider the proof valid.
  const responseBody = {
    message: "Session is protected, valid, and bound.",
    session: data
  };
  
  console.log("DEBUG: Sending response with protected session data:", responseBody);
  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
