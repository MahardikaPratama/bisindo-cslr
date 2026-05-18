/**
 * @file        HeroSection.tsx
 * @description Hero section halaman utama. Menampilkan judul, deskripsi,
 *              dan dua CTA buttons: Upload Video dan Try Demo Sample.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React from 'react';
import { Upload, Play } from 'lucide-react';
import Button from '../../common/Button/Button';

interface HeroSectionProps {
  onUploadClick: () => void;
  onDemoClick: () => void;
}

const HeroSection = React.memo(function HeroSection({
  onUploadClick,
  onDemoClick,
}: HeroSectionProps) {
  return (
    <section
      id="hero-section"
      className="pt-32 pb-12 px-6 max-w-screen-xl mx-auto animate-slide-up"
    >
      <div className="max-w-2xl">
        {/* ── Tag line ── */}
        <div className="flex items-center gap-2 mb-5">
          <span className="h-px w-8 bg-brand-blue" />
          <span className="text-xs font-semibold text-brand-blue-light uppercase tracking-widest">
            KoTA 502 — Research Demo
          </span>
        </div>

        {/* ── H1 Heading ── */}
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-5 text-text-primary">
          BISINDO{' '}
          <span className="text-brand-blue-light">Continuous</span>
          <br />
          Sign Language{' '}
          <span className="relative">
            Recognition
            <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-blue to-transparent" />
          </span>
        </h1>

        {/* ── Description ── */}
        <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-xl">
          Upload a sign language video and run end-to-end inference from raw RGB video to
          precise gloss prediction. Leveraging state-of-the-art skeleton extraction and
          temporal feature fusion.
        </p>

        {/* ── CTA Buttons ── */}
        <div className="flex flex-wrap items-center gap-4">
          <Button
            id="btn-upload-video"
            variant="primary"
            size="lg"
            onClick={onUploadClick}
            leftIcon={<Upload size={18} />}
          >
            Upload Video
          </Button>
          <Button
            id="btn-demo-sample"
            variant="secondary"
            size="lg"
            onClick={onDemoClick}
            leftIcon={<Play size={16} />}
          >
            Try Demo Sample
          </Button>
        </div>
      </div>
    </section>
  );
});

export default HeroSection;
