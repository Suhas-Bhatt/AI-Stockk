/**
 * 🚀 APPLICATION ENTRY POINT
 * This is the very first file that runs when someone opens your website.
 * Its job is to mount the React application into the actual HTML page.
 */

import { createRoot } from "react-dom/client"; // The 'engine' that renders React
import App from "./App"; // The main Route logic
import "./index.css"; // The global Tailwind CSS variables

// 🎯 TARGETING THE HTML
// We find the <div id="root"> inside your 'index.html' file.
const rootElement = document.getElementById("root");

// 🏗️ MOUNTING
// We tell React to start rendering our 'App' component inside that root element.
const root = createRoot(rootElement);
root.render(<App />);