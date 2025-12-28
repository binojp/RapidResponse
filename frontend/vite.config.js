import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import url from "url";

// const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  // server: {
  //   host: "0.0.0.0",
  //   port: 5173,
  //   https: {
  //     key: fs.readFileSync(
  //       path.resolve(__dirname, "certs/192.168.82.139-key.pem")
  //     ),
  //     cert: fs.readFileSync(
  //       path.resolve(__dirname, "certs/192.168.82.139.pem")
  //     ),
  //   },
  // },
  base: "/",
});
