import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import { gapi } from "gapi-script";

let tokenClient;

const StudentDetails = () => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState();
  const [assignments, setAssignments] = useState([]);
  const [extensionsData, setExtensionsData] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  function extractSheetIdFromUrl(url) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  async function getData(assignmentsSheetId, extensionsSheetId) {
    try {
      const [resAssignments, resDueDates] = await Promise.all([
        gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: assignmentsSheetId,
          range: "Sheet1!A2:A100",
        }),
        gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: assignmentsSheetId,
          range: "Sheet1!B2:B100",
        }),
      ]);

      const assignmentsValues = resAssignments.result.values || [];
      const dueDatesValues = resDueDates.result.values || [];

      const newAssignments = assignmentsValues
        .map((assignment, index) => ({
          name: assignment[0],
          due_date: dueDatesValues[index] ? dueDatesValues[index][0] : "",
        }))
        .filter((a) => a.name);

      console.log("Assignments:", newAssignments);
      setAssignments(newAssignments);

      const resExtensions = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: extensionsSheetId,
        range: "Sheet1!A1:J500",
      });

      const data = resExtensions.result.values || [];
      const rowNames = data[0];
      const responses = data.slice(1);

      const parsedExtensions = responses.map((response, i) => {
        const obj = {};
        rowNames.forEach((name, j) => {
          obj[name] = response[j];
        });
        obj["ind"] = i;
        return obj;
      });

      console.log("Extensions data:", parsedExtensions);
      setExtensionsData(parsedExtensions);

      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  useEffect(() => {
    setStudent(location.state?.data);

    gapi.load("client", async () => {
      await gapi.client.init({
        discoveryDocs: [
          "https://sheets.googleapis.com/$discovery/rest?version=v4",
        ],
      });

      const storedToken = localStorage.getItem("token");
      const storedTokenExp = localStorage.getItem("tokenExpiry");
      const assignmentsSheetUrl = localStorage.getItem("assignmentsSheet");
      const extensionsSheetUrl = localStorage.getItem("extensionsSheet");

      console.log("Stored token:", storedToken);
      console.log("Assignments sheet URL:", assignmentsSheetUrl);
      console.log("Extensions sheet URL:", extensionsSheetUrl);

      if (!assignmentsSheetUrl || !extensionsSheetUrl) {
        console.error("Missing Google Sheet URLs in localStorage.");
        return;
      }

      const assignmentsSheetId = extractSheetIdFromUrl(assignmentsSheetUrl);
      const extensionsSheetId = extractSheetIdFromUrl(extensionsSheetUrl);

      const currTime = new Date();
      if (storedToken && storedTokenExp && currTime.getTime() < storedTokenExp) {
        gapi.client.setToken({ access_token: storedToken });
        getData(assignmentsSheetId, extensionsSheetId);
      } else {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id:
            "189937528489-6nrjdp52eohmoposc8t31ggkts7sk5nr.apps.googleusercontent.com",
          scope: "https://www.googleapis.com/auth/spreadsheets",
          callback: (tokenResponse) => {
            gapi.client.setToken({ access_token: tokenResponse.access_token });
            localStorage.setItem("token", tokenResponse.access_token);
            localStorage.setItem("tokenExpiry", currTime.getTime() + 3550000)
            getData();
            setExtensionsData(extensionsData.filter(ext => ext["SID"] == student["SID"]));
          },
        });
        tokenClient.requestAccessToken();
      }
    });


  }, [location]);
  
  if (loading) return <div>Loading student details...</div>;
  

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
        <div>
          Due Dates
          {assignments.map((assignment, i) => (
            <div>
              {assignment["name"]} -- {extensionsData.filter(ext => ext["Approved?"] == "Yes").map(ext => ext["If you anticipate needing an extension on certain assignments, what assignment do you need to extend, and what day are you requesting to extend them until?"])
                .includes(assignment["name"]) ? extensionsData.filter(ext => ext["If you anticipate needing an extension on certain assignments, what assignment do you need to extend, and what day are you requesting to extend them until?"] == assignment["name"] && ext["Approved?"] == "Yes")
                .map(ext => ext["What date are you requesting an extension to?"])
                .sort()
                .at(-1) + " (Extended)" : assignment["due_date"]}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default StudentDetails;
