import React from "react";
import Sidebar from "../components/sidebar/Sidebar";
import SheetVisualizer from "../components/SheetsChart";

export default function Settings() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: "1rem" }}>
        <h2>Settings</h2>
        <SheetVisualizer sheetUrl={localStorage.getItem("extensionsSheet")} />
      </main>
    </div>
  );
}
