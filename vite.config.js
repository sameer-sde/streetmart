import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // vite-plugin-pwa is added via manual SW below to avoid npm install requirement
});
