import React, { useState, useEffect } from 'react';
import { User, LogOut } from 'lucide-react';

interface UserSessionProps {
  onUserChange: (userName: string | null) => void;
}

function UserSession({ onUserChange }: UserSessionProps) {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('pocUserName');
  });
  const [showLogin, setShowLogin] = useState(!currentUser);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    onUserChange(currentUser);
  }, [currentUser, onUserChange]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      const trimmedName = userName.trim();
      localStorage.setItem('pocUserName', trimmedName);
      setCurrentUser(trimmedName);
      setShowLogin(false);
      setUserName('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pocUserName');
    setCurrentUser(null);
    setShowLogin(true);
  };

  if (showLogin) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">POC User Identification</h3>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>For POC Testing Only:</strong> Enter your name to identify your test data. 
                This allows multiple users to test simultaneously without interfering with each other's requests.
              </p>
            </div>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name (for testing identification)
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your name..."
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Start Testing
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center text-sm text-gray-600">
        <User className="h-4 w-4 mr-1" />
        <span>Testing as: <strong>{currentUser}</strong></span>
      </div>
      <button
        onClick={handleLogout}
        className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
        title="Switch User"
      >
        <LogOut className="h-3 w-3 mr-1" />
        Switch
      </button>
    </div>
  );
}

export default UserSession;