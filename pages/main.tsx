import React from "react";
import ReactDOM from "react-dom/client";
import { Flashcards } from "../app/Flashcards";
import "../app/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Flashcards />
  </React.StrictMode>,
);
