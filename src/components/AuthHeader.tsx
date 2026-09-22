import { useState } from "react";
import { Button } from "./ui/button";
import type { UserProfile } from "@/types";

interface Props {
  user: UserProfile | null;
  onLogin: (u: UserProfile) => void;
  onLogout: () => void;
}

export function AuthHeader({ user, onLogin, onLogout }: Props) {
  const [showDemo, setShowDemo] = useState(false);

  const demoLogin = (name: string, email: string) => {
    onLogin({
      id: `demo_${email}`,
      name,
      email,
      avatarText: name.slice(0, 2).toUpperCase(),
      role: "Founder",
      provider: "demo",
    });
    setShowDemo(false);
  };

  return (
    <header className="border-b border-zinc-800 bg-[#0c0c0e]/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center font-black text-black text-sm">
            SA
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">Stellar Agent Layer</h1>
            <p className="text-[10px] text-zinc-500 font-medium">v2 · Investor Ready · Testnet</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-400/20 border border-yellow-500/40 flex items-center justify-center text-xs font-bold text-yellow-400">
                  {user.avatarText}
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-white">{user.name}</p>
                  <p className="text-[10px] text-zinc-500">{user.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                Salir
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="gold"
                size="sm"
                onClick={() => demoLogin("Rodrigo Boero", "rodrigo@stellar-agent.dev")}
              >
                Demo Login
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowDemo(true)}>
                Más perfiles
              </Button>
            </>
          )}
        </div>
      </div>

      {showDemo && (
        <div className="absolute right-4 top-16 w-64 rounded-xl border border-zinc-700 bg-[#121215] shadow-2xl p-3 z-50">
          <p className="text-xs text-zinc-400 mb-2 font-semibold">Elegí un perfil demo</p>
          {[
            { name: "Alex Founder", email: "alex@demo.dev" },
            { name: "Maria Ops", email: "maria@demo.dev" },
            { name: "Dev Node", email: "dev@node.dev" },
          ].map((p) => (
            <button
              key={p.email}
              onClick={() => demoLogin(p.name, p.email)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-zinc-800 text-zinc-200"
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={() => setShowDemo(false)}
            className="w-full mt-2 text-xs text-zinc-500 hover:text-zinc-300"
          >
            Cerrar
          </button>
        </div>
      )}
    </header>
  );
}
