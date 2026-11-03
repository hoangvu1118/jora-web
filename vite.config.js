import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development every call to /api goes to the Spring Boot app on port 8080.
// The browser then sees one origin, so no CORS setup is needed while you work.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
