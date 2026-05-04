# KARAR-SİS | Kamu Karar Destek Paneli

Fütüristik, siber/kontrol merkezi konseptli kamu karar destek sistemi.

## Özellikler

- 🗺️ React-Leaflet ile interaktif harita (dark mode tile layer)
- 📊 Claude AI destekli simülasyon analizi
- 🎨 Glassmorphism kart tasarımı
- ⚡ Next.js 15 App Router
- 🌐 Vercel'e hazır deployment

## Kurulum

```bash
npm install
npm run dev
```

## Vercel Deployment

### Seçenek 1: Vercel CLI
```bash
npm i -g vercel
vercel
```

### Seçenek 2: GitHub + Vercel
1. Bu klasörü bir GitHub repo'ya push edin
2. [vercel.com](https://vercel.com) üzerinden "Import Project"
3. GitHub repo'nuzu seçin → Deploy

### ⚠️ Önemli: API Key
`src/app/page.tsx` içindeki API çağrısı Anthropic API'yi kullanır.
Vercel ortam değişkenlerine `ANTHROPIC_API_KEY` eklemek isterseniz,
fetch headers'a `"x-api-key": process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY` ekleyin.

Mevcut haliyle API key olmadan da çalışır (fallback rastgele sonuçlarla).

## Proje Yapısı

```
src/
  app/
    layout.tsx    # Root layout, font ve meta
    page.tsx      # Ana dashboard sayfası
    globals.css   # Global stiller ve animasyonlar
  components/
    MapComponent.tsx  # Leaflet harita bileşeni (SSR-safe)
```

## Teknolojiler

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React-Leaflet** (dark CartoDB tiles)
- **Anthropic Claude API** (simülasyon analizi)
- **Orbitron + Share Tech Mono** (Google Fonts)
