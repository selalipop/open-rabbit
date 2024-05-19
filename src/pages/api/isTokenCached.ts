import axios from "axios";
import { getCachedToken } from "../utils/tokenUtils";

// endpoint for getting access token from client
export default async function handler(req, res) {
  try {
    console.log("server: finding if token is cached");
    const token = await getCachedToken();
    console.log("server: spotify accessToken=", token);
    if (token) res.status(200).json({ cached: true });
    else res.status(404).json({ cached: false });
  } catch (error) {
    // Handle the error
    console.error(error);
    res
      .status(error.response.status)
      .json({ cached: false, error: error.response.data });
  }
}
