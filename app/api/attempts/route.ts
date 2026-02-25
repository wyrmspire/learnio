import { NextResponse } from "next/server";
import { MockDataClient } from "@/lib/data/mock";
import { AttemptSchema } from "@/lib/contracts/schemas";

const mockClient = new MockDataClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const attempt = AttemptSchema.parse(body);
    
    await mockClient.submitAttempt(attempt);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return new NextResponse("Invalid Request", { status: 400 });
  }
}
