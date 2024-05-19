import { kv } from "@vercel/kv";
import axios from "axios";

export async function getSpotifyAccessToken(userId: string) {
  const accessToken: string | null = await kv.get(
    `spotify_access_token_${userId}`
  );
  const refreshToken: string | null = await kv.get(
    `spotify_refresh_token_${userId}`
  );
  if (!refreshToken) {
    console.log("No refresh token found for user:", userId);
    return null;
  }
  if (refreshToken && accessToken) {
    console.log("Access token found for user:", userId);
    return { accessToken, refreshToken };
  }
  const response = await axios.post("https://accounts.spotify.com/api/token", {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
  });
  const { access_token } = response.data;
  saveSpotifyTokens(userId, access_token, refreshToken);
  return { accessToken, refreshToken };
}

export async function saveSpotifyTokens(
  userId: string,
  accessToken: string,
  refreshToken: string
) {
  await Promise.all([
    kv.set(`spotify_access_token_${userId}`, accessToken, { ex: 60 * 60 }),
    kv.set(`spotify_refresh_token_${userId}`, refreshToken),
  ]);
  console.log("Tokens saved for user:", userId);
}
