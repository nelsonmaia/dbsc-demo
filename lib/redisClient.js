// lib/redisClient.js
import { createClient } from "redis";

let redisClient;

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL, // Set your Redis URL in an environment variable.
    });
    redisClient.on("error", (err) =>
      console.error("Redis Client Error", err)
    );
    await redisClient.connect();
  }
  return redisClient;
}
