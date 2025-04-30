import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";

const StudentDetails = () => {
  const [student, setStudent] = useState();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log(location)
    setStudent(location.state?.data);
    console.log(student);
  }, [location]);

  if (!student) return null;

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
              <td>{student["Email"]}</td>
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
