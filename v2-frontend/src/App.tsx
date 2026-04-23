import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/room/:code" element={<GameRoom />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
