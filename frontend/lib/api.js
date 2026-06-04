// Single source of truth for the backend base URL.
// Set NEXT_PUBLIC_API_URL at build/run time (see .env.example); falls back to
// localhost for local development.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
