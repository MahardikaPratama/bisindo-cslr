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
// import SystemTelemetry from './components/system-telemetry/SystemTelemetry';
import GlossOutput from './components/gloss-output/GlossOutput';
import Footer from './components/footer/Footer';

import { useVideoUpload } from './hooks/useVideoUpload';
import { useInference } from './hooks/useInference';
import { useDemoExample } from './hooks/useDemoExample';
import { useInferenceStore } from './store/useInferenceStore';
import { useVideoStore } from './store/useVideoStore';
import { useGroundTruthStore } from './store/useGroundTruthStore';

function App() {
  const { fileInputRef, handleFileChange, triggerSelect } = useVideoUpload();
  const { startInference } = useInference();
  const { loadDemo, demos } = useDemoExample();
  const { isRunning } = useInferenceStore();
  const { videoFile } = useVideoStore();
  const { selectedGroundTruth } = useGroundTruthStore();

  const handleDemoClick = async () => {
    if (demos.length === 0) {
      alert('No demo examples available');
      return;
    }
    // Load first demo
    await loadDemo();
  };

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden bg-surface-bg">
      <Navbar />
      {/* Background Grid Decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-hero-grid" />

      {/* Hidden input file */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="video/mp4,video/webm,video/avi,video/quicktime"
      />

      <main className="relative z-10 flex-1 pb-20">
        <HeroSection
          onUploadClick={() => {
            if (isRunning) return;
            triggerSelect();
          }}
          onDemoClick={handleDemoClick}
        />

        <div className="grid max-w-screen-xl grid-cols-1 gap-6 px-6 mx-auto lg:grid-cols-12">
          {/* ── LEFT PANEL (4 columns) ── */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            <VideoInputPanel />
            {/* Start Pipeline Action */}
            <button
              onClick={startInference}
              disabled={isRunning || !videoFile || !selectedGroundTruth}
              className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-semibold py-3.5 rounded-xl shadow-btn-primary hover:shadow-panel-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Processing...' : 'Run Pipeline Inference'}
            </button>
            <div className="flex-1">
              <ConsoleLogPanel />
            </div>
          </div>

          {/* ── RIGHT PANEL (8 columns) ── */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            <ProcessingPipeline />
            <VisualizationPanel />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-12">
              <div className="sm:col-span-12">
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
