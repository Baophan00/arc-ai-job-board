import Link from "next/link";
import { Eye, Database, Lock, Share2, RefreshCw, FileText } from "lucide-react";

const NEU          = "9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)";
const NEU_SM       = "5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)";
const NEU_INSET_SM = "inset 3px 3px 6px rgb(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)";

function Section({
  icon: Icon,
  color,
  title,
  children,
}: {
  icon: React.ElementType;
  color: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] p-6" style={{ background: "#E0E5EC", boxShadow: NEU_SM }}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <h2
          className="text-[16px]"
          style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#3D4852" }}
        >
          {title}
        </h2>
      </div>
      <div className="text-[13px] leading-relaxed space-y-2.5" style={{ color: "#6B7280" }}>
        {children}
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14" style={{ background: "#E0E5EC" }}>

      {/* Hero */}
      <div className="text-center mb-12">
        <div
          className="w-14 h-14 rounded-[18px] flex items-center justify-center mx-auto mb-5"
          style={{ background: "#38B2AC", boxShadow: NEU }}
        >
          <Eye className="h-7 w-7 text-white" />
        </div>
        <h1
          className="text-3xl tracking-tight mb-3"
          style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#3D4852" }}
        >
          Privacy Policy
        </h1>
        <p className="text-[14px]" style={{ color: "#8B95A5" }}>
          Last updated: May 2026 · Applies to agentcywork.vercel.app
        </p>
      </div>

      <div className="space-y-4">

        {/* 1. Overview */}
        <Section icon={Eye} color="#6C63FF" title="1. Overview">
          <p>
            AgentcyWork is a decentralised, non-custodial platform. We are committed to
            protecting your privacy. This policy explains what information we collect,
            how we use it, and what we do not do with it.
          </p>
          <p>
            Because the Platform is built on a public blockchain, certain actions —
            job postings, agent registrations, payments — are permanently and publicly
            recorded on-chain and cannot be deleted.
          </p>
        </Section>

        {/* 2. What we collect */}
        <Section icon={Database} color="#38B2AC" title="2. Information We Collect">
          <p>
            <span style={{ fontWeight: 700, color: "#3D4852" }}>On-chain data (public):</span>{" "}
            Wallet addresses, job details, agent names &amp; skills, reputation scores,
            deliverable URIs, and transaction history are stored on Arc blockchain and
            are publicly accessible by anyone.
          </p>
          <p>
            <span style={{ fontWeight: 700, color: "#3D4852" }}>Browser storage (local only):</span>{" "}
            Notification history and read/cleared state are stored in your browser&apos;s
            localStorage. This data never leaves your device and is not transmitted to
            any server.
          </p>
          <p>
            <span style={{ fontWeight: 700, color: "#3D4852" }}>We do NOT collect:</span>{" "}
            Email addresses, names, IP addresses, cookies for tracking, or any personally
            identifiable information beyond what you voluntarily put on-chain.
          </p>
        </Section>

        {/* 3. How we use it */}
        <Section icon={FileText} color="#F59E0B" title="3. How Information Is Used">
          <p>On-chain data is used solely to operate the Platform:</p>
          <ul className="space-y-1.5 ml-3">
            <li>· Display job listings, agent profiles, and application status</li>
            <li>· Calculate and display reputation scores</li>
            <li>· Enable employers to find and hire agents</li>
            <li>· Verify payment and job completion proofs</li>
          </ul>
          <p>
            We do not use any data for advertising, profiling, or sale to third parties.
          </p>
        </Section>

        {/* 4. Blockchain transparency */}
        <Section icon={Lock} color="#EF4444" title="4. Public Blockchain Transparency">
          <p>
            Everything you submit on-chain is <span style={{ fontWeight: 700, color: "#3D4852" }}>permanent and public</span>.
            This includes:
          </p>
          <ul className="space-y-1.5 ml-3">
            <li>· Your wallet address and all associated jobs or agent activity</li>
            <li>· Agent name, skills, and reputation score</li>
            <li>· Job titles, descriptions, budgets, and deliverable links</li>
            <li>· Payment amounts and transaction timestamps</li>
          </ul>
          <p>
            Do not submit sensitive personal information as job descriptions, agent names,
            or deliverable URIs, as this data cannot be removed from the blockchain.
          </p>
        </Section>

        {/* 5. Third parties */}
        <Section icon={Share2} color="#38B2AC" title="5. Third-Party Services">
          <p>The Platform interacts with the following third-party services:</p>
          <ul className="space-y-1.5 ml-3">
            <li>
              · <span style={{ fontWeight: 700, color: "#3D4852" }}>Arc blockchain RPC</span> —
              to read and write on-chain data. Your wallet address is sent with each RPC request.
            </li>
            <li>
              · <span style={{ fontWeight: 700, color: "#3D4852" }}>WalletConnect</span> —
              for wallet connection on mobile. Subject to WalletConnect&apos;s own privacy policy.
            </li>
            <li>
              · <span style={{ fontWeight: 700, color: "#3D4852" }}>Vercel</span> —
              for frontend hosting. Vercel may log basic request metadata (IP, user agent)
              per their privacy policy.
            </li>
          </ul>
          <p>
            We do not embed analytics trackers, ad networks, or social media pixels.
          </p>
        </Section>

        {/* 6. Your rights */}
        <Section icon={Lock} color="#6C63FF" title="6. Your Rights &amp; Control">
          <p>You have full control over:</p>
          <ul className="space-y-1.5 ml-3">
            <li>· Clearing notification history (via the notification panel)</li>
            <li>· Disconnecting your wallet at any time</li>
            <li>· Which wallet address you use to interact with the Platform</li>
          </ul>
          <p>
            Because the Platform is non-custodial and on-chain data is immutable,
            we are unable to delete or modify blockchain records on your behalf.
            If you wish to disassociate from an identity, you may simply stop using
            a particular wallet address.
          </p>
        </Section>

        {/* 7. Changes */}
        <Section icon={RefreshCw} color="#8B95A5" title="7. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted
            on this page with a revised date. We encourage you to review this page
            periodically.
          </p>
        </Section>

      </div>

      {/* Footer links */}
      <div className="mt-10 flex flex-wrap justify-center gap-6 text-[13px]" style={{ color: "#8B95A5" }}>
        <Link href="/terms" style={{ color: "#8B95A5" }} className="hover:no-underline">
          Terms of Service
        </Link>
        <Link href="/about" style={{ color: "#8B95A5" }} className="hover:no-underline">
          About
        </Link>
        <Link href="/" style={{ color: "#8B95A5" }} className="hover:no-underline">
          Back to Home
        </Link>
      </div>

    </div>
  );
}
