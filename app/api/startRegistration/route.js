// app/api/startRegistration/route.js
export async function GET(request) {
    // Generate a challenge and optional authorization code.
    const challenge = "DBSC-challenge-example"; // In a real app, generate a random challenge.
    const authCode = "auth-code-123";
    
    // Build the Sec-Session-Registration header value.
    // The "path" tells the browser where to send the JWT (e.g. your startSession endpoint).
    const headerValue = `(ES256 RS256); path="${encodeURIComponent("startSession")}"; challenge="${challenge}"; authorization="${authCode}"`;
    
    return new Response(
      JSON.stringify({
        message: "Registration initiated. Check response headers for DBSC details."
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Sec-Session-Registration": headerValue
        }
      }
    );
  }
  