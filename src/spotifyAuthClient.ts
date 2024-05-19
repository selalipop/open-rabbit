import axios from "axios";
import { Spotify_client_id, Spotify_client_secret } from "./constants";

const test_env = () => {
  console.log("env:abc=", process.env.NEXT_PUBLIC_ABC);
  console.log("env:spotify id=", Spotify_client_id);
};

export async function getTokenCachedStatus() {
  console.log("getTokenCachedStatus()");
  try {
    const response = await axios.get("/api/isTokenCached");
    console.log("getTokenCachedStatus():", response);
    return response?.data?.cached;
  } catch (error) {
    console.error("Error fetching Spotify token:", error);
    return false;
  }
}

export async function getSpotifyToken() {
  try {
    const response = await axios.post("/api/getSpotifyToken", {
      client_id: Spotify_client_id,
      client_secret: Spotify_client_secret,
    });
    const access_token = response?.data?.access_token || "";
    console.log("getSpotifyToken(): access_token=", access_token);
    //return response.data?.access_token;
    // send to server
    const ret = await sendToken(access_token);
    console.log("getSpotifyToken(): response:");
    console.log(ret);
    if (ret) {
      console.log("getSpotifyToken(): success send to server");
      return true;
    } else {
      console.error("getSpotifyToken(): failed to send to server");
      return false;
    }
  } catch (error) {
    console.error("getSpotifyToken(): Error fetching Spotify token:", error);
    return false;
  }
}

async function sendToken(accessToken: string) {
  try {
    const response = await axios.get("/api/saveToken", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    // Handle the response data
    console.log("sendToken()", response.data);
    return response?.data?.success || false;
  } catch (error) {
    // Handle the error
    console.error(error);
    return false;
  }
}
