import React from 'react';
import { CheckCircle, List, Eye, Plus } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';

function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const requestId = location.state?.requestId;

  const handleNewRequest = () => {
    // Disable test mode when creating a new request
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Request Submitted!</h2>
              <p className="mt-4 text-lg text-gray-600">
                Thank you for your security role request.
              </p>
              <div className="mt-6 space-y-4">
                <p className="text-sm text-gray-500">
                  An email has been sent to the employee for their signature.
                </p>
                <p className="text-sm text-gray-500">
                  The process to grant access has been initiated and you will be notified of updates.
                </p>
              </div>
              <div className="mt-8 flex flex-col gap-4 justify-center">
                {requestId && (
                  <Link
                    to={`/requests/${requestId}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View This Request
                  </Link>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/requests"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <List className="h-4 w-4 mr-2" />
                  View Requests
                </Link>
                <button
                  onClick={handleNewRequest}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Another Request
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuccessPage;