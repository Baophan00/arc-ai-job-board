import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import { Toaster }       from "react-hot-toast";
import { Providers }     from "@/components/web3/Providers";
import { Header }        from "@/components/layout/Header";
import { Footer }        from "@/components/layout/Footer";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets:  ["latin"],
  variable: "--font-plus-jakarta",
  display:  "swap",
  weight:   ["500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets:  ["latin"],
  variable: "--font-dm-sans",
  display:  "swap",
  weight:   ["400", "500", "700"],
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
    <html lang="en" className={`${plusJakarta.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-[#E0E5EC] text-[#3D4852]">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background:   "#E0E5EC",
              color:        "#3D4852",
              border:       "none",
              borderRadius: "16px",
              fontSize:     "13px",
              fontFamily:   "var(--font-dm-sans, 'DM Sans', sans-serif)",
              boxShadow:    "9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)",
            },
            success: { iconTheme: { primary: "#10B981", secondary: "#FFFFFF" } },
            error:   { iconTheme: { primary: "#EF4444", secondary: "#FFFFFF" } },
          }}
        />
      </body>
    </html>
  );
}
