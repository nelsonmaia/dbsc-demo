// app/api/startRegistration/route.js
import { randomUUID } from "crypto";
import { supabase } from "../../../lib/supabaseClient";

export async function GET(request) {
  // Generate a unique session ID and challenge value
  const sessionId = randomUUID();
  const challenge = "challenge-" + randomUUID();

  // Create a record in Supabase
  // (Replace 'dbsc_sessions' with your actual table name)
  const { error } = await supabase.from('dbsc_sessions').insert([{
    sessionId,
    challenge,
    createdAt: new Date().toISOString(),
    bound: false // not yet bound to a device key
  }]);

  if (error) {
    console.error("ERROR inserting session into Supabase:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create session" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Encode the sessionId as a base64 cookie value for the initial cookie
  const cookieValue = Buffer.from(sessionId).toString("base64");

  // Prepare an authorization code (could be part of a prior flow)
  const authCode = "auth-code-123";

  // Build the Sec-Session-Registration header
  // Tells DBSC-enabled browsers the allowed algorithms,
  // the endpoint to call next (startSession),
  // the challenge to sign, and the authorization value.
  const secHeaderValue = `(ES256 RS256); path="${encodeURIComponent("startSession")}"; challenge="${challenge}"; authorization="${authCode}"`;

  // Build response headers
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store");
  headers.set("Sec-Session-Registration", secHeaderValue);
  headers.append(
    "Set-Cookie",
    `auth0=${cookieValue}; Domain=dbsc-demo.vercel.app; Path=/; Max-Age=600; Secure; HttpOnly; SameSite=None`
  );

  // Return a minimal response; full session registration details come later.
  return new Response(
    JSON.stringify({ message: "Registration initiated" }),
    { status: 200, headers }
  );
}
