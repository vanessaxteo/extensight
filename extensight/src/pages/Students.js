import React, { useEffect, useState } from "react";
import { Routes, Route, Outlet, Link } from "react-router-dom"; // Import Link for navigation
import Sidebar from "../components/sidebar/Sidebar";
import { gapi } from "gapi-script";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from "@mui/material";


let tokenClient;

export default function Students() {
  const [rosterData, setRosterData] = useState([]);
  const [loading, setLoading] = useState(true);

  function extractSheetIdFromUrl(url) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  async function getData() {
    let studentRosterId = localStorage.getItem("studentRoster");
    try {
      if (!studentRosterId) {
        console.error("Sheet IDs are missing");
        return;
      }
      else {
        studentRosterId = extractSheetIdFromUrl(studentRosterId);
      }

      const [students] = await Promise.all([
        gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: studentRosterId,
          range: "Roster!A1:E500",
        }),
      ]);

      const data = students.result.values || [];
      const rowNames = data[0];
      const studentData = data.slice(1);

      const parsedStudents = studentData.map((student, i) => {
        const obj = {};
        rowNames.forEach((name, j) => {
          obj[name] = student[j];
        });
        obj["ind"] = i;
        return obj;
      });

      console.log("Students data:", parsedStudents);
      setRosterData(parsedStudents);

      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  useEffect(() => {
    gapi.load("client", async () => {
      await gapi.client.init({
        discoveryDocs: [
          "https://sheets.googleapis.com/$discovery/rest?version=v4",
        ],
      });

      const storedToken = localStorage.getItem("token");
      const storedTokenExp = localStorage.getItem("tokenExpiry");

      console.log("Stored token:", storedToken);

      const currTime = new Date();
      if (storedToken && storedTokenExp && currTime.getTime() < storedTokenExp) {
        gapi.client.setToken({ access_token: storedToken });
        getData();
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
          },
        });
        tokenClient.requestAccessToken();
      }
    });
  }, []);

  
  if (loading) return <div>Loading students...</div>;
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: "2rem" }}>
        <h1>Students</h1>
  
        <TableContainer sx={{ width: "80%", marginBottom: "2rem" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>SID</TableCell>
                <TableCell>Email Address</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rosterData.map((student, index) => (
                <TableRow key={index}>
                  <TableCell>{student.Name}</TableCell>
                  <TableCell>{student.SID}</TableCell>
                  <TableCell>{student.Email}</TableCell>
                  <TableCell>
                    <Link
                      to={`/student/${student.SID}`}
                      state={{
                        data: rosterData.find((s) => s.SID === student.SID),
                      }}
                      style={{ textDecoration: "none" }}
                    >
                      <Button variant="contained" size="small">
                        View Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </main>
    </div>
  );  
}
