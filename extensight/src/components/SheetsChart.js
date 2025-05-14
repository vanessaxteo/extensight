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
  LineChart,
  Line,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

export default function SheetVisualizer({ sheetUrl, range = "Sheet1!A1:Z100" }) {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [frequencyData, setFrequencyData] = useState([]);
  const [chartType, setChartType] = useState("Bar");
  const [graphColor, setGraphColor] = useState("#0041cc");
  const [xLabel, setXLabel] = useState("");
  const [yLabel, setYLabel] = useState("");

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
          scope: "https://www.googleapis.com/auth/spreadsheets",
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
          Extension Frequency Visualization
        </Typography>

        <Box sx={{ mt: 3, mb: 4 }}>
          <FormControl fullWidth>
            <InputLabel id="column-select-label">Add a visualization for</InputLabel>
            <Select
              labelId="column-select-label"
              id="column-select"
              value={selectedColumn}
              label="Add a visualization for"
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

        <Box sx={{ mb: 3 }}>
  <FormControl fullWidth sx={{ mb: 2 }}>
    <InputLabel id="chart-type-label">Chart Type</InputLabel>
    <Select
      labelId="chart-type-label"
      value={chartType}
      label="Chart Type"
      onChange={(e) => setChartType(e.target.value)}
    >
      <MenuItem value="Bar">Bar</MenuItem>
      <MenuItem value="Line">Line</MenuItem>
      <MenuItem value="Pie">Pie</MenuItem>
      <MenuItem value="Donut">Donut</MenuItem>
      <MenuItem value="Radar">Radar</MenuItem>
    </Select>
  </FormControl>

    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
      <Typography>Color:</Typography>
      <input
        type="color"
        value={graphColor}
        onChange={(e) => setGraphColor(e.target.value)}
      />
    </Box>

    <Box sx={{ display: 'flex', gap: 2 }}>
      <input
        placeholder="X Label"
        value={xLabel}
        onChange={(e) => setXLabel(e.target.value)}
      />
      <input
        placeholder="Y Label"
        value={yLabel}
        onChange={(e) => setYLabel(e.target.value)}
      />
    </Box>
  </Box>


  <ResponsiveContainer width="100%" height={450}>
  {chartType === "Bar" && (
    <BarChart data={frequencyData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" label={{ value: xLabel, position: "insideBottom", offset: -5 }} />
      <YAxis label={{ value: yLabel, angle: -90, position: "insideLeft" }} />
      <Tooltip />
      <Legend />
      <Bar dataKey="count" fill={graphColor} />
    </BarChart>
  )}

  {chartType === "Line" && (
    <LineChart data={frequencyData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" label={{ value: xLabel, position: "insideBottom", offset: -5 }} />
      <YAxis label={{ value: yLabel, angle: -90, position: "insideLeft" }} />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="count" stroke={graphColor} />
    </LineChart>
  )}

  {chartType === "Pie" || chartType === "Donut" ? (
    <PieChart>
      <Tooltip />
      <Legend />
      <Pie
        data={frequencyData}
        dataKey="count"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={120}
        innerRadius={chartType === "Donut" ? 60 : 0}
        fill={graphColor}
        label
      />
    </PieChart>
  ) : null}

  {chartType === "Radar" && (
    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={frequencyData}>
      <PolarGrid />
      <PolarAngleAxis dataKey="name" />
      <PolarRadiusAxis />
      <Radar name="Frequency" dataKey="count" stroke={graphColor} fill={graphColor} fillOpacity={0.6} />
      <Legend />
    </RadarChart>
  )}
</ResponsiveContainer>

      </Paper>
    </Container>
  );
}
