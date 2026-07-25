import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Square, X } from 'lucide-react';
import Button from '../../common/Button/Button';
import { useVideoStore } from '../../store/useVideoStore';

interface CameraRecorderProps {
  onClose: () => void;
}

const MAX_DURATION_MS = 15000; // 15 seconds

export default function CameraRecorder({ onClose }: CameraRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const requestRef = useRef<number>();

  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MAX_DURATION_MS / 1000);
  const [error, setError] = useState<string | null>(null);

  const { setVideo, setVideoStatus } = useVideoStore();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, // default front camera
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setError('Gagal mengakses kamera: ' + err.message);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const drawToCanvas = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx && video.readyState >= 2) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw standard un-mirrored frame to canvas so ML data is accurate
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    
    requestRef.current = requestAnimationFrame(drawToCanvas);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onplay = () => {
        requestRef.current = requestAnimationFrame(drawToCanvas);
      };
    }
  }, [drawToCanvas]);

  const startRecording = () => {
    if (!canvasRef.current) return;
    
    chunksRef.current = [];
    // Capture stream from canvas to get the mirrored frames
    const canvasStream = canvasRef.current.captureStream(30); // 30 FPS
    
    try {
      const mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType: 'video/webm;codecs=vp8',
      });
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        handleRecordingComplete(blob);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setTimeLeft(MAX_DURATION_MS / 1000);
      
    } catch (err: any) {
      setError('Gagal memulai rekaman: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    let interval: number;
    if (isRecording && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRecording && timeLeft <= 0) {
      stopRecording();
    }
    return () => clearInterval(interval);
  }, [isRecording, timeLeft]);

  const handleRecordingComplete = (blob: Blob) => {
    // Convert blob to file and save to store
    const file = new File([blob], 'recorded_video.webm', { type: 'video/webm' });
    const objectUrl = URL.createObjectURL(file);
    
    setVideoStatus('processing');
    
    // Create an invisible video element just to read metadata
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;
    
    tempVideo.onloadedmetadata = () => {
      const metadata = {
        filename: file.name,
        duration: tempVideo.duration || (MAX_DURATION_MS / 1000 - timeLeft),
        resolution: `${tempVideo.videoWidth}x${tempVideo.videoHeight}`,
        fps: 30,
        fileSize: file.size,
      };
      
      setVideo(file, metadata, objectUrl);
      onClose(); // Close the modal
    };
    
    tempVideo.onerror = () => {
      setVideoStatus('error');
      URL.revokeObjectURL(objectUrl);
      onClose();
    };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-surface-bg border border-surface-border rounded-xl shadow-panel-glow overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-border bg-surface-panel">
          <h3 className="font-semibold text-text-primary">Rekam Video Isyarat</h3>
          <button onClick={onClose} className="p-1 text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          {error ? (
            <div className="text-red-500 text-center p-4">{error}</div>
          ) : (
            <>
              {/* Visible Video: Mirrored via CSS for user feedback */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {/* Hidden Canvas: Used for recording the mirrored frames */}
              <canvas ref={canvasRef} className="hidden" />
              
              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/20 text-red-500 px-3 py-1.5 rounded-full backdrop-blur-md border border-red-500/30">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-mono font-medium">{timeLeft}s</span>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-center p-4 bg-surface-panel border-t border-surface-border">
          {!isRecording ? (
            <Button
              variant="primary"
              size="lg"
              onClick={startRecording}
              leftIcon={<Camera size={20} />}
              className="bg-brand-blue hover:bg-brand-blue-light"
            >
              Mulai Merekam
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="lg"
              onClick={stopRecording}
              leftIcon={<Square size={20} className="fill-current" />}
              className="text-red-500 border-red-500/30 hover:bg-red-500/10"
            >
              Berhenti
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
