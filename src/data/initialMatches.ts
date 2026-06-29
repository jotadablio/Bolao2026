import { Match } from "../types";

export const INITIAL_MATCHES: Match[] = [
  {
    id: "match_rsa_can",
    homeTeam: "África do Sul",
    awayTeam: "Canadá",
    homeFlag: "🇿🇦",
    awayFlag: "🇨🇦",
    kickoffTime: new Date(2026, 5, 28, 16, 0).toISOString(), // 28 de Junho, 16:00
    status: "scheduled",
    stage: "16avos de Final"
  },
  {
    id: "match_bra_jpn",
    homeTeam: "Brasil",
    awayTeam: "Japão",
    homeFlag: "🇧🇷",
    awayFlag: "🇯🇵",
    kickoffTime: new Date(2026, 5, 29, 14, 0).toISOString(), // 29 de Junho, 14:00
    status: "scheduled",
    stage: "16avos de Final"
  },
  {
    id: "match_ger_par",
    homeTeam: "Alemanha",
    awayTeam: "Paraguai",
    homeFlag: "🇩🇪",
    awayFlag: "🇵🇾",
    kickoffTime: new Date(2026, 5, 29, 17, 30).toISOString(), // 29 de Junho, 17:30
    status: "scheduled",
    stage: "16avos de Final"
  },
  {
    id: "match_ned_mar",
    homeTeam: "Holanda",
    awayTeam: "Marrocos",
    homeFlag: "🇳🇱",
    awayFlag: "🇲🇦",
    kickoffTime: new Date(2026, 5, 29, 22, 0).toISOString(), // 29 de Junho, 22:00
    status: "scheduled",
    stage: "16avos de Final"
  },
  {
    id: "match_civ_nor",
    homeTeam: "Costa do Marfim",
    awayTeam: "Noruega",
    homeFlag: "🇨🇮",
    awayFlag: "🇳🇴",
    kickoffTime: new Date(2026, 5, 30, 14, 0).toISOString(), // 30 de Junho, 14:00
    status: "scheduled",
    stage: "16avos de Final"
  },
  {
    id: "match_fra_swe",
    homeTeam: "França",
    awayTeam: "Suécia",
    homeFlag: "🇫🇷",
    awayFlag: "🇸🇪",
    kickoffTime: new Date(2026, 5, 30, 18, 0).toISOString(), // 30 de Junho, 18:00
    status: "scheduled",
    stage: "16avos de Final"
  },
  {
    id: "match_mex_ecu",
    homeTeam: "México",
    awayTeam: "Equador",
    homeFlag: "🇲🇽",
    awayFlag: "🇪🇨",
    kickoffTime: new Date(2026, 5, 30, 22, 0).toISOString(), // 30 de Junho, 22:00
    status: "scheduled",
    stage: "16avos de Final"
  },
  {
    id: "match_eng_cod",
    homeTeam: "Inglaterra",
    awayTeam: "RD Congo",
    homeFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    awayFlag: "🇨🇩",
    kickoffTime: new Date(2026, 6, 1, 13, 0).toISOString(), // 1 de Julho, 13:00
    status: "scheduled",
    stage: "16avos de Final"
  },
  {
    id: "match_bel_sen",
    homeTeam: "Bélgica",
    awayTeam: "Senegal",
    homeFlag: "🇧🇪",
    awayFlag: "🇸🇳",
    kickoffTime: new Date(2026, 6, 1, 17, 0).toISOString(), // 1 de Julho, 17:00
    status: "scheduled",
    stage: "16avos de Final"
  },
  {
    id: "match_usa_bih",
    homeTeam: "Estados Unidos",
    awayTeam: "Bósnia",
    homeFlag: "🇺🇸",
    awayFlag: "🇧🇦",
    kickoffTime: new Date(2026, 6, 1, 21, 0).toISOString(), // 1 de Julho, 21:00
    status: "scheduled",
    stage: "16avos de Final"
  },
  {
    id: "match_esp_aut",
    homeTeam: "Espanha",
    awayTeam: "Áustria",
    homeFlag: "🇪🇸",
    awayFlag: "🇦🇹",
    kickoffTime: new Date(2026, 6, 2, 16, 0).toISOString(), // 2 de Julho, 16:00
    status: "scheduled",
    stage: "16avos de Final"
  },
  {
    id: "match_por_cro",
    homeTeam: "Portugal",
    awayTeam: "Croácia",
    homeFlag: "🇵🇹",
    awayFlag: "🇭🇷",
    kickoffTime: new Date(2026, 6, 2, 20, 0).toISOString(), // 2 de Julho, 20:00
    status: "scheduled",
    stage: "16avos de Final"
  },
  {
    id: "match_sui_alg",
    homeTeam: "Suíça",
    awayTeam: "Argélia",
    homeFlag: "🇨🇭",
    awayFlag: "🇩🇿",
    kickoffTime: new Date(2026, 6, 3, 0, 0).toISOString(), // 3 de Julho, 00:00 (Sexta-feira 0h)
    status: "scheduled",
    stage: "16avos de Final"
  },
  {
    id: "match_aus_egy",
    homeTeam: "Austrália",
    awayTeam: "Egito",
    homeFlag: "🇦🇺",
    awayFlag: "🇪🇬",
    kickoffTime: new Date(2026, 6, 3, 15, 0).toISOString(), // 3 de Julho, 15:00
    status: "scheduled",
    stage: "16avos de Final"
  },
  {
    id: "match_arg_cpv",
    homeTeam: "Argentina",
    awayTeam: "Cabo Verde",
    homeFlag: "🇦🇷",
    awayFlag: "🇨🇻",
    kickoffTime: new Date(2026, 6, 3, 19, 0).toISOString(), // 3 de Julho, 19:00
    status: "scheduled",
    stage: "16avos de Final"
  },
  {
    id: "match_col_gha",
    homeTeam: "Colômbia",
    awayTeam: "Gana",
    homeFlag: "🇨🇴",
    awayFlag: "🇬🇭",
    kickoffTime: new Date(2026, 6, 3, 22, 30).toISOString(), // 3 de Julho, 22:30
    status: "scheduled",
    stage: "16avos de Final"
  }
];
