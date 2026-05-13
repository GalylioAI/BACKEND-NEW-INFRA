import { NextResponse } from "next/server";
import { fetchFr24Reference } from "@/lib/fr24";

export const dynamic = "force-dynamic";

export async function GET() {
  const reference = await fetchFr24Reference();

  return NextResponse.json(reference, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
