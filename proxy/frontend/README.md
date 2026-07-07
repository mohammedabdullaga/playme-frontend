# Proxy Admin Frontend

React + Vite + Tailwind admin panel for the proxy management backend.

## Run locally

1. Install deps
   ```bash
   npm install
   ```
2. Create a local env file
   ```bash
   cp .env.example .env
   ```
3. Set the backend URL if needed
   ```bash
   VITE_API_URL=http://localhost:3000
   ```
4. Start the frontend
   ```bash
   npm run dev
   ```

The backend must be running separately on port 3000.
