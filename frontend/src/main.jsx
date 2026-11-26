import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { InterviewProvider } from './context/InterviewContext.jsx';
import { NotesProvider } from './context/NotesContext.jsx';
import { PreferencesProvider } from './context/PreferencesContext.jsx';
import './styles/variables.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotesProvider>
          <InterviewProvider>
            <PreferencesProvider>
              <App />
            </PreferencesProvider>
          </InterviewProvider>
        </NotesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
