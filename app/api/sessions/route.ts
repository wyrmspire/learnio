import { NextResponse } from "next/server";
import { MockDataClient } from "@/lib/data/mock";

const mockClient = new MockDataClient();

export async function POST(request: Request) {
  try {
    const { cuId } = await request.json();
    const session = await mockClient.createSession(cuId);
    return NextResponse.json(session);
  } catch (error) {
    return new NextResponse("Invalid Request", { status: 400 });
  }
}
