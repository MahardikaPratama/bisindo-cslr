/**
 * @file        App.tsx
 * @description Root component aplikasi. Menyatukan (assemble) semua panel komponen
 *              ke dalam layout responsif sesuai desain UI.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/navbar/Navbar';
import Footer from './components/footer/Footer';

import DemoPage from './pages/DemoPage';
import ExperimentResultsPage from './pages/ExperimentResultsPage';
import CompareConfigsPage from './pages/CompareConfigsPage';

function App() {
  return (
    <Router>
      <div className="relative flex flex-col min-h-screen overflow-hidden bg-surface-bg">
        <Navbar />
        {/* Background Grid Decoration */}
        <div className="absolute inset-0 z-0 pointer-events-none bg-hero-grid" />

        <Routes>
          <Route path="/" element={<DemoPage />} />
          <Route path="/results" element={<ExperimentResultsPage />} />
          <Route path="/compare" element={<CompareConfigsPage />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
