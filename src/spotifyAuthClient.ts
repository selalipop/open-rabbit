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
    //return response.data?.access_token;
    // send to server
    const ret = await sendToken(response.data?.access_token);
    console.log("getSpotifyToken response:");
    console.log(ret);
    if (ret) {
      console.log("success send to server");
      return "success";
    } else {
      console.error("failed to send to server");
      return "";
    }
  } catch (error) {
    console.error("Error fetching Spotify token:", error);
    return "";
  }
}

async function sendToken(accessToken: string) {
  try {
    const response = await axios.get("/api/data", {
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
