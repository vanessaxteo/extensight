import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import { gapi } from "gapi-script";
import Sidebar from "../components/sidebar/Sidebar";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Drawer,
  IconButton,
  Divider,
  Chip,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Avatar,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Link,
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import NoteIcon from '@mui/icons-material/Note';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';

let tokenClient;

// Metrics bar component to show counts at the top
const StudentMetricsBar = memo(({ students }) => {
  // Calculate metrics
  const newRequests = students.filter(student => 
    student.extensions && student.extensions.some(ext => !ext.reviewed)
  ).length || 3; // Hardcoded for demo if no data
  
  const dspRequests = students.filter(student => 
    student.DSP === true || student.Flags?.includes('DSP')
  ).length || 5; // Hardcoded for demo if no data
  
  // Count students with conflicts
  const conflicts = [
    '4 extensions in 2 weeks',
    '6 extensions in 2 weeks',
    'assignments conflicts'
  ];
  
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
      <Card sx={{ flex: 1, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" color="primary" gutterBottom>New Requests</Typography>
          <Typography variant="h4">{newRequests}</Typography>
        </CardContent>
      </Card>
      <Card sx={{ flex: 1, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" color="primary" gutterBottom>DSP Requests</Typography>
          <Typography variant="h4">{dspRequests}</Typography>
        </CardContent>
      </Card>
      <Card sx={{ flex: 1, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" color="primary" gutterBottom>Flags</Typography>
          <Box>
            {conflicts.map((conflict, index) => (
              <Typography key={index} variant="body2">{conflict}</Typography>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
});

// StudentDetails component to display in the drawer
const StudentDetails = ({ student, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  
  // Get all available student data from the original record
  const { original } = student;
  
  // Helper function to get additional student information
  const getAdditionalInfo = () => {
    const excludedFields = ['name', 'email', 'sid', 'rowIndex', 'id'];
    const infoItems = [];
    
    // Extract all available fields from the original record
    Object.keys(original || {}).forEach(key => {
      const value = original[key];
      if (
        value && 
        typeof value === 'string' && 
        value.trim() !== '' && 
        !excludedFields.includes(key.toLowerCase())
      ) {
        infoItems.push({ label: key, value });
      }
    });
    
    return infoItems;
  };
  
  // Detect possible deadlines or important dates from student data
  const getDeadlines = () => {
    const possibleDateFields = ['Due Date', 'Deadline', 'Exam Date', 'Midterm', 'Final'];
    const deadlines = [];
    
    let id = 1;
    Object.keys(original || {}).forEach(key => {
      const value = original[key];
      
      // If the field name contains words related to deadlines
      if (possibleDateFields.some(field => key.includes(field)) && value) {
        deadlines.push({
          id: id++,
          name: key,
          date: value,
          color: key.includes('Midterm') || key.includes('Exam') ? '#ffebee' : '#e8f5e9'
        });
      }
      
      // If field name includes "Extension" or "Request"
      if ((key.includes('Extension') || key.includes('Request')) && value) {
        deadlines.push({
          id: id++,
          name: `Requested ${key}`,
          date: value,
          color: '#fff8e1',
          aiSuggested: '3 days earlier'
        });
      }
    });
    
    // If no real deadlines were found, use sample ones
    if (deadlines.length === 0) {
      return [
        { id: 1, name: 'Assignment 2 Deadline', date: '3/21/25', color: '#e8f5e9' },
        { id: 2, name: 'Midterm 1', date: '3/24/25', color: '#ffebee' },
        { id: 3, name: 'Requested Extension Assignment 2', date: '3/27/25', aiSuggested: '3/23/25', color: '#fff8e1' }
      ];
    }
    
    return deadlines;
  };
  
  // Get any existing notes from the data
  const getInitialNotes = () => {
    const noteField = Object.keys(original || {}).find(key => 
      key.toLowerCase().includes('note') || key.toLowerCase().includes('comment')
    );
    
    return noteField ? original[noteField] : "";
  };
  
  const deadlines = getDeadlines();
  const additionalInfo = getAdditionalInfo();
  
  return (
    <Box sx={{ height: '100%' }}>
      {/* Header with back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={onClose} aria-label="Back">
          <ArrowBackIcon />
        </IconButton>
      </Box>
      
      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} md={6}>
          {/* Student Profile */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            {/* Basic info with avatar */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar 
                src={student.avatar} 
                alt={student.name} 
                sx={{ width: 80, height: 80, mr: 2 }}
              />
              <Box>
                <Typography variant="h5" color="primary">{student.name}</Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>SID: {student.sid}</Typography>
                <Typography variant="body1">
                  Email: <Link href={`mailto:${student.email}`}>{student.email}</Link>
                </Typography>
                {student.flags && student.flags.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {student.flags.map((flag, i) => (
                      <Chip 
                        key={i} 
                        label={flag} 
                        size="small" 
                        sx={{ 
                          mr: 0.5,
                          backgroundColor: flag === 'DSP' ? '#d1e6fa' : '#f0e8fa' 
                        }} 
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
            
            {/* Additional info from the roster */}
            {additionalInfo.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Additional Information</Typography>
                <Grid container spacing={2}>
                  {additionalInfo.map((info, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Typography variant="body2" color="text.secondary">{info.label}</Typography>
                      <Typography variant="body1">{info.value}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Paper>
          
          {/* Calendar */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">March 2025</Typography>
              <Box>
                <IconButton size="small"><ArrowBackIcon fontSize="small" /></IconButton>
                <IconButton size="small"><ChevronRightIcon fontSize="small" /></IconButton>
              </Box>
            </Box>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateCalendar 
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                // Highlight special dates
                renderDay={(day, _value, DayProps) => {
                  const isSpecialDate = deadlines.some(deadline => 
                    new Date(deadline.date).getDate() === day.getDate() && 
                    new Date(deadline.date).getMonth() === day.getMonth()
                  );
                  
                  const deadline = deadlines.find(d => 
                    new Date(d.date).getDate() === day.getDate() && 
                    new Date(d.date).getMonth() === day.getMonth()
                  );
                  
                  return (
                    <Box 
                      {...DayProps}
                      sx={{
                        ...DayProps.sx,
                        ...(isSpecialDate && {
                          backgroundColor: deadline?.color || '#e3f2fd',
                          borderRadius: '4px',
                        })
                      }}
                    >
                      {day.getDate()}
                    </Box>
                  );
                }}
              />
            </LocalizationProvider>
          </Paper>
        </Grid>
        
        {/* Right column */}
        <Grid item xs={12} md={6}>
          {/* AI Recommendation */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>AI Recommendation</Typography>
            <Box sx={{ p: 2, backgroundColor: '#f0f7ff', borderRadius: 1 }}>
              <Typography>
                This student has requested an assignment that goes past the midterm and may be behind on content that will be tested.
              </Typography>
            </Box>
          </Paper>
          
          {/* Upcoming Deadlines */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>Upcoming Deadlines</Typography>
            <List disablePadding>
              {deadlines.map((deadline) => (
                <Box 
                  key={deadline.id} 
                  sx={{ 
                    p: 1, 
                    mb: 1, 
                    backgroundColor: deadline.color,
                    borderRadius: 1 
                  }}
                >
                  <Typography variant="subtitle1">{deadline.name}</Typography>
                  <Typography variant="body2">{deadline.date}</Typography>
                  {deadline.aiSuggested && (
                    <Typography variant="body2">
                      AI Suggested: {deadline.aiSuggested}
                    </Typography>
                  )}
                </Box>
              ))}
            </List>
          </Paper>
          
          {/* Notes */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NoteIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" color="primary">Notes</Typography>
              <Box sx={{ ml: 'auto' }}>
                <Avatar sx={{ bgcolor: '#9c27b0', width: 32, height: 32, fontSize: 14 }}>E</Avatar>
              </Box>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Add notes about this student..."
              defaultValue={getInitialNotes()}
              value={notes || getInitialNotes()}
              onChange={(e) => setNotes(e.target.value)}
              variant="outlined"
            />
            {notes !== getInitialNotes() && notes !== '' && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" size="small">
                  Save Notes
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default function Students() {
  const [rosterData, setRosterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  function extractSheetIdFromUrl(url) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  async function getData() {
    setLoading(true);
    setError('');
    
    let studentRosterId = localStorage.getItem("studentRoster");
    
    try {
      if (!studentRosterId) {
        setError("No student roster spreadsheet configured. Please set a Student Roster link in Settings.");
        setLoading(false);
        return;
      }
      
      // Extract the sheet ID from the URL
      studentRosterId = extractSheetIdFromUrl(studentRosterId);
      if (!studentRosterId) {
        setError("Invalid Google Sheets URL. Please check the Student Roster URL in Settings.");
        setLoading(false);
        return;
      }
      
      console.log("Fetching roster data from spreadsheet ID:", studentRosterId);
      
      // Try to fetch with a wider range to ensure we get all data
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: studentRosterId,
        range: "Roster!A1:Z500", // Wider range to capture more columns
      });

      const data = response.result.values || [];
      
      if (data.length === 0) {
        setError("The student roster spreadsheet appears to be empty.");
        setLoading(false);
        return;
      }
      
      const headerRow = data[0];
      const studentRows = data.slice(1);

      console.log("Headers found:", headerRow);
      console.log("Student rows found:", studentRows.length);
      
      // Convert array data to objects with named properties
      const parsedStudents = studentRows.map((studentRow, index) => {
        const studentObj = {};
        
        // Map each column to its header name
        headerRow.forEach((headerName, colIndex) => {
          // Ensure we don't access beyond the array bounds
          if (colIndex < studentRow.length) {
            studentObj[headerName] = studentRow[colIndex];
          } else {
            studentObj[headerName] = ''; // Default empty value
          }
        });
        
        // Add index for reference
        studentObj.rowIndex = index;
        
        return studentObj;
      });

      console.log("Processed student data:", parsedStudents);
      setRosterData(parsedStudents);
      setLoading(false);
      
    } catch (error) {
      console.error("Error loading student roster data:", error);
      setError(`Failed to load student data: ${error.message || 'Unknown error'}`);
      setLoading(false);
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

  
  // Helper functions for drawer
  const openDrawer = useCallback((student) => {
    setSelectedStudent(student);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  // Generate placeholder image if no avatar is available
  const getAvatar = useCallback((name) => {
    if (!name) return null;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=50`;
  }, []);

  // Process student data to include flags
  const processedStudentData = useMemo(() => {
    console.log("Processing roster data:", rosterData);
    
    return rosterData.map((student, index) => {
      // Check for columns with different possible names
      const getName = () => {
        return student.Name || student["Full Name"] || student["Student Name"] || 
               `${student["First Name"] || ''} ${student["Last Name"] || ''}`.trim() || 
               "Unknown Student";
      };
      
      const getEmail = () => {
        return student.Email || student["Email Address"] || student["Student Email"] || 
               "";
      };
      
      const getSID = () => {
        return student.SID || student["Student ID"] || student["ID Number"] || 
               index.toString();
      };
      
      // Check for DSP status (we look at various possible column names)
      const isDSP = (
        (student.DSP && student.DSP.toLowerCase().includes('yes')) ||
        (student.Accommodations && student.Accommodations.toLowerCase().includes('yes')) ||
        (student["Special Needs"] && student["Special Needs"].toLowerCase().includes('yes')) ||
        (student["Accommodations"] && student["Accommodations"].toLowerCase().includes('yes'))
      );
      
      // Check for students who need support (looking for various indicators)
      const needsSupport = (
        (student.GPA && parseFloat(student.GPA) < 2.5) ||
        (student["At Risk"] && student["At Risk"].toLowerCase().includes('yes')) ||
        (student["Needs Support"] && student["Needs Support"].toLowerCase().includes('yes'))
      );
      
      const name = getName();
      const email = getEmail();
      const sid = getSID();
      
      return {
        id: index,
        sid: sid,
        name: name,
        email: email,
        avatar: getAvatar(name),
        flags: [
          ...(isDSP ? ['DSP'] : []),
          ...(needsSupport ? ['Needs Support'] : [])
        ],
        // Store the original record for detail view
        original: student
      };
    });
  }, [rosterData, getAvatar]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
      <Typography variant="h6" sx={{ ml: 2 }}>Loading student data...</Typography>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>Students Tab</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {/* Metrics Bar */}
        <StudentMetricsBar students={processedStudentData} />
        
        {/* Main Content */}
        <Paper sx={{ width: '100%', overflow: 'hidden', p: 2, mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>Students</Typography>
          
          {/* DataGrid */}
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={processedStudentData}
              columns={[
                { 
                  field: 'avatar', 
                  headerName: '', 
                  width: 60,
                  sortable: false,
                  filterable: false,
                  renderCell: (params) => (
                    <Avatar src={params.value} alt={params.row.name} />
                  )
                },
                { field: 'name', headerName: 'Student', flex: 1 },
                { field: 'email', headerName: 'Email', width: 220 },
                { field: 'sid', headerName: 'SID', width: 120 },
                {
                  field: 'flags',
                  headerName: 'Flags',
                  width: 150,
                  renderCell: (params) => (
                    <Box>
                      {params.value.map((flag, i) => (
                        <Chip 
                          key={i} 
                          label={flag} 
                          size="small" 
                          sx={{ 
                            mr: 0.5,
                            backgroundColor: flag === 'DSP' ? '#d1e6fa' : '#f0e8fa' 
                          }} 
                        />
                      ))}
                    </Box>
                  )
                },
                {
                  field: 'actions',
                  headerName: '',
                  width: 50,
                  sortable: false,
                  filterable: false,
                  renderCell: (params) => (
                    <IconButton onClick={() => openDrawer(params.row)}>
                      <ChevronRightIcon />
                    </IconButton>
                  )
                }
              ]}
              disableRowSelectionOnClick
              getRowClassName={(params) => params.indexRelativeToCurrentPage % 2 === 0 ? 'even-row' : 'odd-row'}
              onRowClick={(params) => openDrawer(params.row)}
              sx={{
                '& .MuiDataGrid-columnHeaders': { backgroundColor: '#F5F5F5' },
                '& .MuiDataGrid-row:hover': { backgroundColor: '#F9F9F9', cursor: 'pointer' },
                '& .even-row': { backgroundColor: '#FFFFFF' },
                '& .odd-row': { backgroundColor: '#FAFBFC' }
              }}
            />
          </Box>
        </Paper>
        
        {/* Student Details Drawer */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={closeDrawer}
          sx={{
            '& .MuiDrawer-paper': { width: { xs: '100%', md: '80%', lg: '60%' }, p: 3 }
          }}
        >
          {selectedStudent && (
            <StudentDetails 
              student={selectedStudent} 
              onClose={closeDrawer} 
            />
          )}
        </Drawer>
      </Box>
    </Box>
  );
}
