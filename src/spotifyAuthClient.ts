import axios from "axios";
import { Spotify_client_id, Spotify_client_secret } from "./constants";

const test_env = () => {
  console.log("env:abc=", process.env.NEXT_PUBLIC_ABC);
  console.log("env:spotify id=", Spotify_client_id);
};

export default async function getSpotifyToken() {
  try {
    const response = await axios.post("/api/getSpotifyToken", {
      client_id: Spotify_client_id,
      client_secret: Spotify_client_secret,
    });
    // console.log(response.data?.access_token);
    return response.data?.access_token;
  } catch (error) {
    console.error("Error fetching Spotify token:", error);
    return "";
  }
}
