import { NextResponse } from "next/server"
import { getMechanics } from "@/lib/actions"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get("city") || undefined
  const service = searchParams.get("service") || undefined

  const mechanics = await getMechanics({ city, service })
  return NextResponse.json(mechanics)
}
