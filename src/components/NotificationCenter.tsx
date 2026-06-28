import { useState, useEffect } from "react";
import { PushNotification, Match } from "../types";
import { Bell, Volume2, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NotificationCenterProps {
  matches: Match[];
}

export default function NotificationCenter({ matches }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  // Sync browser notification permission state
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("Este navegador não suporta notificações de área de trabalho.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === "granted") {
      showNativeNotification(
        "Notificações Ativadas! 🔔",
        "Você receberá lembretes de início de partida e atualizações do Bolão."
      );
    }
  };

  const showNativeNotification = (title: string, body: string) => {
    if (permission === "granted" && "Notification" in window) {
      new Notification(title, {
        body: body,
        icon: "https://cdn-icons-png.flaticon.com/512/5323/5323812.png"
      });
    }
  };

  const triggerSimulatedNotification = (type: "match_reminder" | "score_update") => {
    let title = "";
    let body = "";

    if (type === "match_reminder") {
      const scheduled = matches.find(m => m.status === "scheduled") || matches[0];
      title = "Lembrete de Início! ⚽";
      body = `O jogo ${scheduled.homeTeam} x ${scheduled.awayTeam} (${scheduled.stage}) começa logo! Certifique-se de salvar seu palpite.`;
    } else {
      const active = matches.find(m => m.status !== "scheduled") || matches[0];
      const scoreText = active.homeScore !== undefined ? `${active.homeScore} x ${active.awayScore}` : "começando";
      title = "Resultado Atualizado! 🏆";
      body = `Placar final: ${active.homeTeam} ${scoreText} ${active.awayTeam}. Veja seus pontos ganhos na classificação!`;
    }

    const newNotification: PushNotification = {
      id: `notif_${Date.now()}`,
      title,
      body,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Send native desktop notification
    showNativeNotification(title, body);

    // Audio chime effect
    if (soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.25);
      } catch (e) {
        console.log("Audio contexts blocked or unsupported:", e);
      }
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Mini Bar with Bell Action */}
      <div className="flex items-center justify-between p-4 bg-black/40 backdrop-blur-sm border border-emerald-500/10 rounded-xl shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-10 h-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center hover:bg-emerald-500/25 cursor-pointer transition-colors"
            >
              <Bell className="w-5 h-5" />
            </button>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce shadow-sm">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider leading-tight">
              Central de Notificações Push
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono mt-0.5">
              {permission === "granted" ? "🔔 Notificações ativas no navegador" : "🔕 Notificações internas ativas"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {permission !== "granted" && (
            <button
              onClick={requestNotificationPermission}
              className="text-[10px] font-black px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black uppercase tracking-widest transition-colors cursor-pointer"
            >
              Ativar no Navegador
            </button>
          )}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded border text-xs cursor-pointer transition-all ${
              soundEnabled
                ? "bg-amber-500/10 border-amber-500/25 text-amber-400"
                : "bg-black/40 border-emerald-500/10 text-slate-500"
            }`}
            title={soundEnabled ? "Mutar sons" : "Ativar sons"}
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Simulator Actions & History Panel */}
      <div className="bg-black/40 backdrop-blur-sm border border-emerald-500/10 rounded-xl p-5 shadow-lg flex flex-col gap-4">
        
        {/* Quick Simulator Buttons */}
        <div>
          <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest block mb-2.5 font-mono">
            Simular Alertas em Tempo Real
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => triggerSimulatedNotification("match_reminder")}
              className="py-2.5 px-3 rounded bg-black/40 hover:bg-emerald-500/5 border border-emerald-500/10 text-slate-300 hover:text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-amber-500" />
              Lembrete de Início
            </button>
            <button
              onClick={() => triggerSimulatedNotification("score_update")}
              className="py-2.5 px-3 rounded bg-black/40 hover:bg-emerald-500/5 border border-emerald-500/10 text-slate-300 hover:text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              Placar Atualizado
            </button>
          </div>
        </div>

        {/* In-app notification stack list */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-emerald-500/10 pt-4 flex flex-col gap-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest font-mono">
                Histórico de Alertas ({notifications.length})
              </span>
              {notifications.length > 0 && (
                <div className="flex gap-2 text-[9px] font-black uppercase tracking-wider font-mono text-amber-400">
                  <button onClick={markAllRead} className="hover:underline cursor-pointer">Lidas</button>
                  <span>•</span>
                  <button onClick={clearNotifications} className="hover:underline text-red-400 cursor-pointer">Limpar</button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-[10px] uppercase font-bold tracking-wider font-mono text-slate-500">
                    Nenhum alerta recebido ainda. Clique nos botões acima para simular os avisos.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`p-3.5 rounded-lg border text-xs leading-relaxed flex flex-col gap-1.5 transition-colors ${
                        notif.read
                          ? "bg-black/10 border-emerald-500/5 text-slate-500"
                          : "bg-emerald-500/5 border-emerald-500/15 text-slate-300 font-bold"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wide">
                          {!notif.read && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 animate-pulse" />}
                          {notif.title}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono font-bold">{notif.timestamp}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed font-medium text-slate-400">{notif.body}</p>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
