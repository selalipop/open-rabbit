import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import {
  createServerClient,
  type CookieOptions,
  serialize,
} from "@supabase/ssr";
import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { createServerSupabase } from "@/utils/supabase/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const code = req.query["code"] as string;
  const next = req.query["next"] ?? "/";
  if (code) {
    const supabase = createServerSupabase(req, res);
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    const origin = req.headers.host;
    if (error) {
      //TODO: Add authentication error handling
      res.redirect(`http://${origin}/`);
    } else {
      res.redirect(`http://${origin}${next}`);
      return;
    }
  }
}
