import { NextResponse } from "next/server";
import { getTotalUnreadCount } from "@/app/actions/messaging";

export async function GET() {
  const count = await getTotalUnreadCount();
  return NextResponse.json({ count });
}
