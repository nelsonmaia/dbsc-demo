// app/page.js
"use client";

import { useEffect, useState } from "react";
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from "next/navigation";




export default function Home() {
  
  const { user, error: authError, isLoading } = useUser();
  const router = useRouter();


  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");

   // Redirect if not logged in
   useEffect(() => {
    if (!isLoading && !user) {
      router.push("/api/auth/login"); // Auth0's login endpoint
    }
  }, [isLoading, user, router]);

  // Fetch info from the startRegistration endpoint for demo purposes.
  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await fetch("/api/startRegistration");
        if (!res.ok) throw new Error("Failed to fetch registration info");
        const data = await res.json();
        setInfo(data);
      } catch (err) {
        setError(err.message);
      }
    }
    if (user) {
      fetchInfo();
    }
  }, [user]);

  if (isLoading) return <div>Loading...</div>;
  if (authError) return <div>{authError.message}</div>;

  if (!user) return <div>Please sign in.</div>;

  return (
    <div className="container">
      <h1>Hello {user?.name} - DBSC Demo</h1>
  
      {error && <p className="error">{error}</p>}
  
      {info && (
        <>
          <h2>Session Registration Instructions</h2>
          <pre>{JSON.stringify(info, null, 2)}</pre>
        </>
      )}
  
      <h2>Available Endpoints</h2>
      <ul>
        <li><code>GET</code> /api/startRegistration</li>
        <li><code>POST</code> /api/startSession</li>
        <li><code>POST</code> /api/refreshSession - Working in Progress</li>
      </ul>
  
      <a href="/api/auth/logout">Logout</a>
    </div>
  );
  
}
