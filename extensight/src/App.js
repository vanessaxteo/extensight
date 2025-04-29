import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
// import Assignments from "./pages/assignments/Assignments";
// import Calendar from "./pages/calendar/Calendar";
// import Settings from "./pages/settings/Settings";

export default function App() {
  return (
    <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        {/* <Route path="assignments" element={<Assignments />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="settings" element={<Settings />} /> */}
    </Routes>
  );
}