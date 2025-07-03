import { useAuth } from '../context/AuthContext';

export default function MySporty() {
  const { user, logout } = useAuth();

  return (
    <div className="App">
      <h1>MySporty</h1>
      <p>Welcome, {user.name} ({user.email})</p>
    </div>
  );
}