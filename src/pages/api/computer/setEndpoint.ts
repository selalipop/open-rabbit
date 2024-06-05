import { getAuth } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import { NextApiRequest, NextApiResponse } from "next";

type Data =
  | {
      success: true;
    }
  | {
      error: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const endpointUrl = req.body.endpointUrl;
  await saveUserComputerEndpoint(userId, endpointUrl);
  const id  = await getUserComputerEndpoint(userId)
  
  res.status(200).json({ success: true });
}

export async function getUserComputerEndpoint(userId: string) {
  const endpoint: string | null = await kv.get(
    `user_computer_endpoint/${userId}`
  );
  if (!endpoint) {
    console.log("No endpoint found for user:", userId);
    return null;
  }
  return endpoint;
}

export async function saveUserComputerEndpoint(
  userId: string,
  endpointUrl: string
) {
  await kv.set(`user_computer_endpoint/${userId}`, endpointUrl);
  console.log("Endpoint saved for user:", userId, endpointUrl);
}
