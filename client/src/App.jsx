import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Register from './components/Register';
import MySporty from './components/MySporty/MySporty';
import AdminPanel from './components/AdminPanel';
import ManageLeagueEdit from './components/ManageLeagueEdit';
import ManageGames from './components/ManageGames';
import GameTracking from './components/GameTracking/GameTracking';
import NavBar from './components/NavBar';
import About from './components/About';
import Home from './components/Home';
import UpcomingFeatures from './components/UpcomingFeatures';
import ManageTeams from './components/ManageTeams';
import TeamJoin from './components/TeamJoin';
import NotFound from './components/NotFound';
import Team from './components/Team/Team';
import PublicFacingLeaguePage from './components/PublicFacingLeaguePage';
import PrivacyPolicy from './components/PrivacyPolicy';
import PlayerProfile from './components/Player/PlayerProfile';
import CompletedGamePage from './components/Game/CompletedGamePage';
import './App.css';

function AppContent() {
  const location = useLocation();
  // Define routes where navbar should NOT be shown
  const hideNavbarRoutes = [
    /^\/leagues\/[^/]+\/games\/[^/]+\/tracking$/
  ];
  const showNavbar = !hideNavbarRoutes.some(route =>
    route instanceof RegExp ? route.test(location.pathname) : route === location.pathname
  );

  return (
    <div className="App">
      {showNavbar && <NavBar />}
      {/* <main style={{ paddingTop: showNavbar ? '64px' : '0' }}> */}
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/upcoming-features" element={<UpcomingFeatures />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/leagues/public/:leagueId" element={<PublicFacingLeaguePage />} />
          <Route path="/leagues/:leagueId/team/:teamId/players/:playerId" element={<PlayerProfile />} />

          {/* Protected Routes */}
          <Route
            path="/leagues/:leagueId/team/:teamId"
            element={
              <ProtectedRoute>
                <Team />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/:leagueId/game/:gameId"
            element={
              <ProtectedRoute>
                <CompletedGamePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/:leagueId/games/:gameId/tracking"
            element={
              <ProtectedRoute>
                <GameTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/:leagueId/games"
            element={
              <ProtectedRoute>
                <ManageGames />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/:leagueId/teams"
            element={
              <ProtectedRoute>
                <ManageTeams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/:leagueId"
            element={
              <ProtectedRoute>
                <ManageLeagueEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/join"
            element={
              <ProtectedRoute>
                <TeamJoin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-sporty"
            element={
              <ProtectedRoute>
                <MySporty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>

      </main>
    </div>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
          <ToastContainer
            position="top-right"
            autoClose={1000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;