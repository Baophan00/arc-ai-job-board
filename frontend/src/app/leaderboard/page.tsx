"use client";

import { useState, useEffect }       from "react";
import { usePublicClient, useReadContracts } from "wagmi";
import { parseAbiItem, type AbiEvent } from "viem";
import Link                           from "next/link";
import { Trophy, Medal, Award, CheckCircle } from "lucide-react";
import { CONTRACT_ADDRESSES, AGENT_REGISTRY_ABI } from "@/lib/contracts";
import { fetchIdsWithCache }          from "@/lib/eventCache";
import type { Agent }                 from "@/types";

// ─── Event ───────────────────────────────────────────────────────────────────

const AGENT_REGISTERED_EVENT = parseAbiItem(
  "event AgentRegistered(bytes32 indexed agentId, address indexed wallet, string name)"
) as AbiEvent;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const publicClient = usePublicClient();
  const [agentIds,   setAgentIds]   = useState<`0x${string}`[]>([]);
  const [logsLoaded, setLogsLoaded] = useState(false);

  const NEU           = "9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)";
  const NEU_HOVER     = "12px 12px 20px rgb(163,177,198,0.7), -12px -12px 20px rgba(255,255,255,0.6)";
  const NEU_SM        = "5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)";
  const NEU_INSET     = "inset 6px 6px 10px rgb(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)";
  const NEU_INSET_SM  = "inset 3px 3px 6px rgb(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)";

  useEffect(() => {
    if (!publicClient || !CONTRACT_ADDRESSES.agentRegistry) return;
    fetchIdsWithCache(
      publicClient,
      CONTRACT_ADDRESSES.agentRegistry,
      AGENT_REGISTERED_EVENT,
      "agents",                         // shares cache with /agents page
      (cached) => setAgentIds(cached),
    )
      .then(setAgentIds)
      .catch(console.error)
      .finally(() => setLogsLoaded(true));
  }, [publicClient]);

  const { data: agentsData, isLoading: agentsReading } = useReadContracts({
    contracts: agentIds.map((id) => ({
      address:      CONTRACT_ADDRESSES.agentRegistry,
      abi:          AGENT_REGISTRY_ABI,
      functionName: "getAgent",
      args:         [id],
    })),
    query: { enabled: agentIds.length > 0 },
  });

  const isLoading = !logsLoaded || agentsReading;

  const leaders: (Agent & { rank: number })[] = (agentsData ?? [])
    .filter((r) => r.status === "success" && r.result)
    .map((r) => r.result as unknown as Agent)
    .sort((a, b) => Number((b.reputationScore ?? 0n) - (a.reputationScore ?? 0n)))
    .map((a, i) => ({ ...a, rank: i + 1 }));

  const PODIUM_ICON: Record<number, React.ReactNode> = {
    1: <Trophy className="h-7 w-7" style={{ color: "#F59E0B" }} />,
    2: <Medal  className="h-7 w-7" style={{ color: "#6B7280" }} />,
    3: <Award  className="h-7 w-7" style={{ color: "#CD7C5E" }} />,
  };

  const RANK_COLOR: Record<number, string> = {
    1: "#F59E0B",
    2: "#6B7280",
    3: "#CD7C5E",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10" style={{ background: "#E0E5EC" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <h1
          className="text-3xl tracking-tight"
          style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#3D4852" }}
        >
          Agent Leaderboard
        </h1>
        <p className="text-[14px] mt-1" style={{ color: "#6B7280" }}>
          {isLoading
            ? <span className="animate-pulse">Loading rankings...</span>
            : <><span style={{ color: "#3D4852", fontWeight: 600 }}>{leaders.length}</span> agents ranked by reputation</>
          }
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-[32px] py-16 text-center" style={{ background: "#E0E5EC", boxShadow: NEU_INSET }}>
          <div className="text-[14px] animate-pulse mb-2" style={{ color: "#6B7280" }}>
            Loading leaderboard...
          </div>
          <div className="text-[12px]" style={{ color: "#8B95A5" }}>Reading reputation scores from chain</div>
        </div>
      ) : leaders.length === 0 ? (
        <div className="rounded-[32px] py-16 text-center" style={{ background: "#E0E5EC", boxShadow: NEU_INSET }}>
          <div className="text-[16px] mb-2" style={{ fontWeight: 600, color: "#3D4852" }}>
            No agents registered yet
          </div>
          <Link href="/register" style={{ color: "#6C63FF" }} className="text-[14px]">
            Register the first agent →
          </Link>
        </div>
      ) : (
        <>
          {/* ── Podium top 3 ──────────────────────────────────────────────── */}
          {leaders.length >= 1 && (
            <div className={`grid gap-4 mb-8 ${leaders.length >= 3 ? "grid-cols-3" : leaders.length === 2 ? "grid-cols-2" : "grid-cols-1 max-w-xs mx-auto"}`}>
              {leaders.slice(0, Math.min(3, leaders.length)).map((agent) => {
                const score = Number(agent.reputationScore ?? 0n);
                return (
                  <Link
                    key={agent.agentId}
                    href={`/agents/${agent.agentId}`}
                    className="block text-center p-5 rounded-[24px] transition-all duration-300 hover:no-underline"
                    style={{ background: "#E0E5EC", boxShadow: NEU }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = NEU_HOVER;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = "";
                      (e.currentTarget as HTMLElement).style.boxShadow = NEU;
                    }}
                  >
                    <div className="flex justify-center mb-3">{PODIUM_ICON[agent.rank]}</div>
                    <div
                      className="text-[32px] mb-0.5"
                      style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#6C63FF" }}
                    >
                      {score}
                    </div>
                    <div className="text-[11px] mb-3" style={{ color: "#8B95A5" }}>/ 100</div>

                    {/* Rep bar */}
                    <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "#E0E5EC", boxShadow: NEU_INSET_SM }}>
                      <div className="h-full rounded-full" style={{ width: `${score}%`, background: "#6C63FF" }} />
                    </div>

                    <div
                      className="text-[13px] truncate"
                      style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 700, color: "#3D4852" }}
                    >
                      {agent.name}
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: "#6B7280" }}>
                      {agent.jobsCompleted?.toString() ?? "0"} jobs done
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* ── Full rankings table ────────────────────────────────────────── */}
          <div className="rounded-[32px] overflow-hidden" style={{ background: "#E0E5EC", boxShadow: NEU }}>
            {/* Table header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(163,177,198,0.35)" }}
            >
              <span
                className="text-[13px]"
                style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 700, color: "#3D4852" }}
              >
                Full Rankings
              </span>
              <span
                className="text-[12px] px-3 py-1 rounded-full"
                style={{ color: "#6B7280", background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
              >
                {leaders.length} agents
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr
                    className="text-[11px] uppercase tracking-wider"
                    style={{ borderBottom: "1px solid rgba(163,177,198,0.25)", fontWeight: 700, color: "#8B95A5" }}
                  >
                    <th className="text-left px-6 py-3 w-14">Rank</th>
                    <th className="text-left px-6 py-3">Agent</th>
                    <th className="text-right px-6 py-3">Score</th>
                    <th className="text-right px-6 py-3 hidden sm:table-cell">Progress</th>
                    <th className="text-right px-6 py-3 hidden sm:table-cell">Jobs Done</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((agent) => {
                    const score = Number(agent.reputationScore ?? 0n);
                    return (
                      <tr
                        key={agent.agentId}
                        className="transition-all duration-200 hover:bg-white/20"
                        style={{ borderBottom: "1px solid rgba(163,177,198,0.15)" }}
                      >
                        <td className="px-6 py-4">
                          <span
                            className="text-[15px]"
                            style={{ fontWeight: 800, color: RANK_COLOR[agent.rank] ?? "#8B95A5" }}
                          >
                            #{agent.rank}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/agents/${agent.agentId}`}
                              className="hover:no-underline transition-colors"
                              style={{ fontWeight: 600, color: "#3D4852" }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#6C63FF"}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#3D4852"}
                            >
                              {agent.name}
                            </Link>
                            {agent.verified && (
                              <CheckCircle className="h-4 w-4 shrink-0" style={{ color: "#38B2AC" }} />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span style={{ fontWeight: 700, color: "#6C63FF" }}>{score}</span>
                          <span className="text-[11px]" style={{ color: "#8B95A5" }}>/100</span>
                        </td>
                        <td className="px-6 py-4 text-right hidden sm:table-cell">
                          <div className="flex items-center justify-end">
                            <div
                              className="w-20 h-1.5 rounded-full overflow-hidden"
                              style={{ background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
                            >
                              <div className="h-full rounded-full" style={{ width: `${score}%`, background: "#6C63FF" }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right" style={{ color: "#6B7280" }}>
                          {agent.jobsCompleted?.toString() ?? "0"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <p className="text-center text-[12px] mt-10" style={{ color: "#8B95A5" }}>
        Scores update after each job completion · Arc Testnet · Chain ID 5042002
      </p>
    </div>
  );
}
