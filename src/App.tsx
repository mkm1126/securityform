import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { isAfter, startOfToday } from 'date-fns';
import { ClipboardList, AlertCircle, ArrowRight } from 'lucide-react';
import { SecurityRoleRequest } from './types';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';
import Header from './components/Header';
import AgencySelect from './components/AgencySelect';
import UserSelect from './components/UserSelect';

async function copyExistingUserRoles(newRequestId: string, copyFromEmployeeId: string) {
  try {
    console.log('Looking for existing user with employee ID:', copyFromEmployeeId);
    
    // Find the most recent request for the user we want to copy from
    const { data: existingRequest, error: requestError } = await supabase
      .from('security_role_requests')
      .select('id')
      .eq('employee_id', copyFromEmployeeId)
      .eq('status', 'completed') // Only copy from completed requests
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (requestError) {
      console.error('Error finding existing request:', requestError);
      return;
    }

    if (!existingRequest) {
      console.log('No completed request found for employee ID:', copyFromEmployeeId);
      return;
    }

    console.log('Found existing request to copy from:', existingRequest.id);

    // Get the role selections from the existing user
    const { data: existingRoles, error: rolesError } = await supabase
      .from('security_role_selections')
      .select('*')
      .eq('request_id', existingRequest.id)
      .maybeSingle();

    if (rolesError) {
      console.error('Error fetching existing roles:', rolesError);
      return;
    }

    if (!existingRoles) {
      console.log('No role selections found for existing request');
      return;
    }

    console.log('Found existing roles to copy:', existingRoles);

    // Create a copy of the role selections for the new request
    const newRoleSelections = {
      ...existingRoles,
      id: undefined, // Remove the ID so a new one is generated
      request_id: newRequestId, // Set to the new request ID
      created_at: undefined, // Let the database set the timestamp
      updated_at: undefined,
      role_justification: existingRoles.role_justification || 'Copied from existing user access'
    };

    // Insert the copied role selections
    const { error: insertError } = await supabase
      .from('security_role_selections')
      .insert(newRoleSelections);

    if (insertError) {
      console.error('Error copying role selections:', insertError);
      return;
    }

    console.log('Successfully copied role selections to new request');

  } catch (error) {
    console.error('Error in copyExistingUserRoles:', error);
  }
}

function App() {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<'copy' | 'select' | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCopyUser, setSelectedCopyUser] = useState<{employee_name: string; employee_id: string; email: string} | null>(null);

  const handleUserChange = (userName: string | null) => {
    setCurrentUser(userName);
  };

  const [isTestMode, setIsTestMode] = useState(() => {
    return localStorage.getItem('testMode') === 'true';
  });

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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SecurityRoleRequest>();

  // Watch for security area selection
  const selectedSecurityArea = watch('securityArea');
  const isNonEmployee = watch('isNonEmployee');

  // Check if a security area is selected
  const hasSelectedSecurityArea = !!selectedSecurityArea;

  // Generate test data
  const getTestData = () => ({
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    employeeName: 'John Test User',
    employeeId: '12345',
    workLocation: 'Test Building, Room 123',
    workPhone: '6515551234',
    email: 'john.testuser@state.mn.us',
    agencyName: 'Administration',
    agencyCode: 'G02',
    justification: 'This is test data for development and testing purposes.',
    submitterName: currentUser || 'Test Submitter',
    submitterEmail: `${(currentUser || 'testsubmitter').toLowerCase().replace(/\s+/g, '.')}@state.mn.us`,
    supervisorName: 'Jane Test Supervisor',
    supervisorUsername: 'jane.supervisor',
    securityAdminName: 'Bob Test Admin',
    securityAdminUsername: 'bob.admin',
    accountingDirector: 'Alice Test Director',
    accountingDirectorUsername: 'alice.director',
    elmKeyAdmin: 'Carol Test ELM Admin',
    elmKeyAdminUsername: 'carol.elmadmin',
    copyUserName: 'Sample Copy User',
    copyUserEmployeeId: '67890',
    copyUserSema4Id: 'SAMP001'
  });

  // Auto-populate test data when test mode is enabled and security area is selected
  useEffect(() => {
    if (isTestMode && currentUser) {
      console.log('Auto-populating test data for security area:', selectedSecurityArea);
      const testData = getTestData();
      
      // Populate basic fields
      setValue('startDate', testData.startDate);
      setValue('employeeName', testData.employeeName);
      setValue('employeeId', testData.employeeId);
      setValue('workLocation', testData.workLocation);
      setValue('workPhone', testData.workPhone);
      setValue('email', testData.email);
      setValue('agencyName', testData.agencyName);
      setValue('agencyCode', testData.agencyCode);
      setValue('justification', testData.justification);
      setValue('submitterName', testData.submitterName);
      setValue('submitterEmail', testData.submitterEmail);
      setValue('supervisorName', testData.supervisorName);
      setValue('supervisorUsername', testData.supervisorUsername);
      setValue('securityAdminName', testData.securityAdminName);
      setValue('securityAdminUsername', testData.securityAdminUsername);

      // Populate security area specific fields
      if (selectedSecurityArea === 'accounting_procurement') {
        setValue('accountingDirector', testData.accountingDirector);
        setValue('accountingDirectorUsername', testData.accountingDirectorUsername);
      } else if (selectedSecurityArea === 'elm') {
        setValue('elmKeyAdmin', testData.elmKeyAdmin);
        setValue('elmKeyAdminUsername', testData.elmKeyAdminUsername);
      }
    }
  }, [isTestMode, selectedSecurityArea, setValue, currentUser]);

  // Handle security area selection - navigate to specific role selection if needed
  useEffect(() => {
    if (selectedSecurityArea === 'elm') {
      // Don't navigate immediately, let user complete the form first
      console.log('ELM selected - user will be redirected after form submission');
    }
  }, [selectedSecurityArea]);

  const handleAgencyChange = (agencyName: string, agencyCode: string) => {
    setValue('agencyName', agencyName);
    setValue('agencyCode', agencyCode);
  };

  const handleCopyUserChange = (user: {employee_name: string; employee_id: string; email: string} | null) => {
    console.log('🔧 App handleCopyUserChange called with:', user);
    setSelectedCopyUser(user);
    if (user) {
      setValue('copyUserName', user.employee_name);
      setValue('copyUserEmployeeId', user.employee_id);
    } else {
      setValue('copyUserName', '');
      setValue('copyUserEmployeeId', '');
    }
  };

  const getSecurityAreaLabel = (area: string) => {
    const labels: Record<string, string> = {
      'accounting_procurement': 'Accounting/Procurement',
      'hr_payroll': 'HR/Payroll',
      'epm_data_warehouse': 'EPM Data Warehouse',
      'elm': 'ELM'
    };
    return labels[area] || area;
  };

  const handleProceedToRoleSelection = async () => {
    if (!hasSelectedSecurityArea || !selectedSecurityArea) {
      toast.error('Please select a security area first.');
      return;
    }

    // Get form data
    const formData = watch();
    
    // Validate required fields
    if (!formData.employeeName || !formData.email || !formData.agencyName || !formData.submitterName || !formData.supervisorName || !formData.securityAdminName) {
      toast.error('Please fill in all required fields before proceeding.');
      return;
    }

    setSaving(true);

    try {
      console.log('Creating request for role selection...');
      
      // Format phone number
      const formattedPhone = formData.workPhone ? formData.workPhone.replace(/\D/g, '') : null;

      // Create the main request
      const requestData = {
        start_date: formData.startDate,
        employee_name: formData.employeeName,
        employee_id: formData.employeeId,
        is_non_employee: formData.isNonEmployee,
        work_location: formData.workLocation,
        work_phone: formattedPhone,
        email: formData.email,
        agency_name: formData.agencyName,
        agency_code: formData.agencyCode,
        justification: formData.justification,
        submitter_name: formData.submitterName,
        submitter_email: formData.submitterEmail,
        supervisor_name: formData.supervisorName,
        supervisor_email: `${formData.supervisorUsername}@state.mn.us`,
        security_admin_name: formData.securityAdminName,
        security_admin_email: `${formData.securityAdminUsername}@state.mn.us`,
        poc_user: currentUser
      };

      const { data: request, error: requestError } = await supabase
        .from('security_role_requests')
        .insert(requestData)
        .select()
        .single();

      if (requestError) throw requestError;

      // Create security area record
      const securityAreas = [];
      if (selectedSecurityArea === 'accounting_procurement') {
        securityAreas.push({
          request_id: request.id,
          area_type: 'accounting_procurement',
          director_name: formData.accountingDirector,
          director_email: `${formData.accountingDirectorUsername}@state.mn.us`,
        });
      } else if (selectedSecurityArea === 'hr_payroll') {
        securityAreas.push({
          request_id: request.id,
          area_type: 'hr_payroll',
          director_name: formData.hrMainframeLogonId,
          director_email: formData.hrViewStatewide ? 'hr_statewide_access@state.mn.us' : 'hr_standard_access@state.mn.us',
        });
      } else if (selectedSecurityArea === 'epm_data_warehouse') {
        securityAreas.push({
          request_id: request.id,
          area_type: 'epm_data_warehouse',
        });
      } else if (selectedSecurityArea === 'elm') {
        securityAreas.push({
          request_id: request.id,
          area_type: 'elm',
          director_name: formData.elmKeyAdmin,
          director_email: `${formData.elmKeyAdminUsername}@state.mn.us`,
        });
      }

      if (securityAreas.length > 0) {
        const { error: areasError } = await supabase
          .from('security_areas')
          .insert(securityAreas);

        if (areasError) throw areasError;
      }

      // Navigate to the appropriate role selection page
      if (selectedSecurityArea === 'elm') {
        navigate('/elm-roles', { state: { requestId: request.id } });
      } else if (selectedSecurityArea === 'epm_data_warehouse') {
        navigate('/epm-dwh-roles', { state: { requestId: request.id } });
      } else if (selectedSecurityArea === 'hr_payroll') {
        navigate('/hr-payroll-roles', { state: { requestId: request.id } });
      } else {
        navigate('/select-roles', { state: { requestId: request.id } });
      }

    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Failed to create request. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (data: SecurityRoleRequest) => {
    if (!hasSelectedSecurityArea) {
      return;
    }

    try {
      console.log('Starting submission process...');
      console.log('Form data:', data);

      // Format phone number
      const formattedPhone = data.workPhone ? data.workPhone.replace(/\D/g, '') : null;

      // Create the main request with POC user tracking
      const requestData = {
        start_date: data.startDate,
        employee_name: data.employeeName,
        employee_id: data.employeeId,
        is_non_employee: data.isNonEmployee,
        work_location: data.workLocation,
        work_phone: formattedPhone,
        email: data.email,
        agency_name: data.agencyName,
        agency_code: data.agencyCode,
        justification: data.justification,
        submitter_name: data.submitterName,
        submitter_email: data.submitterEmail,
        supervisor_name: data.supervisorName,
        supervisor_email: `${data.supervisorUsername}@state.mn.us`,
        security_admin_name: data.securityAdminName,
        security_admin_email: `${data.securityAdminUsername}@state.mn.us`,
        poc_user: currentUser // Track which POC user created this request
      };

      console.log('Inserting main request:', requestData);

      const { data: request, error: requestError } = await supabase
        .from('security_role_requests')
        .insert(requestData)
        .select()
        .single();

      if (requestError) throw requestError;
      console.log('Main request created:', request);

      // Create security area record
      const securityAreas = [];
      if (data.securityArea === 'accounting_procurement') {
        securityAreas.push({
          request_id: request.id,
          area_type: 'accounting_procurement',
          director_name: data.accountingDirector,
          director_email: `${data.accountingDirectorUsername}@state.mn.us`,
        });
      } else if (data.securityArea === 'hr_payroll') {
        securityAreas.push({
          request_id: request.id,
          area_type: 'hr_payroll',
          director_name: data.hrMainframeLogonId,
          director_email: data.hrViewStatewide ? 'hr_statewide_access@state.mn.us' : 'hr_standard_access@state.mn.us',
        });
      } else if (data.securityArea === 'epm_data_warehouse') {
        securityAreas.push({
          request_id: request.id,
          area_type: 'epm_data_warehouse',
        });
      } else if (data.securityArea === 'elm') {
        securityAreas.push({
          request_id: request.id,
          area_type: 'elm',
          director_name: data.elmKeyAdmin,
          director_email: `${data.elmKeyAdminUsername}@state.mn.us`,
        });
      }

      if (securityAreas.length > 0) {
        console.log('Inserting security areas:', securityAreas);
        const { error: areasError } = await supabase
          .from('security_areas')
          .insert(securityAreas);

        if (areasError) throw areasError;
        console.log('Security areas created successfully');
      }

      // Handle copy user details if selected
      if (selectedOption === 'copy') {
        const copyUserData = {
          request_id: request.id,
          copy_user_name: data.copyUserName,
          copy_user_employee_id: data.copyUserEmployeeId,
          copy_user_sema4_id: data.copyUserSema4Id,
        };

        console.log('Inserting copy user details:', copyUserData);
        const { error: copyError } = await supabase
          .from('copy_user_details')
          .insert(copyUserData);

        if (copyError) throw copyError;
        console.log('Copy user details created successfully');

        // Find and copy the existing user's role selections
        await copyExistingUserRoles(request.id, data.copyUserEmployeeId);
      }

      toast.success('Request submitted successfully!');
      
      // Navigate based on selection
      if (selectedOption === 'copy') {
        navigate('/success', { state: { requestId: request.id } });
      } else if (data.securityArea === 'elm') {
        navigate('/elm-roles', { state: { requestId: request.id } });
      } else if (data.securityArea === 'epm_data_warehouse') {
        navigate('/epm-dwh-roles', { state: { requestId: request.id } });
      } else if (data.securityArea === 'hr_payroll') {
        navigate('/hr-payroll-roles', { state: { requestId: request.id } });
      } else {
        navigate('/select-roles', { state: { requestId: request.id } });
      }

    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Request for Access to SWIFT Statewide Systems"
        subtitle="Complete this form to request security role access"
        onUserChange={handleUserChange}
      />
      
      {!currentUser ? (
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">User Identification Required</h3>
              <p className="text-blue-700">
                Please identify yourself to submit requests.
              </p>
            </div>
          </div>
        </div>
      ) : (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-lg shadow">
            {/* Section 1: Employee Details */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Employee Details</h3>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date of Access*</label>
                  <input
                    type="date"
                    {...register('startDate', {
                      required: 'Start date is required',
                      validate: value => 
                        isAfter(new Date(value), startOfToday()) || 'Start date must be in the future'
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee Name*</label>
                  <input
                    type="text"
                    {...register('employeeName', { required: 'Employee name is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.employeeName && (
                    <p className="mt-1 text-sm text-red-600">{errors.employeeName.message}</p>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                  <div className="flex items-center mt-1">
                    <input
                      type="text"
                      {...register('employeeId', {
                        required: isNonEmployee ? false : 'Employee ID is required'
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          {...register('isNonEmployee')}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">Non-Employee</span>
                      </label>
                    </div>
                  </div>
                  {errors.employeeId && (
                    <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Work Location</label>
                  <input
                    type="text"
                    {...register('workLocation')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Work Phone</label>
                  <input
                    type="tel"
                    {...register('workPhone', {
                      pattern: {
                        value: /^(\d{10})?$/,
                        message: 'Please enter a valid 10-digit phone number or leave empty'
                      }
                    })}
                    placeholder="1234567890"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.workPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.workPhone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address*</label>
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <AgencySelect
                    value={watch('agencyName') || ''}
                    onChange={handleAgencyChange}
                    error={errors.agencyName?.message}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Agency Code*</label>
                  <input
                    type="text"
                    {...register('agencyCode', {
                      required: 'Agency code is required',
                      maxLength: {
                        value: 3,
                        message: 'Agency code must be 3 characters'
                      },
                      minLength: {
                        value: 3,
                        message: 'Agency code must be 3 characters'
                      }
                    })}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                  />
                  {errors.agencyCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.agencyCode.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Request Justification</label>
                <textarea
                  {...register('justification')}
                  rows={3}
                  placeholder="Please explain why this access is needed..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Section 2: Submitter Details */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Submitter Details</h3>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Submitter Name*</label>
                  <input
                    type="text"
                    {...register('submitterName', { required: 'Submitter name is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.submitterName && (
                    <p className="mt-1 text-sm text-red-600">{errors.submitterName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Submitter Email*</label>
                  <input
                    type="email"
                    {...register('submitterEmail', {
                      required: 'Submitter email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.submitterEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.submitterEmail.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Approver Details */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Approver Details</h3>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee's Supervisor*</label>
                  <input
                    type="text"
                    {...register('supervisorName', { required: 'Supervisor name is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.supervisorName && (
                    <p className="mt-1 text-sm text-red-600">{errors.supervisorName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Supervisor Username*</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      {...register('supervisorUsername', {
                        required: 'Supervisor username is required',
                        pattern: {
                          value: /^[a-zA-Z0-9._-]+$/,
                          message: 'Username can only contain letters, numbers, dots, hyphens, and underscores'
                        }
                      })}
                      className="flex-1 rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="username"
                    />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      @state.mn.us
                    </span>
                  </div>
                  {errors.supervisorUsername && (
                    <p className="mt-1 text-sm text-red-600">{errors.supervisorUsername.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Agency Security Administrator*</label>
                  <input
                    type="text"
                    {...register('securityAdminName', { required: 'Security admin name is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.securityAdminName && (
                    <p className="mt-1 text-sm text-red-600">{errors.securityAdminName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Security Administrator Username*</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      {...register('securityAdminUsername', {
                        required: 'Security admin username is required',
                        pattern: {
                          value: /^[a-zA-Z0-9._-]+$/,
                          message: 'Username can only contain letters, numbers, dots, hyphens, and underscores'
                        }
                      })}
                      className="flex-1 rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="username"
                    />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      @state.mn.us
                    </span>
                  </div>
                  {errors.securityAdminUsername && (
                    <p className="mt-1 text-sm text-red-600">{errors.securityAdminUsername.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Security Details */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Security Details</h3>
              
              <p className="text-sm text-gray-700">Please select the security area you need access to</p>

              {!hasSelectedSecurityArea && (
                <div className="rounded-md bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Required Selection
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Please select a security area to proceed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      {...register('securityArea', { required: 'Please select a security area' })}
                      value="accounting_procurement"
                      className="border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Accounting / Procurement</span>
                  </label>

                  {selectedSecurityArea === 'accounting_procurement' && (
                    <div className="ml-6 mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Accounting Director/CFO*</label>
                        <input
                          type="text"
                          {...register('accountingDirector', { required: 'Accounting Director is required' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.accountingDirector && (
                          <p className="mt-1 text-sm text-red-600">{errors.accountingDirector.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Director Username*</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input
                            type="text"
                            {...register('accountingDirectorUsername', {
                              required: 'Director username is required',
                              pattern: {
                                value: /^[a-zA-Z0-9._-]+$/,
                                message: 'Username can only contain letters, numbers, dots, hyphens, and underscores'
                              }
                            })}
                            className="flex-1 rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="username"
                          />
                          <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            @state.mn.us
                          </span>
                        </div>
                        {errors.accountingDirectorUsername && (
                          <p className="mt-1 text-sm text-red-600">{errors.accountingDirectorUsername.message}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      {...register('securityArea')}
                      value="hr_payroll"
                      className="border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">HR / Payroll</span>
                  </label>

                  {selectedSecurityArea === 'hr_payroll' && (
                    <div className="ml-6 mt-2 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Enter mainframe logon ID—required until further notice:*
                        </label>
                        <input
                          type="text"
                          {...register('hrMainframeLogonId', { required: 'Mainframe logon ID is required' })}
                          placeholder="Enter mainframe logon ID"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.hrMainframeLogonId && (
                          <p className="mt-1 text-sm text-red-600">{errors.hrMainframeLogonId.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="inline-flex items-start">
                          <input
                            type="checkbox"
                            {...register('hrViewStatewide')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            If this person is responsible for HR activities/transactions and has an ongoing business need to view HR data pages for employees across department boundaries (HR View Statewide), check here:
                          </span>
                        </label>
                      </div>

                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Important Note
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>
                                The mainframe logon ID is required until further notice for all HR/Payroll access requests.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      {...register('securityArea')}
                      value="epm_data_warehouse"
                      className="border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">EPM / Data Warehouse</span>
                  </label>
                </div>

                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      {...register('securityArea')}
                      value="elm"
                      className="border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">ELM</span>
                  </label>
                  <p className="ml-6 mt-1 text-sm text-gray-500">
                    DON'T SELECT ELM unless you are seeking access privileges for administrative functions. All staff automatically have access to ELM courses.
                  </p>

                  {selectedSecurityArea === 'elm' && (
                    <div className="ml-6 mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ELM Key Administrator*</label>
                        <input
                          type="text"
                          {...register('elmKeyAdmin', { required: 'ELM Key Administrator is required' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.elmKeyAdmin && (
                          <p className="mt-1 text-sm text-red-600">{errors.elmKeyAdmin.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Administrator Username*</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input
                            type="text"
                            {...register('elmKeyAdminUsername', {
                              required: 'Administrator username is required',
                              pattern: {
                                value: /^[a-zA-Z0-9._-]+$/,
                                message: 'Username can only contain letters, numbers, dots, hyphens, and underscores'
                              }
                            })}
                            className="flex-1 rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="username"
                          />
                          <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            @state.mn.us
                          </span>
                        </div>
                        {errors.elmKeyAdminUsername && (
                          <p className="mt-1 text-sm text-red-600">{errors.elmKeyAdminUsername.message}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {errors.securityArea && (
                <p className="mt-1 text-sm text-red-600">{errors.securityArea.message}</p>
              )}
            </div>

            {/* Role Selection Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Role Selection Method</h3>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  Please choose how you would like to set up the security roles for this request:
                </p>
                
                <div className="space-y-6">
                  <div className="flex flex-col space-y-4">
                    <button
                      type="button"
                      onClick={() => setSelectedOption('copy')}
                      className={`p-4 text-left rounded-lg border-2 transition-colors ${
                        selectedOption === 'copy'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">Copy Existing User Access</h4>
                          <p className="mt-1 text-sm text-gray-500">
                            Grant the same roles, agency codes, and workflows as an existing user.
                            Choose this if you want to replicate another user's access permissions.
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedOption('select')}
                      className={`p-4 text-left rounded-lg border-2 transition-colors ${
                        selectedOption === 'select'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">Select Individual Roles</h4>
                          <p className="mt-1 text-sm text-gray-500">
                            Choose specific roles and permissions from a comprehensive list.
                            Best for customized access requirements.
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {selectedOption === 'copy' && (
                    <div className="mt-6 space-y-4 bg-white p-6 rounded-lg border border-gray-200">
                      <UserSelect
                        selectedUser={selectedCopyUser}
                        onUserChange={handleCopyUserChange}
                        error={errors.copyUserName?.message || errors.copyUserEmployeeId?.message}
                        required={true}
                        currentUser={currentUser}
                      />
                      
                      {/* Hidden fields to maintain form validation */}
                      <input type="hidden" {...register('copyUserName', { required: 'User selection is required' })} />
                      <input type="hidden" {...register('copyUserEmployeeId', { required: 'User selection is required' })} />

                      <div>
                        <label className="block text-sm font-medium text-gray-700">SEMA4 ID</label>
                        <input
                          type="text"
                          {...register('copyUserSema4Id')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {selectedOption === 'select' && (
                    <div className="mt-6 space-y-4 bg-white p-6 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">
                        You will be taken to a detailed role selection page for {getSecurityAreaLabel(selectedSecurityArea || '')}.
                      </p>
                      <button
                        type="button"
                        onClick={handleProceedToRoleSelection}
                        disabled={saving || !hasSelectedSecurityArea}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                          hasSelectedSecurityArea && !saving
                            ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        {saving ? 'Processing...' : `Proceed to ${getSecurityAreaLabel(selectedSecurityArea || '')} Role Selection`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!hasSelectedSecurityArea || !selectedOption}
                className={`flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                  hasSelectedSecurityArea && selectedOption
                    ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <ClipboardList className="mr-2 h-5 w-5" />
                Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>
      )}
    </div>
  );
}

export default App;