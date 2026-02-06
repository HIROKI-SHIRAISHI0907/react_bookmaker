// frontend/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import "./styles/globals.css";

console.log("MAIN: about to render App", App);

// （React Query を使うなら）
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- DEBUG: detect SPA navigations ---
const _pushState = history.pushState;
const _replaceState = history.replaceState;

history.pushState = function (...args: any[]) {
  console.trace("history.pushState:", args[2]);
  return _pushState.apply(this, args as any);
};

history.replaceState = function (...args: any[]) {
  console.trace("history.replaceState:", args[2]);
  return _replaceState.apply(this, args as any);
};

window.addEventListener("popstate", () => {
  console.log("popstate ->", window.location.pathname);
});

console.log("boot ->", window.location.pathname);

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
