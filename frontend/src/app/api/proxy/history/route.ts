import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const domain = searchParams.get("domain")

  if (!domain) {
    return NextResponse.json({ error: "Domain is required" }, { status: 400 })
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001"
  try {
    const res = await fetch(`${backendUrl}/api/adstxt/history?domain=${domain}`, {
      cache: "no-store"
    })

    if (!res.ok) {
      const errorText = await res.text()
      return NextResponse.json({ error: errorText }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
