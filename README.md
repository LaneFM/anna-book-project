# Booking Site (Node.js)

## Run locally
1. Copy `.env.example` to `.env`
2. Install dependencies: `npm install`
3. Start server: `npm run dev` or `npm start`
4. Open `http://localhost:3000`

## Production notes
- Sensitive config is stored in `.env` (`SESSION_SECRET`)
- Do not commit `.env`
- User/admin role is stored in `data/users.json` (`role: "user" | "admin"`)
- Runtime schedule cache is stored in `data/schedule.json`

## Project structure
- `server.js` - Express server entrypoint
- `src/routes/api.js` - Backend API routes
- `src/services/*` - JSON storage, users, schedule services
- `public/` - static frontend
  - `public/js/api.js` - API client
  - `public/js/state.js` - state and selectors
  - `public/js/render.js` - render/UI helpers
  - `public/js/app.js` - app wiring
