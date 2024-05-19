import axios from "axios";

// endpoint for getting access token from client
export default async function handler(req, res) {
  const accessToken = req.headers.authorization.split(" ")[1];

  try {
    // Use the accessToken to fetch data from your external API
    // const apiResponse = await axios.get("https://your-api.com/data", {
    //   headers: {
    //     Authorization: `Bearer ${accessToken}`,
    //   },
    // });
    console.log("server: spotify accessToken=", accessToken);

    res.status(200).json({ success: true });
  } catch (error) {
    // Handle the error
    console.error(error);
    res
      .status(error.response.status)
      .json({ success: false, error: error.response.data });
  }
}
