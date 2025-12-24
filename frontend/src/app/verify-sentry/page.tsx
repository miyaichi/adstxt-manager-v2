"use client"

import * as Sentry from "@sentry/nextjs"
import { useState, useEffect } from "react"

export default function VerifySentryPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Sentry Configuration Verification</h1>
      
      <div className="p-4 border rounded bg-gray-50">
        <h2 className="font-semibold">Environment Variables</h2>
        <p>
          <strong>NEXT_PUBLIC_SENTRY_DSN:</strong>{" "}
          {process.env.NEXT_PUBLIC_SENTRY_DSN ? "Present" : "Missing"}
        </p>
        <p className="text-sm text-gray-500 break-all">
          {process.env.NEXT_PUBLIC_SENTRY_DSN}
        </p>
        <p>
          <strong>NODE_ENV:</strong> {process.env.NODE_ENV}
        </p>
      </div>

      <div className="space-x-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => {
            console.log("Sending test message to Sentry...")
            const eventId = Sentry.captureMessage("Test Message from Frontend Verification Page")
            console.log("Sent message with Event ID:", eventId)
            alert(`Sent message. ID: ${eventId}`)
          }}
        >
          Capture Message
        </button>

        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={() => {
            console.log("Throwing test error...")
            throw new Error("Sentry Frontend Verification Error")
          }}
        >
          Throw Error
        </button>
      </div>
    </div>
  )
}
