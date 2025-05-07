import React from "react";
import { Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from "../components/sidebar/Sidebar";

export default function Calendar() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: "2rem" }}>
        <h1>Calendar</h1>
      </main>
    </div>
  );
}
