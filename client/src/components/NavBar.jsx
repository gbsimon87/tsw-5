import { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function NavBar() {
  const { user, logout } = useContext(AuthContext);
  const isAuthenticated = user !== null;
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    logout();
    navigate('/');
  };

  // Get user initials from name or email (only called when user exists)
  const getInitials = () => {
    const name = user.name || user.email.split('@')[0];
    const nameParts = name.trim().split(' ');
    return nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
      : nameParts[0].slice(0, 2);
  };

  return (
    <>
      <style>
        {`
          .navbar {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 64px;
            background: linear-gradient(to right, #2563eb, #4f46e5);
            color: white;
            z-index: 50;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .navbar-container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 16px;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .navbar-logo {
            font-size: 24px;
            font-weight: bold;
            color: white;
            text-decoration: none;
          }
          .navbar-desktop {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .navbar-desktop a, .navbar-desktop button {
            padding: 8px 12px;
            color: white;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            border-radius: 4px;
            transition: background-color 0.2s;
            background: none;
            border: none;
            cursor: pointer;
            outline: none;
          }
          .navbar-desktop a:hover, .navbar-desktop button:hover,
          .navbar-desktop a:focus, .navbar-desktop button:focus {
            background-color: rgba(255, 255, 255, 0.1);
            outline: 2px solid rgba(255, 255, 255, 0.5);
          }
          .navbar-initials {
            background: none;
            border: 2px solid white;
            border-radius: 50%;
            color: white;
            font-size: 0.875rem;
            font-weight: bold;
            text-transform: uppercase;
            line-height: 1;
            text-align: center;
            min-width: 2rem;
            height: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}
      </style>
      <nav className="navbar" aria-label="Main navigation">
        <div className="navbar-container">
          <NavLink to="/" className="navbar-logo" aria-label="Home">
            TSW
          </NavLink>
          <div className="navbar-desktop">
            <NavLink to="/" className="hover:bg-white/10" aria-label="Home page">
              Home
            </NavLink>
            <NavLink to="/about" className="hover:bg-white/10" aria-label="About page">
              About
            </NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className="hover:bg-white/10" aria-label="Dashboard page">
                  Dashboard
                </NavLink>
                <NavLink to="/admin" className="hover:bg-white/10" aria-label="Admin page">
                  Admin
                </NavLink>
                <button
                  onClick={handleLogoutClick}
                  className="hover:bg-white/10"
                  aria-label="Log out"
                >
                  Log out
                </button>
                <div
                  className="navbar-initials"
                  aria-label={`User profile: ${user.name || user.email}`}
                >
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt="User profile"
                      className="navbar-initials w-8 h-8 rounded-full"
                    />
                  ) : (
                    getInitials()
                  )}
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login" className="hover:bg-white/10" aria-label="Login page">
                  Login
                </NavLink>
                <NavLink to="/register" className="hover:bg-white/10" aria-label="Register page">
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

export default NavBar;