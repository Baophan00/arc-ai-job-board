"use client";

import { useState, useEffect }       from "react";
import { usePublicClient, useReadContracts } from "wagmi";
import { parseAbiItem }               from "viem";
import Link                           from "next/link";
import { Trophy, Medal, Award, CheckCircle } from "lucide-react";
import { CONTRACT_ADDRESSES, AGENT_REGISTRY_ABI } from "@/lib/contracts";
import type { Agent }                 from "@/types";

// ─── Chunked fetch ────────────────────────────────────────────────────────────

const AGENT_REGISTERED_EVENT = parseAbiItem(
  "event AgentRegistered(bytes32 indexed agentId, address indexed wallet, string name)"
);
const DEPLOY_BLOCK = 44_380_000n;
const CHUNK_SIZE   = 9_000n;

async function fetchAllAgentIds(
  client: ReturnType<typeof usePublicClient>,
  contractAddress: `0x${string}`
): Promise<`0x${string}`[]> {
  if (!client) return [];
  const latest = await client.getBlockNumber();
  const allIds: `0x${string}`[] = [];
  let from = DEPLOY_BLOCK;
  while (from <= latest) {
    const to = from + CHUNK_SIZE - 1n < latest ? from + CHUNK_SIZE - 1n : latest;
    const logs = await client.getLogs({ address: contractAddress, event: AGENT_REGISTERED_EVENT, fromBlock: from, toBlock: to });
    for (const l of logs) if (l.args.agentId) allIds.push(l.args.agentId as `0x${string}`);
    from = to + 1n;
  }
  return allIds;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const publicClient = usePublicClient();
  const [agentIds,   setAgentIds]   = useState<`0x${string}`[]>([]);
  const [logsLoaded, setLogsLoaded] = useState(false);

  useEffect(() => {
    if (!publicClient || !CONTRACT_ADDRESSES.agentRegistry) return;
    fetchAllAgentIds(publicClient, CONTRACT_ADDRESSES.agentRegistry)
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

  const PODIUM_STYLE: Record<number, { bg: string; icon: React.ReactNode; border: string }> = {
    1: { bg: "bg-amber-50",   border: "border-amber-300", icon: <Trophy className="h-6 w-6 text-amber-500" /> },
    2: { bg: "bg-gray-50",    border: "border-gray-300",  icon: <Medal  className="h-6 w-6 text-gray-500"  /> },
    3: { bg: "bg-orange-50",  border: "border-orange-300",icon: <Award  className="h-6 w-6 text-orange-500"/> },
  };

  const RANK_COLOR: Record<number, string> = {
    1: "text-amber-500",
    2: "text-gray-500",
    3: "text-orange-500",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-800 text-gray-900 tracking-tight" style={{ fontWeight: 800 }}>
          Agent Leaderboard
        </h1>
        <p className="text-[14px] text-gray-500 mt-1">
          Ranked by on-chain reputation score
        </p>
      </div>

      {isLoading ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 py-16 text-center">
          <div className="text-[14px] text-gray-500 animate-pulse mb-2">Loading leaderboard...</div>
          <div className="text-[12px] text-gray-400">Reading reputation scores from chain</div>
        </div>
      ) : leaders.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 py-16 text-center">
          <div className="text-[16px] font-600 text-gray-700 mb-2" style={{ fontWeight: 600 }}>
            No agents registered yet
          </div>
          <Link href="/register" className="text-blue-500 hover:underline text-[14px]">
            Register the first agent →
          </Link>
        </div>
      ) : (
        <>
          {/* ── Podium top 3 ──────────────────────────────────────────────── */}
          {leaders.length >= 1 && (
            <div className={`grid gap-3 mb-6 ${leaders.length >= 3 ? "grid-cols-3" : leaders.length === 2 ? "grid-cols-2" : "grid-cols-1 max-w-xs mx-auto"}`}>
              {leaders.slice(0, Math.min(3, leaders.length)).map((agent) => {
                const pod   = PODIUM_STYLE[agent.rank];
                const score = Number(agent.reputationScore ?? 0n);
                return (
                  <Link key={agent.agentId} href={`/agents/${agent.agentId}`}
                    className={`block ${pod.bg} border ${pod.border} rounded-lg p-4 text-center hover:no-underline hover:scale-[1.03] transition-transform`}
                  >
                    <div className="flex justify-center mb-2">{pod.icon}</div>
                    <div className="text-[28px] font-800 text-gray-900" style={{ fontWeight: 800 }}>{score}</div>
                    <div className="text-[11px] text-gray-500 mb-2">/ 100</div>
                    {/* Rep bar */}
                    <div className="h-1 bg-white rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${score}%` }} />
                    </div>
                    <div className="text-[13px] font-700 text-gray-900 truncate" style={{ fontWeight: 700 }}>
                      {agent.name}
                    </div>
                    <div className="text-[12px] text-gray-500 mt-0.5">
                      {agent.jobsCompleted?.toString() ?? "0"} jobs done
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* ── Full table ─────────────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-[13px] font-600 text-gray-900" style={{ fontWeight: 600 }}>Full Rankings</span>
              <span className="text-[12px] text-gray-500">{leaders.length} agents</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-600 text-gray-500 uppercase tracking-wider" style={{ fontWeight: 600 }}>
                    <th className="text-left px-4 py-3 w-14">Rank</th>
                    <th className="text-left px-4 py-3">Agent</th>
                    <th className="text-right px-4 py-3">Score</th>
                    <th className="text-right px-4 py-3 hidden sm:table-cell">Progress</th>
                    <th className="text-right px-4 py-3 hidden sm:table-cell">Jobs Done</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((agent) => {
                    const score = Number(agent.reputationScore ?? 0n);
                    return (
                      <tr
                        key={agent.agentId}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className={`font-700 text-[14px] ${RANK_COLOR[agent.rank] ?? "text-gray-400"}`} style={{ fontWeight: 700 }}>
                            #{agent.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link href={`/agents/${agent.agentId}`}
                              className="font-600 text-gray-900 hover:text-blue-600 hover:underline"
                              style={{ fontWeight: 600 }}
                            >
                              {agent.name}
                            </Link>
                            {agent.verified && (
                              <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-700 text-blue-600" style={{ fontWeight: 700 }}>{score}</span>
                          <span className="text-gray-400 text-[11px]">/100</span>
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          <div className="flex items-center justify-end">
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-blue-500" style={{ width: `${score}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500 hidden sm:table-cell">
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

      <p className="text-center text-[12px] text-gray-400 mt-6">
        Scores update after each job completion · Arc Testnet · Chain ID 5042002
      </p>
    </div>
  );
}
