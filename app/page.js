// app/page.js
"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");

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
    fetchInfo();
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>DBSC Demo Information</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {info && <pre>{JSON.stringify(info, null, 2)}</pre>}
      <h2>Available Endpoints</h2>
      <ul>
        <li>GET /api/startRegistration</li>
        <li>POST /api/startSession</li>
        <li>POST /api/refreshSession</li>
      </ul>
    </div>
  );
}
