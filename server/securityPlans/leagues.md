Security Plan for /leagues Endpoints

Endpoints





POST /api/leagues/: Creates a new league (admin only).



PATCH /api/leagues/:leagueId/end-season: Ends the active season (admin only).



POST /api/leagues/:leagueId/seasons: Creates a new season (admin only).



POST /api/leagues/:leagueId/teams/carry-over: Carries over teams to a new season (admin only).



GET /api/leagues/public: Fetches active public leagues (public).



GET /api/leagues/public/:leagueId: Retrieves public league details, teams, games, standings, leaders (public).



GET /api/leagues/: Fetches user’s admin/manager leagues (authenticated).



GET /api/leagues/:leagueId: Retrieves a single league by ID (authenticated).



PATCH /api/leagues/:leagueId: Updates a league’s details (admin only).



DELETE /api/leagues/:leagueId: Deletes a league (admin only).

Environment





Hosted on Render (Node.js, HTTPS default), MongoDB, GA4 for client-side pageviews/events via gtag.



JWTs in localStorage, Render environment variables for JWT_SECRET.



Middleware: authMiddleware (JWT validation) for authenticated endpoints; admin checks for POST, PATCH, DELETE.

Security Focus





Exploits: API abuse (DoS), injection (leagueId, settings), unauthorized access, session theft (XSS), data exposure (league/team/player data).



Standards: OWASP API Security Top 10 (Broken Authentication, BOLA, Excessive Data Exposure, Security Misconfiguration, Logging Failures).

POST /api/leagues/

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 10/hour per user ID/IP with express-rate-limit. Validate name (3-50 chars), sportType (enum), settings (e.g., foulOutLimit). Sanitize inputs. Enforce admin access.



Implementation Steps:





Apply express-rate-limit for 10/hour per user ID/IP.



Validate name, sportType, settings with express-validator.



Sanitize inputs to prevent injection.



Log invalid attempts via Winston.



Effectiveness: Prevents API abuse, injection, unauthorized access (OWASP API1, API2, API6).



Alternative: Google reCAPTCHA for anti-bot protection.





Why Better: Blocks automated creation, but needs client-side integration.



Pros:





Prevents mass league creation.



Validates inputs.



Enforces admin access.



Cons:





Needs Redis.



IP limiting affects shared IPs.



CAPTCHA adds friction.

PATCH /api/leagues/:leagueId/end-season

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 20/hour per user ID/IP. Validate leagueId as ObjectId, enforce admin access. Log invalid attempts.



Implementation Steps:





Use express-rate-limit for 20/hour per user ID/IP.



Validate leagueId with express-validator.



Enforce admin check.



Log attempts via Winston.



Effectiveness: Prevents API abuse, injection, unauthorized access (OWASP API1, API2, API6).



Alternative: Use transactions for atomic updates.





Why Better: Ensures consistency, but rate limiting prioritized.



Pros:





Prevents abuse, injection.



Enforces admin access.



Logging tracks attempts.



Cons:





Needs Redis.



IP limiting affects shared IPs.



Transactions add complexity.

POST /api/leagues/:leagueId/seasons

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 20/hour per user ID/IP. Validate leagueId, name, startDate, endDate. Sanitize inputs. Enforce admin access.



Implementation Steps:





Use express-rate-limit for 20/hour per user ID/IP.



Validate inputs with express-validator.



Sanitize inputs.



Log attempts via Winston.



Effectiveness: Prevents API abuse, injection, unauthorized access (OWASP API1, API2, API6).



Alternative: JSON Schema validation.





Why Better: Catches errors early, but adds complexity.



Pros:





Prevents abuse, injection.



Validates season data.



Enforces admin access.



Cons:





Needs Redis.



Complex validation.



IP limiting affects shared IPs.

POST /api/leagues/:leagueId/teams/carry-over

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 20/hour per user ID/IP. Validate leagueId, teamIds, newSeason. Sanitize inputs. Enforce admin access.



Implementation Steps:





Use express-rate-limit for 20/hour per user ID/IP.



Validate inputs with express-validator.



Sanitize inputs.



Log attempts via Winston.



Effectiveness: Prevents API abuse, injection, unauthorized access (OWASP API1, API2, API6).



Alternative: Use transactions for atomic team creation.





Why Better: Ensures consistency, but rate limiting prioritized.



Pros:





Prevents abuse, injection.



Validates inputs.



Enforces admin access.



Cons:





Needs Redis.



Complex validation.



IP limiting affects shared IPs.

GET /api/leagues/public

Recommended Approach: Rate Limiting with Database Query Monitoring





Description: Limit requests to 100/hour per IP with express-rate-limit. Monitor MongoDB queries (League.find) >100ms. Log requests, send failures to GA4.



Implementation Steps:





Use express-rate-limit for 100/hour per IP.



Configure MongoDB profiling (level 1) for queries >100ms.



Log requests via Winston.



Send failed requests to GA4.



Effectiveness: Mitigates API abuse, data exposure, detects slow queries (OWASP API1, API3, API8).



Alternative: Cloudflare WAF for rate limiting/DDoS protection.





Why Better: Offloads rate limiting, but requires external service.



Pros:





Prevents abuse.



Detects slow queries.



GA4 leverages existing setup.



Cons:





Needs Redis.



IP limiting affects shared IPs.



Profiling adds overhead.

GET /api/leagues/public/:leagueId

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 50/hour per IP. Validate leagueId, restrict response fields (e.g., exclude user.email). Log invalid attempts.



Implementation Steps:





Use express-rate-limit for 50/hour per IP.



Validate leagueId with express-validator.



Filter response to exclude sensitive fields.



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

GET /api/leagues/

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 100/hour per user ID/IP. Validate user access, restrict response fields. Log requests.



Implementation Steps:





Use express-rate-limit for 100/hour per user ID/IP.



Ensure authMiddleware validates JWT.



Filter response to exclude sensitive fields.



Log requests via Winston.



Effectiveness: Mitigates API abuse, data exposure, session theft (OWASP API1, API2, API3).



Alternative: HttpOnly cookies for JWTs.





Why Better: Prevents XSS, but needs client changes.



Pros:





Prevents abuse.



Reduces data exposure.



Enforces authentication.



Cons:





Needs Redis.



IP limiting affects shared IPs.



Cookie storage needs CSRF protection.

GET /api/leagues/:leagueId

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 100/hour per user ID/IP. Validate leagueId, restrict response fields. Log invalid attempts.



Implementation Steps:





Use express-rate-limit for 100/hour per user ID/IP.



Validate leagueId with express-validator.



Filter response to exclude sensitive fields.



Log invalid attempts via Winston.



Effectiveness: Prevents API abuse, injection, data exposure (OWASP API1, API3, API6).



Alternative: Cache responses in Redis.





Why Better: Reduces MongoDB load, but rate limiting prioritized.



Pros:





Prevents abuse, injection.



Reduces data exposure.



Render-compatible.



Cons:





Needs Redis.



IP limiting affects shared IPs.



Response filtering needs care.

PATCH /api/leagues/:leagueId

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 20/hour per user ID/IP. Validate leagueId, settings. Sanitize inputs. Enforce admin access.



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



Enforces admin access.



Cons:





Needs Redis.



Complex validation.



IP limiting affects shared IPs.

DELETE /api/leagues/:leagueId

Recommended Approach: Rate Limiting with Input Validation





Description: Limit requests to 10/hour per user ID/IP. Validate leagueId, enforce admin access. Log deletion attempts.



Implementation Steps:





Use express-rate-limit for 10/hour per user ID/IP.



Validate leagueId with express-validator.



Enforce admin check.



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



Session Management: JWTs in localStorage are vulnerable to XSS. HttpOnly cookies could enhance security, but require client-side changes.



API Versioning: Less critical for stable /leagues endpoints, but versioning (e.g., /api/v1/leagues) can be added for future-proofing.