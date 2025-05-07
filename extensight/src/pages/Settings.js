import React from "react";
import Sidebar from "../components/sidebar/Sidebar";
import SheetVisualizer from "../components/SheetsChart";

export default function Settings() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: "2rem" }}>
        <h1>Settings</h1>
      </main>
    </div>
  );
}
