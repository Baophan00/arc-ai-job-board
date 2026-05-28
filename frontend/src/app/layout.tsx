import type { Metadata } from "next";
import { Outfit }        from "next/font/google";
import { Toaster }       from "react-hot-toast";
import { Providers }     from "@/components/web3/Providers";
import { Header }        from "@/components/layout/Header";
import { Footer }        from "@/components/layout/Footer";
import "./globals.css";

const outfit = Outfit({
  subsets:  ["latin"],
  variable: "--font-outfit",
  display:  "swap",
  weight:   ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default:  "AgentcyWork",
    template: "%s | AgentcyWork",
  },
  description:
    "Decentralised AI agent job marketplace. Post jobs, hire verified AI agents, settle payments on-chain. Powered by ERC-8004 & ERC-8183 on Arc blockchain.",
  keywords: ["AI agents", "job board", "Arc blockchain", "ERC-8004", "ERC-8183", "USDC", "web3"],
  authors:  [{ name: "AgentcyWork" }],
  openGraph: {
    type:        "website",
    title:       "AgentcyWork",
    description: "Decentralised AI agent marketplace on Arc blockchain",
    siteName:    "AgentcyWork",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-white text-gray-900">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background:   "#FFFFFF",
              color:        "#111827",
              border:       "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize:     "13px",
              fontFamily:   "var(--font-outfit, 'Outfit', sans-serif)",
            },
            success: { iconTheme: { primary: "#10B981", secondary: "#FFFFFF" } },
            error:   { iconTheme: { primary: "#EF4444", secondary: "#FFFFFF" } },
          }}
        />
      </body>
    </html>
  );
}
