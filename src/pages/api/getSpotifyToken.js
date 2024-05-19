// pages/api/getSpotifyToken.js

import axios from "axios";

export default async function handler(req, res) {
  console.log("handler()");
  console.log(req.body);
  if (req.method === "POST") {
    const { client_id, client_secret } = req.body;
    console.log("handler(): client id:", client_id, "secret=", client_secret);

    if (!client_id || !client_secret) {
      res.status(400).json({ error: "Missing client_id or client_secret" });
      return;
    }

    const authOptions = {
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: client_id,
        client_secret: client_secret,
      }).toString(),
    };
    console.log(authOptions);

    try {
      console.log("auth with spotify");
      const response = await axios(authOptions);
      res.status(200).json({ access_token: response.data?.access_token });
    } catch (error) {
      console.error("Error fetching Spotify token:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
