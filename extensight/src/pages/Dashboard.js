import React from "react";
import { Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from "../components/sidebar/Sidebar";

export default function Dashboard() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: "1rem" }}>
        <div class="main-content">
          {/* Summary Section */}
          <div class="summary-section">
            <div class="summary-header">
              <h2>Summary of Extension Insights</h2>
              <button class="toggle-btn" id="summaryToggle">
                <i class="icon lucide-chevron-down"></i>
              </button>
            </div>
            <div class="summary-content" id="summaryContent">
              {/* FILL IN THE BLANKS */}
              <p class="summary-text">
                In the past month, there were a total of <strong>__</strong> extensions (<strong>UP/DOWN __ </strong> from last month), where
                <strong> __</strong> were approved, <strong>__ (__%)</strong> were flagged with high frequency requests.
              </p>

              {/* Gray info-box, modify with summaries powered by Noggin! */}
              <div class="info-box">
                <div class="info-section">
                  <h3>Assignments of Concern</h3>
                  <ul>
                    <li>
                      HW3 had <strong>25 (12.5%)</strong> extension requests, a <strong>40%</strong> increase compared to other HWs.
                    </li>
                  </ul>
                </div>

                <div class="info-section">
                  <h3>Student Risk Overview</h3>
                  <ul>
                    <li>
                      <strong>7 (3.5%) students</strong> requested <strong> more than 3</strong> extensions this month.
                    </li>
                  </ul>
                </div>

                <div class="info-section">
                  <h3>Assignment Conflict Overview</h3>
                  <ul>
                    <li>
                      Project 3 deadline (March 25) conflicts with Midterm 2 (March 25). Consider moving to March 27.
                    </li>
                  </ul>
                </div>
                
                {/* ADD NEW "info-section" div for each summary! */}
              
              </div>

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
            <div class="visualization-controls">
              <p>Add a visualization for</p>
              <div class="control-row">
                <div class="select-container">
                  <select>
                    <option>Select metric</option>
                  </select>
                  <i class="icon lucide-chevron-down"></i>
                </div>

                <span class="vs">vs.</span>

                <div class="select-container">
                  <select>
                    <option>Select metric</option>
                  </select>
                  <i class="icon lucide-chevron-down"></i>
                </div>

                <button class="add-btn">Add</button>
              </div>
            </div>

            {/* Chart */}
            <div class="chart-container">
              <h3>Extensions by Assignment</h3>
              <div class="chart">
                <div class="bar-group">
                  <div class="bar" style={{height: "120px"}}></div>
                  <div class="bar-label">HW 1</div>
                  <div class="bar-value">18</div>
                </div>
                <div class="bar-group">
                  <div class="bar" style={{height: "150px"}}></div>
                  <div class="bar-label">Project 1</div>
                  <div class="bar-value">23</div>
                </div>
                <div class="bar-group">
                  <div class="bar" style={{height: "170px"}}></div>
                  <div class="bar-label">HW 2</div>
                  <div class="bar-value">25</div>
                </div>
                <div class="bar-group">
                  <div class="bar" style={{height: "140px"}}></div>
                  <div class="bar-label">Project 2</div>
                  <div class="bar-value">20</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    
  );
}
