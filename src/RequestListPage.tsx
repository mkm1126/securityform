import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, List, Share2, RefreshCw, Search, Trash2, X, AlertTriangle } from 'lucide-react';
import { supabase } from './lib/supabase';
import { format } from 'date-fns';
import { toast } from 'sonner';
import clsx from 'clsx';
import Header from './components/Header';
import SearchableSelect from './components/SearchableSelect';

interface SecurityArea {
  area_type: 'accounting_procurement' | 'hr_payroll' | 'epm_data_warehouse' | 'elm';
}

interface Request {
  id: string;
  created_at: string;
  submitter_name: string;
  employee_name: string;
  status: string;
  security_areas: SecurityArea[];
  request_approvals: {
    id: string;
    step: string;
    status: string;
  }[];
}

const areaLabels: Record<SecurityArea['area_type'], string> = {
  accounting_procurement: 'Accounting / Procurement',
  hr_payroll: 'HR / Payroll',
  epm_data_warehouse: 'EPM / Data Warehouse',
  elm: 'ELM'
};

function RequestListPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [userOptions, setUserOptions] = useState<{value: string; label: string}[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const location = useLocation();

  const handleUserChange = (userName: string | null) => {
    setCurrentUser(userName);
  };

  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<Request | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  // Refresh data when returning from edit page
  useEffect(() => {
    if (location.state?.refreshData) {
      console.log('Refreshing data due to location state');
      fetchRequests();
      // Clear the state to prevent unnecessary refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  async function fetchRequests() {
    try {
      setLoading(true);
      
      console.log('Fetching requests from database...');
      
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      
      let query = supabase
        .from('security_role_requests')
        .select(`
          *,
          security_areas (
            area_type
          ),
          request_approvals (
            id,
            step,
            status
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by current user if available
      if (currentUser) {
        query = query.eq('poc_user', currentUser);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      console.log('Raw data from database:', data);
      
      // Process the data to ensure security_areas is always an array
      const processedData = (data || []).map(request => ({
        ...request,
        security_areas: request.security_areas || []
      }));
      
      console.log('Processed data:', processedData);
      setRequests(processedData);
      
      // Create user options for search dropdown
      const uniqueUsers = processedData.reduce((acc: {value: string; label: string}[], request) => {
        if (request.employee_name && !acc.find(user => user.value === request.employee_name)) {
          acc.push({
            value: request.employee_name,
            label: request.employee_name
          });
        }
        return acc;
      }, []);
      
      // Sort users alphabetically
      uniqueUsers.sort((a, b) => a.label.localeCompare(b.label));
      
      console.log('User options created:', uniqueUsers);
      setUserOptions(uniqueUsers);
      
      // Apply current filter if any
      applyUserFilter(processedData, selectedUser);
      
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const applyUserFilter = (requestsToFilter: Request[], userFilter: string) => {
    if (!userFilter) {
      setFilteredRequests(requestsToFilter);
      return;
    }
    
    const filtered = requestsToFilter.filter(request => 
      request.employee_name === userFilter
    );
    setFilteredRequests(filtered);
  };

  const handleUserSearch = (selectedValue: string) => {
    console.log('User search changed to:', selectedValue);
    setSelectedUser(selectedValue);
    applyUserFilter(requests, selectedValue);
  };

  const handleDeleteClick = (request: Request) => {
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return;

    setDeletingRequestId(requestToDelete.id);
    
    try {
      // Delete the main request - this will cascade delete all related records
      const { error } = await supabase
        .from('security_role_requests')
        .delete()
        .eq('id', requestToDelete.id);

      if (error) throw error;

      toast.success(`Request for ${requestToDelete.employee_name} has been deleted`);
      
      // Remove the deleted request from the local state
      const updatedRequests = requests.filter(req => req.id !== requestToDelete.id);
      setRequests(updatedRequests);
      applyUserFilter(updatedRequests, selectedUser);
      
      // Close modal and reset state
      setShowDeleteModal(false);
      setRequestToDelete(null);
      
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Failed to delete request. Please try again.');
    } finally {
      setDeletingRequestId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setRequestToDelete(null);
  };

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

  const getNextPendingApproval = (request: Request) => {
    return request.request_approvals.find(approval => approval.status === 'pending');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    toast.success('Requests refreshed');
  };

  const displayRequests = selectedUser ? filteredRequests : requests;
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Security Role Requests"
        subtitle="Manage and review security role requests"
        onUserChange={handleUserChange}
      />
      
      {!currentUser ? (
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">User Identification Required</h3>
              <p className="text-blue-700">
                Please identify yourself to view your test requests.
              </p>
            </div>
          </div>
        </div>
      ) : (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div className="w-80 min-w-0">
              <SearchableSelect
                options={userOptions}
                value={selectedUser}
                onChange={handleUserSearch}
                placeholder="Search by employee name..."
                searchPlaceholder="Type to search users..."
                label="Filter by Employee"
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleNewRequest}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : displayRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <List className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {selectedUser ? 'No matching requests' : 'No requests'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedUser 
                  ? 'No requests found for the selected user. Try clearing the search filter.'
                  : 'Get started by creating a new security role request.'
                }
              </p>
              <div className="mt-6 flex justify-center space-x-4">
                {selectedUser && (
                  <button
                    onClick={() => handleUserSearch('')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear Filter
                  </button>
                )}
                <button
                  onClick={handleNewRequest}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="bg-white shadow overflow-hidden rounded-md">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedUser ? `Filtered Results (${displayRequests.length})` : `All Requests (${displayRequests.length})`}
                  </span>
                  {selectedUser && (
                    <button
                      onClick={() => handleUserSearch('')}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requested For
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Areas Requested
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayRequests.map((request) => {
                      const nextApproval = getNextPendingApproval(request);
                      console.log(`Request ${request.id} security areas:`, request.security_areas);
                      
                      return (
                        <tr key={request.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Add
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.submitter_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.employee_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex flex-wrap gap-1">
                              {request.security_areas && request.security_areas.length > 0 ? (
                                request.security_areas.map((area, index) => (
                                  <span
                                    key={`${request.id}-${area.area_type}-${index}`}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {areaLabels[area.area_type]}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400 text-xs">No areas selected</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={clsx(
                              "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                              {
                                "bg-yellow-100 text-yellow-800": request.status === "pending",
                                "bg-green-100 text-green-800": request.status === "approved",
                                "bg-blue-100 text-blue-800": request.status === "completed",
                                "bg-gray-100 text-gray-800": request.status === "rejected"
                              }
                            )}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(request.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-3">
                              {nextApproval && (
                                <button
                                  onClick={() => {
                                    const reviewUrl = `${window.location.origin}/signature/${request.id}/${nextApproval.id}?mode=review`;
                                    navigator.clipboard.writeText(reviewUrl);
                                    toast.success('Review link copied to clipboard!');
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Copy Review Link"
                                >
                                  <Share2 className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteClick(request)}
                                disabled={deletingRequestId === request.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete Request"
                              >
                                {deletingRequestId === request.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                              <Link
                                to={`/requests/${request.id}`}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                View Details
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && requestToDelete && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">Confirm Delete Request</h3>
                  </div>
                  <button
                    onClick={handleDeleteCancel}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <p className="text-sm text-red-800">
                      <strong>Warning:</strong> This action cannot be undone. This will permanently delete the security role request and all associated data including approvals and role selections.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Request Details:</h4>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 text-sm">
                      <div>
                        <dt className="font-medium text-gray-500">Employee Name:</dt>
                        <dd className="text-gray-900">{requestToDelete.employee_name}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">Submitted By:</dt>
                        <dd className="text-gray-900">{requestToDelete.submitter_name}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">Status:</dt>
                        <dd>
                          <span className={clsx(
                            "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                            {
                              "bg-yellow-100 text-yellow-800": requestToDelete.status === "pending",
                              "bg-green-100 text-green-800": requestToDelete.status === "approved",
                              "bg-blue-100 text-blue-800": requestToDelete.status === "completed",
                              "bg-gray-100 text-gray-800": requestToDelete.status === "rejected"
                            }
                          )}>
                            {requestToDelete.status.charAt(0).toUpperCase() + requestToDelete.status.slice(1)}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">Submitted Date:</dt>
                        <dd className="text-gray-900">{format(new Date(requestToDelete.created_at), 'MMM d, yyyy')}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="font-medium text-gray-500">Security Areas:</dt>
                        <dd className="mt-1">
                          <div className="flex flex-wrap gap-1">
                            {requestToDelete.security_areas && requestToDelete.security_areas.length > 0 ? (
                              requestToDelete.security_areas.map((area, index) => (
                                <span
                                  key={`${requestToDelete.id}-${area.area_type}-${index}`}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {areaLabels[area.area_type]}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs">No areas selected</span>
                            )}
                          </div>
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="font-medium text-gray-500">Request ID:</dt>
                        <dd className="text-gray-900 font-mono text-xs">{requestToDelete.id}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleDeleteCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deletingRequestId === requestToDelete.id}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingRequestId === requestToDelete.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Deleting...
                      </>
                    ) : (
                      'Confirm Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

export default RequestListPage;