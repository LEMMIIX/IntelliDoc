/**
 * Diese datei ist der Einstiegspunkt der Anwendung und rendert die Haupt-App-Komponente innerhalb eines `BrowserRouter` f�r die Routing-Funktionalit�t.
 * @Author Farah. 
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
