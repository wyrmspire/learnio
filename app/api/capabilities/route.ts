import { NextResponse } from "next/server";
import { MockDataClient } from "@/lib/data/mock";

const mockClient = new MockDataClient();

export async function GET() {
  const data = await mockClient.listCapabilities();
  return NextResponse.json(data);
}
