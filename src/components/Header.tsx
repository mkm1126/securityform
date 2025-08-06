import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { List, Shield } from 'lucide-react';
import UserSession from './UserSession';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onUserChange?: (userName: string | null) => void;
}

function Header({ title, subtitle, onUserChange }: HeaderProps) {
  console.log('Header component rendered with:', { title, subtitle });
  
  const navigate = useNavigate();
  const location = useLocation();
  const isMainPage = location.pathname === '/';
  
  const [isTestMode, setIsTestMode] = React.useState(() => {
    return localStorage.getItem('testMode') === 'true';
  });

  // Reset test mode when navigating to main page
  React.useEffect(() => {
    if (isMainPage) {
      setIsTestMode(false);
      localStorage.setItem('testMode', 'false');
      
      // Dispatch a storage event to notify other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'testMode',
        newValue: 'false',
        oldValue: 'true'
      }));
    }
  }, [isMainPage]);

  const toggleTestMode = () => {
    const newTestMode = !isTestMode;
    setIsTestMode(newTestMode);
    localStorage.setItem('testMode', newTestMode.toString());
    
    // Clear test data when disabling test mode
    if (!newTestMode) {
      // Clear any stored form data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('formData_') || 
          key.startsWith('requestId_') ||
          key.startsWith('testData_')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear session storage as well
      sessionStorage.clear();
      
      // Force a page reload to clear any form state
      if (isMainPage) {
        window.location.reload();
      }
    }
    
    // Dispatch a storage event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'testMode',
      newValue: newTestMode.toString(),
      oldValue: (!newTestMode).toString()
    }));
  };

  // Listen for storage changes from other tabs/components
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'testMode') {
        setIsTestMode(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const handleNewRequest = () => {
    // Disable test mode when creating a new request
    setIsTestMode(false);
    localStorage.setItem('testMode', 'false');
    
    // Dispatch a storage event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'testMode',
      newValue: 'false',
      oldValue: 'true'
    }));
    
    // Navigate to home page
    navigate('/');
  };
  
  return (
    <>
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button onClick={handleNewRequest} className="flex items-center hover:opacity-80 transition-opacity">
              <img 
                src="/mmb-homepage-logo3-01_tcm1059-264925_tcm1059-264925.png" 
                alt="Minnesota Management & Budget"
                className="h-12 w-auto"
              />
            </button>
            <div className="flex-1" />
            {onUserChange && (
              <UserSession onUserChange={onUserChange} />
            )}
          </div>
        </div>
      </div>
      
      {/* Centered Title Section */}
      {title && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="mt-2 text-lg text-gray-600">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons Section - Only show on main page */}
      {isMainPage && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={toggleTestMode}
                className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                  isTestMode
                    ? 'border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                <Shield className="h-4 w-4 mr-2" />
                {isTestMode ? 'Disable Test Mode' : 'Enable Test Mode'}
              </button>
              <Link
                to="/requests"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <List className="h-4 w-4 mr-2" />
                View Requests
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Non-main page action buttons */}
      {!isMainPage && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {onUserChange && (
                <UserSession onUserChange={onUserChange} />
              )}
              <div className="flex items-center space-x-4">
                {!isMainPage && (
                  <button
                    onClick={toggleTestMode}
                    className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md ${
                      isTestMode
                        ? 'border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {isTestMode ? 'Disable Test Mode' : 'Enable Test Mode'}
                  </button>
                )}
                <Link
                  to="/requests"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <List className="h-4 w-4 mr-2" />
                  View Requests
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-8" />
    </>
  );
}

export default Header;