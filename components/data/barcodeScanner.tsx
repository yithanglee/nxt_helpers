"use client"

import React, { useState } from 'react'
import { useZxing } from "react-zxing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Check } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (result: string) => void
  scanType: 'book' | 'member'
}

export default function BarcodeScanner({ onScan, scanType }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)

  const { ref } = useZxing({
    onDecodeResult(result) {
      setLastResult(result.getText())
      onScan(result.getText())
      setIsScanning(false)
    },
    paused: !isScanning,
  })

  const handleStartScan = () => {
    setIsScanning(true)
    setLastResult(null)
  }

  const handleStopScan = () => {
    setIsScanning(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{scanType === 'book' ? 'Scan Book Barcode' : 'Scan Member Card'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isScanning ? (
            <>
              <div className="relative aspect-video">
                <video ref={ref} className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-2 border-red-500 animate-pulse pointer-events-none" />
              </div>
              <Button onClick={handleStopScan} variant="destructive">Stop Scanning</Button>
            </>
          ) : (
            <Button onClick={handleStartScan}>Start Scanning {scanType === 'book' ? 'Book' : 'Member Card'}</Button>
          )}
          {lastResult && (
            <div className="flex items-center space-x-2 text-green-600">
              <Check className="h-5 w-5" />
              <span>Last scanned: {lastResult}</span>
            </div>
          )}
          {!isScanning && !lastResult && (
            <div className="flex items-center space-x-2 text-gray-500">
              <AlertCircle className="h-5 w-5" />
              <span>No barcode scanned yet</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}