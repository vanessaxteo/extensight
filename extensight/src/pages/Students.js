import React, { useEffect, useState } from "react";
import { Routes, Route, Outlet, Link } from "react-router-dom"; // Import Link for navigation
import Sidebar from "../components/sidebar/Sidebar";
import Papa from "papaparse";

export default function Students() {
  const [rosterData, setRosterData] = useState([]);

  useEffect(() => {
    fetch("/data/roster.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const filteredData = results.data.map((row) => ({
              Name: row["Name"],
              SID: row["SID"],
              Email: row["Email address"],
              UID: row["UID"],
              Role: row["Role"],
              Sections: row["Sections"]
            }));
            setRosterData(filteredData);
          },
        });
      })
      .catch((error) => console.error("Error loading CSV:", error));
  }, []);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: "1rem" }}>
        <h2>Students</h2>
        <table border="1" cellPadding="8" width="100%">
          <thead>
            <tr>
              <th>Name</th>
              <th>SID</th>
              <th>Email Address</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rosterData.map((student, index) => (
              <tr key={index}>
                <td>{student.Name}</td>
                <td>{student.SID}</td>
                <td>{student.Email}</td>
                <td>
                  <Link to={`/student/${student.SID}`}>
                    <button>View Details</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
