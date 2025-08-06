import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, CheckCircle, ShieldCheck, X, Check, Edit, Plus, List } from 'lucide-react';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';
import Header from './components/Header';

interface RequestDetails {
  id: string;
  created_at: string;
  start_date: string;
  employee_name: string;
  employee_id: string;
  is_non_employee: boolean;
  work_location: string;
  work_phone: string;
  email: string;
  agency_name: string;
  agency_code: string;
  justification: string;
  submitter_name: string;
  submitter_email: string;
  supervisor_name: string;
  supervisor_email: string;
  security_admin_name: string;
  security_admin_email: string;
  status: string;
  completed_by: string | null;
  completed_at: string | null;
}

interface SecurityArea {
  id: string;
  area_type: string;
  director_name: string;
  director_email: string;
}

interface CopyUserDetails {
  copy_user_name: string;
  copy_user_employee_id: string;
  copy_user_sema4_id: string;
}

interface SecurityRoleSelection {
  id: string;
  home_business_unit: string;
  other_business_units: string;
  role_justification: string;
  // Add other role fields as needed
  [key: string]: any;
}

interface Approval {
  id: string;
  step: string;
  approver_email: string;
  status: 'pending' | 'approved' | 'denied';
  signature_data: string | null;
  approved_at: string | null;
  comments: string | null;
}

function RequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [securityAreas, setSecurityAreas] = useState<SecurityArea[]>([]);
  const [copyUserDetails, setCopyUserDetails] = useState<CopyUserDetails | null>(null);
  const [roleSelections, setRoleSelections] = useState<SecurityRoleSelection | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [completerName, setCompleterName] = useState('');

  const [isTestMode, setIsTestMode] = useState(() => {
    return localStorage.getItem('testMode') === 'true';
  });

  const handleUserChange = (userName: string | null) => {
    setCurrentUser(userName);
  };

  // Listen for test mode changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'testMode') {
        const newTestMode = e.newValue === 'true';
        console.log('Test mode changed to:', newTestMode);
        setIsTestMode(newTestMode);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (id) {
      fetchRequestDetails();
    }
  }, [id]);

  async function fetchRequestDetails() {
    try {
      setLoading(true);
      setError(null);

      // Fetch main request details
      const { data: requestData, error: requestError } = await supabase
        .from('security_role_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (requestError) throw requestError;
      setRequest(requestData);

      // Fetch security areas
      const { data: areasData, error: areasError } = await supabase
        .from('security_areas')
        .select('*')
        .eq('request_id', id);

      if (areasError) throw areasError;
      setSecurityAreas(areasData || []);

      // Fetch copy user details
      const { data: copyData, error: copyError } = await supabase
        .from('copy_user_details')
        .select('*')
        .eq('request_id', id)
        .maybeSingle();

      if (copyError) throw copyError;
      setCopyUserDetails(copyData);

      // Fetch role selections
      const { data: roleData, error: roleError } = await supabase
        .from('security_role_selections')
        .select('*')
        .eq('request_id', id)
        .maybeSingle();

      if (roleError) throw roleError;
      setRoleSelections(roleData);

      // Fetch approvals
      const { data: approvalsData, error: approvalsError } = await supabase
        .from('request_approvals')
        .select('*')
        .eq('request_id', id)
        .order('created_at', { ascending: true });

      if (approvalsError) throw approvalsError;
      
      // Sort approvals to ensure Security Admin is always last
      const sortedApprovals = (approvalsData || []).sort((a, b) => {
        const stepOrder = {
          'user_signature': 1,
          'supervisor_approval': 2,
          'accounting_director_approval': 3,
          'hr_director_approval': 3,
          'elm_admin_approval': 3,
          'security_admin_approval': 4  // Always last
        };
        
        const orderA = stepOrder[a.step as keyof typeof stepOrder] || 3;
        const orderB = stepOrder[b.step as keyof typeof stepOrder] || 3;
        
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        
        // If same order level, sort by created_at
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      
      setApprovals(sortedApprovals);

    } catch (err) {
      console.error('Error fetching request details:', err);
      setError('Failed to load request details');
    } finally {
      setLoading(false);
    }
  }

  // Function to format field names for display
  const formatFieldName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Get all boolean fields that are true
  const getActiveBooleanRoles = () => {
    if (!roleSelections) return [];
    
    return Object.entries(roleSelections)
      .filter(([key, value]) => 
        typeof value === 'boolean' && 
        value === true && 
        !['created_at', 'updated_at', 'id', 'request_id'].includes(key)
      )
      .map(([key]) => key);
  };

  // Get all string fields that have values
  const getStringFieldValues = () => {
    if (!roleSelections) return [];
    
    return Object.entries(roleSelections)
      .filter(([key, value]) => 
        typeof value === 'string' && 
        value !== '' && 
        !['created_at', 'updated_at', 'id', 'request_id', 'role_justification'].includes(key)
      );
  };

  const handleAutoApprove = async () => {
    if (!isTestMode) {
      toast.error('Test mode is not enabled');
      return;
    }

    try {
      const pendingApprovals = approvals.filter(approval => approval.status === 'pending');
      
      if (pendingApprovals.length === 0) {
        toast.info('No pending approvals to process');
        return;
      }

      for (const approval of pendingApprovals) {
        const { error } = await supabase
          .from('request_approvals')
          .update({
            status: 'approved',
            signature_data: 'Test Mode Auto-Signature',
            approved_at: new Date().toISOString()
          })
          .eq('id', approval.id);

        if (error) throw error;
      }

      toast.success(`Auto-approved ${pendingApprovals.length} signatures`);
      fetchRequestDetails(); // Refresh the data
    } catch (err) {
      console.error('Error auto-approving:', err);
      toast.error('Failed to auto-approve signatures');
    }
  };

  const handleCompleteRequest = async () => {
    if (!completerName.trim()) {
      toast.error('Please enter the completer name');
      return;
    }
    try {
      const { error } = await supabase
        .from('security_role_requests')
        .update({
          status: 'completed',
          completed_by: completerName.trim(),
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Request completed by ${completerName}`);
      setCompleterName(''); // Clear the field after completion
      fetchRequestDetails(); // Refresh the data
    } catch (err) {
      console.error('Error completing request:', err);
      toast.error('Failed to complete request');
    }
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

  // Check if all approvals are approved
  const allApprovalsApproved = approvals.length > 0 && approvals.every(approval => approval.status === 'approved');
  const canCompleteRequest = allApprovalsApproved && request?.status !== 'completed';
  
  console.log('Completion logic:', {
    allApprovalsApproved,
    requestStatus: request?.status,
    canCompleteRequest,
    approvalsCount: approvals.length,
    approvals: approvals.map(a => ({ step: a.step, status: a.status }))
  });

  const getStepDisplayName = (step: string) => {
    const stepNames: Record<string, string> = {
      'user_signature': 'User Signature',
      'supervisor_approval': 'Supervisor Approval',
      'accounting_director_approval': 'Accounting Director Approval',
      'hr_director_approval': 'HR Director Approval',
      'elm_admin_approval': 'ELM Admin Approval',
      'security_admin_approval': 'Security Admin Approval'
    };
    return stepNames[step] || step;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'denied':
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'denied':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Request Details" />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Request Details" />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <X className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error || 'Request not found'}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Link
              to="/requests"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Requests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Request Details" 
        onUserChange={handleUserChange}
      />
      
      {!currentUser ? (
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">User Identification Required</h3>
              <p className="text-blue-700">
                Please identify yourself to view request details.
              </p>
            </div>
          </div>
        </div>
      ) : (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header with actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link
              to="/requests"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Requests
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Request #{request.id.slice(0, 8)}
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleNewRequest}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </button>
            
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
            
            <Link
              to={`/requests/${id}/edit`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </div>
        </div>

        {/* Request Information */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Request Information</h2>
          </div>
          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Employee Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{request.employee_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Employee ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{request.employee_id || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{request.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(request.start_date).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Agency</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {request.agency_name} ({request.agency_code})
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Work Location</dt>
                <dd className="mt-1 text-sm text-gray-900">{request.work_location || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Work Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{request.work_phone || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Non-Employee</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {request.is_non_employee ? 'Yes' : 'No'}
                </dd>
              </div>
            </dl>
            
            {request.justification && (
              <div className="mt-6">
                <dt className="text-sm font-medium text-gray-500">Request Justification</dt>
                <dd className="mt-1 text-sm text-gray-900">{request.justification}</dd>
              </div>
            )}
          </div>
        </div>

        {/* Security Areas */}
        {securityAreas.length > 0 && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Security Areas</h2>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                {securityAreas.map((area) => (
                  <div key={area.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {area.area_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    {area.director_name && (
                      <p className="text-sm text-gray-600">
                        Director: {area.director_name}
                        {area.director_email && ` (${area.director_email})`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Role Selections */}
        {roleSelections && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Role Selections</h2>
            </div>
            <div className="px-6 py-4">
              {getActiveBooleanRoles().length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Active Roles:</h3>
                    <div className="flex flex-wrap gap-2">
                      {getActiveBooleanRoles().map((role) => (
                        <span 
                          key={role} 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          {formatFieldName(role)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {getStringFieldValues().length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Additional Settings:</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {getStringFieldValues().map(([key, value]) => (
                          <div key={key} className="bg-gray-50 p-3 rounded-lg">
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              {formatFieldName(key)}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">{value as string}</dd>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {roleSelections.role_justification && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Role Justification:</h3>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {roleSelections.role_justification}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No specific role selections found for this request.</p>
              )}
            </div>
          </div>
        )}

        {/* Copy User Details */}
        {copyUserDetails && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Copy User Access</h2>
              <p className="text-sm text-gray-500 mt-1">
                This request copies access permissions from an existing user
              </p>
            </div>
            <div className="px-6 py-4">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Copy User Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{copyUserDetails.copy_user_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Copy User Employee ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{copyUserDetails.copy_user_employee_id}</dd>
                </div>
                {copyUserDetails.copy_user_sema4_id && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Copy User SEMA4 ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{copyUserDetails.copy_user_sema4_id}</dd>
                  </div>
                )}
              </dl>
              
              {/* Show a note about copied permissions */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> All security roles and permissions from the specified user have been copied to this request.
                  {!roleSelections && (
                    <span className="text-blue-600"> No role selections were found for the specified user - they may not have any completed requests or active permissions.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Approval Status */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Approval Status</h2>
            <div className="flex items-center space-x-3">
              {isTestMode && (
                approvals.some(approval => approval.status === 'pending') && (
                  <button
                    onClick={handleAutoApprove}
                    className="inline-flex items-center px-3 py-2 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100"
                  >
                    <ShieldCheck className="w-4 w-4 mr-2" />
                    Auto-Approve All Signatures
                  </button>
                )
              )}
              {canCompleteRequest && (
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={completerName}
                    onChange={(e) => setCompleterName(e.target.value)}
                    placeholder="Enter your name to complete request"
                    className="px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-50"
                  />
                  <button
                    onClick={handleCompleteRequest}
                    disabled={!completerName.trim()}
                    className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm ${
                      completerName.trim()
                        ? 'border-green-500 text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                        : 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-4 w-4 mr-2" />
                    {completerName.trim() ? 'Complete Request' : 'Enter Name to Complete'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="px-6 py-4">
            {approvals.length > 0 ? (
              <div className="space-y-4">
                {approvals.map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      {approval.status === 'pending' ? (
                        <Link
                          to={`/signature/${id}/${approval.id}`}
                          className="flex items-center cursor-pointer hover:text-blue-600"
                        >
                          <input
                            type="radio"
                            name="approval-selection"
                            className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                            readOnly
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 hover:text-blue-600">
                              {getStepDisplayName(approval.step)}
                            </p>
                            <p className="text-sm text-gray-500">{approval.approver_email}</p>
                          </div>
                        </Link>
                      ) : (
                        <>
                          {getStatusIcon(approval.status)}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {getStepDisplayName(approval.step)}
                            </p>
                            <p className="text-sm text-gray-500">{approval.approver_email}</p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(approval.status)}`}>
                        {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                      </span>
                      {approval.approved_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(approval.approved_at).toLocaleString()}
                        </p>
                      )}
                      {approval.comments && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                          <strong>Comments:</strong> {approval.comments}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No approvals found for this request.</p>
            )}
          </div>
        </div>

        {/* Submitter and Approver Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Contact Information</h2>
          </div>
          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Submitter</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {request.submitter_name}
                  <br />
                  <span className="text-gray-600">{request.submitter_email}</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Supervisor</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {request.supervisor_name}
                  <br />
                  <span className="text-gray-600">{request.supervisor_email}</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Security Administrator</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {request.security_admin_name}
                  <br />
                  <span className="text-gray-600">{request.security_admin_email}</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(request.created_at).toLocaleString()}
                </dd>
              </div>
              {request.completed_by && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Completed By</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {request.completed_by}
                    {request.completed_at && (
                      <>
                        <br />
                        <span className="text-gray-600">
                          {new Date(request.completed_at).toLocaleString()}
                        </span>
                      </>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default RequestDetailsPage;