import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetails from "./pages/StudentDetails";
import Assignments from "./pages/Assignments";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import AISuggestion from "./pages/AISuggestion";
import Login from "./pages/Login";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="students" element={<Students />} />
      <Route path="/student/:sid" element={<StudentDetails />} />
      <Route path="aisuggestion" element={<AISuggestion />} />
      <Route path="assignments" element={<Assignments />} />
      <Route path="calendar" element={<Calendar />} />
      <Route path="settings" element={<Settings />} />
    </Routes>
  );
}
