// app/api/printCookie/route.js
export async function GET(request) {
    // Get the cookie header from the request.
    const cookieHeader = request.headers.get("cookie") || "";
    console.log("Cookies received at /api/printCookie:", cookieHeader);
  
    // Return the cookie header in the response so you can also see it in the browser.
    return new Response(JSON.stringify({ cookies: cookieHeader }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  