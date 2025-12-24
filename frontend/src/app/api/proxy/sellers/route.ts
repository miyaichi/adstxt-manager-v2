import { proxyRequest } from "@/lib/proxy-utils"

export const maxDuration = 60 // 1 minute

export async function GET(request: Request) {
  return proxyRequest(request, "/api/sellers", { timeoutMs: 60000 })
}
