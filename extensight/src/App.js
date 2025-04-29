import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetails from "./pages/StudentDetails";
import Assignments from "./pages/Assignments";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import AISuggestion from "./pages/AISuggestion";

export default function App() {
  return (
    <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="/student/:sid" element={<StudentDetails />} />
        <Route path="aisuggestion" element={<AISuggestion />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="settings" element={<Settings />} />
    </Routes>
  );
}