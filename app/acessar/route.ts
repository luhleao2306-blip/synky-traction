import { getSynkyUser } from "../synky-auth";

export const dynamic = "force-dynamic";

// A full document redirect avoids client routing and cached authentication redirects.
export async function GET(request: Request) {
  const user = await getSynkyUser(request);
  return new Response(null, {
    status: 303,
    headers: {
      location: user ? "/painel" : "/login",
      "cache-control": "private, no-store, max-age=0",
      vary: "Cookie",
    },
  });
}
