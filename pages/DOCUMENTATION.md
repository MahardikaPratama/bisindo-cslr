# Dokumentasi Engineering Codebase AIS/ADS-B Track Simulator

## Table of Contents
1. [Pendahuluan](#1-pendahuluan)
2. [Filosofi Arsitektur Project](#2-filosofi-arsitektur-project)
3. [Struktur Direktori](#3-struktur-direktori)
4. [Standar Penamaan (Naming Convention)](#4-standar-penamaan-naming-convention)
5. [Standar Component & Arsitektur](#5-standar-component--arsitektur)
6. [Standar TypeScript](#6-standar-typescript)
7. [Standar Styling](#7-standar-styling)
8. [Standar Utilities dan Helpers](#8-standar-utilities-dan-helpers)
9. [Standar Hooks](#9-standar-hooks)
10. [Standar Testing](#10-standar-testing)
11. [Best Practices yang Digunakan](#11-best-practices-yang-digunakan)
12. [Prinsip Scalability dan Maintainability](#12-prinsip-scalability-dan-maintainability)
13. [Contoh Pattern yang Baik dari Project](#13-contoh-pattern-yang-baik-dari-project)
14. [Anti-Pattern yang Dihindari](#14-anti-pattern-yang-dihindari)
15. [Panduan Kontribusi Developer Baru](#15-panduan-kontribusi-developer-baru)
16. [Kesimpulan Engineering](#16-kesimpulan-engineering)

---

## 1. Pendahuluan
Project `fe-eo-track-simulator` (AIS/ADS-B Track Simulator) adalah *high-quality frontend codebase* berbasis React 18 dan TypeScript. Dokumentasi ini disusun berdasarkan analisis mendalam terhadap struktur *source code*, standar penulisan kode (*coding standards*), pola implementasi (*implementation patterns*), dan keputusan *engineering* (baik eksplisit maupun implisit). Dokumentasi ini bertindak sebagai pedoman teknis utama bagi developer.

## 2. Filosofi Arsitektur Project
Codebase ini menggunakan arsitektur **Domain-Driven Modular Design** dengan penerapan **Separation of Concerns (SoC)** yang ketat. 
- **View Layer**: Komponen UI difokuskan sebagai *presentation layer*.
- **State Management Layer**: *Zustand* digunakan sebagai state container global namun dipecah menjadi beberapa *store* spesifik (terisolasi per konteks).
- **Infrastructure & Data Layer**: API Calls, manipulasi data kompleks, dan WebSocket disembunyikan di balik *Custom Hooks* dan *Utilities Adapter*.

## 3. Struktur Direktori
Pemisahan struktur folder dirancang untuk tingkat *reusability* dan isolasi fitur maksimal.
```text
src/
├── assets/      # File aset statis (gambar, font, dll).
├── common/      # Komponen UI global (Atom/Molekul) yang agnostik terhadap bisnis logic (Button, Alert, Tabs, dll).
├── components/  # Komponen UI spesifik yang mengandung bisnis logic dan hierarki fitur (e.g. ais-adsb-tab).
├── constants/   # Penyimpanan variabel statis, magic strings, config.
├── hooks/       # Custom React hooks (e.g. useWebsocket, useTrackDataSync).
├── store/       # File Zustand state management per domain (e.g. useADSBStore, useAlertStore).
├── types/       # Definisi interface TypeScript terpusat.
└── utils/       # Fungsi pembantu (*pure functions*), adapter class, dan tools formatting.
```

## 4. Standar Penamaan (Naming Convention)
Konsistensi identitas file sangat dijaga untuk mempermudah navigasi:
- **File Komponen**: Menggunakan `PascalCase` (contoh: `AISADSBTrackSimulator.tsx`).
- **Folder Spesifik/Common**: Menggunakan `kebab-case` (contoh: `ais-adsb-tab`, `status-indicator`).
- **File State / Store**: Menggunakan format `use<DomainName>Store.ts` (contoh: `useADSBStore.ts`).
- **File Utilities**: Menggunakan `camelCase` (contoh: `inputHandlers.ts`).
- **File Ekstensi Khusus**: 
  - File tipe data: `*.types.ts`
  - File konstanta: `*.constants.ts`
  - File testing: `*.test.ts` atau `*.test.tsx`
- **Copyright Header**: Diwajibkan menyertakan *docblock header* (Hak Cipta, Author, Versi, Changelog) di awal setiap file.

## 5. Standar Component & Arsitektur
- **Composition over Inheritance**: Komponen dibangun menggunakan komposisi yang fleksibel (seperti `Tabs` yang membungkus komponen internal).
- **Optimization**: Komponen utama menggunakan `React.memo` untuk mencegah re-render yang tidak perlu saat terjadi pembaruan *props*.
- Komponen di folder `components/` hanya menyatukan *domain UI*. Komponen UI primitif harus diambil dari `common/`.

## 6. Standar TypeScript
Codebase ini menolak penggunaan tipe implisit:
- Seluruh *props* UI Component harus dideklarasikan sebagai `interface` atau `type`.
- Dilarang keras menggunakan `any`. Jika *payload* dinamis (seperti event *WebSocket*), menggunakan `unknown` dan kemudian dilakukan *Type Narrowing* atau validasi tipe (contoh di `useWebSocket.ts`).
- Pemisahan ke file `.types.ts` membuat file komponen bersih dari deklarasi *interface* yang panjang.

## 7. Standar Styling
- Menggunakan pendekatan **Utility-First** dengan **TailwindCSS**.
- Menangani *Dynamic Styling* menggunakan utilitas komposit dari `clsx` dan `tailwind-merge`. Fungsi ini di-*wrap* pada utility `@utils/cn` untuk memastikan tidak ada konflik antar *utility classes* ketika ada conditional class dari *props*.

## 8. Standar Utilities dan Helpers
Fungsi murni *(pure functions)* yang terlepas dari kapabilitas React disatukan dalam `utils/`. 
- **Adapters**: seperti `WebSocketManager` memisahkan kompleksitas instansiasi class bawaan dari komponen React.
- **Formatters**: Modul-modul kecil difokuskan hanya melakukan satu tugas (prinsip *Single Responsibility Principle*) contoh: date formatting, number formatting.

## 9. Standar Hooks
Custom hooks difokuskan untuk mengabstraksi fungsionalitas asinkron atau state lokal yang kompleks.
*Kapan Pattern ini digunakan:* Jika sebuah komponen memiliki lebih dari satu blok `useEffect` untuk integrasi *3rd party* (seperti *WebSocket* atau sinkronisasi data), logic tersebut langsung diabstraksi ke dalam *Custom Hook* terpisah.

## 10. Standar Testing
- *Testing* mengadopsi standar yang ketat dengan penulisan **Co-located Testing** (file `.test.tsx` sejajar dengan komponen/fungsinya).
- Menggunakan **Jest** dan **React Testing Library**.
- *Matrix coverage* test (seperti terdokumentasi di `unit-testing-doc.xwiki`) mengharuskan validasi terhadap: 
  - Skenario *rendering* CSS classes.
  - Skenario *event handler* & lifecycle.
  - *Snapshot testing* UI untuk meminimalisasi regresi visual.
  - Validasi *edge-cases* (misal: *environment variables* yang `null` atau `undefined`).

## 11. Best Practices yang Digunakan
1. **Clean Error Handling**: State validasi (`errorState`) disimpan di *store Zustand* (`useADSBStore.ts`), bukan *scattered* pada masing-masing field form.
2. **Abstracted Dependencies**: Panggilan WebSocket di-*wrap* di dalam *class* adapter (`WebSocketManager`) lalu dihubungkan dengan hook React (`useWebSocket`), tidak langsung dipanggil di dalam komponen UI.
3. **Implicit Dependency Injection**: Variabel *environment* (`process.env`) divalidasi dan digunakan untuk mendefinisikan *behavior* (contoh: mock API vs *Production* WebSocket).

## 12. Prinsip Scalability dan Maintainability
1. **Horizontal Scaling untuk Fitur**: Untuk menambah sub-fitur simulator baru, *developer* hanya perlu membuat folder domain baru di `src/components/`, tanpa risiko bentrok (conflict) dengan fitur *AIS/ADS-B*.
2. **Flat Global State**: *Store* dipecah berdasarkan domain objek yang berbeda (Indicator, AIS, ADSB, Alert, Global) agar tidak terjadi bottleneck *re-rendering* di root store.

## 13. Contoh Pattern yang Baik dari Project

### A. Dynamic TailWind Class Merging (Styling Strategy)
Menghindari konflik CSS class *string concatenation* menggunakan `tailwind-merge` + `clsx`.
```typescript
// src/utils/cn.ts
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Implementasi di Komponen:
<div className={cn("w-full h-auto mt-2 rounded-lg", currentTab !== "ais-adsb" && "hidden")}>
```

### B. Global State Splitting tanpa Prop-Drilling
Zustand memisahkan konfigurasi state dari Component Tree.
```typescript
// src/store/useADSBStore.ts
export const useADSBStore = create<ADSBStore>((set) => ({
    inputValues: { ...DEFAULT_VALUES },
    errorState: {},
    // Action functions memanipulasi store terisolasi dari UI
    setInputValue: (name, value) => set((state) => ({
        inputValues: { ...state.inputValues, [name]: value }
    })),
    resetErrors: () => set(() => ({ errorState: {} })),
}));
```

### C. Abstraksi Lifecycle dengan Hooks
`useWebSocket` menutupi logic rumit WebSocket (reconnection timer, cleanup listener) dari *Presentation Component*.
```typescript
// src/hooks/useWebsocket.ts
export function useWebSocket({ url, reconnect = true, reconnectInterval = 10000, onMessage }: UseWebSocketProps) {
    const wsManagerRef = useRef<WebSocketManager | null>(null);

    useEffect(() => {
        const wsManager = new WebSocketManager(url, { reconnect, reconnectInterval });
        wsManager.on("message", (data) => {
            if (onMessageRef.current) onMessageRef.current(data);
        });
        
        return () => wsManager.close(); // Clean up on unmount
    }, [url]);
}
```

## 14. Anti-Pattern yang Dihindari
- **God Component / Giant Files**: Dihindari dengan meletakkan Header, Tab Navigasi, dan Konten Tab pada komponen berbeda (`AISADSBTrackSimulator.tsx` hanya sebagai *orchestrator layout*).
- **Magic Strings / Hardcoded Values**: Seluruh *property* dinamis / nama *column* dideklarasikan di `src/constants/` untuk memastikan keakuratan referensi data antar file.
- **Prop Drilling**: Pengiriman *props* sejauh > 3 level *nesting* dihindari menggunakan Zustand State Container (misalnya data `receiveDataStatus` pada indicator diambil langsung via store `useIndicatorStatusStore`).

## 15. Panduan Kontribusi Developer Baru
Bagi developer yang akan bergabung atau melakukan pemeliharaan:
1. Pahami lokasi entitas berdasarkan tanggung jawab (*Separation of Concerns*). UI ke `components/` atau `common/`, Business Logic ke `store/` atau `hooks/`.
2. Jika perlu menambah warna atau *styles* global, letakkan definisinya dalam integrasi `tailwind.config.js`.
3. Gunakan `pnpm format-lint` sebelum *commit* untuk menjaga format standar dari *Eslint* dan *Prettier* yang sudah didefinisikan.
4. Setiap penambahan utilitas baru wajib dibarengi dengan penambahan file `[nama-file].test.ts` (menggunakan *Jest*).

## 16. Kesimpulan Engineering
Codebase project ini merupakan implementasi *Modern Frontend Development* yang sangat *robust*. Konsistensi penamaan yang ketat, arsitektur *Decoupled*, pemanfaatan penuh abstraksi React (*Hooks*), dan dukungan dokumentasi serta penulisan testing yang tinggi menjadikan project ini **production-ready**, *maintainable*, dan dapat dijadikan referensi/ *template* bagi pengembangan arsitektur UI selanjutnya di lingkungan Enterprise.
