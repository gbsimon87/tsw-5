import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Register from './components/Register';
import MySporty from './components/MySporty';
import AdminPanel from './components/AdminPanel';
import ManageLeague from './components/ManageLeague';
import ManageLeagueEdit from './components/ManageLeagueEdit';
import ManageGames from './components/ManageGames';
import GameTrackingTwo from './components/GameTracking/GameTrackingTwo';
import NavBar from './components/NavBar';
import About from './components/About';
import Home from './components/Home';
import UpcomingFeatures from './components/UpcomingFeatures';
import ManageTeams from './components/ManageTeams';
import TeamJoin from './components/TeamJoin';
import NotFound from './components/NotFound';
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
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/upcoming-features" element={<UpcomingFeatures />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
          <Route
            path="/leagues/:leagueId"
            element={
              <ProtectedRoute>
                <ManageLeague />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/:leagueId/edit"
            element={
              <ProtectedRoute>
                <ManageLeagueEdit />
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
            path="/leagues/:leagueId/games/:gameId/tracking"
            element={
              <ProtectedRoute>
                <GameTrackingTwo />
              </ProtectedRoute>
            }
          />
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