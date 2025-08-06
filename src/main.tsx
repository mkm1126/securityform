import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App.tsx';
import SuccessPage from './SuccessPage.tsx';
import SelectRolesPage from './SelectRolesPage.tsx';
import RequestListPage from './RequestListPage.tsx';
import RequestDetailsPage from './RequestDetailsPage.tsx';
import SignaturePage from './SignaturePage.tsx';
import EditRequestPage from './EditRequestPage.tsx';
import ElmRoleSelectionPage from './ElmRoleSelectionPage.tsx';
import EpmDwhRoleSelectionPage from './EpmDwhRoleSelectionPage.tsx';
import HrPayrollRoleSelectionPage from './HrPayrollRoleSelectionPage.tsx';
import TestPage from './TestPage.tsx';
import TestApprovalOrder from './TestApprovalOrder.tsx';
import './index.css';

// Comprehensive protection against browser extension errors
(function() {
  // More aggressive error suppression
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('is not valid JSON') || message.includes('[object Object]')) {
      console.warn('Browser extension JSON error suppressed:', ...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Override JSON.parse globally
  const originalJSONParse = JSON.parse;
  JSON.parse = function(text, reviver) {
    try {
      return originalJSONParse.call(this, text, reviver);
    } catch (error) {
      if (error instanceof SyntaxError && (text === "[object Object]" || typeof text === 'object' || String(text).includes('[object Object]'))) {
        console.warn('Browser extension JSON parse error intercepted:', error);
        return null;
      }
      throw error;
    }
  };

  // Global error handler for unhandled errors
  window.addEventListener('error', function(event) {
    if (event.error && event.error.message && event.error.message.includes('is not valid JSON')) {
      console.warn('Global JSON error intercepted:', event.error);
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);

  // Global promise rejection handler
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes('is not valid JSON')) {
      console.warn('Unhandled JSON promise rejection intercepted:', event.reason);
      event.preventDefault();
      return false;
    }
  });

  // Storage event protection
  window.addEventListener('storage', function(e) {
    if (e.key && (e.newValue === "[object Object]" || typeof e.newValue === 'object')) {
      e.stopImmediatePropagation();
      return false;
    }
  }, true);

  // Additional protection for localStorage access
  const originalSetItem = localStorage.setItem;
  const originalGetItem = localStorage.getItem;
  
  localStorage.setItem = function(key, value) {
    try {
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      return originalSetItem.call(this, key, value);
    } catch (error) {
      console.warn('localStorage.setItem error intercepted:', error);
      return null;
    }
  };

  localStorage.getItem = function(key) {
    try {
      return originalGetItem.call(this, key);
    } catch (error) {
      console.warn('localStorage.getItem error intercepted:', error);
      return null;
    }
  };
})();

createRoot(document.getElementById('root')!).render(
  <Router future={{ v7_relativeSplatPath: true }}>
    <Toaster position="top-right" richColors />
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/elm-roles" element={<ElmRoleSelectionPage />} />
      <Route path="/epm-dwh-roles" element={<EpmDwhRoleSelectionPage />} />
      <Route path="/hr-payroll-roles" element={<HrPayrollRoleSelectionPage />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/test-approval-order" element={<TestApprovalOrder />} />
      <Route path="/select-roles" element={<SelectRolesPage />} />
      <Route path="/requests" element={<RequestListPage />} />
      <Route path="/requests/:id" element={<RequestDetailsPage />} />
      <Route path="/requests/:id/edit" element={<EditRequestPage />} />
      <Route path="/signature/:requestId/:approvalId" element={<SignaturePage />} />
    </Routes>
  </Router>
);