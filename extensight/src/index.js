import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Onboarding from './Onboarding';
import Assignments from './Assignments';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Assignments />
  </React.StrictMode>
);
