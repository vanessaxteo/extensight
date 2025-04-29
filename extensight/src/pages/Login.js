import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../components/Onboarding.css";

export default function Login() {
  const [courseName, setCourseName] = useState("");
  const [studentRoster, setStudentRoster] = useState("");
  const [dspData, setDspData] = useState("");
  const [extensionsSheet, setExtensionsSheet] = useState("");
  const [assignmentsSheet, setAssignmentsSheet] = useState("");

  const navigate = useNavigate();

  const handleCreate = () => {
    localStorage.setItem("courseName", courseName);
    localStorage.setItem("studentRoster", studentRoster);
    localStorage.setItem("dspData", dspData);
    localStorage.setItem("extensionsSheet", extensionsSheet);
    localStorage.setItem("assignmentsSheet", assignmentsSheet);

    console.log("Course Name:", localStorage.getItem("courseName"));
    console.log("Student Roster Link:", localStorage.getItem("studentRoster"));
    console.log("DSP Data Link:", localStorage.getItem("dspData"));
    console.log(
      "Extensions Sheet Link:",
      localStorage.getItem("extensionsSheet")
    );
    console.log(
      "Assignments Sheet Link:",
      localStorage.getItem("assignmentsSheet")
    );

    navigate("/dashboard");
  };

  return (
    <div className="form-container">
      <div className="form-box">
        <h1 className="form-title">Welcome to Extensight</h1>

        <div className="form-fields">
          <div className="form-group">
            <label htmlFor="courseName">Course Name</label>
            <input
              id="courseName"
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="studentRoster">Import student roster</label>
            <input
              id="studentRoster"
              type="text"
              value={studentRoster}
              onChange={(e) => setStudentRoster(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dspData">Import DSP Data</label>
            <input
              id="dspData"
              type="text"
              value={dspData}
              onChange={(e) => setDspData(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="extensionsSheet">Link extensions sheet</label>
            <input
              id="extensionsSheet"
              type="text"
              value={extensionsSheet}
              onChange={(e) => setExtensionsSheet(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="assignmentsSheet">Link assignments sheet</label>
            <input
              id="assignmentsSheet"
              type="text"
              value={assignmentsSheet}
              onChange={(e) => setAssignmentsSheet(e.target.value)}
            />
          </div>

          <div className="form-button-container">
            <button
              type="button"
              className="create-button"
              onClick={handleCreate}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
