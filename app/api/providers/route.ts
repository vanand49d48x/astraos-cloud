import { NextResponse } from "next/server";
import { getProviderManifest } from "@/lib/providers/registry";

export async function GET() {
  return NextResponse.json({ providers: getProviderManifest() });
}
