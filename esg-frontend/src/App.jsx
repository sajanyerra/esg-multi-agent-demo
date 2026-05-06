import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { SensorProvider } from './context/SensorContext';
import Navbar from './components/Navbar';
import ComparePage from './pages/ComparePage';
import Dashboard from './pages/Dashboard';
import { wakeUpServers } from './api/client';

export default function App() {
  useEffect(() => {
    wakeUpServers();
  }, []);

  return (
    <SensorProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<ComparePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </SensorProvider>
  );
}