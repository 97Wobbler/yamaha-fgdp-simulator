import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import pkg from "./package.json";

export default defineConfig({
  plugins: [react()],
  base: "/yamaha-fgdp-simulator/",
  build: {
    outDir: "dist"
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  }
});


