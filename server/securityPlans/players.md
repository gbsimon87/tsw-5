Security Plan for /players Endpoints

Endpoints





POST /api/players/: Creates a new player (admin/manager only).



GET /api/players/:playerId: Retrieves a player by ID with last 3 games' stats (authenticated).



GET /api/players/: Fetches players filtered by leagueId or userId (authenticated).



PATCH /api/players/:playerId: Updates a player’s details (admin/manager or own profile).



POST /api/players/:teamId/players/ringer: Adds a ringer player to a team (admin/manager only).



DELETE /api/players/:playerId: Deletes a player and removes from teams (admin/manager only).

Environment





Hosted on Render (Node.js, HTTPS default), MongoDB, GA4 for client-side pageviews/events via gtag.



JWTs in localStorage, Render environment variables for JWT_SECRET.



Middleware: authMiddleware (JWT validation) for all endpoints; checkAdminOrManager for POST, PATCH (ringer), DELETE.

Security Focus





Exploits: API abuse (DoS), injection (playerId, userId, stats), unauthorized access, session theft (XSS), data exposure (player/team data).



Standards: OWASP API Security Top 10 (Broken Authentication, BOLA, Excessive Data Exposure, Security Misconfiguration, Logging Failures).

POST /api/players/

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 20/hour per user ID/IP with express-rate-limit. Validate userId (ObjectId, existing user), position (enum). Sanitize inputs. Enforce checkAdminOrManager.



Implementation Steps:





Apply express-rate-limit for 20/hour per user ID/IP.



Validate userId, position with express-validator.



Sanitize inputs to prevent injection.



Log invalid attempts via Winston.



Effectiveness: Prevents API abuse, injection, unauthorized access (OWASP API1, API2, API6).



Alternative: Google reCAPTCHA for anti-bot protection.





Why Better: Blocks automated creation, but needs client-side integration.



Pros:





Prevents mass player creation.



Validates inputs.



Enforces admin/manager access.



Cons:





Needs Redis.



IP limiting affects shared IPs.



CAPTCHA adds friction.

GET /api/players/:playerId

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 100/hour per user ID/IP. Validate playerId, leagueId as ObjectIds, restrict response fields. Log invalid attempts.



Implementation Steps:





Use express-rate-limit for 100/hour per user ID/IP.



Validate playerId, leagueId with express-validator.



Filter response to exclude sensitive fields (e.g., user.email).



Log invalid attempts via Winston.



Effectiveness: Prevents API abuse, injection, data exposure (OWASP API1, API3, API6).



Alternative: Cache responses in Redis.





Why Better: Improves performance, but rate limiting prioritized.



Pros:





Prevents abuse, injection.



Reduces data exposure.



Render-compatible.



Cons:





Needs Redis.



IP limiting affects shared IPs.



Response filtering needs care.

GET /api/players/

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 50/hour per user ID/IP. Validate leagueId, userId as ObjectIds. Restrict response fields. Log invalid attempts.



Implementation Steps:





Use express-rate-limit for 50/hour per user ID/IP.



Validate leagueId, userId with express-validator.



Filter response to exclude sensitive fields.



Log invalid attempts via Winston.



Effectiveness: Prevents API abuse, injection, data exposure (OWASP API1, API3, API6).



Alternative: Cache aggregations in Redis.





Why Better: Reduces MongoDB load, but rate limiting prioritized.



Pros:





Prevents abuse, injection.



Reduces data exposure.



Render-compatible.



Cons:





Needs Redis.



IP limiting affects shared IPs.



Response filtering needs care.

PATCH /api/players/:playerId

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 20/hour per user ID/IP. Validate playerId, position, jerseyNumber. Enforce admin/manager or own profile access. Log invalid attempts.



Implementation Steps:





Use express-rate-limit for 20/hour per user ID/IP.



Validate inputs with express-validator.



Sanitize inputs.



Log invalid attempts via Winston.



Effectiveness: Prevents API abuse, injection, unauthorized access (OWASP API1, API2, API6).



Alternative: Use transactions for atomic updates.





Why Better: Ensures consistency, but rate limiting prioritized.



Pros:





Prevents abuse, injection.



Validates inputs.



Enforces access control.



Cons:





Needs Redis.



Complex validation.



IP limiting affects shared IPs.

POST /api/players/:teamId/players/ringer

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 20/hour per user ID/IP. Validate teamId, leagueId, name, jerseyNumber, position. Enforce checkAdminOrManager. Log invalid attempts.



Implementation Steps:





Use express-rate-limit for 20/hour per user ID/IP.



Validate inputs with express-validator.



Sanitize inputs.



Log invalid attempts via Winston.



Effectiveness: Prevents API abuse, injection, unauthorized access (OWASP API1, API2, API6).



Alternative: Google reCAPTCHA for anti-bot protection.





Why Better: Blocks automated creation, but needs client-side changes.



Pros:





Prevents abuse, injection.



Validates inputs.



Enforces admin/manager access.



Cons:





Needs Redis.



Complex validation.



IP limiting affects shared IPs.

DELETE /api/players/:playerId

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 10/hour per user ID/IP. Validate playerId. Enforce checkAdminOrManager. Log deletion attempts.



Implementation Steps:





Use express-rate-limit for 10/hour per user ID/IP.



Validate playerId with express-validator.



Enforce checkAdminOrManager.



Log deletion attempts via Winston.



Effectiveness: Prevents API abuse, injection, unauthorized access (OWASP API1, API2, API6).



Alternative: Soft delete (isActive: false).





Why Better: Allows recovery, but requires schema changes.



Pros:





Prevents abuse, injection.



Enforces admin/manager access.



Logging tracks deletions.



Cons:





Needs Redis.



IP limiting affects shared IPs.



Soft delete adds complexity.

Additional Notes





Non-Default Database Ports: If MongoDB is self-hosted on Render, change port from 27017 to a non-standard port (e.g., 27018) and restrict access via Render’s firewall. Not applicable for MongoDB Atlas.



Session Management: JWTs in localStorage are vulnerable to XSS. HttpOnly cookies could enhance security for authenticated endpoints, but require client-side changes.



API Versioning: Less critical for stable /players endpoints, but versioning (e.g., /api/v1/players) can be added for future-proofing.