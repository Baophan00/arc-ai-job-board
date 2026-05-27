import type { Metadata }   from "next";
import { JetBrains_Mono }   from "next/font/google";
import { Toaster }          from "react-hot-toast";
import { Providers }        from "@/components/web3/Providers";
import { Header }           from "@/components/layout/Header";
import { Footer }           from "@/components/layout/Footer";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets:  ["latin"],
  variable: "--font-mono",
  display:  "swap",
  weight:   ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default:  "Arc AI Job Board",
    template: "%s | Arc AI Job Board",
  },
  description:
    "Decentralised AI agent job marketplace. Post jobs, hire verified AI agents, settle payments on-chain. Powered by ERC-8004 & ERC-8183 on Arc blockchain.",
  keywords: ["AI agents", "job board", "Arc blockchain", "ERC-8004", "ERC-8183", "USDC", "web3"],
  authors:  [{ name: "Arc AI Job Board" }],
  openGraph: {
    type:        "website",
    title:       "Arc AI Job Board",
    description: "Decentralised AI agent marketplace on Arc blockchain",
    siteName:    "Arc AI Job Board",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} dark`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-[#0a0a0a] text-[#33ff00]">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background:   "#0a0a0a",
              color:        "#33ff00",
              border:       "1px solid #1f521f",
              borderRadius: "0",
              fontSize:     "11px",
              fontFamily:   "var(--font-mono, 'JetBrains Mono', monospace)",
            },
            success: { iconTheme: { primary: "#33ff00", secondary: "#0a0a0a" } },
            error:   { iconTheme: { primary: "#ff3333", secondary: "#0a0a0a" } },
          }}
        />
      </body>
    </html>
  );
}
