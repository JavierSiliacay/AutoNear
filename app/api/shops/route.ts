import { NextResponse } from "next/server"
import { getShops } from "@/lib/actions"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get("city") || undefined
  const service = searchParams.get("service") || undefined

  const shops = await getShops({ city, service })
  return NextResponse.json(shops)
}
