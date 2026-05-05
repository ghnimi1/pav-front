"use client"

import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DownloadIcon, CopyIcon, CheckIcon } from "lucide-react"
import { useState } from "react"

interface QRCodeDisplayProps {
  value: string
  title?: string
  description?: string
  size?: number
  includeLogo?: boolean
  logoElement?: React.ReactNode
}

export function QRCodeDisplay({
  value,
  title,
  description,
  size = 200,
  includeLogo = false,
  logoElement,
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code-svg")
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      canvas.width = size * 2 // Higher resolution
      canvas.height = size * 2
      if (ctx) {
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }

      const pngFile = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a")
      downloadLink.download = `qrcode-${Date.now()}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      {title && (
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <div className="relative inline-block p-4 bg-white rounded-lg border border-border">
            <QRCodeSVG
              id="qr-code-svg"
              value={value}
              size={size}
              level="M"
              includeMargin={true}
              fgColor="#000000"
              bgColor="#FFFFFF"
            />
            {includeLogo && logoElement && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white p-1 rounded-full">
                  {logoElement}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex-1"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Copié!
                </>
              ) : (
                <>
                  <CopyIcon className="h-4 w-4 mr-2" />
                  Copier le code
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadQRCode}
              className="flex-1"
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground font-mono break-all bg-muted p-2 rounded">
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}