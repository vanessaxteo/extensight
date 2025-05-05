import React, { useEffect, useState } from "react";
import { gapi } from "gapi-script";
import {
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Paper,
  Box,
} from "@mui/material";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function SheetVisualizer({ sheetUrl, range = "Sheet1!A1:Z100" }) {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [frequencyData, setFrequencyData] = useState([]);

  function extractSheetIdFromUrl(url) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  async function getSheetData() {
    const sheetId = extractSheetIdFromUrl(sheetUrl);
    if (!sheetId) return console.error("Invalid sheet URL");

    try {
      const result = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      });

      const rows = result.result.values;
      if (!rows || rows.length === 0) {
        console.warn("No data found.");
        return;
      }

      const [headerRow, ...dataRows] = rows;
      const parsedData = dataRows.map((row) =>
        Object.fromEntries(
          headerRow.map((key, i) => [key, row[i] || ""])
        )
      );

      setHeaders(headerRow);
      setData(parsedData);
      setSelectedColumn(headerRow[0]); // Default to first column
    } catch (err) {
      console.error("Error fetching sheet data:", err);
    }
  }

  useEffect(() => {
    gapi.load("client", async () => {
      await gapi.client.init({
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
      });

      const token = localStorage.getItem("token");
      const tokenExpiry = localStorage.getItem("tokenExpiry");
      const now = new Date();

      if (token && tokenExpiry && now.getTime() < tokenExpiry) {
        gapi.client.setToken({ access_token: token });
        getSheetData();
      } else {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: "189937528489-6nrjdp52eohmoposc8t31ggkts7sk5nr.apps.googleusercontent.com",
          scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
          callback: (tokenResponse) => {
            gapi.client.setToken({ access_token: tokenResponse.access_token });
            localStorage.setItem("token", tokenResponse.access_token);
            localStorage.setItem("tokenExpiry", now.getTime() + 3550000);
            getSheetData();
          },
        });

        tokenClient.requestAccessToken();
      }
    });
  }, [sheetUrl]);

  useEffect(() => {
    if (!selectedColumn || !data.length) return;

    const counts = {};
    data.forEach((row) => {
      const value = row[selectedColumn]?.trim() || "Blank";
      counts[value] = (counts[value] || 0) + 1;
    });

    const freqArray = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));

    setFrequencyData(freqArray);
  }, [selectedColumn, data]);

  if (!data.length) return <div>Loading chart...</div>;

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h5" gutterBottom>
          📊 Column Frequency Visualization
        </Typography>

        <Box sx={{ mt: 3, mb: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Select Column</InputLabel>
            <Select
              value={selectedColumn}
              label="Select Column"
              onChange={(e) => setSelectedColumn(e.target.value)}
            >
              {headers.map((header) => (
                <MenuItem key={header} value={header}>
                  {header}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <ResponsiveContainer width="100%" height={450}>
          <BarChart data={frequencyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Container>
  );
}
