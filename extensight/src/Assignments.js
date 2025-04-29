import React, {useState, useEffect} from 'react';
import './Assignments.css';
import {gapi} from "gapi-script";
import { Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Modal, Box, Select, MenuItem, Button } from "@mui/material";

let tokenClient;

export default function Assignments() {
    const [assignments, setAssignments] = useState([{}]);
    const [selectedAssignment, setSelectedAssignment] = useState("");
    const [extensionsData, setExtensionsData] = useState([]);
    const [selectedExtensions, setSelectedExtensions] = useState([]);
    const [loading, setLoading] = useState(true);

    async function submitExtensionsApproval() {
        let updatedExtensionsData = [...extensionsData];
        selectedExtensions.forEach((ext) => {
            updatedExtensionsData[ext["ind"]]["Approved?"] = ext["Approved?"]
        })

        const approvalStatus = updatedExtensionsData.map((ext) => ext["Approved?"] !== undefined ? [ext["Approved?"]] : [""]);
        console.log(approvalStatus);
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: "1hkJnKDfxfFiZPLlC43yDiVZdhj1zB6Dy5z1Fh3Z4j0g",
            range: `J2:J${updatedExtensionsData.length + 1}`,
            resource: {
                values: approvalStatus
            },
            valueInputOption: "RAW"
        })

    }
    
    useEffect(() => {
        const initializeGapiClient = () => {
          gapi.client.init({
            discoveryDocs: [
              "https://sheets.googleapis.com/$discovery/rest?version=v4",
            ],
          });
        }
        gapi.load("client", initializeGapiClient);
        
        let assignments = [];
        let dueDates = []
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: "189937528489-6nrjdp52eohmoposc8t31ggkts7sk5nr.apps.googleusercontent.com",
          scope: "https://www.googleapis.com/auth/spreadsheets",
          callback: (tokenResponse) => {
            gapi.client.setToken({ access_token: tokenResponse.access_token });
            Promise.all([
                gapi.client.sheets.spreadsheets.values
                .get({
                    spreadsheetId: "12v_wLKmF0YKMcntS7T7nptQwtk0-aveYySCZQLFQw6k",
                    range: "Sheet1!A2:A100",
                }),
                gapi.client.sheets.spreadsheets.values
                .get({
                    spreadsheetId: "12v_wLKmF0YKMcntS7T7nptQwtk0-aveYySCZQLFQw6k",
                    range: "Sheet1!B2:B100",
                })
            ])
            .then(([res1, res2]) => {
                assignments = res1.result.values;
                dueDates = res2.result.values;
                let newAssignments = [];
                for (let i = 0; i < assignments.length; i++) {
                    if (assignments[i] == ""){
                        break;
                    }
                    newAssignments.push({name: assignments[i], due_date: dueDates[i]});
                }
                console.log(assignments);
                setAssignments(newAssignments); 
            });

           
            gapi.client.sheets.spreadsheets.values
            .get({
                spreadsheetId: "1hkJnKDfxfFiZPLlC43yDiVZdhj1zB6Dy5z1Fh3Z4j0g",
                range: "Sheet1!A1:J500",
            })
            .then((res) => {
                const data = res.result.values;
                const rowNames = data[0];
                const responses = data.slice(1);

                const parsedData = responses.map((response, i) => {
                    let jsonPArsed = {}
                    rowNames.forEach((name, i) => {
                        jsonPArsed[name] = response[i];
                    })
                    jsonPArsed["ind"] = i;
                    return jsonPArsed;
                });

                setExtensionsData(parsedData);
                console.log(parsedData);
                
            })

            setLoading(false);
          },
        });

        tokenClient.requestAccessToken();
        
      }, []);

    
    if (loading) return <div>Loading assignments...</div>;

    return (
        <div>
            <TableContainer sx={{width: '50%'}}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Assignment</TableCell>
                            <TableCell>Due Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {
                            assignments.map((assignment, index) => (
                            <TableRow
                                onClick = {() => {
                                        setSelectedAssignment(assignment["name"]);
                                        console.log('h')
                                        const currSelectedExtensions = extensionsData.filter(extension => extension["If you anticipate needing an extension on certain assignments, what assignment do you need to extend, and what day are you requesting to extend them until?"] == assignment["name"]);
                                        console.log('j');
                                        setSelectedExtensions(currSelectedExtensions);
                                        console.log(currSelectedExtensions);
                                    }
                                }
                            >
                                <TableCell> {assignment["name"]} </TableCell>
                                <TableCell> {assignment["due_date"]} </TableCell>
                            </TableRow>
                        ))
                        }
                    </TableBody>
                </Table>
            </TableContainer>
            <Modal 
                open = {selectedAssignment != ""}
                onClose={() => setSelectedAssignment("")}
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 500,
                    height: 500,
                    bgcolor: 'white',
                    transform: 'translate(-50%, -50%)'
                }}>

                    {
                        <div>
                            <TableContainer sx={{width: '100%'}}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Assignment</TableCell>
                                            <TableCell>Due Date</TableCell>
                                            <TableCell>Approved?</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {
                                            selectedExtensions.map((extension, i) => (
                                            <TableRow>
                                                <TableCell> {extension["Name"]} </TableCell>
                                                <TableCell> {extension["What date are you requesting an extension to?"]} </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value = {extension["Approved?"] || ""}
                                                        size = "small"
                                                        onChange = {(e) => {
                                                            let ext = [...selectedExtensions];
                                                            ext[i]["Approved?"] = e.target.value;
                                                            setSelectedExtensions(ext);
                                                        }}
                                                    >
                                                        <MenuItem value="">-</MenuItem>
                                                        <MenuItem value = "No">No</MenuItem>
                                                        <MenuItem value = "Yes">Yes</MenuItem>
                                                    </Select>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                        }
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Button onClick = {() => {
                                    setSelectedAssignment("");
                                    submitExtensionsApproval();
                                }
                            }> Submit </Button>
                        </div>
                    }
                </Box>
            </Modal>
        </div>

    )
}
