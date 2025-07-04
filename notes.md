[] - when creating a game for a league, I get an error: 
checkAdminOrManager: leagueId from body/query: undefined
checkAdminOrManager: No leagueId provided

Request URL: http://localhost:5000/api/games
Request Method: POST
Status Code: 400 Bad Request

The component is showing 'League ID is required'

----------------------------------------------------------------

[x] - When joining a team, it reads "Successfully joined team: undefined"

Request URL: http://localhost:5000/api/teams/join
Request Method: POST
Status Code: 200 OK

----------------------------------------------------------------

[x] - MySporty is showing I am not part of any teams even though I am 
I believe it's using the wrong endpoint at /my-teams

Request URL: http://localhost:5000/api/teams/my-teams
Request Method: GET
Status Code: 304 Not Modified

