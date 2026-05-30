import { createRoot } from "react-dom/client";
import App from "./App";
import { installStaticDemoApi } from "@/lib/static-demo-api";
import "./index.css";

if (import.meta.env.VITE_STATIC_DEMO === "true") {
  installStaticDemoApi();
}

createRoot(document.getElementById("root")!).render(<App />);
