import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
// import './App.css'
import { Theme } from './context/Theme'
import theme from './theme'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Theme>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Theme>
  </React.StrictMode>,
)