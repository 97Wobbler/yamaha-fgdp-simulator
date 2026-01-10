import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  base: "/yamaha-fgdp-simulator/",
  build: {
    outDir: "dist"
  }
});


