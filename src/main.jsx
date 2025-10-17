import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import "./App.css";
import router from "./App.jsx";
import { Toaster } from "@/components/ui/sonner";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Toaster
      toastOptions={{
        style: {
          borderRadius: "var(--radius)",
        },
      }}
      position="top-center"
    />
    <RouterProvider router={router} />
  </StrictMode>
);
