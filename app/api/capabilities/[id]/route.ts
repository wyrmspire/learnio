import { NextResponse } from "next/server";
import { MockDataClient } from "@/lib/data/mock";

const mockClient = new MockDataClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await mockClient.getCapability(id);
  
  if (!data) {
    return new NextResponse("Not Found", { status: 404 });
  }
  
  return NextResponse.json(data);
}
