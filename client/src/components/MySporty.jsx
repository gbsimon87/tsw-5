import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function MySporty() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="App">
      <h1>MySporty</h1>
      <p>Welcome, {user.name} ({user.email})</p>
      <button onClick={handleLogout}>Logout</button>
      <nav>
        <Link to="/">Home</Link> | <Link to="/about">About</Link> | <Link to="/my-sporty">MySporty</Link>
      </nav>
    </div>
  );
}