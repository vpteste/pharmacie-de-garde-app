import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('Health check endpoint was hit!');
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
