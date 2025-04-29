import React, { useState } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import "./Styles.css";

export default function Students() {
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAIResponse = async () => {
    setLoading(true);
    try {
      const [rosterRes, extensionsRes, examsRes] = await Promise.all([
        fetch("/data/roster.csv"),
        fetch("/data/extensions.csv"),
        fetch("/data/exam_dates.csv"),
      ]);

      const [rosterText, extensionsText, examsText] = await Promise.all([
        rosterRes.text(),
        extensionsRes.text(),
        examsRes.text(),
      ]);

      const res = await fetch("https://noggin.rea.gent/renewed-grouse-2739", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer rg_v1_j7uxo1x5jvexeqjj1eqjwshfvh7rjq8chop7_ngk",
        },
        body: JSON.stringify({
          student_roster: rosterText,
          extensions: extensionsText,
          exam_dates: examsText,
        }),
      });

      const text = await res.text();
      const json = JSON.parse(text);
      setResponseData(json.chat_response);
    } catch (error) {
      console.error("AI fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="mainContent">
        <h1 className="pageTitle">Students</h1>
        <button onClick={fetchAIResponse} className="requestButton">
          Request AI Suggestion
        </button>

        {loading ? (
          <p>Loading AI response...</p>
        ) : responseData ? (
          <div className="aiResponseCard">
            <h2 className="cardTitle">Suggested Extension Update</h2>
            <p><strong>Student Name:</strong> {responseData.student_name}</p>
            <p><strong>SID:</strong> {responseData.SID}</p>
            <p><strong>New Date:</strong> {responseData.new_date}</p>
            <p><strong>Reasoning:</strong> {responseData.reasoning}</p>
          </div>
        ) : (
          <p>No data found. Click the button to get a suggestion.</p>
        )}
      </main>
    </div>
  );
}
