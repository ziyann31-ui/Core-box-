# Core Box — Offline Music Player

An offline music downloader and player. Search for songs, download as MP3, play with a beautiful player.

## Stack
- **Mobile**: React Native + Expo
- **Web**: React + Vite
- **API**: Express 5 + Node.js
- **DB**: PostgreSQL + Drizzle ORM

## Setup

### Requirements
- Node.js 24+
- pnpm
- PostgreSQL
- yt-dlp (`pip install yt-dlp`)
- ffmpeg

### Environment Variables (api-server)
```
DATABASE_URL=your_postgres_url
PORT=3000
NODE_ENV=production
```

### Run locally
```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/music-player run dev
```
