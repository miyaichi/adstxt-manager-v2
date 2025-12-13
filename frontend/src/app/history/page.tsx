"use client"

export const dynamic = "force-dynamic"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, CheckCircle2, Clock, FileText } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import useSWR from "swr"

type HistoryRecord = {
  id: string
  scanned_at: string
  records_count: number
  valid_count: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function HistoryContent() {
  const searchParams = useSearchParams()
  const domain = searchParams.get("domain")
  const router = useRouter()

  const { data, error, isLoading } = useSWR<HistoryRecord[]>(
    domain ? `/api/proxy/history?domain=${domain}` : null,
    fetcher
  )

  if (!domain) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center space-y-4">
          <h1 className="text-2xl font-bold">Domain not specified</h1>
          <Button onClick={() => router.push("/validator")}>Go into Validator</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scan History</h1>
          <p className="text-muted-foreground">Ads.txt scan history for {domain}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Past Scans</CardTitle>
          <CardDescription>List of all saved validation scans for this domain.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">Loading...</div>
          ) : error ? (
            <div className="text-red-500">Failed to load history</div>
          ) : !data || data.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center">No history found for this domain.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Scanned At</TableHead>
                  <TableHead>Records Found</TableHead>
                  <TableHead>Valid Records</TableHead>
                  <TableHead className="w-[100px]">Scan ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        {new Date(record.scanned_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                        {record.records_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-green-600">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {record.valid_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">{record.id.substring(0, 8)}...</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-10">Loading history...</div>}>
      <HistoryContent />
    </Suspense>
  )
}
