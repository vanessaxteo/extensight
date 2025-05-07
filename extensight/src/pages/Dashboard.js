import React, { useState, useEffect } from "react";
import { Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from "../components/sidebar/Sidebar";
import SheetVisualizer from "../components/SheetsChart";

export default function Dashboard() {
  const [summaryData, setSummaryData] = useState(null);
  // const secretKey = process.env.DASHBOARD_SECRETKEY;
  // console.log("Loaded API Key:", secretKey);

  useEffect(() => {
    const fetchSummary = async () => {
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

        // import fetch from 'node-fetch'; // for node.js

        const dashboardKey = process.env.REACT_APP_DASHBOARD;
        console.log("FULL ENV:", process.env);
        console.log("DASHBOARD:", process.env.REACT_APP_DASHBOARD); 

        const res = await fetch(
          'https://noggin.rea.gent/big-mink-8289',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${dashboardKey}`,
            },
            body: JSON.stringify({
              // fill variables here.
              "student_roster": rosterText,
              "extensions": extensionsText,
              "exam_dates": examsText,
            }),
          }
        );

        const json = await res.json();
        setSummaryData(json);
        console.log("Received data:", json);  // Check the API response
      } catch (err) {
        console.error("Noggin fetch error:", err);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: "1rem" }}>
        <div class="main-content">
          {/* Summary Section */}
          <div class="summary-section">
            <div class="summary-header">
              <h1>Summary of Extension Insights</h1>
              <button class="toggle-btn" id="summaryToggle">
                <i class="icon lucide-chevron-down"></i>
              </button>
            </div>
            <div class="summary-content" id="summaryContent">
              {/* FILL IN THE BLANKS */}
              <p className="summary-text">
                {summaryData ? (
                  <span>
                    In the past month, there were a total of <strong>{summaryData.total_extensions}</strong> extensions (
                    <strong>{summaryData.plus_minus}</strong> from last month), where
                    <strong> {summaryData.approved}</strong> were approved,
                    <strong> {summaryData.flagged} ({summaryData.flagged_percent}%)</strong> were flagged with high frequency requests.
                  </span>
                ) : "Loading summary..."}
              </p>
              

              {/* Gray info-box, modify with summaries powered by Noggin! */}
              {summaryData ? (
                <div class="info-box">
                  <div class="info-section">
                    <h3>Assignments of Concern</h3>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: (summaryData?.assignments_of_concern || "No assignment concern data available.").replace(/\n/g, "<br />"),
                      }}
                    />
                  </div>

                  <div class="info-section">
                    <h3>Student Risk Overview</h3>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: (summaryData?.student_risk || "No assignment concern data available.").replace(/\n/g, "<br />"),
                      }}
                    />
                  </div>

                  <div class="info-section">
                    <h3>Assignment Conflict Overview</h3>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: (summaryData?.assignment_conflict_overview || "No assignment concern data available.").replace(/\n/g, "<br />"),
                      }}
                    />
                  </div>
                  
                  {/* ADD NEW "info-section" div for each summary! */}
                
                </div>
              ) : (
                <div class="info-box loading">
                  <p>Loading insights...</p>
                </div>
              )}

              {/* Suggested Actions */}
              <div class="suggested-actions">
                <h3>Suggested Actions</h3>
                <p>
                  →navigate to <span class="tag">Students</span> tab to view flagged students.
                </p>
                <p>
                  →navigate to <span class="tag">Assignments</span> tab to see recommended suggestions for addressing assignments conflict.
                </p>
              </div>
            </div>
          </div>

          {/* Visualizations Section */}
          <div class="visualizations-section">
            <h2>Visualizations</h2>

            {/* Visualization Controls */}
            <SheetVisualizer sheetUrl={localStorage.getItem("extensionsSheet")} />
              
            
          </div>
        </div>
      </main>
    </div>

    
  );
}
