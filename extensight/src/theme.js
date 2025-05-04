import { createTheme } from '@mui/material/styles';

// Design system based on specifications
const theme = createTheme({
  palette: {
    primary: {
      main: '#0055ff',
    },
    secondary: {
      main: '#e3e8ee',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
      light: '#f9f9f9',
    },
    neutral: {
      border: '#e3e8ee',
      background: '#f9f9f9',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
  },
  spacing: (factor) => {
    const baseSpacing = 8;
    const values = [16, 24, 32];
    return values[factor - 1] || factor * baseSpacing;
  },
  shape: {
    borderRadius: 4,
  },
});

export default theme;
