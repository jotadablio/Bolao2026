# Firebase Security Rules Specification

## 1. Data Invariants
- Users can read and write only their own user profiles.
- Any logged-in user can read all matches and all predictions (to show leaderboard & predictions of other matches).
- Users can create or update predictions, but ONLY if:
  - The prediction's `userId` matches the authenticated user's `uid`.
  - The match has not started yet (current server time is before match kickoff time).
  - One prediction per match per user is enforced by setting the document ID to `userId_matchId`.
- Match data is read-only for general users; writing match scores or status requires admin authorization or simulator mock writes securely controlled.

## 2. The Dirty Dozen Payloads (Identity, Integrity, State)
1. **User Spoofing**: Write to `users/different_user_id` with own auth credentials. (Denied)
2. **Point Injection**: Update own `totalPoints` directly in profile to gain massive scores without correct guesses. (Denied)
3. **Admin Injection**: Set self as admin/role fields in user profiles. (Denied)
4. **Retroactive Pick**: Submit/update a prediction for a match whose kickoff time has already passed. (Denied)
5. **Prediction Spoofing**: Submit a prediction with a `userId` that belongs to someone else. (Denied)
6. **Prediction Hijacking**: Update another user's prediction document. (Denied)
7. **Score Modification**: Direct modification of a match's official scores by a regular user. (Denied)
8. **Match Status Override**: Direct modification of a match's status from `scheduled` to `finished` by a regular user. (Denied)
9. **Document ID Poisoning**: Submit a prediction with an extremely long or malformed document ID to consume resources. (Denied)
10. **Shadow Fields**: Creating user or prediction records with unsupported, undocumented fields. (Denied)
11. **Blanket Query Abuse**: Attempting a query-less read of all user private PII data. (Denied)
12. **Relation Orphan**: Attempting to write a prediction for a non-existent match ID. (Denied)

## 3. The Rules Design
We will write `firestore.rules` containing global rules that implement these constraints. Let's construct a robust rule set.
