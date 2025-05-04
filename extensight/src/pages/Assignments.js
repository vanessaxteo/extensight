import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
// Use only one approach for GAPI - stick with the imported version
import { gapi } from "gapi-script";
import Sidebar from "../components/sidebar/Sidebar";
import {
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Select,
  MenuItem,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  Typography,
  Card,
  CardContent,
  Drawer,
  IconButton,
  Divider,
} from "@mui/material";
import { DataGrid, GridToolbarQuickFilter } from '@mui/x-data-grid';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

let tokenClient;

// Memoized component for the metrics overview
const AssignmentsOverview = memo(({ assignments, extensionsData }) => {
  // Helper function to find student names consistently
  const findStudentName = useCallback((record) => {
    if (!record) return null;
    for (const column of STUDENT_NAME_COLUMN_NAMES) {
      if (column in record && record[column]) {
        return record[column];
      }
    }
    return null;
  }, []);

  // Memoized calculations for metrics
  const { extensionRequests, pendingApprovals, approvedRequests, studentConflicts } = useMemo(() => {
    // Track student names for conflict detection
    const studentCounts = {};
    
    // Count approved requests
    const approved = extensionsData.filter(ext => 
      ext['Approved (y/n)'] === 'Yes' || 
      ext['Approved'] === 'Yes' || 
      ext['approved'] === 'Yes' || 
      ext['Approved?'] === 'Yes'
    ).length;
    
    // Process student names for conflict detection
    extensionsData.forEach(ext => {
      // Find student name using various possible column names
      const studentName = findStudentName(ext);
      if (studentName) {
        studentCounts[studentName] = (studentCounts[studentName] || 0) + 1;
      }
    });
    
    // Count students with more than one extension request
    const conflicts = Object.values(studentCounts).filter(count => count > 1).length;
    
    return {
      extensionRequests: extensionsData.length,
      pendingApprovals: extensionsData.length - approved,
      approvedRequests: approved,
      studentConflicts: conflicts
    };
  }, [extensionsData, findStudentName]);

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
      <Card sx={{ flex: 1, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ color: '#0055FF' }} gutterBottom>Total Assignments</Typography>
          <Typography variant="h4">{assignments.length}</Typography>
        </CardContent>
      </Card>
      <Card sx={{ flex: 1, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ color: '#0055FF' }} gutterBottom>Extension Requests</Typography>
          <Typography variant="h4">{extensionRequests}</Typography>
        </CardContent>
      </Card>
      <Card sx={{ flex: 1, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ color: '#0055FF' }} gutterBottom>Pending Approval</Typography>
          <Typography variant="h4">{pendingApprovals}</Typography>
        </CardContent>
      </Card>
      <Card sx={{ flex: 1, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ color: '#0055FF' }} gutterBottom>Student Conflicts</Typography>
          <Typography variant="h4">{studentConflicts}</Typography>
        </CardContent>
      </Card>
    </Box>
  );
});

// Define constants for column name options to make the code more maintainable
const ASSIGNMENT_COLUMN_NAMES = [
  "If you anticipate needing an extension on certain assignments, what assignment do you need to extend, and what day are you requesting to extend them until?",
  "Assignment",
  "Which assignment do you need an extension for?",
  "Assignment Name"
];

const STUDENT_NAME_COLUMN_NAMES = [
  "Name", 
  "What is your name?", 
  "Email Address", 
  "Student Name",
  "Full Name"
];

const REQUESTED_DATE_COLUMN_NAMES = [
  "What date are you requesting an extension to?",
  "Requested Date",
  "Extension Date",
  "New Due Date"
];

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

    try {
      // First, get sheet column headers to determine column structure
      const sheetsMetadata = await gapi.client.sheets.spreadsheets.get({
        spreadsheetId: extensionsSheetId
      });
      
      // Get first sheet name
      const firstSheetName = sheetsMetadata.result.sheets[0]?.properties.title || "Sheet1";
      console.log("Using sheet:", firstSheetName);
      
      // Get header row
      const headerRowResponse = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: extensionsSheetId,
        range: `${firstSheetName}!A1:Z1`
      });
      
      const headers = headerRowResponse.result.values[0] || [];
      console.log("Found headers:", headers);
      
      // Find the 'Approved (y/n)' column index
      const approvedColIndex = headers.findIndex(header => header === "Approved (y/n)");
      
      if (approvedColIndex === -1) {
        console.error("Could not find 'Approved (y/n)' column in spreadsheet");
        setError("Could not find 'Approved (y/n)' column in spreadsheet. Please make sure it exists.");
        return;
      }
      
      // Convert column index to letter (0 = A, 1 = B, etc.)
      const approvedColLetter = String.fromCharCode(65 + approvedColIndex); // A=65 in ASCII
      console.log(`Found 'Approved (y/n)' in column ${approvedColLetter}`);
      
      const updatedExtensionsData = [...extensionsData];

      // Prepare values for the update
      const approvalStatus = [];
      
      // Only update the selected extensions
      for (let i = 0; i < selectedExtensions.length; i++) {
        const ext = selectedExtensions[i];
        const rowIndex = ext["ind"] + 2; // +2 because 1-indexed and header row
        const approvalValue = ext["Approved (y/n)"] || "";  

        // Update just this cell with the approval value
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: extensionsSheetId,
          range: `${firstSheetName}!${approvedColLetter}${rowIndex}`,
          resource: { values: [[approvalValue]] },
          valueInputOption: "RAW",
        });
      }

      console.log("Successfully updated approvals in 'Approved (y/n)' column");
      alert("Extension approvals successfully updated!");
      
      // Re-fetch data to update the UI
      getData();
    } catch (error) {
      console.error("Error updating extension approvals:", error);
      setError(`Error updating approvals: ${error.message || 'Unknown error'}`);
    }
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
      setLoadingMessage("Initializing Google API...");
      // We already have gapi from the import
      initializeGoogleAPI();
    };
    
    const initializeGoogleAPI = () => {
      setLoadingMessage("Initializing Google Sheets API...");
      // Use the imported gapi
      if (!gapi) {
        console.error("Debug - gapi not available");
        setError("Google API not loaded properly. Please refresh the page and try again.");
        setLoading(false);
        return;
      }
      
      // Load the client portion of the API
      gapi.load("client", async () => {
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
        
        // Initialize the token client with a more user-friendly approach
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
            
            // Use the imported gapi consistently
            gapi.client.setToken({ access_token: tokenResponse.access_token });
            localStorage.setItem("token", tokenResponse.access_token);
            localStorage.setItem("tokenExpiry", currTime.getTime() + 3550000);
            getData();
          },
          // Add error handler
          error_callback: (error) => {
            console.error("Auth error:", error);
            setError(`Authentication failed: ${error || 'Popup may have been blocked. Please allow popups for this site.'}`); 
            setLoading(false);
          }
        });
        
        // Request token with focus on the current window to avoid popup blockers
        try {
          tokenClient.requestAccessToken({
            prompt: 'consent',
            hint: '', // Optional email hint
            // Use a timeout to give the browser time to focus
            timeout: 500 
          });
          
          // Ensure the window has focus to prevent popup blocking
          window.focus();
        } catch (err) {
          console.error("Error requesting token:", err);
          setError(`Could not authenticate: ${err.message}. Try disabling popup blockers.`);
          setLoading(false);
        }
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
        error_callback: (error) => {
          console.error("Auth error:", error);
          setError(`Authentication failed: ${error || 'Popup may have been blocked. Please allow popups for this site.'}`); 
        }
      });
      
      // Using the same improved pattern as in the initial auth flow
      try {
        tokenClient.requestAccessToken({
          prompt: 'consent',
          timeout: 500
        });
        window.focus();
      } catch (err) {
        console.error("Error requesting token:", err);
        setError(`Could not authenticate: ${err.message}. Try disabling popup blockers.`);
      }
    } else {
      console.error("Debug - Google accounts API not available");
      setError("Google authentication API not available. Please refresh the page and try again.");
    }
  };

  // Auto-process URLs when they are available
  useEffect(() => {
    if (showSheetUrlForm && assignmentsSheetUrl && extensionsSheetUrl) {
      console.log("Auto-processing form with existing spreadsheet URLs");
      
      // Short delay to allow UI to render first
      const timer = setTimeout(() => {
        saveSheetUrls();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [showSheetUrlForm, assignmentsSheetUrl, extensionsSheetUrl]);
  
  // Auto-authenticate when needed
  useEffect(() => {
    if (error && error.includes("authentication") && window.google && window.google.accounts) {
      console.log("Auto-triggering re-authentication due to authentication error");
      
      // Short delay to allow UI to render first
      const timer = setTimeout(() => {
        handleReAuthenticate();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  const renderSheetUrlForm = () => (
    <Paper elevation={3} sx={{ padding: 3, maxWidth: 600, margin: '0 auto', mt: 4 }}>
      <Typography variant="h5" sx={{ color: '#0055FF', fontWeight: 500 }} gutterBottom>Enter Google Spreadsheet URLs</Typography>
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
          id="auto-save-button" // Adding ID for reference
        >
          Save and Load Data
        </Button>
      </Box>
      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
        If you're experiencing permission issues, try clicking "Re-authenticate with Google" to refresh your Google authorization.
      </Typography>
      {/* Only show this message when we're auto-processing */}
      {(assignmentsSheetUrl && extensionsSheetUrl) && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Auto-processing your request... Please wait.
        </Alert>
      )}
    </Paper>
  );

  // Helper functions for finding column values - moved before any conditional returns
  const findAssignmentColumn = useCallback((data) => {
    if (!data || data.length === 0) return null;
    return ASSIGNMENT_COLUMN_NAMES.find(colName => colName in data[0]);
  }, []);

  const findValueFromColumns = useCallback((record, columnOptions) => {
    if (!record) return null;
    for (const column of columnOptions) {
      if (column in record && record[column]) {
        return record[column];
      }
    }
    return null;
  }, []);
  
  // Memoize the assignment column to avoid recalculating for each cell
  const assignmentColumn = useMemo(() => 
    findAssignmentColumn(extensionsData),
    [extensionsData, findAssignmentColumn]
  );
  
  // Direct function to count extensions for an assignment - simpler and more reliable approach
  const countExtensionsForAssignment = useCallback((assignmentName) => {
    if (!assignmentName || !extensionsData || extensionsData.length === 0) return 0;
    
    let matchingExtensions = [];
    
    // Count extensions for this assignment
    if (assignmentColumn && extensionsData.some(ext => assignmentColumn in ext)) {
      // If we have an assignment column, use it for direct matches
      matchingExtensions = extensionsData.filter(ext => ext[assignmentColumn] === assignmentName);
    } else {
      // Fallback to fuzzy matching across all fields
      matchingExtensions = extensionsData.filter(ext => 
        Object.values(ext).some(value => 
          typeof value === 'string' && 
          value.toLowerCase().includes(assignmentName.toLowerCase())
        )
      );
    }
    
    return matchingExtensions.length;
  }, [extensionsData, assignmentColumn]);
  
  // Function to get pending count (not approved)
  const countPendingForAssignment = useCallback((assignmentName) => {
    if (!assignmentName || !extensionsData || extensionsData.length === 0) return 0;
    
    let matchingExtensions = [];
    
    // Find extensions for this assignment
    if (assignmentColumn && extensionsData.some(ext => assignmentColumn in ext)) {
      matchingExtensions = extensionsData.filter(ext => ext[assignmentColumn] === assignmentName);
    } else {
      matchingExtensions = extensionsData.filter(ext => 
        Object.values(ext).some(value => 
          typeof value === 'string' && 
          value.toLowerCase().includes(assignmentName.toLowerCase())
        )
      );
    }
    
    // Count those that are not approved with 'Yes'
    return matchingExtensions.filter(ext => ext['Approved (y/n)'] !== 'Yes').length;
  }, [extensionsData, assignmentColumn]);
  
  // Function to get approved count
  const countApprovedForAssignment = useCallback((assignmentName) => {
    if (!assignmentName || !extensionsData || extensionsData.length === 0) return 0;
    
    let matchingExtensions = [];
    
    // Find extensions for this assignment
    if (assignmentColumn && extensionsData.some(ext => assignmentColumn in ext)) {
      matchingExtensions = extensionsData.filter(ext => ext[assignmentColumn] === assignmentName);
    } else {
      matchingExtensions = extensionsData.filter(ext => 
        Object.values(ext).some(value => 
          typeof value === 'string' && 
          value.toLowerCase().includes(assignmentName.toLowerCase())
        )
      );
    }
    
    // Count those that are approved with 'Yes'
    return matchingExtensions.filter(ext => ext['Approved (y/n)'] === 'Yes').length;
  }, [extensionsData, assignmentColumn]);
  
  // Helper for filtering extensions by assignment name - direct implementation
  const filterExtensionsFor = useCallback((assignmentName) => {
    if (!assignmentName || !extensionsData || extensionsData.length === 0) return [];
    
    let matchingExtensions = [];
    
    // Find extensions for this assignment
    if (assignmentColumn && extensionsData.some(ext => assignmentColumn in ext)) {
      // If we have an assignment column, use it for direct matches
      matchingExtensions = extensionsData.filter(ext => ext[assignmentColumn] === assignmentName);
    } else {
      // Fallback to fuzzy matching across all fields
      matchingExtensions = extensionsData.filter(ext => 
        Object.values(ext).some(value => 
          typeof value === 'string' && 
          value.toLowerCase().includes(assignmentName.toLowerCase())
        )
      );
    }
    
    return matchingExtensions;
  }, [extensionsData, assignmentColumn]);
  
  // Helper for drawer state management
  const closeDrawer = useCallback(() => {
    setSelectedAssignment("");
    setSelectedExtensions([]);
  }, []);
  
  const openDrawer = useCallback((assignmentName) => {
    const selected = filterExtensionsFor(assignmentName);
    setSelectedExtensions(selected);
    setSelectedAssignment(assignmentName);
    
    // Debug extension spreadsheet data
    console.log("Debug - Total extension data entries:", extensionsData.length);
    console.log("Debug - First 3 extension records (sample):", extensionsData.slice(0, 3));
    console.log("Debug - Available column names in extension data:", 
      extensionsData.length > 0 ? Object.keys(extensionsData[0]) : "No extension data");
    console.log("Debug - Using assignment column:", assignmentColumn || "None found");
  }, [filterExtensionsFor, extensionsData, assignmentColumn]);

  // Loading state - after all hooks are defined
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
        <Typography variant="h2" sx={{ mb: 1, fontWeight: 500, fontSize: 24, color: '#0055FF' }}>Assignments</Typography>
        {error && <Alert severity="error" sx={{ mb: 2, maxWidth: "80%" }}>{error}</Alert>}

        {/* Metrics Bar Component */}
        <AssignmentsOverview 
          assignments={assignments} 
          extensionsData={extensionsData} 
        />

        {/* DataGrid */}
        <Box sx={{ height: 600, width: '100%', mb: 4 }}>
          <DataGrid
            rows={assignments.map((assignment, index) => {
              // Calculate real counts for this assignment
              const matchingExtensions = extensionsData.filter(ext => {
                // Try exact match first (if we have an assignment column)
                if (assignmentColumn && ext[assignmentColumn]) {
                  return ext[assignmentColumn] === assignment.name;
                }
                
                // Fall back to fuzzy matching in all fields
                return Object.values(ext).some(value => 
                  typeof value === 'string' && 
                  value.toLowerCase().includes(assignment.name.toLowerCase())
                );
              });
              
              // Count approved extensions
              const approvedCount = matchingExtensions.filter(ext => 
                ext['Approved (y/n)'] === 'Yes' || 
                ext['Approved'] === 'Yes' || 
                ext['approved'] === 'Yes' || 
                ext['Approved?'] === 'Yes'
              ).length;
              
              // Build the row data in the format that works
              return {
                id: index,
                name: assignment.name,
                due_date: assignment.due_date,
                // Use the field names that work in the DataGrid
                requests: matchingExtensions.length,
                pending: matchingExtensions.length - approvedCount,
                approved: approvedCount
              };
            })}
            columns={[
              { field: 'name', headerName: 'Assignment', flex: 1 },
              { field: 'due_date', headerName: 'Due Date', width: 130 },
              { field: 'requests', headerName: 'Requests', width: 110, type: 'number' },
              { field: 'pending', headerName: 'Pending', width: 100, type: 'number' },
              { field: 'approved', headerName: 'Approved', width: 100, type: 'number' },
              {
                field: 'actions',
                headerName: '',
                width: 50,
                sortable: false,
                filterable: false,
                renderCell: (params) => (
                  <IconButton onClick={() => openDrawer(params.row.name)}>
                    <ChevronRightIcon />
                  </IconButton>
                ),
              },
            ]}
            components={{ Toolbar: GridToolbarQuickFilter }}
            componentsProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { 
                  debounceMs: 300,
                  placeholder: "Search assignments...",
                  "aria-label": "Filter assignments"
                },
              },
            }}
            components={{
              Cell: ({ value, field }) => {
                // For numeric columns, ensure the value is rendered as a number
                if (['requestsCount', 'pendingCount', 'approvedCount'].includes(field)) {
                  return <div style={{textAlign: 'center', padding: '8px'}}>{value}</div>;
                }
                // For other columns, use default rendering
                return <div style={{padding: '8px'}}>{value}</div>;
              }
            }}
            onRowClick={(params) => openDrawer(params.row.name)}
            sx={{
              '& .MuiDataGrid-columnHeaders': { backgroundColor: '#F5F5F5' },
              '& .MuiDataGrid-row:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' },
              boxShadow: 1,
              borderRadius: 2,
              p: 1
            }}
          />
        </Box>

        {/* Slide-in Drawer instead of Modal */}
        <Drawer
          anchor="right"
          open={selectedAssignment !== ""}
          onClose={closeDrawer}
        >
          <Box sx={{ width: 500, p: 3 }}>
            <Typography variant="h6" sx={{ color: '#0055FF', fontWeight: 500 }} gutterBottom>
              Extension Requests for "{selectedAssignment}"
            </Typography>
            
            <Divider sx={{ mb: 2 }} />

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
                      const studentName = findValueFromColumns(extension, STUDENT_NAME_COLUMN_NAMES) || "Unknown";
                      const requestedDate = findValueFromColumns(extension, REQUESTED_DATE_COLUMN_NAMES) || "";
                      
                      return (
                        <TableRow key={i}>
                          <TableCell sx={{ fontSize: '0.9rem' }}>{studentName}</TableCell>
                          <TableCell sx={{ fontSize: '0.9rem' }}>{requestedDate}</TableCell>
                          <TableCell>
                            {/* Check if the Approved (y/n) column exists in the headers */}
                            {extensionsData.length > 0 && 'Approved (y/n)' in extensionsData[0] ? (
                              <>
                                <Select
                                  value={extension["Approved (y/n)"] || extension["Approved?"] || ""}
                                  size="small"
                                  onChange={(e) => {
                                    const updated = [...selectedExtensions];
                                    updated[i]["Approved (y/n)"] = e.target.value;
                                    setSelectedExtensions(updated);
                                  }}
                                >
                                  <MenuItem value="">-</MenuItem>
                                  <MenuItem value="No">No</MenuItem>
                                  <MenuItem value="Yes">Yes</MenuItem>
                                </Select>
                              </>
                            ) : (
                              <>
                                <Select
                                  value=""
                                  size="small"
                                  disabled
                                >
                                  <MenuItem value="">-</MenuItem>
                                </Select>
                                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                                  "Approved (y/n)" column missing in spreadsheet
                                </Typography>
                              </>
                            )}
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={closeDrawer}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                disabled={selectedExtensions.length === 0}
                onClick={() => {
                  closeDrawer();
                  submitExtensionsApproval();
                }}
              >
                Submit
              </Button>
            </Box>
          </Box>
        </Drawer>
      </main>
    </div>
  );
}
