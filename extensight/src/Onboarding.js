import React from 'react';
import './Onboarding.css';

export default function Onboarding() {
  return (
    <div className="form-container">
      <div className="form-box">
        <h1 className="form-title">Welcome to Extensight</h1>

        <div className="form-fields">
          <div className="form-group">
            <label htmlFor="courseName">Course Name</label>
            <input id="courseName" type="text" />
          </div>

          <div className="form-group">
            <label htmlFor="studentRoster">Import student roster</label>
            <input id="studentRoster" type="text" />
          </div>

          <div className="form-group">
            <label htmlFor="dspData">Import DSP Data</label>
            <input id="dspData" type="text" />
          </div>

          <div className="form-group">
            <label htmlFor="staff">Import staff</label>
            <input id="staff" type="text" />
          </div>

          <div className="form-group">
            <label htmlFor="extensionsSheet">Link extensions sheet</label>
            <input id="extensionsSheet" type="text" />
          </div>

          <div className="form-button-container">
            <button type="button" className="create-button">Create</button>
          </div>
        </div>
      </div>
    </div>
  );
}
