import React, { useState, useRef } from 'react';
import { Search, Play, Pause } from 'lucide-react';
import { GROUND_TRUTH_SENTENCES } from '../constants/ground-truth.constants';
import { GLOSS_TO_INDONESIAN } from '../components/gloss-output/GlossOutput';

const VIDEO_MAPPING: Record<string, string> = {
  "S01": "/examples/S01/P1_S01_R1.mp4",
  "S02": "/examples/S02/P2_S02_R1.mp4",
  "S03": "/examples/S03/P3_S03_R1.mp4",
  "S04": "/examples/S04/P4_S04_R1.mp4",
  "S05": "/examples/S05/P5_S05_R1.mp4",
  "S06": "/examples/S06/P6_S06_MJ.mp4",
  "S07": "/examples/S07/P1_S07_R1.mp4",
  "S08": "/examples/S08/P2_S08_R1.mp4",
  "S09": "/examples/S09/P3_S09_R1.mp4",
  "S10": "/examples/S10/P4_S10_R1.mp4",
  "S11": "/examples/S11/P5_S11_R1.mp4",
  "S12": "/examples/S12/P6_S12_MJ.mp4",
  "S13": "/examples/S13/P1_S13_R1.mp4",
  "S14": "/examples/S14/P2_S14_R1.mp4",
  "S15": "/examples/S15/P3_S15_R1.mp4",
  "S16": "/examples/S16/P4_S16_R1.mp4",
  "S17": "/examples/S17/P5_S17_R1.mp4",
  "S18": "/examples/S18/P6_S18_MJ.mp4",
  "S19": "/examples/S19/P1_S19_R1.mp4",
  "S20": "/examples/S20/P2_S20_R1.mp4",
  "S21": "/examples/S21/P3_S21_R1.mp4",
  "S22": "/examples/S22/P4_S22_R1.mp4",
  "S23": "/examples/S23/P5_S23_R1.mp4",
  "S24": "/examples/S24/P6_S24_MJ.mp4",
  "S25": "/examples/S25/P1_S25_R1.mp4",
  "S26": "/examples/S26/P2_S26_R1.mp4",
  "S27": "/examples/S27/P3_S27_R1.mp4",
  "S28": "/examples/S28/P4_S28_R1.mp4",
  "S29": "/examples/S29/P5_S29_R1.mp4",
  "S30": "/examples/S30/P6_S30_MJ.mp4"
};

const VideoCard = ({ item }: { item: typeof GROUND_TRUTH_SENTENCES[0] }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const translation = GLOSS_TO_INDONESIAN[item.text] || item.text;
  const videoPath = VIDEO_MAPPING[item.sentence_id];

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="bg-surface-panel border border-surface-border rounded-xl overflow-hidden shadow-panel-glow flex flex-col group transition-all duration-300 hover:border-brand-blue/30">
      <div 
        className="relative aspect-[3/4] sm:aspect-video w-full bg-black cursor-pointer overflow-hidden flex items-center justify-center"
        onClick={handlePlayPause}
      >
        <video 
          ref={videoRef}
          src={videoPath}
          className="w-full h-full object-cover transition-opacity duration-300"
          muted
          loop
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {/* Play/Pause Overlay */}
        <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
          <div className="w-12 h-12 rounded-full bg-brand-blue/90 flex items-center justify-center text-white shadow-lg transform transition-transform group-hover:scale-110">
            {isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current translate-x-0.5" />}
          </div>
        </div>

        {/* Video ID Badge */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-white/90 uppercase tracking-widest border border-white/10">
          {item.sentence_id}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-brand-blue-light mb-2 leading-snug">
          {translation}
        </h3>
        
        <div className="mt-auto pt-4 flex flex-col gap-1 border-t border-surface-border/50">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-text-muted">
            Gloss
          </span>
          <p className="text-sm font-mono text-text-secondary truncate" title={item.text}>
            {item.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function LearnPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = GROUND_TRUTH_SENTENCES.filter((item) => {
    const translation = GLOSS_TO_INDONESIAN[item.text] || item.text;
    const searchLower = searchQuery.toLowerCase();
    return (
      translation.toLowerCase().includes(searchLower) ||
      item.text.toLowerCase().includes(searchLower) ||
      item.sentence_id.toLowerCase().includes(searchLower)
    );
  });

  return (
    <main className="relative z-10 flex-1 pb-20 pt-32 px-6">
      <div className="max-w-screen-xl mx-auto flex flex-col gap-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-3 max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-text-primary">
              Belajar <span className="text-brand-blue-light">Isyarat</span>
            </h1>
            <p className="text-text-secondary leading-relaxed">
              Pelajari berbagai kalimat dalam Bahasa Isyarat Indonesia (BISINDO). Tonton video peraganya untuk melatih gerakan isyarat Anda secara mandiri.
            </p>
          </div>
          
          {/* Search Box */}
          <div className="relative w-full md:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-text-muted group-focus-within:text-brand-blue-light transition-colors" />
            </div>
            <input
              type="text"
              className="w-full bg-surface-panel border border-surface-border text-text-primary rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue-light transition-all placeholder-text-muted"
              placeholder="Cari kalimat atau gloss..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Video Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <VideoCard key={item.sentence_id} item={item} />
            ))}
          </div>
        ) : (
          <div className="w-full py-20 flex flex-col items-center justify-center text-text-muted border-2 border-dashed border-surface-border rounded-xl">
            <Search size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">Kalimat tidak ditemukan</p>
            <p className="text-sm opacity-70">Coba kata kunci lain.</p>
          </div>
        )}

      </div>
    </main>
  );
}
