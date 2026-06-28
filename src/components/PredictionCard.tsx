import React, { useState, useEffect } from "react";
import { Match, Prediction } from "../types";
import { submitPrediction } from "../firebaseService";
import { Clock, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { getFlagUrl } from "../utils/flagHelper";

interface PredictionCardProps {
  key?: string;
  match: Match;
  userPrediction?: Prediction;
  userId: string;
  userEmail: string;
  userName: string;
  onPredictionSubmitted: () => void;
}

export default function PredictionCard({
  match,
  userPrediction,
  userId,
  userEmail,
  userName,
  onPredictionSubmitted
}: PredictionCardProps) {
  const [homeInput, setHomeInput] = useState<string>("");
  const [awayInput, setAwayInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isLocked, setIsLocked] = useState(false);

  // Parse relative time & check lock state
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const kickoff = new Date(match.kickoffTime);
      const isPast = now >= kickoff || match.status !== "scheduled";
      setIsLocked(isPast);

      if (isPast) {
        if (match.status === "finished") {
          setTimeLeft("Finalizado");
        } else if (match.status === "live") {
          setTimeLeft("Ao Vivo");
        } else {
          setTimeLeft("Bloqueado");
        }
        return;
      }

      const diff = kickoff.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (days > 0) {
        setTimeLeft(`Começa em ${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`Começa em ${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`Começa em ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`Começa em ${seconds}s`);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [match]);

  // Sync state if user already made a prediction
  useEffect(() => {
    if (userPrediction) {
      setHomeInput(userPrediction.predictedHomeScore.toString());
      setAwayInput(userPrediction.predictedAwayScore.toString());
    } else {
      setHomeInput("");
      setAwayInput("");
    }
  }, [userPrediction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setError("Este jogo está bloqueado! O horário do kickoff já passou.");
      return;
    }

    const homeScoreVal = parseInt(homeInput);
    const awayScoreVal = parseInt(awayInput);

    if (isNaN(homeScoreVal) || isNaN(awayScoreVal) || homeScoreVal < 0 || awayScoreVal < 0) {
      setError("Insira valores de gols válidos (maiores ou iguais a 0).");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const pred: Prediction = {
        id: `${userId}_${match.id}`,
        userId,
        matchId: match.id,
        userEmail,
        userName,
        predictedHomeScore: homeScoreVal,
        predictedAwayScore: awayScoreVal,
        status: "pending",
        createdAt: new Date().toISOString()
      };
      await submitPrediction(pred);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onPredictionSubmitted();
    } catch (err) {
      console.error(err);
      setError("Falha ao salvar palpite no banco de dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const incrementHome = () => {
    if (isLocked) return;
    const current = parseInt(homeInput) || 0;
    setHomeInput((current + 1).toString());
  };

  const decrementHome = () => {
    if (isLocked) return;
    const current = parseInt(homeInput) || 0;
    if (current > 0) setHomeInput((current - 1).toString());
  };

  const incrementAway = () => {
    if (isLocked) return;
    const current = parseInt(awayInput) || 0;
    setAwayInput((current + 1).toString());
  };

  const decrementAway = () => {
    if (isLocked) return;
    const current = parseInt(awayInput) || 0;
    if (current > 0) setAwayInput((current - 1).toString());
  };

  const points = userPrediction?.pointsEarned;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-black/30 backdrop-blur-sm border border-emerald-500/10 hover:border-emerald-500/25 rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 shadow-md"
    >
      {/* Top Meta info */}
      <div className="flex justify-between items-center text-[10px]">
        <span className="px-2.5 py-1 rounded font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">
          {match.stage}
        </span>
        <div className="flex items-center gap-1.5 text-slate-400 font-mono font-bold uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span className={isLocked ? "text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20" : ""}>
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Main Vs Section */}
      <div className="grid grid-cols-11 items-center gap-2 py-2">
        {/* Home Team */}
        <div className="col-span-4 flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 bg-black/40 rounded-full border border-emerald-500/10 flex items-center justify-center text-3xl shadow-lg hover:scale-105 transition-transform overflow-hidden">
            {getFlagUrl(match.homeTeam) ? (
              <img
                src={getFlagUrl(match.homeTeam) || ""}
                alt={match.homeTeam}
                className="w-11 h-8 object-cover rounded shadow-sm border border-white/10"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="select-none" role="img" aria-label={match.homeTeam}>
                {match.homeFlag}
              </span>
            )}
          </div>
          <span className="text-xs font-extrabold uppercase text-white line-clamp-1 leading-tight tracking-wider">
            {match.homeTeam}
          </span>
          {match.status !== "scheduled" && match.homeScore !== undefined && (
            <span className="text-3xl font-black text-white font-mono leading-none mt-1 bg-black/40 px-3 py-1 rounded border border-white/5">
              {match.homeScore}
            </span>
          )}
        </div>

        {/* VS / Score box */}
        <div className="col-span-3 flex flex-col items-center justify-center">
          <div className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
            match.status === "live" 
              ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse" 
              : match.status === "finished" 
                ? "bg-slate-500/10 text-slate-400 border border-slate-500/20" 
                : "bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20"
          }`}>
            {match.status === "live" ? "AO VIVO" : match.status === "finished" ? "FIM DE JOGO" : "VS"}
          </div>
          {match.status === "scheduled" && (
            <span className="text-[10px] text-amber-500 font-mono mt-1.5 font-bold bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded">
              {new Date(match.kickoffTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className="col-span-4 flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 bg-black/40 rounded-full border border-emerald-500/10 flex items-center justify-center text-3xl shadow-lg hover:scale-105 transition-transform overflow-hidden">
            {getFlagUrl(match.awayTeam) ? (
              <img
                src={getFlagUrl(match.awayTeam) || ""}
                alt={match.awayTeam}
                className="w-11 h-8 object-cover rounded shadow-sm border border-white/10"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="select-none" role="img" aria-label={match.awayTeam}>
                {match.awayFlag}
              </span>
            )}
          </div>
          <span className="text-xs font-extrabold uppercase text-white line-clamp-1 leading-tight tracking-wider">
            {match.awayTeam}
          </span>
          {match.status !== "scheduled" && match.awayScore !== undefined && (
            <span className="text-3xl font-black text-white font-mono leading-none mt-1 bg-black/40 px-3 py-1 rounded border border-white/5">
              {match.awayScore}
            </span>
          )}
        </div>
      </div>

      {/* Prediction inputs or Outcome display */}
      <div className="border-t border-emerald-500/10 pt-4 flex flex-col gap-3">
        {isLocked ? (
          /* Locked prediction status */
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Seu Palpite</span>
              <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 font-mono">
                <Lock className="w-3 h-3" /> BLOQUEADO
              </span>
            </div>

            {userPrediction ? (
              <div className="flex items-center justify-between p-3.5 bg-black/40 rounded border border-emerald-500/10">
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-xl font-black text-white bg-black/40 px-3 py-1 rounded border border-white/5">
                    {userPrediction.predictedHomeScore}
                  </span>
                  <span className="text-emerald-500 font-black">-</span>
                  <span className="text-xl font-black text-white bg-black/40 px-3 py-1 rounded border border-white/5">
                    {userPrediction.predictedAwayScore}
                  </span>
                </div>

                {/* Points Reward Display */}
                {match.status === "finished" && points !== undefined ? (
                  <div className="flex items-center gap-1.5 font-mono">
                    {points === 3 ? (
                      <span className="bg-emerald-500/20 border-2 border-emerald-500 text-emerald-300 px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-emerald-500/10 animate-pulse">
                        ⭐ +3 PTS (Exato!)
                      </span>
                    ) : points === 1 ? (
                      <span className="bg-amber-500/20 border-2 border-amber-500/40 text-amber-300 px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        +1 PT (Vencedor)
                      </span>
                    ) : (
                      <span className="bg-white/5 border border-white/10 text-slate-500 px-3 py-1 rounded text-[10px] font-bold uppercase">
                        0 PTS
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider">
                    Aguardando Placar
                  </span>
                )}
              </div>
            ) : (
              <div className="p-3 bg-red-500/5 rounded border border-red-500/15 text-[10px] text-red-400 text-center font-bold font-mono uppercase tracking-wide">
                Nenhum palpite registrado antes do início do jogo.
              </div>
            )}
          </div>
        ) : (
          /* Dynamic active prediction builder */
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>{userPrediction ? "Ajustar Seu Palpite" : "Faça Seu Palpite"}</span>
              {userPrediction && (
                <span className="text-emerald-400 flex items-center gap-1 font-bold tracking-wider uppercase font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Salvo!
                </span>
              )}
            </div>

            {/* Inputs & Counters grid */}
            <div className="grid grid-cols-11 items-center gap-3">
              {/* Home score selector */}
              <div className="col-span-4 flex items-center justify-between border border-emerald-500/10 rounded-lg p-1 bg-black/40">
                <button
                  type="button"
                  onClick={decrementHome}
                  className="w-8 h-8 rounded bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:text-black font-black transition-all cursor-pointer select-none flex items-center justify-center text-sm"
                >
                  -
                </button>
                <input
                  type="text"
                  pattern="[0-9]*"
                  value={homeInput}
                  onChange={(e) => setHomeInput(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="0"
                  className="w-10 text-center font-black font-mono text-base bg-transparent focus:outline-none text-white"
                />
                <button
                  type="button"
                  onClick={incrementHome}
                  className="w-8 h-8 rounded bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:text-black font-black transition-all cursor-pointer select-none flex items-center justify-center text-sm"
                >
                  +
                </button>
              </div>

              {/* Colon */}
              <div className="col-span-3 text-center text-emerald-500 font-black font-mono select-none text-lg">-</div>

              {/* Away score selector */}
              <div className="col-span-4 flex items-center justify-between border border-emerald-500/10 rounded-lg p-1 bg-black/40">
                <button
                  type="button"
                  onClick={decrementAway}
                  className="w-8 h-8 rounded bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:text-black font-black transition-all cursor-pointer select-none flex items-center justify-center text-sm"
                >
                  -
                </button>
                <input
                  type="text"
                  pattern="[0-9]*"
                  value={awayInput}
                  onChange={(e) => setAwayInput(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="0"
                  className="w-10 text-center font-black font-mono text-base bg-transparent focus:outline-none text-white"
                />
                <button
                  type="button"
                  onClick={incrementAway}
                  className="w-8 h-8 rounded bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:text-black font-black transition-all cursor-pointer select-none flex items-center justify-center text-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Error alerts */}
            {error && (
              <div className="text-[10px] text-red-400 font-bold font-mono uppercase tracking-wide flex items-center gap-1 bg-red-500/10 p-2 rounded border border-red-500/20">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </div>
            )}

            {/* Submit btn */}
            <button
              type="submit"
              disabled={isSubmitting || !homeInput || !awayInput}
              id={`submit_pick_btn_${match.id}`}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? "Gravando Palpite..." : success ? "✓ Palpite Salvo!" : userPrediction ? "Atualizar Palpite" : "Confirmar Palpite"}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
}
