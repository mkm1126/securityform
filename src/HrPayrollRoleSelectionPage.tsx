import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, AlertTriangle, Users, Shield, Database, FileText } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';
import Header from './components/Header';
import AgencySelect from './components/AgencySelect';
import BusinessUnitSelect from './components/BusinessUnitSelect';

interface HrPayrollRoleSelection {
  // Agency / Department ID Access
  addAccessType: 'agency' | 'department';
  agencyCodes: string;
  departmentId: string;
  prohibitedDepartmentIds: string;
  deleteAccessCodes: string;
  homeBusinessUnit: string;
  
  // HR/Payroll SEMA4 Roles
  hrDataEntry: boolean;
  hrDataInquiry: boolean;
  hrSupervisor: boolean;
  hrDirector: boolean;
  hrStatewide: boolean;
  
  // Payroll Roles
  payrollDataEntry: boolean;
  payrollDataInquiry: boolean;
  payrollSupervisor: boolean;
  payrollDirector: boolean;
  payrollStatewide: boolean;
  
  // Benefits Administration
  benefitsAdministrator: boolean;
  benefitsInquiry: boolean;
  
  // Position Management
  positionControl: boolean;
  positionInquiry: boolean;
  
  // Reporting
  hrReporting: boolean;
  payrollReporting: boolean;
  
  // Special Access
  confidentialEmployeeAccess: boolean;
  workersCompAccess: boolean;
  
  // Justification
  roleJustification: string;
  supervisorApproval: boolean;
}

function HrPayrollRoleSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [selectedAgency, setSelectedAgency] = useState({ name: '', code: '' });
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState({ name: '', code: '' });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HrPayrollRoleSelection>({
    defaultValues: {
      addAccessType: undefined
    }
  });

  // Watch for role selections
  const selectedRoles = watch();
  const supervisorApproval = watch('supervisorApproval');
  const confidentialEmployeeAccess = watch('confidentialEmployeeAccess');
  const hrStatewide = watch('hrStatewide');
  const payrollStatewide = watch('payrollStatewide');
  const addAccessType = watch('addAccessType');

  const handleAgencyChange = (agencyName: string, agencyCode: string) => {
    setSelectedAgency({ name: agencyName, code: agencyCode });
    setValue('agencyCodes', agencyCode);
  };

  const handleBusinessUnitChange = (businessUnitName: string, businessUnitCode: string) => {
    setSelectedBusinessUnit({ name: businessUnitName, code: businessUnitCode });
    setValue('homeBusinessUnit', businessUnitCode);
  };

  const hasHighRiskRoles = confidentialEmployeeAccess || hrStatewide || payrollStatewide;

  // Check if any roles are selected
  const hasSelectedRoles = Object.entries(selectedRoles || {})
    .filter(([key, value]) => 
      typeof value === 'boolean' && 
      value === true && 
      !['supervisorApproval'].includes(key)
    ).length > 0;

  useEffect(() => {
    // Try to get requestId from location state
    const stateRequestId = location.state?.requestId;
    if (stateRequestId) {
      setRequestId(stateRequestId);
      fetchRequestDetails(stateRequestId);
    } else {
      // If no requestId, redirect back to main form
      toast.error('Please complete the main form first before selecting HR/Payroll roles.');
      navigate('/');
    }
  }, [location.state, navigate]);

  // Auto-scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const fetchRequestDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('security_role_requests')
        .select('employee_name, agency_name, agency_code')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRequestDetails(data);
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast.error('Failed to load request details');
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const onSubmit = async (data: HrPayrollRoleSelection) => {
    if (!supervisorApproval) {
      toast.error('Supervisor approval acknowledgment is required for HR/Payroll access.');
      return;
    }

    if (!hasSelectedRoles) {
      toast.error('Please select at least one HR/Payroll role.');
      return;
    }

    if (!requestId) {
      toast.error('No request found. Please start from the main form.');
      navigate('/');
      return;
    }

    setSaving(true);

    try {
      // Store HR/Payroll role selections - mapping to database fields
      const hrPayrollRoleData = {
        request_id: requestId,
        home_business_unit: selectedBusinessUnit.code?.padEnd(5, '0') || data.homeBusinessUnit || requestDetails?.agency_code?.padEnd(5, '0') || '00000',
        other_business_units: data.addAccessType === 'agency' ? selectedAgency.code : data.departmentId,
        
        // Map HR roles to available fields
        manage_user_accounts: data.hrDataEntry || false,
        view_user_progress: data.hrDataInquiry || false,
        assign_user_roles: data.hrSupervisor || false,
        generate_user_reports: data.hrDirector || false,
        access_system_reports: data.hrStatewide || false,
        
        // Map Payroll roles to available fields
        create_custom_reports: data.payrollDataEntry || false,
        export_report_data: data.payrollDataInquiry || false,
        view_analytics_dashboard: data.payrollSupervisor || false,
        create_learning_paths: data.payrollDirector || false,
        edit_learning_paths: data.payrollStatewide || false,
        
        // Map Benefits and Position roles
        manage_certifications: data.benefitsAdministrator || false,
        issue_certificates: data.benefitsInquiry || false,
        track_certification_status: data.positionControl || false,
        renew_certifications: data.positionInquiry || false,
        
        // Map Reporting and Special Access
        configure_system_settings: data.hrReporting || false,
        manage_integrations: data.payrollReporting || false,
        setup_notifications: data.confidentialEmployeeAccess || false,
        manage_security_settings: data.workersCompAccess || false,
        
        role_justification: data.roleJustification
      };

      // Update or insert HR/Payroll role selections with explicit conflict resolution
      const { error } = await supabase
        .from('security_role_selections')
        .upsert(hrPayrollRoleData, { onConflict: 'request_id' });

      if (error) throw error;

      toast.success('HR/Payroll role selections saved successfully!');
      navigate('/success', { state: { requestId } });

    } catch (error) {
      console.error('Error saving HR/Payroll role selections:', error);
      toast.error('Failed to save HR/Payroll role selections. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="HR / Payroll Role Selection"
        subtitle="Select specific roles and permissions for HR and Payroll access"
      />
      
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Main Form
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    HR / Payroll Role Selection
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Select specific roles and permissions for HR and Payroll system access
                  </p>
                  {requestDetails && (
                    <p className="mt-2 text-sm text-blue-600">
                      Request for: <strong>{requestDetails.employee_name}</strong> at <strong>{requestDetails.agency_name}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
              {/* Agency / Department ID Access */}
              <div id="agency-access" className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Agency / Department ID Access</h3>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Database className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Add Access
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          You may grant access to all employees within an agency OR employees of only specific Department IDs.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        {...register('addAccessType')}
                        value="agency"
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">By Agency</span>
                    </label>
                    <p className="ml-6 mt-1 text-sm text-gray-500">
                      Select an agency to allow access to all employees within that agency:
                    </p>
                    {addAccessType === 'agency' && (
                      <div className="ml-6 mt-2 space-y-3">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <AgencySelect
                            value={selectedAgency.name}
                            onChange={handleAgencyChange}
                            error={errors.agencyCodes?.message}
                          />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Selected Agency Code
                            </label>
                            <input
                              type="text"
                              value={selectedAgency.code}
                              readOnly
                              className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Auto-populated when agency is selected"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-center text-sm font-medium text-gray-500">
                    OR
                  </div>

                  <div>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        {...register('addAccessType')}
                        value="department"
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">By Department ID</span>
                    </label>
                    <p className="ml-6 mt-1 text-sm text-gray-500">
                      To limit access to employees of defined departments within the agency, list the Department ID highest in your department organization structure that the user will access. The user will have access to that Department ID and all those reporting to it.
                    </p>
                    {addAccessType === 'department' && (
                      <div className="ml-6 mt-2 space-y-3">
                        <input
                          type="text"
                          {...register('departmentId')}
                          placeholder="Enter Department ID"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            To prohibit access to individual lower-level Department IDs included above, list each ID here:
                          </label>
                          <input
                            type="text"
                            {...register('prohibitedDepartmentIds')}
                            placeholder="Enter prohibited Department IDs (comma-separated)"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <BusinessUnitSelect
                      businessUnitDescription={selectedBusinessUnit.name}
                      businessUnitValue={selectedBusinessUnit.code}
                      onBusinessUnitChange={handleBusinessUnitChange}
                      error={errors.homeBusinessUnit?.message}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Human Resources Components */}
              <div id="human-resources" className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead style={{ backgroundColor: '#003865' }}>
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Human Resources Components
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="bg-yellow-50">
                        <td colSpan={3} className="px-4 py-3 text-sm text-gray-700">
                          * Requires agency/dept. ID code(s)<br/>
                          ** Only assign to users with non-managerial job codes. No agency/dept. ID codes required. User ID for this role is the employee ID number.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Administer Training</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    {...register('hrDataEntry')}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">All-Correct</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    {...register('hrDataInquiry')}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Enroll-Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    {...register('hrSupervisor')}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">View only</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    {...register('hrDirector')}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Company Property Table Correct</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Emergency Contact</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    {...register('hrStatewide')}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Employment Data Update General Data</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Health & Safety</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Job Data*</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Correct*</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Update*</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Labor Relations</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Manage Competencies</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Personal Data*</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Correct*</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Update*</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Physical Exams</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Position Data</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Correct</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Position Funding</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Correct</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">View</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payroll Components */}
              <div id="payroll" className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead style={{ backgroundColor: '#003865' }}>
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Payroll Components
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="bg-yellow-50">
                        <td colSpan={3} className="px-4 py-3 text-sm text-gray-700">
                          * Requires agency/dept. ID code(s)<br/>
                          ** Only assign to users with non-managerial job codes. No agency/dept. ID codes required. User ID for this role is the employee ID number.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Payroll Data Entry</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    {...register('payrollDataEntry')}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Entry Access</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Payroll Inquiry</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    {...register('payrollDataInquiry')}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Inquiry Access</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Supervisor Access</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    {...register('payrollSupervisor')}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Supervisor Level</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Director Access</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    {...register('payrollDirector')}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Director Level</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Statewide Access</h4>
                              <div className="space-y-1 mt-1">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    {...register('payrollStatewide')}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Statewide Level</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Benefits Administration */}
              <div id="benefits" className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Benefits Administration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('benefitsAdministrator')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Benefits Administrator</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('benefitsInquiry')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Benefits Inquiry Only</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Position Management */}
              <div id="position" className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Position Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('positionControl')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Position Control</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('positionInquiry')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Position Inquiry Only</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Reporting */}
              <div id="reporting" className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Reporting</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('hrReporting')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">HR Reporting</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('payrollReporting')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Payroll Reporting</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Special Access */}
              <div id="special-access" className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Special Access</h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('confidentialEmployeeAccess')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Confidential Employee Access</span>
                    </label>
                    {confidentialEmployeeAccess && (
                      <div className="mt-2 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                        <div className="flex">
                          <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                              <strong>High Risk Role:</strong> This role provides access to confidential employee information and requires additional approval.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('workersCompAccess')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Workers' Compensation Access</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Role Justification */}
              <div id="justification" className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Role Justification</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Please provide justification for the selected HR/Payroll roles <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('roleJustification', { required: 'Role justification is required' })}
                    rows={4}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Explain why these specific HR/Payroll roles are needed for this user's job responsibilities..."
                  />
                  {errors.roleJustification && (
                    <p className="mt-1 text-sm text-red-600">{errors.roleJustification.message}</p>
                  )}
                </div>
              </div>

              {/* High Risk Warning */}
              {hasHighRiskRoles && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        High Risk Roles Selected
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          You have selected roles that provide elevated access to sensitive HR/Payroll data. 
                          These selections will require additional review and approval from HR leadership.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Supervisor Approval */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Shield className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Supervisor Approval Required
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        HR and Payroll access requires explicit supervisor approval due to the sensitive nature of the data.
                      </p>
                      <div className="mt-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('supervisorApproval', { required: 'Supervisor approval acknowledgment is required' })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm font-medium text-blue-800">
                            I acknowledge that my supervisor has approved this HR/Payroll access request
                          </span>
                        </label>
                        {errors.supervisorApproval && (
                          <p className="mt-1 text-sm text-red-600">{errors.supervisorApproval.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving || !hasSelectedRoles}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save HR/Payroll Roles
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HrPayrollRoleSelectionPage;