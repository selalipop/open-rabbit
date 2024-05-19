import axios from "axios";
import querystring from "querystring";
import cookie from "cookie";
import { kv } from "@vercel/kv";
import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { saveSpotifyTokens } from "@/backendUtil/spotify";

const stateKey = "spotify_auth_state";

export default async function handler(req, res) {
  const { userId } = getAuth(req);
  if (!userId) {
    res.redirect("/");
    return;
  }
  const { code, state } = req.query;


  res.setHeader(
    "Set-Cookie",
    cookie.serialize(stateKey, "", {
      maxAge: -1,
      path: "/",
    })
  );

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.SPOTIFY_CLIENT_ID +
                ":" +
                process.env.SPOTIFY_CLIENT_SECRET
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    const { access_token, refresh_token } = response.data;
    await saveSpotifyTokens(userId, access_token, refresh_token);
    res.redirect("/");
  } catch (error) {
    res.redirect("/?" + querystring.stringify({ error: "invalid_token" }));
  }
}
