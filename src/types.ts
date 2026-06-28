export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string; // flag emoji or country code
  awayFlag: string;
  kickoffTime: string; // ISO date-time string
  status: "scheduled" | "live" | "finished";
  homeScore?: number;
  awayScore?: number;
  stage: string; // e.g., "Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "Final"
}

export interface Prediction {
  id: string; // formatted as "userId_matchId"
  userId: string;
  matchId: string;
  userEmail: string;
  userName: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  pointsEarned?: number; // 0, 1, or 3
  status: "pending" | "processed";
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  totalPoints: number;
  predictionsCount?: number;
  exactCount?: number;
  outcomeCount?: number;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  type: "match_reminder" | "score_update" | "system";
  read: boolean;
}

export interface Group {
  id: string;
  name: string;
  adminId: string;
  adminName: string;
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  joinedAt: string;
}

