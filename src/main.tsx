import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { Theme } from './context/Theme'
import createTheme from './theme'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Theme>
      <ThemeProvider theme={createTheme}>
       <CssBaseline />
      <App />
    </ThemeProvider>
    </Theme>
  </React.StrictMode>,
)