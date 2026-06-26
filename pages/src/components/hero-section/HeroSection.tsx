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
      className="max-w-screen-xl px-6 pt-20 pb-8 mx-auto animate-slide-up"
    >
      <div className="max-w-2xl">
        {/* ── Tag line ── */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold tracking-widest uppercase text-brand-blue-light">
            KoTA 502 — Research Demo
          </span>
        </div>

        {/* ── H1 Heading ── */}
        <h1 className="mb-4 text-3xl font-bold leading-tight md:text-4xl text-text-primary">
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
        <p className="max-w-xl mb-8 text-base leading-relaxed text-text-secondary">
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
