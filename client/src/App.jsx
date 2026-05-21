import { Routes, Route } from 'react-router-dom';
import ApplyPage from './pages/ApplyPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ApplyPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
