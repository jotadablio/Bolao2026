import React, { useState } from "react";
import { signInWithGoogle, signInAsGuest } from "../firebase";
import { Trophy, ShieldAlert, Flame, Star } from "lucide-react";
import TriondaBallIcon from "./TriondaBallIcon";

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      onLoginSuccess(user);
    } catch (err: any) {
      console.error(err);
      setError("Falha ao entrar com o Google. Se estiver usando o modo de visualização em iframe, utilize o Acesso Rápido de Convidado abaixo!");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError("Por favor, digite um apelido para entrar como convidado.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await signInAsGuest(guestName.trim());
      onLoginSuccess(user);
    } catch (err) {
      console.error(err);
      setError("Falha ao entrar como convidado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040d08] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Stadium/Pitch atmosphere background */}
      <div className="absolute inset-0 stadium-pitch-glow opacity-60" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 blur-3xl rounded-full" />
      
      <div className="w-full max-w-md bg-black/40 backdrop-blur-md rounded-2xl border border-emerald-500/20 shadow-2xl relative z-10 p-8 flex flex-col gap-6">
        
        {/* Header section with Trionda Ball 2026 icon */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500/30 relative overflow-hidden shadow-lg animate-pulse">
            <TriondaBallIcon size={44} className="relative z-10" />
          </div>
          <div>
            <div className="inline-block bg-[#e10600] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1">
              COPA DO MUNDO 2026
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-white">
              BOLÃO OFICIAL
            </h1>
            <p className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase font-mono mt-1">
              PREDICTOR DE FUTEBOL
            </p>
          </div>
        </div>

        {/* Features list */}
        <div className="bg-[#05160E]/80 rounded border border-emerald-500/15 p-4 flex flex-col gap-3.5">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mt-0.5 shrink-0 border border-emerald-500/30">
              <span className="text-[10px] font-black">✓</span>
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-wider">Um Palpite por Jogo</p>
              <p className="text-[11px] text-gray-400">Insira e salve seus palpites exatos de placar antes do início da partida.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-amber-500/15 text-amber-400 rounded-full flex items-center justify-center mt-0.5 shrink-0 border border-amber-500/30">
              <span className="text-[10px] font-black">✓</span>
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-wider">Regras de Pontuação Oficiais</p>
              <p className="text-[11px] text-gray-400">Ganhe <span className="text-emerald-400 font-bold font-mono">+3 PTS</span> por placar exato e <span className="text-amber-400 font-bold font-mono">+1 PT</span> por acertar o vencedor/empate.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-red-500/15 text-red-400 rounded-full flex items-center justify-center mt-0.5 shrink-0 border border-red-500/30">
              <span className="text-[10px] font-black">✓</span>
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-wider">Crie seu Próprio Bolão</p>
              <p className="text-[11px] text-gray-400">Crie ligas fechadas para disputar com amigos e torne-se administrador!</p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 text-red-400 p-3.5 rounded border border-red-500/20 flex items-start gap-2.5 text-xs">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="leading-normal">{error}</p>
          </div>
        )}

        {/* Sign In Options */}
        <div className="flex flex-col gap-4">
          
          {/* Main Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            id="google_login_btn"
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" strokeLinejoin="round" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            Entrar com conta do Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px bg-emerald-500/20 grow" />
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest font-mono">ou</span>
            <div className="h-px bg-emerald-500/20 grow" />
          </div>

          {/* Guest Sign-In */}
          <form onSubmit={handleGuestLogin} className="flex flex-col gap-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300 text-center font-mono">
              Entrar sem Conta (Convidado)
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Seu apelido (ex: Craque99)"
                maxLength={20}
                className="grow text-xs py-2.5 px-3 bg-black/60 border border-emerald-500/25 rounded text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500 font-bold"
              />
              <button
                type="submit"
                disabled={loading}
                id="guest_login_submit_btn"
                className="py-2.5 px-5 rounded bg-emerald-600 border border-emerald-500 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Jogar
              </button>
            </div>
            <p className="text-[9px] text-emerald-400/50 text-center leading-relaxed font-medium">
              *Permite prever resultados, calcular pontuações e disputar no ranking.
            </p>
          </form>

        </div>

      </div>
    </div>
  );
}
