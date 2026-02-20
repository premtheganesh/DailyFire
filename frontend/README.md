# DailyFire - Personal Task Scheduler

A premium, motivating task scheduler and daily routine tracker web app.

## Features

- 🔥 Daily Routine Tracker with 16 pre-loaded tasks
- ✅ One-off Tasks with priority levels (High/Medium/Low)
- 🏆 Streak & XP rewards system with badges
- 📱 Mobile-first responsive design
- 🔔 Browser notifications for reminders
- 🎯 Motivational quotes and images

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: CSS with custom properties
- **Animations**: Framer Motion
- **State**: Zustand
- **Icons**: Lucide React

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Deploy to Netlify

1. Push this frontend folder to a GitHub repository
2. Connect the repository to Netlify
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Update `netlify.toml` with your backend URL
5. Deploy!

## Backend API

This app requires a backend API. You can:
1. Deploy the FastAPI backend separately (e.g., Railway, Render, Fly.io)
2. Update the `VITE_API_URL` environment variable in Netlify
3. Update the proxy in `netlify.toml`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (default: `/api`) |
