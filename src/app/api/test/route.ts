
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log("--- /api/test route was successfully called! ---");
  return NextResponse.json({ message: "Hello from the test API route!" });
}
