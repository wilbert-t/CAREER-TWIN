## Getting Started

Run the frontend development server:

```bash
npm run dev
```

The dev server binds to `0.0.0.0`, so you can open it from:

- Your own machine: `http://localhost:3000`
- Another device on the same network: `http://<your-computer-lan-ip>:3000`

## Backend URL

By default, the frontend talks to port `8000` on the same hostname that served the page.

Examples:

- `http://localhost:3000` -> backend `http://localhost:8000`
- `http://192.168.31.44:3000` -> backend `http://192.168.31.44:8000`

To override that explicitly, create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://192.168.31.44:8000
```

## LAN Setup

1. Start the backend on your computer so it listens on `0.0.0.0:8000`.
2. Start the frontend with `npm run dev`.
3. Open `http://<your-computer-lan-ip>:3000` from the other device.

The backend CORS config allows `localhost`, `127.0.0.1`, and common private-network origins by default. To customize it, set backend env vars such as:

```bash
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://192.168.31.44:3000
CORS_ALLOWED_ORIGIN_REGEX=
```
