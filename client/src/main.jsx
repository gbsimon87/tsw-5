import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import 'react-loading-skeleton/dist/skeleton.css';
import App from './App.jsx';
import Modal from 'react-modal';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

Modal.setAppElement('#root')
