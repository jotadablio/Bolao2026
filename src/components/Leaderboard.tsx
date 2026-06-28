import { UserProfile } from "../types";
import { Trophy, Medal, Award, Users } from "lucide-react";
import { motion } from "motion/react";

interface LeaderboardProps {
  users: UserProfile[];
  currentUserId: string;
  groupName?: string;
}

export default function Leaderboard({ users, currentUserId, groupName }: LeaderboardProps) {
  return (
    <div className="bg-black/40 backdrop-blur-sm border border-emerald-500/10 rounded-xl shadow-lg p-5 flex flex-col gap-5">
      
      {/* Leaderboard stats summary */}
      <div className="flex justify-between items-center pb-3 border-b border-emerald-500/15">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm font-sans font-black text-white uppercase tracking-wider">
            {groupName || "Classificação Geral"}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded font-bold uppercase font-mono">
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span>{users.length} {users.length === 1 ? "Competidor" : "Competidores"}</span>
        </div>
      </div>

      {/* Leaderboard Table Header */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-emerald-500/10 text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest pb-3">
              <th className="py-2.5 px-3 text-center w-12">Pos</th>
              <th className="py-2.5 px-3">Competidor</th>
              <th className="py-2.5 px-3 text-center w-20">Palpites</th>
              <th className="py-2.5 px-3 text-center w-20">Exato (+3)</th>
              <th className="py-2.5 px-3 text-center w-20">Vencedor (+1)</th>
              <th className="py-2.5 px-3 text-right pr-4 w-24">Pontos Totais</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-xs text-emerald-400/50 font-bold uppercase tracking-wider font-mono">
                  Nenhum competidor participando ainda. Seja o primeiro!
                </td>
              </tr>
            ) : (
              users.map((user, index) => {
                const rank = index + 1;
                const isMe = user.uid === currentUserId;
                
                return (
                  <motion.tr
                     key={user.uid}
                     initial={{ opacity: 0, y: 5 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: index * 0.05 }}
                     className={`border-b last:border-0 border-emerald-500/5 text-xs font-medium transition-all ${
                       isMe 
                         ? "bg-amber-500/5 text-amber-400 font-bold" 
                         : "text-slate-300 hover:bg-emerald-500/5"
                     }`}
                  >
                     {/* Rank column */}
                     <td className="py-3 px-3 text-center">
                       <div className="flex items-center justify-center font-mono">
                         {rank === 1 ? (
                           <div className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                             <Medal className="w-3.5 h-3.5 fill-current" />
                           </div>
                         ) : rank === 2 ? (
                           <div className="w-5 h-5 rounded bg-slate-500/10 border border-slate-500/20 text-slate-400 flex items-center justify-center">
                             <Medal className="w-3.5 h-3.5 fill-current" />
                           </div>
                         ) : rank === 3 ? (
                           <div className="w-5 h-5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                             <Award className="w-3.5 h-3.5 fill-current" />
                           </div>
                         ) : (
                           <span className="text-slate-500 font-bold">{rank}</span>
                         )}
                       </div>
                     </td>

                     {/* Username profile info */}
                     <td className="py-3 px-3">
                       <div className="flex items-center gap-2.5">
                         <div className="w-7 h-7 rounded bg-black/60 text-emerald-400 border border-emerald-500/10 flex items-center justify-center text-xs font-bold overflow-hidden">
                           {user.photoURL ? (
                             <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                           ) : (
                             user.displayName.slice(0, 2).toUpperCase()
                           )}
                         </div>
                         <div className="flex flex-col">
                           <span className="flex items-center gap-1.5 text-white font-black uppercase tracking-wide">
                             {user.displayName}
                             {isMe && (
                               <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/20 uppercase tracking-widest font-black">
                                 Você
                               </span>
                             )}
                           </span>
                           <span className="text-[9px] text-slate-500 font-bold font-mono truncate max-w-[140px]">
                             {user.email}
                           </span>
                         </div>
                       </div>
                     </td>

                     {/* Count metrics */}
                     <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                       {user.predictionsCount || 0}
                     </td>
                     <td className="py-3 px-3 text-center">
                       <span className="px-1.5 py-0.5 rounded font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                         {user.exactCount || 0}
                       </span>
                     </td>
                     <td className="py-3 px-3 text-center">
                       <span className="px-1.5 py-0.5 rounded font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">
                         {user.outcomeCount || 0}
                       </span>
                     </td>

                     {/* Total points */}
                     <td className="py-3 px-3 text-right pr-4">
                       <span className="text-xs font-black text-amber-400 font-mono">
                         {user.totalPoints} PTS
                       </span>
                     </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
