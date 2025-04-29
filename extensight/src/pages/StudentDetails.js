import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import Papa from "papaparse";

const StudentDetails = () => {
  const { sid } = useParams();
  const [student, setStudent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/data/roster.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const studentData = results.data.find(
              (row) => row["SID"] === sid
            );
            setStudent(studentData);
          },
        });
      })
      .catch((error) => console.error("Error loading CSV:", error));
  }, [sid]);

  if (!student) return <div>Loading...</div>;

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: "1rem" }}>
        <h2>Student Details</h2>

        <button onClick={() => navigate("/students")}>Back to Students</button> 

        <table border="1" cellPadding="8">
          <tbody>
            <tr>
              <td><strong>Name</strong></td>
              <td>{student["Name"]}</td>
            </tr>
            <tr>
              <td><strong>SID</strong></td>
              <td>{student["SID"]}</td>
            </tr>
            <tr>
              <td><strong>Email Address</strong></td>
              <td>{student["Email address"]}</td>
            </tr>
            <tr>
              <td><strong>UID</strong></td>
              <td>{student["UID"]}</td>
            </tr>
            <tr>
              <td><strong>Role</strong></td>
              <td>{student["Role"]}</td>
            </tr>
            <tr>
              <td><strong>Sections</strong></td>
              <td>{student["Sections"]}</td>
            </tr>
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default StudentDetails;
