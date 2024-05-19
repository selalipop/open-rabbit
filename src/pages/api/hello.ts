import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getSpotifyAccessToken } from "@/backendUtil/spotify";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);
  const result = await getSpotifyAccessToken(userId!);
  if (result) {
    const { accessToken, refreshToken } = result;

    const sdk = SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID!, {
      access_token: accessToken!,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: refreshToken,
    });
    const searchResults =  await sdk.search("low fi beats", ["album", "playlist", "track"]);
    const devices = await sdk.player.getAvailableDevices()
    sdk.player.startResumePlayback(devices.devices[0].id!, searchResults.playlists.items[0].uri )
    res.status(200).json({ searchResults: searchResults });
  } else {
    res.status(200).json({ error: userId });
  }
}
