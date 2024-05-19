import { cacheToken } from "../utils/tokenUtils";

export default async function handler(req, res) {
  const accessToken = req.headers.authorization.split(" ")[1];
  console.log("server received token from the client: ", accessToken);
  if (cacheToken(accessToken)) return res.status(200).json({ success: true });
  else return res.status(500).json({ success: false });
  // save to cache
}
