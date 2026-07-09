import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom' // <-- ఇది యాడ్ చేయండి

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* <-- ఇక్కడ ఓపెన్ చేయండి */}
      <App />
    </BrowserRouter> {/* <-- ఇక్కడ క్లోజ్ చేయండి */}
  </React.StrictMode>,
)
