import querystring from "querystring";
import cookie from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";

const stateKey = "spotify_auth_state";
export const generateRandomString = (length: number) => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const state = generateRandomString(16);
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(stateKey, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      maxAge: 60 * 60,
      sameSite: "strict",
      path: "/",
    })
  );

  const scope = "user-read-private user-read-email app-remote-control streaming user-read-playback-state user-modify-playback-state user-read-currently-playing";
  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      state: state,
    });

  res.redirect(authUrl);
}
