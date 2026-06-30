import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { message: "Transactions API is not implemented yet." },
    { status: 501 },
  );
}
