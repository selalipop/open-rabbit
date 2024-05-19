import axios from "axios";
import { getCachedToken } from "../utils/tokenUtils";

// endpoint for getting access token from client
export default async function handler(req, res) {
  try {
    console.log("server: getting cached access token");
    const token = await getCachedToken();
    console.log("server: spotify accessToken=", token);

    res.status(200).json({ access_token: token });
  } catch (error) {
    // Handle the error
    console.error(error);
    res
      .status(error.response.status)
      .json({ success: false, error: error.response.data });
  }
}
