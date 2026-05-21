import { Routes, Route } from 'react-router-dom';
import ApplyPage from './pages/ApplyPage';
import AdminPage from './pages/AdminPage';
import MyPage from './pages/MyPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ApplyPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/my" element={<MyPage />} />
    </Routes>
  );
}
