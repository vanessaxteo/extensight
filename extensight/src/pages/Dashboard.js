import React from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";

export default function Dashboard() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: "1rem" }}>
        <p> Dashboard </p>
      </main>
    </div>
  );
}
