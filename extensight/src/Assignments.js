import React, {useState, useEffect} from 'react';
import './Assignments.css';
import {gapi} from "gapi-script";

let tokenClient;

export default function Assignments() {
    const [assignments, setAssignments] = useState([{name: "hi", due_date: "5/11/2025"}]);
    
    useEffect(() => {
        const initializeGapiClient = () => {
          gapi.client.init({
            discoveryDocs: [
              "https://sheets.googleapis.com/$discovery/rest?version=v4",
            ],
          });
        }
        gapi.load("client", initializeGapiClient);
    
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: "189937528489-6nrjdp52eohmoposc8t31ggkts7sk5nr.apps.googleusercontent.com",
          scope: "https://www.googleapis.com/auth/spreadsheets",
          callback: (tokenResponse) => {
            gapi.client.setToken({ access_token: tokenResponse.access_token });
            gapi.client.sheets.spreadsheets.values
            .get({
                spreadsheetId: "12v_wLKmF0YKMcntS7T7nptQwtk0-aveYySCZQLFQw6k",
                range: "Sheet1!A1:A3",
            })
            .then((res) => {
                console.log(res.result.values);
            })
          },
        });

        tokenClient.requestAccessToken();
      }, []);

    return (
        <div>
            {
                assignments.map((assignment, index) => (
                <p>
                    {assignment["name"]} --- Due: {assignment["due_date"]}
                </p>
            ))
            }
        </div>
    )
}
