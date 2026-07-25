import { useState } from 'react';
import HeroSection from '../components/hero-section/HeroSection';
import VideoInputPanel from '../components/video-input-panel/VideoInputPanel';
import ProcessingPipeline from '../components/processing-pipeline/ProcessingPipeline';
import VisualizationPanel from '../components/visualization-panel/VisualizationPanel';
import GlossOutput from '../components/gloss-output/GlossOutput';
import CameraRecorder from '../components/camera-recorder/CameraRecorder';

import { useVideoUpload } from '../hooks/useVideoUpload';
import { useInference } from '../hooks/useInference';
import { useDemoExample } from '../hooks/useDemoExample';
import { useInferenceStore } from '../store/useInferenceStore';
import { useVideoStore } from '../store/useVideoStore';

export default function DemoPage() {
  const { fileInputRef, handleFileChange, triggerSelect } = useVideoUpload();
  const { startInference } = useInference();
  const { loadDemo, demos } = useDemoExample();
  const { isRunning } = useInferenceStore();
  const { videoFile } = useVideoStore();
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleDemoClick = async () => {
    if (demos.length === 0) {
      alert('Contoh demo tidak tersedia');
      return;
    }
    // Load first demo
    await loadDemo();
  };

  return (
    <>
      {/* Hidden input file */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="video/mp4,video/webm,video/avi,video/quicktime"
      />

      {isCameraOpen && (
        <CameraRecorder onClose={() => setIsCameraOpen(false)} />
      )}

      <main className="relative z-10 flex-1 pb-20">
        <HeroSection
          onUploadClick={() => {
            if (isRunning) return;
            triggerSelect();
          }}
          onRecordClick={() => {
            if (isRunning) return;
            setIsCameraOpen(true);
          }}
          onDemoClick={handleDemoClick}
        />

        <div className="flex flex-col gap-6 max-w-screen-xl px-6 mx-auto">
          {/* ── TOP: PIPELINE ── */}
          <div className="w-full">
            <ProcessingPipeline />
          </div>

          {/* ── MIDDLE: VIDEO PANELS ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Input Video (Kiri) */}
            <div className="flex flex-col gap-6 lg:col-span-5">
              <VideoInputPanel />
              <button
                onClick={startInference}
                disabled={isRunning || !videoFile}
                className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-semibold py-3.5 rounded-xl shadow-btn-primary hover:shadow-panel-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? 'Sedang Menerjemahkan...' : 'Terjemahkan Video'}
              </button>
            </div>

            {/* Visualisasi Video (Kanan) */}
            <div className="flex flex-col gap-6 lg:col-span-7">
              <VisualizationPanel />
            </div>
          </div>

          {/* ── BOTTOM: HASIL TERJEMAHAN ── */}
          <div className="w-full">
            <GlossOutput />
          </div>
        </div>
      </main>
    </>
  );
}
