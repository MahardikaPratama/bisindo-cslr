/**
 * @file        App.tsx
 * @description Root component aplikasi. Menyatukan (assemble) semua panel komponen
 *              ke dalam layout responsif sesuai desain UI.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React from 'react';
import Navbar from './components/navbar/Navbar';
import HeroSection from './components/hero-section/HeroSection';
import VideoInputPanel from './components/video-input-panel/VideoInputPanel';
import ConsoleLogPanel from './components/console-log-panel/ConsoleLogPanel';
import ProcessingPipeline from './components/processing-pipeline/ProcessingPipeline';
import VisualizationPanel from './components/visualization-panel/VisualizationPanel';
import SystemTelemetry from './components/system-telemetry/SystemTelemetry';
import GlossOutput from './components/gloss-output/GlossOutput';
import Footer from './components/footer/Footer';

import { useVideoUpload } from './hooks/useVideoUpload';
import { useInference } from './hooks/useInference';
import { useInferenceStore } from './store/useInferenceStore';

function App() {
  const { fileInputRef, handleFileChange, triggerSelect } = useVideoUpload();
  const { startInference } = useInference();
  const { isRunning } = useInferenceStore();

  const handleDemoClick = () => {
    // Bisa digunakan untuk trigger inject dummy video file, lalu start inference
    alert('Mock function: Try Demo Sample clicked!');
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col relative overflow-hidden">
      {/* Background Grid Decoration */}
      <div className="absolute inset-0 z-0 bg-hero-grid pointer-events-none" />

      <Navbar />

      {/* Hidden input file */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="video/mp4,video/webm,video/avi,video/quicktime"
      />

      <main className="flex-1 relative z-10 pb-20">
        <HeroSection
          onUploadClick={() => {
            if (isRunning) return;
            triggerSelect();
          }}
          onDemoClick={handleDemoClick}
        />

        <div className="max-w-screen-xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── LEFT PANEL (4 columns) ── */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <VideoInputPanel />
            <div className="flex-1">
              <ConsoleLogPanel />
            </div>
            {/* Start Pipeline Action */}
            <button
              onClick={startInference}
              disabled={isRunning}
              className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-semibold py-3.5 rounded-xl shadow-btn-primary hover:shadow-panel-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Processing...' : 'Run Pipeline Inference'}
            </button>
          </div>

          {/* ── RIGHT PANEL (8 columns) ── */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <ProcessingPipeline />
            <VisualizationPanel />
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
              <div className="sm:col-span-4">
                <SystemTelemetry />
              </div>
              <div className="sm:col-span-8">
                <GlossOutput />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
