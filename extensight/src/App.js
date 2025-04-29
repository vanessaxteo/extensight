import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Assignments from "./pages/Assignments";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="settings" element={<Settings />} />
    </Routes>
  );
}