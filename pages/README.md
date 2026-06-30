<div align="center">

# 🤟 BISINDO-CSLR Web Dashboard

### Interactive End-to-End Inference Platform
### for Continuous Sign Language Recognition

<br/>

[![React](https://img.shields.io/badge/React-18.x-20232a?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Zustand](https://img.shields.io/badge/Zustand-State-black?style=flat-square)](https://zustand-demo.pmnd.rs/)

<br/>

**Undergraduate Thesis · Politeknik Negeri Bandung · 2026**

**Mahardika Pratama** (221524044) &nbsp;·&nbsp; **Sarah** (221524059)

*D-IV Teknik Informatika — Jurusan Teknik Komputer dan Informatika*

</div>

---

## 🔍 Overview

The **BISINDO-CSLR Web Dashboard** is a comprehensive, interactive demonstration platform designed to showcase the end-to-end continuous sign language recognition pipeline.

This front-end application connects to the PyTorch/FastAPI backend to simulate the real-world execution of the **TwoStream-CoSign** architecture. It visualizes every step of the process, from raw RGB video ingestion to final gloss sequence prediction.

---

## ✨ Key Features

- **🎬 Interactive Video Upload**: Drag-and-drop video processing with automatic extraction of essential metadata (Duration, FPS, Resolution).
- **🔄 5-Stage Pipeline Visualization**: Real-time status tracking of the inference pipeline (RGB Video → Skeleton Extraction → Preprocessing → Inference → Prediction).
- **👁️ Synchronized Dual-View**: A side-by-side video playback overlaying the MediaPipe 2D skeletal mapping on top of the raw RGB footage.
- **📊 System Telemetry & Metrics**: Detailed reporting on system performance, including Inference Latency, Inference Speed (seq/s), and Word Error Rate (WER) evaluations.
- **📈 Experiment Results Dashboard**: Analyze predictions against ground truth, view WER, and evaluate model performance metrics from exported experiment data.
- **⚖️ Configuration Comparison**: Side-by-side comparison of different model configurations to easily track inference speed and error rate improvements.
- **📝 Live Console Logging**: An integrated terminal panel that streams background execution logs, facilitating seamless debugging and monitoring.
- **⚡ Domain-Driven State Management**: A highly performant architecture powered by Zustand, ensuring isolated domain states and eliminating prop-drilling.

---

## 🛠️ Technology Stack

| Category | Technology | Description |
|---|---|---|
| **Framework** | [React 18](https://react.dev/) | Component-based UI library |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict syntactical superset of JS |
| **Bundler** | [Vite](https://vitejs.dev/) | Next-generation frontend tooling |
| **Styling** | [TailwindCSS v3](https://tailwindcss.com/) | Utility-first CSS framework |
| **State** | [Zustand](https://github.com/pmndrs/zustand) | Small, fast, and scalable bearbones state-management |
| **Icons** | [Lucide React](https://lucide.dev/) | Beautiful & consistent icon toolkit |

---

## 🚀 Installation & Usage

This project strictly utilizes **pnpm** as its package manager to ensure deterministic and efficient dependency resolution.

### 1. Prerequisites
Ensure the following are installed on your environment:
- **Node.js** (v18.x or newer)
- **pnpm** (v8.x or newer)

### 2. Setup
Clone the repository and install all dependencies:
```bash
cd pages
pnpm install
```

### 3. Development Server
Start the Vite development server:
```bash
pnpm dev
```
> The application will be accessible at `http://localhost:5173`.

### 4. Production Build
Compile and type-check the application for production:
```bash
pnpm build
pnpm preview
```

---

## 🏗️ Architecture & Engineering Guidelines

This project strictly adheres to **Domain-Driven Modular Design** principles. All engineering standards, naming conventions, and architectural decisions are documented centrally.

Before contributing, developers **MUST** review the core engineering guidelines:
👉 **[DOCUMENTATION.md](./DOCUMENTATION.md)**

**High-Level Structure:**
- `src/store/`: Global domain state segregation (`useVideoStore`, `useInferenceStore`, `useConsoleStore`).
- `src/hooks/`: Business logic abstraction (e.g., pipeline orchestration and network operations).
- `src/components/`: Capability-isolated UI components emphasizing Separation of Concerns.
- `src/common/`: Agnostic, highly reusable atomic components (e.g., Buttons, Cards, Badges, Steppers).

---

<div align="center">
<sub>Made with ❤️ for the Indonesian Deaf community · Politeknik Negeri Bandung · 2026</sub>
</div>
