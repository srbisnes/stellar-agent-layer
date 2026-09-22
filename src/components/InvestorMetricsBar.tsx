export function InvestorMetricsBar() {
  return (
    <div className="bg-black border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[11px]">
        <span className="text-zinc-500">Settlement <strong className="text-yellow-400 font-mono">~3.8s</strong></span>
        <span className="text-zinc-500">Tx Cost <strong className="text-yellow-400 font-mono">0.00001 XLM</strong></span>
        <span className="text-zinc-500">Custodia <strong className="text-emerald-400">No-custodial</strong></span>
        <span className="text-zinc-500">Gate <strong className="text-yellow-400">Human-in-the-Loop</strong></span>
        <span className="text-zinc-500">Network <strong className="text-white">Protocol 20 · Testnet</strong></span>
      </div>
    </div>
  );
}
