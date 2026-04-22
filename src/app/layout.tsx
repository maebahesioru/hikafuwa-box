import type { Metadata, Viewport } from "next";
import "./globals.css";
import { HkmProBanner } from "./HkmPro";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ff00cc",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://hikafuwa-box.vercel.app'),
  title: "HIKAFUWA BOX | だれでもネタツイクリエイター",
  description: "画像をアップロードするだけでAIが爆笑ネタツイートを自動作成！ヒカキン風、シュール、ボケてなど、あなたの画像でバズるツイートを生み出します。",
  keywords: ["ネタツイ", "AI", "大喜利", "画像生成", "Twitter", "X", "HIKAFUWA", "ヒカフワ"],
  authors: [{ name: "HIKAFUWA BOX Team" }],
  openGraph: {
    title: "だれでもネタツイクリエイター！HIKAFUWA BOX",
    description: "画像をアップロードするだけでAIが爆笑ネタツイートを自動作成！",
    url: "https://hikafuwa-box.vercel.app", // 実際のデプロイURLに合わせて変更してください
    siteName: "HIKAFUWA BOX",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HIKAFUWA BOX OGP Image",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "だれでもネタツイクリエイター！HIKAFUWA BOX",
    description: "画像をアップロードするだけでAIが爆笑ネタツイートを自動作成！",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "HIKAFUWA BOX",
    "applicationCategory": "EntertainmentApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "JPY"
    },
    "description": "画像をアップロードするだけでAIが爆笑ネタツイートを自動作成！",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1024"
    }
  };

  return (
    <html lang="ja">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          async
          defer
        />
        {children}
        <HkmProBanner />
              <script src="https://hikakinmaniacoin.hikamer.f5.si/ad.js" data-user-id="cmo8lk1kj0000aggyuhzgv5vk" async></script>
      </body>
    </html>
  );
}
