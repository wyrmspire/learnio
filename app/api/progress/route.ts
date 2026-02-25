import { NextResponse } from "next/server";
import { MockDataClient } from "@/lib/data/mock";

const mockClient = new MockDataClient();

export async function GET() {
  const data = await mockClient.listProgressEvents();
  return NextResponse.json(data);
}
