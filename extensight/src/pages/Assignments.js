import React, { useState, useEffect } from "react";
import { gapi } from "gapi-script";
import Sidebar from "../components/sidebar/Sidebar";
import {
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Modal,
  Box,
  Select,
  MenuItem,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";

let tokenClient;

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [extensionsData, setExtensionsData] = useState([]);
  const [selectedExtensions, setSelectedExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");
  const [assignmentsSheetId, setAssignmentsSheetId] = useState(null);
  const [extensionsSheetId, setExtensionsSheetId] = useState(null);
  const [error, setError] = useState(null);
  const [showSheetUrlForm, setShowSheetUrlForm] = useState(false);
  const [assignmentsSheetUrl, setAssignmentsSheetUrl] = useState("");
  const [extensionsSheetUrl, setExtensionsSheetUrl] = useState("");

  function extractSheetIdFromUrl(url) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  async function submitExtensionsApproval() {
    if (!extensionsSheetId) {
      console.error("Extensions Sheet ID missing");
      return;
    }

    const updatedExtensionsData = [...extensionsData];

    selectedExtensions.forEach((ext) => {
      updatedExtensionsData[ext["ind"]]["Approved?"] = ext["Approved?"];
    });

    const approvalStatus = updatedExtensionsData.map((ext) =>
      ext["Approved?"] !== undefined ? [ext["Approved?"]] : [""]
    );

    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: extensionsSheetId,
      range: `J2:J${updatedExtensionsData.length + 1}`,
      resource: { values: approvalStatus },
      valueInputOption: "RAW",
    });
  }

  const saveSheetUrls = () => {
    if (assignmentsSheetUrl && extensionsSheetUrl) {
      localStorage.setItem("assignmentsSheet", assignmentsSheetUrl);
      localStorage.setItem("extensionsSheet", extensionsSheetUrl);
      
      setAssignmentsSheetId(extractSheetIdFromUrl(assignmentsSheetUrl));
      setExtensionsSheetId(extractSheetIdFromUrl(extensionsSheetUrl));
      setShowSheetUrlForm(false);
      setError(null);
    } else {
      setError("Please enter both spreadsheet URLs");
    }
  };

  async function getData() {
    try {
      setLoadingMessage("Checking spreadsheet IDs...");
      console.log("Debug - Assignments Sheet ID:", assignmentsSheetId);
      console.log("Debug - Extensions Sheet ID:", extensionsSheetId);
      console.log("Debug - gapi.client initialized:", !!gapi.client);
      console.log("Debug - gapi.client.sheets available:", !!gapi.client.sheets);
      
      if (!assignmentsSheetId || !extensionsSheetId) {
        console.error("Sheet IDs are missing");
        setError("Sheet IDs are missing. Please enter valid Google Spreadsheet URLs.");
        setShowSheetUrlForm(true);
        return;
      }

      // Verify token is still valid
      const currentToken = gapi.client.getToken();
      console.log("Debug - Current token exists:", !!currentToken);
      if (!currentToken) {
        setError("You're not authenticated with Google. Please sign in again.");
        return;
      }

      setLoadingMessage("Fetching assignments data...");
      console.log("Debug - Attempting to fetch from assignments sheet ID:", assignmentsSheetId);
      
      try {
        // Test API with a simpler request first
        const testRequest = await gapi.client.sheets.spreadsheets.get({
          spreadsheetId: assignmentsSheetId
        });
        console.log("Debug - Spreadsheet metadata:", testRequest.result.properties.title);
      } catch (testError) {
        console.error("Debug - Test API call failed:", testError);
        setError(`Cannot access spreadsheet. Error: ${testError.message || 'Unknown error'}. Check if the spreadsheet exists and you have access to it.`);
        setShowSheetUrlForm(true);
        setLoading(false);
        return;
      }
      
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

      console.log("Debug - Raw assignments values:", assignmentsValues);
      console.log("Debug - Raw due dates values:", dueDatesValues);

      const newAssignments = assignmentsValues
        .map((assignment, index) => ({
          name: assignment[0],
          due_date: dueDatesValues[index] ? dueDatesValues[index][0] : "",
        }))
        .filter((a) => a.name);

      console.log("Debug - Processed assignments:", newAssignments);
      setAssignments(newAssignments);

      setLoadingMessage("Fetching extension requests...");
      console.log("Debug - Attempting to fetch from extensions sheet ID:", extensionsSheetId);
      
      // Try different ranges to make sure we capture all data
      console.log("Debug - Attempting to fetch extension sheet data from:", extensionsSheetId);
      let parsedExtensions = [];
      try {
        // Get sheet names first to determine correct sheet
        const sheetsMetadata = await gapi.client.sheets.spreadsheets.get({
          spreadsheetId: extensionsSheetId
        });
        console.log("Debug - Extension spreadsheet title:", sheetsMetadata.result.properties.title);
        console.log("Debug - Available sheets:", sheetsMetadata.result.sheets.map(s => s.properties.title));
        
        // Use first sheet if available
        const firstSheetName = sheetsMetadata.result.sheets[0]?.properties.title || "Sheet1";
        console.log("Debug - Using sheet:", firstSheetName);
        
        const resExtensions = await gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: extensionsSheetId,
          range: `${firstSheetName}!A1:Z500`, // Using a wider range to ensure we get all columns
        });
    
        const data = resExtensions.result.values || [];
        console.log("Debug - Raw extensions data rows:", data.length);
        console.log("Debug - Header row:", data[0]);
        console.log("Debug - Sample data row:", data.length > 1 ? data[1] : "No data rows");
        
        if (data.length <= 1) {
          console.log("Debug - Extension spreadsheet has no data rows or only a header");
        }
        
        const rowNames = data[0];
        const responses = data.slice(1);
    
        // Create objects with column name as keys
        parsedExtensions = responses.map((response, i) => {
          const obj = {};
          rowNames.forEach((name, j) => {
            // Skip empty column names
            if (name) {
              obj[name] = response[j] || "";
            }
          });
          obj["ind"] = i;
          return obj;
        });
        
        // Log column details to help debugging
        const sampleExtension = parsedExtensions[0] || {};
        console.log("Debug - Extension data columns:", Object.keys(sampleExtension));
        console.log("Debug - Sample extension record:", sampleExtension);
      } catch (extensionError) {
        console.error("Debug - Error fetching extension data:", extensionError);
        throw extensionError; // rethrow to be caught by outer try-catch
      }

      console.log("Debug - Processed extensions data count:", parsedExtensions.length);
      setExtensionsData(parsedExtensions);

      // Save successful sheet URLs to localStorage
      localStorage.setItem("assignmentsSheet", assignmentsSheetUrl || localStorage.getItem("assignmentsSheet"));
      localStorage.setItem("extensionsSheet", extensionsSheetUrl || localStorage.getItem("extensionsSheet"));
      
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error("Debug - Main error in getData:", error);
      console.error("Debug - Error details:", {
        message: error.message,
        stack: error.stack,
        status: error.status,
        result: error.result
      });
      
      let errorMessage = 'Unknown error';
      if (error.result && error.result.error) {
        errorMessage = `${error.result.error.message} (${error.result.error.status})`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(`Error loading data: ${errorMessage}. Please check your spreadsheet URLs and permissions.`);
      setShowSheetUrlForm(true);
      setLoading(false);
    }
  }

  useEffect(() => {
    const loadAndInitializeGapi = () => {
      setLoadingMessage("Loading Google API...");
      // Explicitly adding a script to load the Google API client
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("Debug - Google API script loaded");
        initializeGoogleAPI();
      };
      script.onerror = () => {
        console.error("Debug - Failed to load Google API script");
        setError("Failed to load Google API. Please check your internet connection and try again.");
        setLoading(false);
      };
      document.body.appendChild(script);
    };
    
    const initializeGoogleAPI = () => {
      setLoadingMessage("Initializing Google Sheets API...");
      // First check if gapi is available
      if (!window.gapi) {
        console.error("Debug - gapi not available");
        setError("Google API not loaded properly. Please refresh the page and try again.");
        setLoading(false);
        return;
      }
      
      // Load the client portion of the API
      window.gapi.load("client", async () => {
        try {
          setLoadingMessage("Loading Google Sheets API...");
          console.log("Debug - Before gapi.client.init");
          
          await window.gapi.client.init({
            apiKey: null, // No API key needed for this use case
            discoveryDocs: [
              "https://sheets.googleapis.com/$discovery/rest?version=v4",
            ],
          });

          console.log("Debug - After gapi.client.init, checking for gapi.client.sheets:", !!window.gapi.client.sheets);
    
          const storedToken = localStorage.getItem("token");
          const storedTokenExp = localStorage.getItem("tokenExpiry");
          const storedAssignmentsSheetUrl = localStorage.getItem("assignmentsSheet");
          const storedExtensionsSheetUrl = localStorage.getItem("extensionsSheet");
    
          console.log("Debug - Stored token:", storedToken ? "[PRESENT]" : "[MISSING]");
          console.log("Debug - Assignments sheet URL:", storedAssignmentsSheetUrl);
          console.log("Debug - Extensions sheet URL:", storedExtensionsSheetUrl);
    
          if (!storedAssignmentsSheetUrl || !storedExtensionsSheetUrl) {
            console.error("Debug - Missing Google Sheet URLs in localStorage.");
            setError("No spreadsheet URLs found. Please enter the Google Spreadsheet URLs to continue.");
            setShowSheetUrlForm(true);
            setLoading(false);
            return;
          }
    
          setAssignmentsSheetUrl(storedAssignmentsSheetUrl);
          setExtensionsSheetUrl(storedExtensionsSheetUrl);
          const assignmentId = extractSheetIdFromUrl(storedAssignmentsSheetUrl);
          const extensionId = extractSheetIdFromUrl(storedExtensionsSheetUrl);
          console.log("Debug - Extracted assignment sheet ID:", assignmentId);
          console.log("Debug - Extracted extension sheet ID:", extensionId);
          
          setAssignmentsSheetId(assignmentId);
          setExtensionsSheetId(extensionId);
    
          // Ensure Google Identity Services is loaded
          if (!window.google || !window.google.accounts) {
            console.log("Debug - Loading Google Identity Services...");
            const identityScript = document.createElement('script');
            identityScript.src = 'https://accounts.google.com/gsi/client';
            identityScript.async = true;
            identityScript.defer = true;
            identityScript.onload = () => {
              console.log("Debug - Google Identity Services loaded");
              handleAuthentication(storedToken, storedTokenExp);
            };
            identityScript.onerror = () => {
              console.error("Debug - Failed to load Google Identity Services");
              setError("Failed to load Google authentication services. Please refresh the page.");
              setLoading(false);
            };
            document.body.appendChild(identityScript);
          } else {
            handleAuthentication(storedToken, storedTokenExp);
          }
        } catch (error) {
          console.error("Debug - Error initializing Google API:", error);
          setError(`Error initializing Google API: ${error.message || 'Unknown error'}`);
          setLoading(false);
        }
      });
    };
    
    const handleAuthentication = (storedToken, storedTokenExp) => {
      const currTime = new Date();
      if (storedToken && storedTokenExp && currTime.getTime() < parseInt(storedTokenExp)) {
        setLoadingMessage("Authenticating with stored token...");
        console.log("Debug - Using stored token");
        window.gapi.client.setToken({ access_token: storedToken });
        getData();
      } else {
        setLoadingMessage("Requesting Google authorization...");
        console.log("Debug - Requesting new token");
        if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
          console.error("Debug - Google OAuth2 not available");
          setError("Google authentication API not available. Please refresh the page.");
          setLoading(false);
          return;
        }
        
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: "189937528489-6nrjdp52eohmoposc8t31ggkts7sk5nr.apps.googleusercontent.com",
          scope: "https://www.googleapis.com/auth/spreadsheets",
          callback: (tokenResponse) => {
            console.log("Debug - Token response received", tokenResponse);
            if (tokenResponse.error) {
              setError(`Authentication error: ${tokenResponse.error}`);
              setLoading(false);
              return;
            }
            window.gapi.client.setToken({ access_token: tokenResponse.access_token });
            localStorage.setItem("token", tokenResponse.access_token);
            localStorage.setItem("tokenExpiry", currTime.getTime() + 3550000);
            getData();
          },
        });
        tokenClient.requestAccessToken({ prompt: 'consent' });
      }
    };

    // Check if Google API is already loaded
    if (window.gapi) {
      console.log("Debug - gapi already available");
      initializeGoogleAPI();
    } else {
      console.log("Debug - gapi not yet loaded, loading script");
      loadAndInitializeGapi();
    }
  }, []);
  
  useEffect(() => {
    if (assignmentsSheetId && extensionsSheetId && window.gapi && window.gapi.client) {
      console.log("Debug - Both sheet IDs and gapi client available, getting data");
      getData();
    }
  }, [assignmentsSheetId, extensionsSheetId]);

  // Force re-authentication with Google
  const handleReAuthenticate = () => {
    // Clear existing token
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiry");
    gapi.client.setToken(null);
    
    console.log("Debug - Forcing re-authentication with Google");
    
    // Request new token
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: "189937528489-6nrjdp52eohmoposc8t31ggkts7sk5nr.apps.googleusercontent.com",
        scope: "https://www.googleapis.com/auth/spreadsheets",
        callback: (tokenResponse) => {
          if (tokenResponse.error) {
            console.error("Debug - Auth error:", tokenResponse.error);
            setError(`Authentication error: ${tokenResponse.error}`);
            return;
          }
          
          const currTime = new Date();
          gapi.client.setToken({ access_token: tokenResponse.access_token });
          localStorage.setItem("token", tokenResponse.access_token);
          localStorage.setItem("tokenExpiry", currTime.getTime() + 3550000);
          console.log("Debug - New token acquired, retrying data fetch");
          getData();
        },
      });
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      console.error("Debug - Google accounts API not available");
      setError("Google authentication API not available. Please refresh the page and try again.");
    }
  };

  const renderSheetUrlForm = () => (
    <Paper elevation={3} sx={{ padding: 3, maxWidth: 600, margin: '0 auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>Enter Google Spreadsheet URLs</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        label="Assignments Spreadsheet URL"
        variant="outlined"
        fullWidth
        value={assignmentsSheetUrl}
        onChange={(e) => setAssignmentsSheetUrl(e.target.value)}
        margin="normal"
        helperText="Format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit"
      />
      <TextField
        label="Extensions Spreadsheet URL"
        variant="outlined"
        fullWidth
        value={extensionsSheetUrl}
        onChange={(e) => setExtensionsSheetUrl(e.target.value)}
        margin="normal"
        helperText="Format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit"
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleReAuthenticate}
        >
          Re-authenticate with Google
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={saveSheetUrls}
        >
          Save and Load Data
        </Button>
      </Box>
      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
        If you're experiencing permission issues, try clicking "Re-authenticate with Google" to refresh your Google authorization.
      </Typography>
    </Paper>
  );

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "80vh" }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>{loadingMessage}</Typography>
      </div>
    );
  }
  
  if (showSheetUrlForm) {
    return (
      <div style={{ display: "flex" }}>
        <Sidebar />
        <main style={{ flexGrow: 1, padding: "2rem" }}>
          <h1>Assignments</h1>
          {renderSheetUrlForm()}
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: "2rem" }}>
        <h1>Assignments</h1>
        {error && <Alert severity="error" sx={{ mb: 2, maxWidth: "80%" }}>{error}</Alert>}

        <TableContainer sx={{ width: "80%", marginBottom: "2rem" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Assignment</TableCell>
                <TableCell>Due Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((assignment, index) => (
                <TableRow
                  key={index}
                  hover
                  onClick={() => {
                    setSelectedAssignment(assignment.name);
                    
                    // Debug extension spreadsheet data
                    console.log("Debug - Total extension data entries:", extensionsData.length);
                    console.log("Debug - First 3 extension records (sample):", extensionsData.slice(0, 3));
                    console.log("Debug - Available column names in extension data:", 
                      extensionsData.length > 0 ? Object.keys(extensionsData[0]) : "No extension data");
                    
                    // Try multiple possible column names for assignment selection
                    const assignmentColumnNames = [
                      "If you anticipate needing an extension on certain assignments, what assignment do you need to extend, and what day are you requesting to extend them until?",
                      "Assignment",
                      "Which assignment do you need an extension for?",
                      "Assignment Name"
                    ];
                    
                    // Find the first column name that exists in the data
                    const assignmentColumn = assignmentColumnNames.find(colName => 
                      extensionsData.length > 0 && colName in extensionsData[0]
                    );
                    
                    console.log("Debug - Using assignment column:", assignmentColumn || "None found");
                    
                    let selected = [];
                    
                    if (assignmentColumn) {
                      // Filter using the found column name
                      selected = extensionsData.filter(ext => ext[assignmentColumn] === assignment.name);
                    } else {
                      // Fallback: try to match assignment name in any column
                      console.log("Debug - No assignment column found, trying fuzzy match");
                      selected = extensionsData.filter(ext => {
                        // Check all string values in the record for the assignment name
                        return Object.values(ext).some(value => 
                          typeof value === 'string' && 
                          value.toLowerCase().includes(assignment.name.toLowerCase())
                        );
                      });
                    }
                    
                    setSelectedExtensions(selected);
                    console.log("Debug - Selected extensions for", assignment.name, ":", selected);
                  }}
                >
                  <TableCell>{assignment.name}</TableCell>
                  <TableCell>{assignment.due_date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Modal
          open={selectedAssignment !== ""}
          onClose={() => setSelectedAssignment("")}
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 600,
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h2>Extension Requests for "{selectedAssignment}"</h2>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Requested Date</TableCell>
                    <TableCell>Approved?</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedExtensions.length > 0 ? (
                    selectedExtensions.map((extension, i) => {
                      console.log("Debug - Extension data for row", i, extension);
                      const studentName = extension["Name"] || extension["What is your name?"] || extension["Email Address"] || "Unknown";
                      const requestedDate = extension["What date are you requesting an extension to?"] || 
                                          extension["Requested Date"] || 
                                          extension["Extension Date"] || 
                                          "";
                      
                      return (
                        <TableRow key={i}>
                          <TableCell>{studentName}</TableCell>
                          <TableCell>{requestedDate}</TableCell>
                          <TableCell>
                            <Select
                              value={extension["Approved?"] || ""}
                              size="small"
                              onChange={(e) => {
                                const updated = [...selectedExtensions];
                                updated[i]["Approved?"] = e.target.value;
                                setSelectedExtensions(updated);
                              }}
                            >
                              <MenuItem value="">-</MenuItem>
                              <MenuItem value="No">No</MenuItem>
                              <MenuItem value="Yes">Yes</MenuItem>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">No extension requests found for this assignment</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setSelectedAssignment("")}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setSelectedAssignment("");
                  submitExtensionsApproval();
                }}
              >
                Submit
              </Button>
            </Box>
          </Box>
        </Modal>
      </main>
    </div>
  );
}
