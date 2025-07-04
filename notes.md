[] - We need a component to track game stats per player, and update a game.
- we will navigate here when we click the 'Edit' button on a game from the ManageGames component
- we need to decide the url path for this component
- It should be called GameTracking
- for the moment, it should show two columns, one for each team.
- in a vertical view for each team, include:
- team name
- a container with each player, using cards (include player name and image if available)
----------------------------------------------------------------

[x] - After creating a game, we need to display it in the games list at the bottom of the ManageGames component.

----------------------------------------------------------------

[x] - When creating a game, we should not list the mvp as we don't know it yet.

----------------------------------------------------------------

[x] - when creating a game for a league, I get an error: 
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

