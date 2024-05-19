import { CookieOptions, createServerClient, serialize } from "@supabase/ssr";
import { NextApiRequest, NextApiResponse } from "next";
import { IncomingMessage, ServerResponse } from "http";
import { NextApiRequestCookies } from "next/dist/server/api-utils";
import { deleteCookie, getCookie, setCookie } from "cookies-next";

export function createServerSupabase(
  req: IncomingMessage & {
    cookies: NextApiRequestCookies;
  },
  res: ServerResponse,
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return getCookie(name, { res, req });
        },
        set(name: string, value: string, options: CookieOptions) {
          setCookie(name, value, { ...options, res, req });
        },
        remove(name: string, options: CookieOptions) {
          deleteCookie(name, { ...options, res, req });
        },
      },
    },
  );
}
