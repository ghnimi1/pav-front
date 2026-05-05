"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLoyalty, LoyaltyProvider } from "@/contexts/loyalty-context"
import { NavigationProvider } from "@/contexts/navigation-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CheckCircleIcon, GiftIcon, SparklesIcon, StoreIcon, QrCodeIcon, Share2Icon, CopyIcon, CheckIcon } from "lucide-react"
import { QRCodeDisplay } from "@/components/qr-code-display"
import Link from "next/link"

function ShareValidationContent() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const { validateShareLink, shareLinks: contextShareLinks } = useLoyalty()
  const [status, setStatus] = useState<"loading" | "success" | "already_used" | "expired" | "not_found">("loading")
  const [shareInfo, setShareInfo] = useState<{ productName: string; platform: string } | null>(null)
  const [shareLinks, setShareLinks] = useState(contextShareLinks)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  // Load shareLinks from localStorage as a fallback
  useEffect(() => {
    // If context has shareLinks, use them
    if (contextShareLinks.length > 0) {
      setShareLinks(contextShareLinks)
      return
    }

    // Otherwise, try to load from localStorage
    const storedShareLinks = localStorage.getItem("loyalty_share_links")
    if (storedShareLinks) {
      try {
        const parsed = JSON.parse(storedShareLinks)
        setShareLinks(parsed)
      } catch (err) {
        console.error("Failed to parse stored share links:", err)
      }
    }
  }, [contextShareLinks])

  useEffect(() => {
    if (!code) {
      setStatus("not_found")
      return
    }

    // Wait a bit for data to load
    const timer = setTimeout(() => {
      // Trouver le lien
      const link = shareLinks.find(l => l.code === code)
      
      if (!link) {
        setStatus("not_found")
        return
      }

      if (link.isClicked) {
        setStatus("already_used")
        setShareInfo({ productName: link.productName, platform: link.platform })
        return
      }

      if (new Date(link.expiresAt) < new Date()) {
        setStatus("expired")
        setShareInfo({ productName: link.productName, platform: link.platform })
        return
      }

      // Valider le lien
      const success = validateShareLink(code)
      if (success) {
        setStatus("success")
        setShareInfo({ productName: link.productName, platform: link.platform })
      } else {
        setStatus("not_found")
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [code, shareLinks, validateShareLink])

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/share/${code}` : ""

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOnPlatform = (platform: string) => {
    const text = `Decouvrez cette offre speciale chez Le Pave d'Art!`
    let shareLink = ""
    
    switch (platform) {
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`
        break
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
        break
      case "whatsapp":
        shareLink = `https://wa.me/?text=${encodeURIComponent(text + " " + shareUrl)}`
        break
    }
    
    if (shareLink) {
      window.open(shareLink, "_blank")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        {/* QR Code Button - positioned absolutely */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={() => setShowQRDialog(true)}
        >
          <QrCodeIcon className="h-5 w-5" />
        </Button>

        {status === "loading" && (
          <CardContent className="py-12 text-center">
            <div className="h-12 w-12 mx-auto mb-4 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin"></div>
            <p className="text-muted-foreground">Verification en cours...</p>
          </CardContent>
        )}

        {status === "success" && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircleIcon className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-700">Merci pour votre visite!</CardTitle>
              <CardDescription className="text-base">
                Vous venez de valider le partage de votre ami
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {shareInfo && (
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Produit partage:</p>
                  <p className="font-semibold text-orange-700">{shareInfo.productName}</p>
                </div>
              )}
              
              <div className="p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <GiftIcon className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="font-semibold text-orange-800">Offre speciale pour vous!</p>
                    <p className="text-sm text-orange-700">
                      Inscrivez-vous et beneficiez de 50 points de bienvenue
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
                  <Link href="/client/register">
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Rejoindre le programme fidelite
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">
                    <StoreIcon className="h-4 w-4 mr-2" />
                    Visiter notre boutique
                  </Link>
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {status === "already_used" && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircleIcon className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-blue-700">Lien deja utilise</CardTitle>
              <CardDescription>
                Ce lien de partage a deja ete valide par quelqu&apos;un d&apos;autre.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <GiftIcon className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="font-semibold text-orange-800">Decouvrez nos offres!</p>
                    <p className="text-sm text-orange-700">
                      Rejoignez notre programme de fidelite
                    </p>
                  </div>
                </div>
              </div>
              <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
                <Link href="/client/register">
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  S&apos;inscrire maintenant
                </Link>
              </Button>
            </CardContent>
          </>
        )}

        {status === "expired" && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <GiftIcon className="h-10 w-10 text-amber-600" />
              </div>
              <CardTitle className="text-xl text-amber-700">Lien expire</CardTitle>
              <CardDescription>
                Ce lien de partage a expire. Les liens sont valides uniquement pour la journee.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
                <Link href="/client/register">
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Rejoindre le programme
                </Link>
              </Button>
            </CardContent>
          </>
        )}

        {status === "not_found" && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <StoreIcon className="h-10 w-10 text-gray-400" />
              </div>
              <CardTitle className="text-xl">Lien non trouve</CardTitle>
              <CardDescription>
                Ce lien de partage n&apos;existe pas ou n&apos;est plus valide.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
                <Link href="/">
                  <StoreIcon className="h-4 w-4 mr-2" />
                  Visiter notre boutique
                </Link>
              </Button>
            </CardContent>
          </>
        )}
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCodeIcon className="h-5 w-5" />
              Partager cette offre
            </DialogTitle>
            <DialogDescription>
              Scannez ce code ou partagez le lien avec vos amis
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <QRCodeDisplay
              value={shareUrl}
              size={200}
            />
            
            {/* Share buttons */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-center">Partager sur:</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => shareOnPlatform("facebook")}
                  className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
                  size="sm"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </Button>
                <Button
                  onClick={() => shareOnPlatform("twitter")}
                  className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white"
                  size="sm"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </Button>
                <Button
                  onClick={() => shareOnPlatform("whatsapp")}
                  className="bg-[#25D366] hover:bg-[#25D366]/90 text-white"
                  size="sm"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ShareValidationPage() {
  return (
    <NavigationProvider initialNavItem="client-fidelite">
      <LoyaltyProvider>
        <ShareValidationContent />
      </LoyaltyProvider>
    </NavigationProvider>
  )
}
