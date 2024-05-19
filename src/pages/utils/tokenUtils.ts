import NodeCache from "node-cache";
import axios from "axios";

const tokenCache = new NodeCache({
  stdTTL: 3599, // Token lifetime in seconds (just under 1 hour to be safe)
  checkperiod: 60, // Check for expired keys every 60 seconds
});

export function getCachedToken() {
  let accessToken = tokenCache.get<string>("spotifyAccessToken");
  return accessToken ?? "";
}

export async function getSpotifyAccessToken() {
  console.log("getSpotifyAccessToken():");
  // 1. Check Cache
  let accessToken = getCachedToken();
  if (accessToken) {
    console.log(
      "getSpotifyAccessToken(): access token already in cache, sending it"
    );
    return accessToken;
  }

  // 2. If Not in Cache, Fetch
  return "";
}

export function cacheToken(accessToken: string) {
  console.log("cacheToken():");
  return tokenCache.set("spotifyAccessToken", accessToken);
}

// async function refreshSpotifyAccessToken() {
//   try {
//     // ... Logic to fetch a new access token using refresh token (if applicable)

//     const newAccessToken = response.data.access_token;

//     // Update cache with new token
//     tokenCache.set("spotifyAccessToken", newAccessToken);

//     return newAccessToken;
//   } catch (error) {
//     console.error(
//       "refreshSpotifyAccessToken(): Error fetching Spotify token:",
//       error
//     );
//     return "";
//   }
// }

// Call refreshSpotifyAccessToken when token is close to expiration (e.g., every 50 minutes)
