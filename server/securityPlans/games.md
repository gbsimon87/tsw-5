Security Plan for /games Endpoints

Endpoints





GET /api/games/next-game: Fetches the next uncompleted game for the user’s team.



GET /api/games/:gameId: Retrieves a single game by ID.



GET /api/games/: Fetches games for a league and optional season.



POST /api/games/: Creates a new game (admin/manager only).



PATCH /api/games/:gameId: Updates game details, stats, or play-by-play (admin/manager only).



DELETE /api/games/:gameId: Deletes a game and adjusts player stats (admin/manager only).

Environment





Hosted on Render (Node.js, HTTPS default), MongoDB, GA4 for client-side pageviews/events via gtag.



JWTs stored in localStorage, Render environment variables for JWT_SECRET.



Middleware: authMiddleware (JWT validation), checkAdminOrManager (admin/manager access).

Security Focus





Exploits: API abuse (DoS), injection (gameId, playByPlay), unauthorized access, session theft (XSS), data exposure (game/player data).



Standards: OWASP API Security Top 10 (Broken Authentication, BOLA, Excessive Data Exposure, Security Misconfiguration, Logging Failures).

GET /api/games/next-game

Recommended Approach: Logging Security Events with Database Query Monitoring





Description: Log requests (IP, user ID, success/failure) with Winston. Monitor MongoDB queries (Player.find, Team.find, Game.findOne) for slow performance (>100ms). Send failed requests to GA4.



Implementation Steps:





Use Winston to log request details (IP, req.user._id, timestamp, status).



Configure MongoDB profiling (level 1) for queries >100ms.



Send failed requests to GA4 as custom events.



Alert on high request volumes using Render logs/GA4.



Effectiveness: Detects API abuse, brute-forcing (OWASP API8:2019). Identifies slow queries indicating DoS or inefficiencies.



Alternative: Rate limiting with express-rate-limit (100/hour per user ID/IP).





Why Better: Prevents abuse proactively, but logging leverages GA4 for detection.



Pros:





Detects suspicious patterns.



GA4 integration uses existing setup.



Query monitoring.



Minimal overhead.



Cons:





Detection-based.



Requires Winston/profiling setup.



GA4 needs custom events.

GET /api/games/:gameId

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 100/hour per user ID/IP with express-rate-limit. Validate gameId as ObjectId, sanitize inputs, restrict response fields (e.g., exclude teams.createdBy).



Implementation Steps:





Apply express-rate-limit for 100/hour per user ID/IP.



Strengthen mongoose.Types.ObjectId.isValid(gameId) with express-validator.



Filter response to exclude sensitive fields.



Log invalid gameId attempts via Winston.



Effectiveness: Mitigates API abuse, injection, data exposure (OWASP API1, API3, API6).



Alternative: Cloudflare WAF for rate limiting/validation.





Why Better: Offloads rate limiting, adds DDoS protection.



Pros:





Prevents abuse, injection.



Reduces data exposure.



Render-compatible.



Cons:





Needs Redis.



IP limiting affects shared IPs.



Response filtering needs care.

GET /api/games/

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 50/hour per user ID/IP. Validate leagueId as ObjectId, sanitize season, restrict response fields.



Implementation Steps:





Use express-rate-limit for 50/hour per user ID/IP.



Validate leagueId, sanitize season with express-validator.



Filter response to exclude sensitive fields.



Log invalid attempts via Winston.



Effectiveness: Prevents API abuse, injection, data exposure (OWASP API1, API3, API6).



Alternative: Redis caching for frequent queries.





Why Better: Reduces MongoDB load, but rate limiting is immediate security.



Pros:





Mitigates abuse, injection.



Reduces data exposure.



Render-compatible.



Cons:





Needs Redis.



IP limiting affects shared IPs.



Response filtering needs care.

POST /api/games/

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 20/hour per user ID/IP. Validate league, teams, playerStats with express-validator, sanitize inputs. Enforce checkAdminOrManager.



Implementation Steps:





Use express-rate-limit for 20/hour per user ID/IP.



Validate inputs (ObjectId, statTypes, team membership) with express-validator.



Sanitize inputs to prevent injection.



Log invalid attempts via Winston.



Effectiveness: Prevents API abuse, injection, unauthorized access (OWASP API1, API2, API6).



Alternative: JSON Schema validation with ajv.





Why Better: Catches validation errors early, but adds complexity.



Pros:





Prevents abuse, injection.



Strengthens validation.



Enforces admin access.



Cons:





Needs Redis.



Complex validation.



IP limiting affects shared IPs.

PATCH /api/games/:gameId

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 50/hour per user ID/IP. Validate gameId, playByPlay, playerStats with express-validator. Enforce checkAdminOrManager.



Implementation Steps:





Use express-rate-limit for 50/hour per user ID/IP.



Validate inputs (ObjectId, statTypes, team membership) with express-validator.



Sanitize inputs to prevent injection.



Log invalid attempts via Winston.



Effectiveness: Mitigates API abuse, injection, unauthorized access (OWASP API1, API2, API6).



Alternative: JSON Schema validation with ajv.





Why Better: Reduces server load, but adds complexity.



Pros:





Prevents stat manipulation.



Validates inputs.



Enforces admin access.



Cons:





Needs Redis.



Complex validation.



IP limiting affects shared IPs.

DELETE /api/games/:gameId

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 10/hour per user ID/IP. Validate gameId, enforce checkAdminOrManager. Log deletion attempts.



Implementation Steps:





Use express-rate-limit for 10/hour per user ID/IP.



Validate gameId with express-validator.



Enforce checkAdminOrManager.



Log attempts via Winston.



Effectiveness: Prevents API abuse, injection, unauthorized access (OWASP API1, API2, API6).



Alternative: Soft delete (isActive: false).





Why Better: Allows recovery, but requires schema changes.



Pros:





Prevents abuse, injection.



Enforces admin access.



Logging tracks deletions.



Cons:





Needs Redis.



IP limiting affects shared IPs.



Soft delete adds complexity.

Additional Notes





Non-Default Database Ports: If MongoDB is self-hosted on Render, change port from 27017 to a non-standard port (e.g., 27018) and restrict access via Render’s firewall. Not applicable for MongoDB Atlas.



Session Management: JWTs in localStorage are vulnerable to XSS. Consider HttpOnly cookies for endpoints like PATCH, but requires client-side changes.



API Versioning: Less critical for /games, but versioning (e.g., /api/v1/games) can be added for future-proofing.