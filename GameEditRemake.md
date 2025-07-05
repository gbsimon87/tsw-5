Steps to migrate GameEdit component.

To efficiently extract the UI elements from the `GameEdit` component for use in Application 2, which has a different data structure, I’ll identify all distinct UI components, describe their functionality, and specify the data (via props) required for each to render and operate correctly. The focus is on creating reusable, presentational components that are decoupled from Application 1’s state management and business logic, relying solely on props to adapt to Application 2’s data structure. I’ll proceed step-by-step, starting with identifying the UI components and their required data, ensuring clarity and efficiency.

### Step 1: Identify UI Components and Required Data

The `GameEdit` component contains several distinct UI sections, each responsible for a specific part of the user interface. Below, I’ll list each UI component, describe its purpose, and specify the data (props) required for rendering and interaction. The components will be designed to be presentational, accepting all necessary data and event handlers via props to ensure reusability in Application 2.

#### 1. ClockControls
- **Purpose**: Displays the game clock (period, time, and play/pause button) and allows editing of minutes and seconds.
- **UI Elements**:
  - Period display (e.g., “Q1” or “H1”).
  - Input fields for minutes and seconds.
  - Play/pause button with `PauseIcon` or `PlayIcon`.
- **Required Data (Props)**:
  - `periodType`: String (`'quarters'` or `'halves'`) – Determines whether to display “Q” or “H” for periods.
  - `currentPeriod`: Number – Current game period (e.g., 1, 2).
  - `editMinutes`: String – Minutes for the clock input (e.g., “12”).
  - `editSeconds`: String – Seconds for the clock input (e.g., “34”).
  - `isClockRunning`: Boolean – Indicates if the clock is running to toggle between play/pause icons.
  - `onTimeEdit`: Function `(type: 'minutes' | 'seconds', value: string) => void` – Handles changes to minute/second inputs.
  - `onPlayPause`: Function `() => void` – Toggles the clock’s running state.
- **Notes**: Relies on `@heroicons/react` for icons. Application 2 must provide formatted strings for `editMinutes` and `editSeconds` (e.g., “00” format).

#### 2. ScreenNavigation
- **Purpose**: Displays a grid of buttons to switch between different screens (Players, PBP, Subs, Box, Qtr, Finish).
- **UI Elements**:
  - Six buttons with icons (`UserGroupIcon`, `ListBulletIcon`, `ArrowsRightLeftIcon`, `TableCellsIcon`, `ClockIcon`) and labels.
  - Finish button, conditionally disabled if no game data.
- **Required Data (Props)**:
  - `activeScreen`: String – Current screen ID (e.g., `'players'`, `'playByPlay'`) to highlight the active button.
  - `game`: Object | null – Game data to enable/disable the Finish button (can be null during loading).
  - `onScreenChange`: Function `(screen: string) => void` – Handles screen change events.
  - `onFinishGame`: Function `() => void` – Triggers the finish game action (e.g., opens a modal).
- **Notes**: Uses `@heroicons/react` for icons. The button configuration (icons and labels) is static, but Application 2 may need to customize the screens array or styling.

#### 3. CourtSelection
- **Purpose**: Renders an SVG basketball court for selecting shot locations, with a back button and player info.
- **UI Elements**:
  - Back button with arrow icon.
  - Text displaying the current player’s name and jersey.
  - SVG court with clickable areas and optional location marker.
- **Required Data (Props)**:
  - `currentPlayer`: Object | null – `{ name: string, jersey: string, courtLocation?: { x: number, y: number } }` – Player data and optional court coordinates.
  - `onBack`: Function `() => void` – Handles back navigation.
  - `onCourtClick`: Function `(event: MouseEvent) => void` – Handles SVG click events to record coordinates.
- **Notes**: The SVG is hardcoded for a basketball court. Application 2 may need to adjust coordinates or SVG structure if using a different sport or court layout.

#### 4. StatSelection
- **Purpose**: Displays a grid of buttons for selecting stats to record for a player.
- **UI Elements**:
  - Back button with arrow icon.
  - Text displaying the current player’s name and jersey.
  - Grid of buttons for each stat (labels from `statOptions`).
- **Required Data (Props)**:
  - `currentPlayer`: Object – `{ name: string, jersey: string }` – Player data for display.
  - `statOptions`: Array – `[{ key: string, label: string }]` – List of available stats (e.g., `{ key: 'twoPointFGM', label: '2PT Made' }`).
  - `onBack`: Function `() => void` – Handles back navigation.
  - `onStatClick`: Function `(statKey: string) => void` – Handles stat selection.
- **Notes**: Application 2 must provide its own `statOptions` array, which may differ in keys or labels based on its data structure.

#### 5. AssistSelection
- **Purpose**: Allows selection of a player who assisted on a shot, with a “No Assist” option.
- **UI Elements**:
  - Back button with arrow icon.
  - Text displaying the current player’s name and jersey.
  - Grid of buttons for active players and “No Assist”.
- **Required Data (Props)**:
  - `currentPlayer`: Object | null – `{ name: string, jersey: string, playerId: string }` – Player who made the shot.
  - `activePlayers`: Array – `[{ playerId: string, name: string, jersey: string }]` – List of players on the court (same team, excluding current player).
  - `onBack`: Function `() => void` – Handles back navigation.
  - `onAssistSelection`: Function `(assistPlayerId: string) => void` – Handles assist selection (includes `'no-assist'`).
- **Notes**: Application 2’s player data structure must map to `{ playerId, name, jersey }`. The `'no-assist'` option is hardcoded.

#### 6. ReboundSelection
- **Purpose**: Allows selection of a player who rebounded a shot, with a “No Rebound” option and separate sections for same and opposing teams.
- **UI Elements**:
  - Back button with arrow icon.
  - Text displaying the current player’s name and jersey.
  - “No Rebound” button.
  - Two sections with team names and grids of player buttons (same team in blue, opposing team in purple).
- **Required Data (Props)**:
  - `currentPlayer`: Object | null – `{ name: string, jersey: string, playerId: string }` – Player who attempted the shot.
  - `sameTeamPlayers`: Array – `[{ playerId: string, name: string, jersey: string }]` – Players on the same team.
  - `opposingTeamPlayers`: Array – `[{ playerId: string, name: string, jersey: string }]` – Players on the opposing team.
  - `sameTeamName`: String – Name of the current player’s team.
  - `opposingTeamName`: String – Name of the opposing team.
  - `onBack`: Function `() => void` – Handles back navigation.
  - `onReboundSelection`: Function `(reboundPlayerId: string) => void` – Handles rebound selection (includes `'nobody'`).
- **Notes**: Application 2 must provide team names and player lists, mapping its data to the expected structure. Styling (blue for same team, purple for opposing) can be customized.

#### 7. TurnoverSelection
- **Purpose**: Allows selection of an opposing player who committed a turnover.
- **UI Elements**:
  - Back button with arrow icon.
  - Text displaying the current player’s name and jersey.
  - Grid of buttons for opposing players.
- **Required Data (Props)**:
  - `currentPlayer`: Object | null – `{ name: string, jersey: string, playerId: string }` – Player who caused the turnover.
  - `opposingPlayers`: Array – `[{ playerId: string, name: string, jersey: string }]` – Players on the opposing team.
  - `onBack`: Function `() => void` – Handles back navigation.
  - `onTurnoverSelection`: Function `(turnoverPlayerId: string) => void` – Handles turnover selection.
- **Notes**: No “nobody” option, as a turnover requires a player. Application 2 must map its player data to the expected structure.

#### 8. StealSelection
- **Purpose**: Allows selection of an opposing player who stole the ball, with a “Nobody” option.
- **UI Elements**:
  - Back button with arrow icon.
  - Text displaying the current player’s name and jersey.
  - “Nobody” button and grid of buttons for opposing players.
- **Required Data (Props)**:
  - `currentPlayer`: Object | null – `{ name: string, jersey: string, playerId: string }` – Player who lost the ball.
  - `opposingPlayers`: Array – `[{ playerId: string, name: string, jersey: string }]` – Players on the opposing team.
  - `onBack`: Function `() => void` – Handles back navigation.
  - `onStealSelection`: Function `(stealPlayerId: string) => void` – Handles steal selection (includes `'nobody'`).
- **Notes**: Similar to `TurnoverSelection` but includes a “Nobody” option. Application 2 must map player data accordingly.

#### 9. PlayerSelection (Existing Component)
- **Purpose**: Displays players for both teams, allowing selection for stat recording.
- **UI Elements**: Team scores, player lists with clickable buttons, and stat recording indicators.
- **Required Data (Props)**:
  - `game`: Object – Contains game data (e.g., `team1Name`, `team2Name`, `playerStats`, `team1Id`, `team2Id`).
  - `calculateTeamScore`: Function `(teamId: string) => number` – Calculates team score based on stats.
  - `handlePlayerClick`: Function `(player: object, team: string) => void` – Handles player selection.
  - `handleKeyDown`: Function `(event: KeyboardEvent) => void` – Handles keyboard navigation.
  - `hasGameStarted`: Boolean – Indicates if the game has started.
  - `remainingSeconds`: Number | null – Remaining time in the period.
- **Notes**: Already a separate component. Application 2 must map its game data to match the expected structure or modify the component’s props to be more generic (e.g., use `players` instead of `playerStats`).

#### 10. Substitutions (Existing Component)
- **Purpose**: Manages player substitutions for both teams.
- **UI Elements**: Team selector, player checkboxes for on-court status.
- **Required Data (Props)**:
  - `game`: Object – Contains game data (e.g., `team1Name`, `team2Name`, `playerStats`).
  - `selectedSubTeam`: String – Current team for substitution (`'team1'` or `'team2'`).
  - `onCourtPlayersTeam1`: Array – Player IDs on court for team 1.
  - `onCourtPlayersTeam2`: Array – Player IDs on court for team 2.
  - `setSelectedSubTeam`: Function `(team: string) => void` – Updates selected team.
  - `handleSubstitutionChange`: Function `(playerId: string, team: string, checked: boolean) => boolean` – Handles substitution changes.
- **Notes**: Reusable as-is if Application 2 maps its data to match the prop structure. May need prop adjustments for different player ID formats.

#### 11. PlayByPlay (Existing Component)
- **Purpose**: Displays a play-by-play log of game events.
- **UI Elements**: Tabs for filtering events and a list of plays.
- **Required Data (Props)**:
  - `game`: Object – Contains game data (e.g., `playerStats`, event logs).
  - `selectedPlayByPlayTab`: String – Current tab (e.g., `'all'`).
  - `setSelectedPlayByPlayTab`: Function `(tab: string) => void` – Updates selected tab.
  - `statOptions`: Array – `[{ key: string, label: string }]` – Stat types for filtering.
- **Notes**: Application 2 must provide event data in a compatible format or modify the component to handle its event structure.

#### 12. BoxScore (Existing Component)
- **Purpose**: Displays a box score for game statistics.
- **UI Elements**: Team selector and table of player stats.
- **Required Data (Props)**:
  - `game`: Object – Contains game data (e.g., `playerStats`, `team1Id`, `team2Id`).
  - `selectedBoxScoreTeam`: String – Current team (`'team1'` or `'team2'`).
  - `setSelectedBoxScoreTeam`: Function `(team: string) => void` – Updates selected team.
  - `calculateBoxScore`: Function `(game: object, teamId: string) => object` – Calculates box score data.
- **Notes**: Application 2 must map its stats data to the expected format or adjust the component’s logic.

#### 13. PeriodSelection (Existing Component)
- **Purpose**: Allows switching between game periods.
- **UI Elements**: Buttons or dropdown for period selection.
- **Required Data (Props)**:
  - `game`: Object – Contains game data (e.g., `currentPeriod`, `periodType`).
  - `handlePeriodChange`: Function `(period: number) => void` – Updates current period.
- **Notes**: Reusable if Application 2’s period data aligns with the expected structure.

#### 14. FinishGameModal (Existing Component)
- **Purpose**: Modal for selecting the final game status (e.g., in-progress, postponed, completed).
- **UI Elements**: Radio buttons for status selection, Cancel/Confirm buttons.
- **Required Data (Props)**:
  - `game`: Object – Contains game data (e.g., `status`).
  - `handleFinishGame`: Function `(status: string) => void` – Updates game status.
- **Notes**: Uses `useModal` context for modal control. Application 2 must provide a compatible modal context or replace with its own modal system.

#### 15. ToastContainer
- **Purpose**: Displays toast notifications for user feedback (e.g., stat recorded, errors).
- **UI Elements**: Configurable toast messages via `react-toastify`.
- **Required Data (Props)**: None (configured via `react-toastify` API in the parent component).
- **Notes**: Reusable as-is, but Application 2 must include `react-toastify` and call `toast` functions in its event handlers.

---

### Summary of UI Components and Data Requirements
The `GameEdit` component contains 15 distinct UI components, with 8 new components to be created (`ClockControls`, `ScreenNavigation`, `CourtSelection`, `StatSelection`, `AssistSelection`, `ReboundSelection`, `TurnoverSelection`, `StealSelection`) and 6 existing components (`PlayerSelection`, `Substitutions`, `PlayByPlay`, `BoxScore`, `PeriodSelection`, `FinishGameModal`) that are already separate but may need prop adjustments. The `ToastContainer` is a third-party component requiring no changes.

Each new component requires props for:
- **Display Data**: Player info (`name`, `jersey`, `playerId`), team names, stat options, period info, etc.
- **Interaction Handlers**: Functions for clicks, input changes, and navigation (e.g., `onBack`, `onStatClick`).
- **State Indicators**: Booleans (e.g., `isClockRunning`) or strings (e.g., `activeScreen`) to control UI state.

### Next Steps for Efficiency
To proceed efficiently, I recommend:
1. **Create New Components**: Generate the 8 new presentational components (`ClockControls`, `ScreenNavigation`, etc.) with JSX code and prop definitions, wrapped in `<xaiArtifact>` tags.
2. **Review Existing Components**: Assess whether `PlayerSelection`, `Substitutions`, etc., need prop adjustments for Application 2’s data structure.
3. **Refactor GameEdit**: Update `GameEdit` to use the new components, maintaining its existing logic.
4. **Provide Integration Guidance**: Offer specific instructions for mapping Application 2’s data to the component props and implementing handlers.

Since you want to focus on Application 2, I’ll prioritize creating the new components and ensuring their props are flexible for different data structures. I’ll avoid modifying `GameEdit` or existing components unless necessary, and I’ll provide guidance on integrating the components into Application 2.

### Action Plan
I’ll proceed with **Step 2**: Creating the 8 new presentational components, providing each in an `<xaiArtifact>` tag with a description of its purpose and props. For each component, I’ll ensure the props are generic to accommodate Application 2’s data structure (e.g., using `id` instead of `playerId` where possible, making non-essential props optional).

Below is the first component, `ClockControls`, as an example. I’ll provide the remaining components in subsequent responses if you confirm this approach, or I can provide all at once. Let me know your preference!

```jsx
import { PauseIcon, PlayIcon } from '@heroicons/react/24/solid';

function ClockControls({
  periodType,
  currentPeriod,
  editMinutes,
  editSeconds,
  isClockRunning,
  onTimeEdit,
  onPlayPause,
}) {
  return (
    <div className="w-full flex justify-center items-center">
      <div className="bg-white px-6 text-3xl font-mono tracking-widest flex items-center gap-4">
        <span className="text-2xl">
          {periodType === 'quarters' ? `Q${currentPeriod}` : `H${currentPeriod}`}
        </span>
        <input
          type="text"
          value={editMinutes}
          onChange={(e) => onTimeEdit('minutes', e.target.value)}
          className="w-12 text-center bg-gray-100 rounded px-1"
          maxLength={2}
          aria-label="Edit minutes"
        />
        <span>:</span>
        <input
          type="text"
          value={editSeconds}
          onChange={(e) => onTimeEdit('seconds', e.target.value)}
          className="w-12 text-center bg-gray-100 rounded px-1"
          maxLength={2}
          aria-label="Edit seconds"
        />
        <button
          onClick={onPlayPause}
          className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-800 transition"
          aria-label={isClockRunning ? 'Pause clock' : 'Start clock'}
        >
          {isClockRunning ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}

export default ClockControls;
```

**ClockControls Props**:
- `periodType`: String (`'quarters'` or `'halves'`) – Required.
- `currentPeriod`: Number – Required.
- `editMinutes`: String – Required.
- `editSeconds`: String – Required.
- `isClockRunning`: Boolean – Required.
- `onTimeEdit`: Function `(type: 'minutes' | 'seconds', value: string) => void` – Required.
- `onPlayPause`: Function `() => void` – Required.

**Notes for Application 2**:
- Map Application 2’s period and time data to `periodType`, `currentPeriod`, `editMinutes`, and `editSeconds`.
- Implement `onTimeEdit` and `onPlayPause` to handle time updates and clock state changes in Application 2’s state management.

### Questions for You
1. **Proceed with All Components?**: Should I provide the remaining 7 new components (`ScreenNavigation`, `CourtSelection`, etc.) in a single response, or would you prefer one component at a time for review?
2. **Existing Components**: Do you want me to review the props of existing components (`PlayerSelection`, etc.) for compatibility with Application 2, or focus only on new components for now?
3. **Data Structure Details**: If you have specifics about Application 2’s data structure (e.g., player object fields), please share them to tailor the prop designs.
4. **Dependencies**: Does Application 2 use the same libraries (`@heroicons/react`, `react-toastify`, Tailwind CSS), or should I suggest alternatives?

Please confirm how you’d like to proceed, and I’ll provide the next component(s) or adjust the approach as needed!