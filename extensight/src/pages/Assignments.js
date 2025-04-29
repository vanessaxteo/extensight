import React from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";

export default function Assignments() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: "1rem" }}>
        <p> Assignments </p>
      </main>
    </div>
  );
}
