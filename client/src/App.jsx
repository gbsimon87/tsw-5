import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Register from './components/Register';
import MySporty from './components/MySporty';
import AdminPanel from './components/AdminPanel';
import ManageLeague from './components/ManageLeague';
import ManageLeagueEdit from './components/ManageLeagueEdit';
import NavBar from './components/NavBar';
import About from './components/About';
import Home from './components/Home';
import UpcomingFeatures from './components/UpcomingFeatures';
import ManageTeams from './components/ManageTeams';
import TeamJoin from './components/TeamJoin';
import './App.css';

function AppContent() {
  const location = useLocation();
  // Define routes where navbar should NOT be shown
  const hideNavbarRoutes = [];
  const showNavbar = !hideNavbarRoutes.includes(location.pathname);

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
            path="/leagues/:leagueId/teams"
            element={
              <ProtectedRoute>
                <ManageTeams />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
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
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;