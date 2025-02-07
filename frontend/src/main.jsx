/**
 * @file main.jsx - React Anwendungs-Einstiegspunkt
 * @author Farah
 * @description Diese Datei ist der Einstiegspunkt der Anwendung und rendert die Haupt-App-Komponente 
 * innerhalb eines `BrowserRouter` für die Routing-Funktionalität.
 * 
 * @requires react
 * @requires react-dom/client
 * @requires react-router-dom
 * @requires ./App
 * @requires ./styles/index.css
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { BrowserRouter } from 'react-router-dom';

/**
 * Initialisiert und rendert die React-Anwendung
 * @function
 * @name initializeApp
 * @type {void}
 * 
 * @example
 * // Die Anwendung wird wie folgt initialisiert:
 * createRoot(document.getElementById('root')).render(
 *   <StrictMode>
 *     <BrowserRouter>
 *       <App />
 *     </BrowserRouter>
 *   </StrictMode>
 * )
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
