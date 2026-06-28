import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  writeBatch,
  collectionGroup,
  where,
  deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { Match, Prediction, UserProfile, Group, GroupMember } from "./types";
import { INITIAL_MATCHES } from "./data/initialMatches";

// 1. Subscribe to Matches (Real-time)
// If matches collection is empty, seed it with INITIAL_MATCHES
export function subscribeMatches(onUpdate: (matches: Match[]) => void) {
  const matchesRef = collection(db, "matches");
  
  return onSnapshot(matchesRef, async (snapshot) => {
    if (snapshot.empty) {
      // Seed INITIAL_MATCHES
      console.log("Seeding initial matches...");
      try {
        const batch = writeBatch(db);
        INITIAL_MATCHES.forEach((match) => {
          const docRef = doc(db, "matches", match.id);
          batch.set(docRef, match);
        });
        await batch.commit();
      } catch (error) {
        console.error("Failed to seed initial matches:", error);
      }
    } else {
      const matches: Match[] = [];
      snapshot.forEach((doc) => {
        matches.push(doc.data() as Match);
      });
      // Sort matches by kickoffTime
      matches.sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime());
      onUpdate(matches);
    }
  }, (error) => {
    console.error("Error subscribing to matches:", error);
  });
}

// 2. Subscribe to Predictions (Real-time)
export function subscribePredictions(onUpdate: (predictions: Prediction[]) => void) {
  const predictionsRef = collection(db, "predictions");
  return onSnapshot(predictionsRef, (snapshot) => {
    const predictions: Prediction[] = [];
    snapshot.forEach((doc) => {
      predictions.push(doc.data() as Prediction);
    });
    onUpdate(predictions);
  }, (error) => {
    console.error("Error subscribing to predictions:", error);
  });
}

// 3. Subscribe to Leaderboard/User profiles sorted by totalPoints
export function subscribeLeaderboard(onUpdate: (users: UserProfile[]) => void) {
  const usersRef = collection(db, "users");
  return onSnapshot(usersRef, (snapshot) => {
    const users: UserProfile[] = [];
    snapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    // Sort descending by totalPoints
    users.sort((a, b) => {
      const pointsDiff = b.totalPoints - a.totalPoints;
      if (pointsDiff !== 0) return pointsDiff;
      // Secondary sort: prediction count or display name
      return (b.predictionsCount || 0) - (a.predictionsCount || 0);
    });
    onUpdate(users);
  }, (error) => {
    console.error("Error subscribing to leaderboard:", error);
  });
}

// 4. Save/Update User Profile
export async function saveUserProfile(user: UserProfile) {
  const userRef = doc(db, "users", user.uid);
  try {
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      // Create new
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || "Anonymous Player",
        email: user.email,
        photoURL: user.photoURL || "",
        totalPoints: 0,
        predictionsCount: 0,
        exactCount: 0,
        outcomeCount: 0
      });
    } else {
      // Keep existing scores but update profile info
      const data = docSnap.data();
      await setDoc(userRef, {
        ...data,
        displayName: user.displayName || data.displayName,
        email: user.email || data.email,
        photoURL: user.photoURL || data.photoURL
      }, { merge: true });
    }
  } catch (error) {
    console.error("Error saving user profile:", error);
  }
}

// 5. Submit or Update a Prediction
export async function submitPrediction(prediction: Prediction) {
  const predictionId = `${prediction.userId}_${prediction.matchId}`;
  const predictionRef = doc(db, "predictions", predictionId);
  try {
    await setDoc(predictionRef, {
      ...prediction,
      id: predictionId,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error submitting prediction:", error);
    throw error;
  }
}

// 6. Update Match (for Simulator/Admin dashboard)
export async function updateMatch(match: Match) {
  const matchRef = doc(db, "matches", match.id);
  try {
    await setDoc(matchRef, match, { merge: true });
  } catch (error) {
    console.error("Error updating match:", error);
    throw error;
  }
}

// 7. Scoring Engine: Recalculate points for all users based on match outcomes
// Standard rules: +3 points for exact score, +1 point for correct winner (including draws)
export async function recalculateScores(matches: Match[], predictions: Prediction[]) {
  try {
    const batch = writeBatch(db);
    
    // Map to quickly find match status/score
    const matchesMap = new Map<string, Match>();
    matches.forEach(m => matchesMap.set(m.id, m));

    // Map to accumulate totals for each user
    const userStatsMap = new Map<string, {
      totalPoints: number;
      predictionsCount: number;
      exactCount: number;
      outcomeCount: number;
    }>();

    // Loop through each prediction
    for (const pred of predictions) {
      const match = matchesMap.get(pred.matchId);
      if (!match) continue;

      let pointsEarned = 0;
      let isProcessed = false;

      if (match.status === "finished" && match.homeScore !== undefined && match.awayScore !== undefined) {
        isProcessed = true;
        const actualHome = match.homeScore;
        const actualAway = match.awayScore;
        const predHome = pred.predictedHomeScore;
        const predAway = pred.predictedAwayScore;

        // Check exact score
        if (actualHome === predHome && actualAway === predAway) {
          pointsEarned = 3;
        } else {
          // Check correct winner or draw
          const actualResult = Math.sign(actualHome - actualAway); // 1 for home win, -1 for away win, 0 for draw
          const predResult = Math.sign(predHome - predAway);

          if (actualResult === predResult) {
            pointsEarned = 1;
          } else {
            pointsEarned = 0;
          }
        }
      }

      // If points changed or status changed, schedule an update for the prediction
      if (pred.pointsEarned !== pointsEarned || pred.status !== (isProcessed ? "processed" : "pending")) {
        const predRef = doc(db, "predictions", pred.id);
        batch.update(predRef, {
          pointsEarned: pointsEarned,
          status: isProcessed ? "processed" : "pending"
        });
      }

      // Accumulate for user stats
      const currentStats = userStatsMap.get(pred.userId) || {
        totalPoints: 0,
        predictionsCount: 0,
        exactCount: 0,
        outcomeCount: 0
      };

      currentStats.predictionsCount += 1;
      if (isProcessed) {
        currentStats.totalPoints += pointsEarned;
        if (pointsEarned === 3) {
          currentStats.exactCount += 1;
        } else if (pointsEarned === 1) {
          currentStats.outcomeCount += 1;
        }
      }

      userStatsMap.set(pred.userId, currentStats);
    }

    // Submit batch prediction updates
    await batch.commit();

    // Now update each user profile document with their aggregated stats
    const userBatch = writeBatch(db);
    for (const [userId, stats] of userStatsMap.entries()) {
      const userRef = doc(db, "users", userId);
      userBatch.update(userRef, {
        totalPoints: stats.totalPoints,
        predictionsCount: stats.predictionsCount,
        exactCount: stats.exactCount,
        outcomeCount: stats.outcomeCount
      });
    }

    // Commit user updates
    await userBatch.commit();
    console.log("Successfully recalculated points and updated user profiles.");
  } catch (error) {
    console.error("Error recalculating scores:", error);
  }
}

// 8. Custom Group (Bolão) operations
export async function createGroup(name: string, adminId: string, adminName: string): Promise<string> {
  // Generate random 6 character alphanumeric code
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let groupId = "";
  for (let i = 0; i < 6; i++) {
    groupId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  const groupRef = doc(db, "groups", groupId);
  const group: Group = {
    id: groupId,
    name,
    adminId,
    adminName,
    createdAt: new Date().toISOString()
  };
  
  await setDoc(groupRef, group);
  
  // Creator automatically joins as a member
  const memberRef = doc(db, "groups", groupId, "members", adminId);
  await setDoc(memberRef, {
    userId: adminId,
    joinedAt: new Date().toISOString()
  });
  
  return groupId;
}

export async function joinGroup(groupId: string, userId: string) {
  const cleanId = groupId.trim().toUpperCase();
  const groupRef = doc(db, "groups", cleanId);
  const groupSnap = await getDoc(groupRef);
  
  if (!groupSnap.exists()) {
    throw new Error("Grupo de bolão não encontrado. Verifique o código e tente novamente.");
  }
  
  const memberRef = doc(db, "groups", cleanId, "members", userId);
  await setDoc(memberRef, {
    userId: userId,
    joinedAt: new Date().toISOString()
  });
}

export async function leaveGroup(groupId: string, userId: string) {
  const memberRef = doc(db, "groups", groupId, "members", userId);
  await deleteDoc(memberRef);
}

export async function deleteGroup(groupId: string) {
  const groupRef = doc(db, "groups", groupId);
  await deleteDoc(groupRef);
}

// 9. Real-time subscription to user's joined groups
export function subscribeUserGroups(userId: string, onUpdate: (groups: Group[]) => void) {
  const membersQuery = query(collectionGroup(db, "members"), where("userId", "==", userId));
  
  return onSnapshot(membersQuery, async (snapshot) => {
    try {
      const groupPromises = snapshot.docs.map(async (docSnap) => {
        // Doc is under /groups/{groupId}/members/{userId}
        const groupRef = docSnap.ref.parent.parent;
        if (!groupRef) return null;
        const groupDoc = await getDoc(groupRef);
        return groupDoc.exists() ? (groupDoc.data() as Group) : null;
      });
      
      const resolved = await Promise.all(groupPromises);
      const groups = resolved.filter((g): g is Group => g !== null);
      // Sort by name
      groups.sort((a, b) => a.name.localeCompare(b.name));
      onUpdate(groups);
    } catch (err) {
      console.error("Error fetching joined groups metadata:", err);
    }
  }, (error) => {
    console.error("Error in members query listener:", error);
  });
}

// 10. Real-time subscription to group members
export function subscribeGroupMembers(groupId: string, onUpdate: (userIds: string[]) => void) {
  const membersRef = collection(db, "groups", groupId, "members");
  return onSnapshot(membersRef, (snapshot) => {
    const userIds: string[] = [];
    snapshot.forEach((doc) => {
      userIds.push(doc.id);
    });
    onUpdate(userIds);
  }, (error) => {
    console.error("Error subscribing to group members:", error);
  });
}

// 11. Admin helper to reset/seed matches to the official 16 matches
export async function resetMatchesToOfficial() {
  const batch = writeBatch(db);
  INITIAL_MATCHES.forEach((match) => {
    const docRef = doc(db, "matches", match.id);
    batch.set(docRef, match);
  });
  await batch.commit();
}

