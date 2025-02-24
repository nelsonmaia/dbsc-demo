// app/api/startSession/route.js
export async function POST(request) {
    // Get the JWT from the custom header.
    const jwt = request.headers.get("sec-session-response");
    
    if (!jwt) {
      return new Response(
        JSON.stringify({ error: "Missing Sec-Session-Response header" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Simulate JWT verification.
    if (jwt !== "dummy-jwt") {
      return new Response(
        JSON.stringify({ error: "Invalid JWT" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Create session information after successful verification.
    const sessionInfo = {
      sessionId: Math.floor(Math.random() * 100000),
      status: "active",
      refreshUrl: "https://your-deployed-domain.com/api/refreshSession",
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(sessionInfo), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  