import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import portalLogo from './src/assets/foodeez.png';

document.title = 'FooDeeZ HRMS';
const iconLink = document.querySelector("link[rel~='icon']");
if (iconLink) {
  iconLink.setAttribute('href', portalLogo);
} else {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = portalLogo;
  document.head.appendChild(link);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);