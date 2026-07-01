import { NextResponse } from "next/server";

import { handleAcceptanceRequest } from "../../../../lib/revista-interativa/acceptance.js";

export async function POST(request: Request) {
  const result = await handleAcceptanceRequest(request);

  return NextResponse.json(result.body, { status: result.status });
}
