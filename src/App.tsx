import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, logOut, isFirebaseConfigured } from "./firebase";
import { 
  subscribeMatches, 
  subscribePredictions, 
  subscribeLeaderboard, 
  saveUserProfile,
  createGroup,
  joinGroup,
  leaveGroup,
  deleteGroup,
  subscribeUserGroups,
  subscribeGroupMembers
} from "./firebaseService";
import { Match, Prediction, UserProfile, Group } from "./types";

import LoginScreen from "./components/LoginScreen";
import ThemeToggle from "./components/ThemeToggle";
import PredictionCard from "./components/PredictionCard";
import Leaderboard from "./components/Leaderboard";
import MatchAdminPanel from "./components/MatchAdminPanel";
import NotificationCenter from "./components/NotificationCenter";
import TriondaBallIcon from "./components/TriondaBallIcon";

import { Trophy, LogOut, Swords, ListOrdered, HelpCircle, Users, Plus, ArrowLeft, Trash2, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Real-time collections state
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);

  // Group-specific states
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [newGroupNameInput, setNewGroupNameInput] = useState("");
  const [isGroupActionLoading, setIsGroupActionLoading] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<"matches" | "leaderboard" | "groups">("matches");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Auth listener
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // Automatically create/sync profile document in Firestore
        const profile: UserProfile = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || `Jogador_${currentUser.uid.slice(0, 5)}`,
          email: currentUser.email || `${currentUser.uid.slice(0, 8)}@guessgame.local`,
          photoURL: currentUser.photoURL || "",
          totalPoints: 0
        };
        await saveUserProfile(profile);
      }
    });

    return () => unsubscribe();
  }, []);

  // Live Firebase Subscriptions when user is logged in
  useEffect(() => {
    if (!user) {
      setJoinedGroups([]);
      return;
    }

    const unsubMatches = subscribeMatches((updatedMatches) => {
      setMatches(updatedMatches);
    });

    const unsubPredictions = subscribePredictions((updatedPredictions) => {
      setPredictions(updatedPredictions);
    });

    const unsubLeaderboard = subscribeLeaderboard((updatedLeaderboard) => {
      setLeaderboard(updatedLeaderboard);
    });

    const unsubGroups = subscribeUserGroups(user.uid, (groups) => {
      setJoinedGroups(groups);
    });

    return () => {
      unsubMatches();
      unsubPredictions();
      unsubLeaderboard();
      unsubGroups();
    };
  }, [user]);

  // Real-time subscription to selected group members
  useEffect(() => {
    if (!selectedGroupId) {
      setSelectedGroupMembers([]);
      return;
    }
    const unsub = subscribeGroupMembers(selectedGroupId, (userIds) => {
      setSelectedGroupMembers(userIds);
    });
    return () => unsub();
  }, [selectedGroupId]);

  // Handle logout
  const handleLogOut = async () => {
    try {
      await logOut();
    } catch (e) {
      console.error(e);
    }
  };

  // Group actions handlers
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupNameInput.trim() || !user) return;
    
    // Limit to 3 created groups per user account
    const createdGroupsCount = joinedGroups.filter((g) => g.adminId === user.uid).length;
    if (createdGroupsCount >= 3) {
      alert("Você atingiu o limite máximo de criação de bolões (máximo de 3 bolões por conta).");
      return;
    }

    setIsGroupActionLoading(true);
    try {
      const code = await createGroup(
        newGroupNameInput.trim(),
        user.uid,
        user.displayName || "Jogador"
      );
      setNewGroupNameInput("");
      setSelectedGroupId(code);
      alert(`Bolão criado com sucesso! Seu código de convite é: ${code}`);
    } catch (err: any) {
      console.error(err);
      alert(`Falha ao criar bolão: ${err.message || err}`);
    } finally {
      setIsGroupActionLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim() || !user) return;
    setIsGroupActionLoading(true);
    try {
      const cleanCode = joinCodeInput.trim().toUpperCase();
      await joinGroup(cleanCode, user.uid);
      setJoinCodeInput("");
      setSelectedGroupId(cleanCode);
      alert("Você entrou no bolão com sucesso!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Não foi possível entrar no bolão. Verifique o código e tente novamente.");
    } finally {
      setIsGroupActionLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroupId || !user) return;
    if (!confirm("Tem certeza que deseja sair deste bolão?")) return;
    setIsGroupActionLoading(true);
    try {
      await leaveGroup(selectedGroupId, user.uid);
      setSelectedGroupId(null);
      alert("Você saiu do bolão.");
    } catch (err: any) {
      console.error(err);
      alert("Falha ao sair do bolão.");
    } finally {
      setIsGroupActionLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroupId) return;
    if (!confirm("Atenção Admin: Tem certeza que deseja excluir permanentemente este bolão? Todos os membros serão removidos.")) {
      return;
    }
    setIsGroupActionLoading(true);
    try {
      await deleteGroup(selectedGroupId);
      setSelectedGroupId(null);
      alert("Bolão excluído com sucesso.");
    } catch (err: any) {
      console.error(err);
      alert("Falha ao excluir bolão.");
    } finally {
      setIsGroupActionLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#040d08] flex flex-col items-center justify-center gap-3">
        <span className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-black text-emerald-400 font-mono tracking-widest animate-pulse">
          CARREGANDO COPA DO MUNDO...
        </span>
      </div>
    );
  }

  // If Firebase is not configured (e.g. on Vercel without environment variables)
  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-[#040d08] text-slate-100 flex flex-col items-center justify-center p-6 font-sans relative">
        <div className="absolute inset-0 stadium-pitch-glow opacity-30 pointer-events-none" />
        <div className="max-w-md w-full bg-black/50 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-6 md:p-8 text-center shadow-2xl relative z-10 flex flex-col gap-6">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center border border-red-500/30 shadow-lg mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider uppercase text-white">Configuração Necessária</h1>
            <p className="text-xs text-red-400 font-bold uppercase tracking-wider font-mono mt-1">
              Credenciais do Firebase Ausentes
            </p>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed text-left bg-black/40 p-4 border border-slate-800 rounded-xl">
            Para que o seu deploy na Vercel funcione corretamente, você precisa configurar as **Variáveis de Ambiente** no painel da Vercel correspondentes ao Firebase.
          </p>
          <div className="text-left flex flex-col gap-3">
            <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest font-mono">
              Passo a Passo para Ajustar:
            </p>
            <ol className="text-[11px] text-slate-400 list-decimal pl-4 flex flex-col gap-2">
              <li>Acesse o painel da <strong className="text-white">Vercel</strong> e entre no seu projeto.</li>
              <li>Vá em <strong className="text-white">Settings</strong> &gt; <strong className="text-white">Environment Variables</strong>.</li>
              <li>Adicione as variáveis abaixo (com os valores do seu Firebase):
                <ul className="list-disc pl-4 mt-1.5 text-[10px] font-mono text-emerald-400/80 flex flex-col gap-1 bg-black/30 p-2 rounded border border-white/5">
                  <li>VITE_FIREBASE_API_KEY</li>
                  <li>VITE_FIREBASE_AUTH_DOMAIN</li>
                  <li>VITE_FIREBASE_PROJECT_ID</li>
                  <li>VITE_FIREBASE_STORAGE_BUCKET</li>
                  <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
                  <li>VITE_FIREBASE_APP_ID</li>
                  <li>VITE_FIREBASE_FIRESTORE_DATABASE_ID</li>
                </ul>
              </li>
              <li>Faça um novo deploy (Redeploy) na Vercel para aplicar!</li>
            </ol>
          </div>
          <div className="text-[9px] font-mono text-slate-500 border-t border-slate-800/60 pt-4">
            Isso garante que seu banco de dados e autenticação funcionem perfeitamente em seu próprio domínio da Vercel de forma 100% segura.
          </div>
        </div>
      </div>
    );
  }

  // Not logged in -> Show login
  if (!user) {
    return <LoginScreen onLoginSuccess={(u) => setUser(u)} />;
  }

  // Aggregate user predictions map
  const myPredictionsMap = new Map<string, Prediction>();
  predictions
    .filter((pred) => pred.userId === user.uid)
    .forEach((pred) => myPredictionsMap.set(pred.matchId, pred));

  // Extract all available stages for stage filter dropdown
  const uniqueStages = Array.from(new Set(matches.map((m) => m.stage)));

  const filteredMatches = matches.filter(
    (m) => filterStage === "all" || m.stage === filterStage
  );

  // Find current user's leaderboard profile for stat stats
  const myProfile = leaderboard.find((p) => p.uid === user.uid);
  const myRank = leaderboard.findIndex((p) => p.uid === user.uid) + 1;

  // Selected Group details & filtering
  const selectedGroup = joinedGroups.find((g) => g.id === selectedGroupId);
  const createdGroupsCount = joinedGroups.filter((g) => g.adminId === user.uid).length;
  const groupUsers = leaderboard.filter((u) => selectedGroupMembers.includes(u.uid));

  return (
    <div className="min-h-screen bg-[#040d08] text-slate-100 pb-16 relative overflow-hidden font-sans">
      
      {/* Stadium Pitch Atmosphere background */}
      <div className="absolute inset-0 stadium-pitch-glow opacity-30 pointer-events-none" />
      
      {/* Top Navigation / Header */}
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-emerald-500/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          
          {/* Logo & title */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <TriondaBallIcon size={28} />
            </div>
            <div>
              <h1 className="text-sm font-sans font-black text-white tracking-wider uppercase leading-none">
                Bolão Copa do Mundo
              </h1>
              <p className="text-[10px] text-emerald-400 font-bold tracking-widest font-mono uppercase mt-1">
                PREDICTOR OFICIAL DE PALPITES
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleLogOut}
              id="logout_btn"
              className="px-4 py-2 rounded bg-black/40 border border-emerald-500/10 text-slate-300 hover:text-red-400 hover:border-red-500/30 cursor-pointer flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest font-mono transition-colors"
              title="Sair da Conta"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Stage */}
      <main className="max-w-6xl mx-auto px-4 mt-6 flex flex-col gap-6 relative z-10">

        {/* User Card: Profile info, streak, and scoring stats */}
        <div className="w-full bg-black/40 backdrop-blur-sm border border-emerald-500/10 text-white rounded-xl p-5 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-stretch justify-between gap-6">
          {/* User basic profile info */}
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 bg-black/60 text-emerald-400 rounded-full border-2 border-emerald-500/20 flex items-center justify-center text-xl font-black overflow-hidden shadow-xl shrink-0">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ""} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                (user.displayName || "J").slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase font-mono">Bem-vindo ao Bolão</p>
              <h2 className="text-lg font-black tracking-wider uppercase mt-0.5">{user.displayName}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                <span className="font-mono bg-black/40 text-slate-400 border border-emerald-500/10 px-2.5 py-0.5 rounded text-[10px] font-bold">
                  {user.email}
                </span>
                {myRank > 0 && (
                  <span className="bg-amber-500 text-black px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-md">
                    🏆 Geral: #{myRank}º
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats breakdown */}
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 md:gap-4 relative z-10 shrink-0 md:w-96 text-center">
            
            {/* Points */}
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-3 flex flex-col items-center justify-center">
              <span className="text-lg md:text-xl font-black text-amber-400 font-mono">
                {myProfile?.totalPoints || 0}
              </span>
              <span className="text-[9px] text-amber-400 font-extrabold uppercase tracking-wider mt-0.5 font-mono">Pontos</span>
            </div>

            {/* Total Predictions */}
            <div className="bg-black/40 border border-emerald-500/10 rounded-lg p-3 flex flex-col items-center justify-center">
              <span className="text-lg md:text-xl font-black text-white font-mono">
                {myProfile?.predictionsCount || 0}
              </span>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5 font-mono">Palpites</span>
            </div>

            {/* Exact guesses */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex flex-col items-center justify-center">
              <span className="text-lg md:text-xl font-black text-emerald-400 font-mono">
                {myProfile?.exactCount || 0}
              </span>
              <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider mt-0.5 font-mono">Exato (+3)</span>
            </div>

            {/* Outcome guesses */}
            <div className="bg-black/40 border border-emerald-500/10 rounded-lg p-3 flex flex-col items-center justify-center">
              <span className="text-lg md:text-xl font-black text-slate-300 font-mono">
                {myProfile?.outcomeCount || 0}
              </span>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5 font-mono">Venc (+1)</span>
            </div>

          </div>
        </div>

        {/* Scoring Helper Notice */}
        <div className="bg-emerald-500/5 text-slate-300 rounded-xl border border-emerald-500/15 p-4 flex items-start gap-3.5 text-xs leading-relaxed">
          <HelpCircle className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" />
          <div>
            <span className="font-extrabold block text-white uppercase tracking-wider font-mono mb-1 text-[10px]">REGRAS DE PONTUAÇÃO</span>
            Você ganha <strong className="text-emerald-400 font-black font-mono">+3 PTS</strong> por acertar o placar exato do jogo. Ganha <strong className="text-amber-400 font-black font-mono">+1 PT</strong> se acertar o vencedor da partida ou o empate (caso o placar não seja exato). Seus palpites devem ser inseridos e salvos antes do início oficial da partida!
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          {/* View Toggles */}
          <div className="flex bg-black border border-emerald-500/10 p-1 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("matches")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-6 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "matches"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/15 border border-emerald-500"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Swords className="w-4 h-4" />
              Jogos da Copa
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-6 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "groups"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/15 border border-emerald-500"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              Meus Bolões
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-6 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "leaderboard"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/15 border border-emerald-500"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              Ranking Geral
            </button>
          </div>

          {/* Stage Filter (Only when matches tab is active) */}
          {activeTab === "matches" && (
            <div className="flex items-center gap-2.5 w-full sm:w-auto self-end">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono whitespace-nowrap hidden sm:inline">
                Filtrar Rodada:
              </span>
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="grow sm:grow-0 text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-lg border border-emerald-500/15 bg-black text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">Todas as Partidas</option>
                {uniqueStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Dynamic tab contents rendering */}
        <div className="flex flex-col gap-6">
          <AnimatePresence mode="wait">
            
            {/* Matches tab */}
            {activeTab === "matches" && (
              <motion.div
                key="matches_view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                {filteredMatches.length === 0 ? (
                  <div className="col-span-1 md:col-span-2 text-center py-12 bg-black/40 rounded-xl border border-emerald-500/10 text-slate-500 font-bold uppercase tracking-widest font-mono text-xs">
                    Nenhuma partida disponível para esta rodada.
                  </div>
                ) : (
                  filteredMatches.map((match) => (
                    <PredictionCard
                      key={match.id}
                      match={match}
                      userPrediction={myPredictionsMap.get(match.id)}
                      userId={user.uid}
                      userEmail={user.email || ""}
                      userName={user.displayName || "Jogador"}
                      onPredictionSubmitted={() => {}}
                    />
                  ))
                )}
              </motion.div>
            )}

            {/* Groups tab */}
            {activeTab === "groups" && (
              <motion.div
                key="groups_view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                {!selectedGroupId ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Left 2 Cols: Joined Groups List */}
                    <div className="md:col-span-2 bg-black/40 backdrop-blur-sm border border-emerald-500/10 rounded-xl p-5 flex flex-col gap-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-emerald-500/15">
                        <Users className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-sm font-black uppercase tracking-wider text-white">Seus Bolões Ativos</h2>
                      </div>
                      
                      {joinedGroups.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 font-bold uppercase tracking-wider font-mono text-xs">
                          Você ainda não participa de nenhum bolão. Crie ou entre em um ao lado!
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {joinedGroups.map((grp) => {
                            const isAdmin = grp.adminId === user.uid;
                            return (
                              <div
                                key={grp.id}
                                onClick={() => setSelectedGroupId(grp.id)}
                                className="p-4 bg-black/40 border border-emerald-500/10 hover:border-emerald-500/30 rounded-lg flex justify-between items-center cursor-pointer hover:bg-emerald-500/5 transition-all"
                              >
                                <div>
                                  <h4 className="font-extrabold text-white uppercase tracking-wider text-sm">{grp.name}</h4>
                                  <p className="text-[10px] text-slate-400 font-mono font-bold uppercase mt-1">
                                    CÓDIGO DE CONVITE: <span className="text-amber-400 select-all font-black">{grp.id}</span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  {isAdmin ? (
                                    <span className="text-[8px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black uppercase tracking-widest font-mono">
                                      ADMINISTRADOR
                                    </span>
                                  ) : (
                                    <span className="text-[8px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black uppercase tracking-widest font-mono">
                                      PARTICIPANTE
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-500">➜</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right 1 Col: Create/Join bolão forms */}
                    <div className="flex flex-col gap-5">
                      {/* Join Form */}
                      <form onSubmit={handleJoinGroup} className="bg-black/40 backdrop-blur-sm border border-emerald-500/10 rounded-xl p-5 flex flex-col gap-4">
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Entrar em Bolão</h3>
                        <div className="flex flex-col gap-2.5">
                          <input
                            type="text"
                            placeholder="Código do Bolão (6 letras)"
                            maxLength={6}
                            value={joinCodeInput}
                            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                            className="w-full text-xs py-2.5 px-3 bg-black border border-emerald-500/15 rounded text-white text-center font-bold tracking-widest uppercase focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="submit"
                            disabled={isGroupActionLoading || !joinCodeInput.trim()}
                            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest rounded transition-colors disabled:opacity-40 cursor-pointer"
                          >
                            {isGroupActionLoading ? "Participando..." : "Participar de Bolão"}
                          </button>
                        </div>
                      </form>

                      {/* Create Form */}
                      <form onSubmit={handleCreateGroup} className="bg-black/40 backdrop-blur-sm border border-emerald-500/10 rounded-xl p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black text-white uppercase tracking-wider">Criar Novo Bolão</h3>
                          <span className={`text-[10px] font-mono font-bold ${createdGroupsCount >= 3 ? "text-red-400" : "text-emerald-400"}`}>
                            {createdGroupsCount}/3 Criados
                          </span>
                        </div>
                        
                        {createdGroupsCount >= 3 ? (
                          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-[10px] text-red-400 font-bold uppercase font-mono tracking-wider leading-relaxed text-center">
                            Você atingiu o limite máximo de 3 bolões criados por conta.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2.5">
                            <input
                              type="text"
                              placeholder="Nome do seu Bolão"
                              maxLength={40}
                              value={newGroupNameInput}
                              onChange={(e) => setNewGroupNameInput(e.target.value)}
                              className="w-full text-xs py-2.5 px-3 bg-black border border-emerald-500/15 rounded text-white font-bold focus:outline-none focus:border-amber-500"
                            />
                            <button
                              type="submit"
                              disabled={isGroupActionLoading || !newGroupNameInput.trim()}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded transition-colors disabled:opacity-40 cursor-pointer"
                            >
                              {isGroupActionLoading ? "Criando..." : "Criar Bolão Oficial"}
                            </button>
                          </div>
                        )}
                      </form>
                    </div>

                  </div>
                ) : (
                  /* A specific Group is selected */
                  <div className="flex flex-col gap-5">
                    
                    {/* Selected Group Header block */}
                    <div className="bg-black/40 backdrop-blur-sm border border-emerald-500/15 rounded-xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedGroupId(null)}
                          className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-full cursor-pointer transition-colors"
                          title="Voltar para a lista"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                          <p className="text-[10px] text-emerald-400 font-bold tracking-wider font-mono uppercase">LIGA ATIVA</p>
                          <h2 className="text-lg font-black uppercase text-white tracking-wider">{selectedGroup?.name}</h2>
                          <p className="text-xs text-slate-400 font-bold uppercase mt-1">
                            Administrador: <span className="text-slate-300 font-normal">{selectedGroup?.adminName}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {/* Share Code */}
                        <div className="p-3 bg-black/60 border border-emerald-500/20 rounded-lg text-center">
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Código para Amigos</p>
                          <span className="text-lg font-black text-amber-400 select-all tracking-widest font-mono uppercase block mt-0.5">{selectedGroupId}</span>
                        </div>

                        {/* Admin Delete or Member Leave */}
                        {selectedGroup?.adminId === user.uid ? (
                          <button
                            onClick={handleDeleteGroup}
                            disabled={isGroupActionLoading}
                            className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 cursor-pointer transition-colors flex items-center gap-1.5 text-xs font-black uppercase tracking-wider"
                            title="Excluir Bolão"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Excluir</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleLeaveGroup}
                            disabled={isGroupActionLoading}
                            className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 cursor-pointer transition-colors flex items-center gap-1.5 text-xs font-black uppercase tracking-wider"
                            title="Sair do Bolão"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Sair</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Customized Leaderboard filtered by current group members */}
                    <Leaderboard
                      users={groupUsers}
                      currentUserId={user.uid}
                      groupName={`Classificação - ${selectedGroup?.name}`}
                    />

                  </div>
                )}
              </motion.div>
            )}

            {/* Leaderboard tab */}
            {activeTab === "leaderboard" && (
              <motion.div
                key="leaderboard_view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Leaderboard users={leaderboard} currentUserId={user.uid} />
              </motion.div>
            )}

          </AnimatePresence>

          {/* Interactive Notifications Section */}
          <NotificationCenter matches={matches} />

          {/* Sandboxed Admin Match & Points Simulator Control Panel */}
          <MatchAdminPanel matches={matches} predictions={predictions} />

        </div>

      </main>
    </div>
  );
}
