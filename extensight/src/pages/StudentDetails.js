import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import { gapi } from "gapi-script";

import {
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Box,
  Paper,
} from "@mui/material";

let tokenClient;

const StudentDetails = () => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState();
  const [assignments, setAssignments] = useState([]);
  const [extensionsData, setExtensionsData] = useState([]);
  const [studentExtensions, setStudentExtensions] = useState([]);
  const [aiRecommendation, setAIRecommendation] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  function extractSheetIdFromUrl(url) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  async function getAISuggestions(assignments, extensions) {
    const response = await fetch(
      'https://noggin.rea.gent/desperate-marlin-9059',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer rg_v1_g4jj91fakulvx5dnznona44ynxvgsw1oxqlh_ngk',
        },
        body: JSON.stringify({
          "student_extensions": JSON.stringify(extensions),
          "assignments": JSON.stringify(assignments),
          "student": student
        }),
      }
    ).then(response => response.text());
    console.log(response);
    setAIRecommendation(response);
    return response;
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
            localStorage.setItem("tokenExpiry", currTime.getTime() + 3550000);
            getData(assignmentsSheetId, extensionsSheetId);
          },
        });
        tokenClient.requestAccessToken();
      }
    });
  }, [location]);

  useEffect(() => {
    if (student && extensionsData.length > 0) {
      const filtered = extensionsData.filter(ext => ext["SID"] === student["SID"]);
      setStudentExtensions(filtered);
    }
  }, [extensionsData, student]);

  useEffect(() => {
    if (assignments.length > 0 && studentExtensions.length > 0 && student) {
      getAISuggestions(assignments, studentExtensions);
    }
  }, [assignments, studentExtensions, student]);

  if (loading) return <div>Loading student details...</div>;
  if (!student) return null;

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: "2rem" }}>
        <h1>Student Details</h1>

        <Button
          variant="outlined"
          onClick={() => navigate("/students")}
          sx={{ marginBottom: "1rem" }}
        >
          Back to Students
        </Button>

        <TableContainer component={Paper} sx={{ width: "80%", marginBottom: "2rem" }}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell>{student["Name"]}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>SID</strong></TableCell>
                <TableCell>{student["SID"]}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Email Address</strong></TableCell>
                <TableCell>{student["Email"]}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Flags</strong></TableCell>
                <TableCell>{student["Flags"]}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Sections</strong></TableCell>
                <TableCell>{student["Sections"]}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ width: "80%", marginBottom: "2rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: 2 }}>
          <h3>AI Recommendation</h3>
          <p>
            {aiRecommendation !== ""
              ? aiRecommendation.replace(/\*\*Recommendation:\*\*/g, "Recommendation:")
              : "Loading AI Recommendation..."}
          </p>
        </Box>

        <Box sx={{ width: "80%", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: 2 }}>
          <h3>Due Dates</h3>
          {assignments.map((assignment, i) => {
            const approvedExtensions = studentExtensions
              .filter(
                (ext) =>
                  ext["Approved?"] === "Yes" &&
                  ext[
                    "If you anticipate needing an extension on certain assignments, what assignment do you need to extend, and what day are you requesting to extend them until?"
                  ] === assignment["name"]
              )
              .map((ext) => ext["What date are you requesting an extension to?"])
              .sort();

            const requestedExtensions = studentExtensions
              .filter(
                (ext) =>
                  !ext["Approved?"] &&
                  ext[
                    "If you anticipate needing an extension on certain assignments, what assignment do you need to extend, and what day are you requesting to extend them until?"
                  ] === assignment["name"]
              )
              .map((ext) => ext["What date are you requesting an extension to?"])
              .sort();

            let displayedDate = assignment["due_date"];

            if (approvedExtensions.length > 0) {
              displayedDate = approvedExtensions.at(-1) + " (Extended)";
            }
            if (requestedExtensions.length > 0) {
              displayedDate +=
                ", Pending Extension Request: " + requestedExtensions.at(-1);
            }

            return (
              <div key={i} style={{ marginBottom: "0.5rem" }}>
                <strong>{assignment["name"]}</strong> — {displayedDate}
              </div>
            );
          })}
        </Box>
      </main>
    </div>
  );
};

export default StudentDetails;
