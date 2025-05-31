import React from "react";
import { createRoot } from "react-dom/client";
import '../assets/popup.css'
import Popup from "./popup";

function index() {
    const appContainer = document.createElement('div')
    document.body.appendChild(appContainer)
    if (!appContainer) {
        throw new Error("Can not find AppContainer");
    }
    const root = createRoot(appContainer)
    root.render(<Popup />);
}

index();