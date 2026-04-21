"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useLoyalty } from "@/contexts/loyalty-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircleIcon, GiftIcon, SparklesIcon, StoreIcon } from "lucide-react"
import Link from "next/link"

export default function ShareValidationPage() {
  const params = useParams()
  const code = params.code as string
  const { validateShareLink, shareLinks } = useLoyalty()
  const [status, setStatus] = useState<"loading" | "success" | "already_used" | "expired" | "not_found">("loading")
  const [shareInfo, setShareInfo] = useState<{ productName: string; platform: string } | null>(null)

  useEffect(() => {
    if (!code) {
      setStatus("not_found")
      return
    }

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
  }, [code, shareLinks, validateShareLink])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
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
    </div>
  )
}
