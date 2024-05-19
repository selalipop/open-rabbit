import axios from "axios";
import { getSpotifyAccessToken } from "../utils/tokenUtils";

// endpoint for getting access token from client
export default async function handler(req, res) {
  try {
    // Use the accessToken to fetch data from your external API
    // const apiResponse = await axios.get("https://your-api.com/data", {
    //   headers: {
    //     Authorization: `Bearer ${accessToken}`,
    //   },
    // });
    console.log("server: getting access token");
    const token = await getSpotifyAccessToken();
    console.log("server: spotify accessToken=", token);

    res.status(200).json({});
  } catch (error) {
    // Handle the error
    console.error(error);
    res
      .status(error.response.status)
      .json({ success: false, error: error.response.data });
  }
}
