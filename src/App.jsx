import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BoardListPage from './pages/BoardListPage';
import BoardDetailPage from './pages/BoardDetailPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0f172a]">
        <Routes>
          <Route path="/" element={<BoardListPage />} />
          <Route path="/board/:id" element={<BoardDetailPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
