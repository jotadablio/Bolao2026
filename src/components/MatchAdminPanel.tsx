import { useState } from "react";
import { Match, Prediction } from "../types";
import { updateMatch, recalculateScores, resetMatchesToOfficial } from "../firebaseService";
import { Sliders, RefreshCw, Calendar, Eye, Settings, Zap, RotateCcw } from "lucide-react";

interface MatchAdminPanelProps {
  matches: Match[];
  predictions: Prediction[];
}

export default function MatchAdminPanel({ matches, predictions }: MatchAdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [homeScoreInput, setHomeScoreInput] = useState("0");
  const [awayScoreInput, setAwayScoreInput] = useState("0");
  const [statusInput, setStatusInput] = useState<"scheduled" | "live" | "finished">("scheduled");
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  const handleMatchSelect = (matchId: string) => {
    setSelectedMatchId(matchId);
    const m = matches.find(match => match.id === matchId);
    if (m) {
      setHomeScoreInput((m.homeScore ?? 0).toString());
      setAwayScoreInput((m.awayScore ?? 0).toString());
      setStatusInput(m.status);
    }
  };

  const handleUpdateMatch = async () => {
    if (!selectedMatch) return;
    setIsProcessing(true);
    try {
      const updated: Match = {
        ...selectedMatch,
        status: statusInput,
        homeScore: statusInput !== "scheduled" ? parseInt(homeScoreInput) || 0 : undefined,
        awayScore: statusInput !== "scheduled" ? parseInt(awayScoreInput) || 0 : undefined
      };
      await updateMatch(updated);
      alert(`Partida atualizada com sucesso: ${updated.homeTeam} vs ${updated.awayTeam} (${updated.status === "finished" ? "Finalizado" : updated.status === "live" ? "Ao vivo" : "Agendado"})`);
    } catch (err) {
      console.error(err);
      alert("Falha ao atualizar partida.");
    } finally {
      setIsProcessing(false);
    }
  };

  const shiftKickoffTime = async (hoursOffset: number) => {
    if (!selectedMatch) return;
    setIsProcessing(true);
    try {
      const newTime = new Date();
      newTime.setHours(newTime.getHours() + hoursOffset);
      const updated: Match = {
        ...selectedMatch,
        kickoffTime: newTime.toISOString()
      };
      await updateMatch(updated);
      alert(`Horário de início ajustado! Os palpites para esta partida agora estão ${hoursOffset < 0 ? "BLOQUEADOS (já começou)" : "ABERTOS (futuro)"}`);
    } catch (err) {
      console.error(err);
      alert("Falha ao ajustar horário de início.");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerRecalculateScores = async () => {
    setIsProcessing(true);
    try {
      await recalculateScores(matches, predictions);
      alert("Recálculo completo! A classificação foi atualizada em tempo real para todos.");
    } catch (err) {
      console.error(err);
      alert("Falha ao recalcular.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetMatches = async () => {
    if (!confirm("Tem certeza que deseja resetar todas as partidas para os 16 jogos oficiais da Copa do Mundo 2026? Isso sobrescreverá as pontuações e partidas existentes.")) {
      return;
    }
    setIsProcessing(true);
    try {
      await resetMatchesToOfficial();
      alert("As 16 partidas oficiais da Copa do Mundo 2026 foram reiniciadas e cadastradas no banco de dados com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Falha ao redefinir partidas.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-emerald-500/20 rounded-xl shadow-lg overflow-hidden transition-all">
      
      {/* Admin header toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-emerald-500/5 hover:bg-emerald-500/10 px-6 py-4 flex items-center justify-between border-b border-emerald-500/10 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-amber-500" />
          <div>
            <span className="text-sm font-black text-white block uppercase tracking-wider">
              Painel de Simulação & Administração
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono mt-0.5 block">
              Simule resultados, gerencie início de jogos e redefina os 16 jogos oficiais da copa
            </span>
          </div>
        </div>
        <div className="text-[10px] px-2.5 py-1 bg-amber-500/15 border border-amber-500/25 text-amber-400 font-black rounded uppercase tracking-wider scale-90">
          {isOpen ? "Ocultar" : "Expandir"}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 flex flex-col gap-5 border-t border-emerald-500/10 bg-black/60">
          
          {/* Main simulator workflow */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Left: Select Match & Modify Status */}
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest font-mono">
                1. Escolher Partida
              </label>
              <select
                value={selectedMatchId}
                onChange={(e) => handleMatchSelect(e.target.value)}
                className="w-full text-xs py-2.5 px-3 rounded border border-emerald-500/15 bg-black text-white font-bold uppercase tracking-wider focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Escolha uma partida para simular --</option>
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.homeTeam} vs {m.awayTeam} ({m.stage})
                  </option>
                ))}
              </select>

              {selectedMatch && (
                <div className="flex flex-col gap-4 p-4 bg-black/40 border border-emerald-500/10 rounded">
                  {/* Status */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase font-mono tracking-wider">
                      Status do Jogo
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["scheduled", "live", "finished"] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setStatusInput(status)}
                          className={`py-1.5 px-2 rounded text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                            statusInput === status
                              ? "bg-amber-500 border-transparent text-black font-black"
                              : "bg-black/60 border-emerald-500/20 text-slate-400 hover:text-white hover:border-emerald-500/40"
                          }`}
                        >
                          {status === "scheduled" ? "Agendado" : status === "live" ? "Ao Vivo" : "Encerrado"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Goal inputs */}
                  {statusInput !== "scheduled" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase font-mono tracking-wider">
                        Placar do Jogo
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1 grow">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider truncate">
                            {selectedMatch.homeTeam}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={homeScoreInput}
                            onChange={(e) => setHomeScoreInput(e.target.value)}
                            className="w-full text-xs text-center font-bold font-mono py-1.5 border border-emerald-500/15 bg-black text-white rounded focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                        <span className="text-emerald-500 font-black mt-4">-</span>
                        <div className="flex flex-col gap-1 grow">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider truncate">
                            {selectedMatch.awayTeam}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={awayScoreInput}
                            onChange={(e) => setAwayScoreInput(e.target.value)}
                            className="w-full text-xs text-center font-bold font-mono py-1.5 border border-emerald-500/15 bg-black text-white rounded focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleUpdateMatch}
                    disabled={isProcessing}
                    className="w-full py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {isProcessing ? "Gravando..." : "Aplicar Placar e Status"}
                  </button>
                </div>
              )}
            </div>

            {/* Right: Kickoff adjustment & Recalculate */}
            <div className="flex flex-col gap-4">
              
              {/* Kickoff Adjustments */}
              <div className="flex flex-col gap-2.5">
                <label className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest font-mono">
                  2. Bloquear / Desbloquear Palpites
                </label>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Os palpites só podem ser salvos antes do jogo iniciar. Mude o horário de início da partida para simular o bloqueio.
                </p>
                <div className="flex gap-2.5 mt-1">
                  <button
                    onClick={() => shiftKickoffTime(2)}
                    disabled={!selectedMatch || isProcessing}
                    className="grow py-2 px-3 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-30"
                  >
                    🔓 Abrir (+2h no futuro)
                  </button>
                  <button
                    onClick={() => shiftKickoffTime(-2)}
                    disabled={!selectedMatch || isProcessing}
                    className="grow py-2 px-3 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-30"
                  >
                    🔒 Fechar (-2h no passado)
                  </button>
                </div>
              </div>

              {/* Scoring Trigger */}
              <div className="flex flex-col gap-2 bg-amber-500/5 p-4 border border-amber-500/15 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest font-mono">
                    3. Processar Pontuação do Bolão
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal font-medium">
                  Processa e credita os pontos para todos os usuários com base nos placares encerrados: <span className="text-emerald-400 font-bold font-mono">+3 PTS</span> placar exato, <span className="text-amber-400 font-bold font-mono">+1 PT</span> acertar o vencedor.
                </p>
                <button
                  onClick={triggerRecalculateScores}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest rounded transition-colors cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Calcular Pontos de Todos
                </button>
              </div>

              {/* Seeding Button */}
              <div className="flex flex-col gap-2 bg-emerald-500/5 p-4 border border-emerald-500/15 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest font-mono">
                    4. Reiniciar banco de dados
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal font-medium">
                  Se o seu banco de dados estiver limpo ou com partidas de teste antigas, clique abaixo para carregar os 16 jogos oficiais da Copa de 2026.
                </p>
                <button
                  onClick={handleResetMatches}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded border border-emerald-500 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar 16 Jogos Oficiais da Copa
                </button>
              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}
