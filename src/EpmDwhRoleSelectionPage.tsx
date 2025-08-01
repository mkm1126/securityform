import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, AlertTriangle, Database, BarChart3, Users, Shield, Settings } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';
import Header from './components/Header';

interface EpmDwhRoleSelection {
  // Business Unit Details
  homeBusinessUnit: string;
  otherBusinessUnits: string;
  
  // HR/Payroll Warehouse Roles
  ssnView: boolean;
  payrollDeductions: boolean;
  hrDataExcludedEmployees: boolean;
  
  // RAPS Roles
  biAuthor: boolean; // Pre-checked
  mEpmHcmLookup: boolean; // Pre-checked
  mRapsLink: boolean;
  rapsNewUser: boolean;
  rapsSema4Codes: string;
  
  // Justification
  roleJustification: string;
  supervisorApproval: boolean;
}

function EpmDwhRoleSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EpmDwhRoleSelection>({
    defaultValues: {
      biAuthor: true, // Pre-checked
      mEpmHcmLookup: true, // Pre-checked
      rapsNewUser: false,
      ssnView: false,
      payrollDeductions: false,
      hrDataExcludedEmployees: false,
      mRapsLink: false,
      supervisorApproval: false
    }
  });

  // Watch for role selections
  const selectedRoles = watch();
  const supervisorApproval = watch('supervisorApproval');
  const rapsNewUser = watch('rapsNewUser');

  // Check if any roles are selected (excluding pre-checked ones)
  const hasSelectedRoles = selectedRoles?.ssnView || selectedRoles?.payrollDeductions || 
                          selectedRoles?.hrDataExcludedEmployees || selectedRoles?.mRapsLink;

  useEffect(() => {
    // Try to get requestId from location state
    const stateRequestId = location.state?.requestId;
    if (stateRequestId) {
      setRequestId(stateRequestId);
      fetchRequestDetails(stateRequestId);
    } else {
      // If no requestId, redirect back to main form
      toast.error('Please complete the main form first before selecting EPM Data Warehouse roles.');
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

  const onSubmit = async (data: EpmDwhRoleSelection) => {
    if (!supervisorApproval) {
      toast.error('Supervisor approval acknowledgment is required for EPM Data Warehouse access.');
      return;
    }

    if (!requestId) {
      toast.error('No request found. Please start from the main form.');
      navigate('/');
      return;
    }

    setSaving(true);

    try {
      // Store EPM DWH role selections - mapping to database fields
      const epmDwhRoleData = {
        request_id: requestId,
        home_business_unit: (data.homeBusinessUnit || requestDetails?.agency_code || '000').padEnd(5, '0').substring(0, 5),
        other_business_units: data.otherBusinessUnits || null,
        
        // Map HR/Payroll Warehouse roles to available fields
        view_user_progress: data.ssnView || false,
        generate_user_reports: data.payrollDeductions || false,
        access_system_reports: data.hrDataExcludedEmployees || false,
        
        // Map RAPS roles to available fields
        create_custom_reports: data.biAuthor || false,
        export_report_data: data.mEpmHcmLookup || false,
        view_analytics_dashboard: data.mRapsLink || false,
        data_import_export: data.rapsNewUser || false,
        
        role_justification: data.roleJustification
      };

      // Update or insert EPM DWH role selections with explicit conflict resolution
      const { error } = await supabase
        .from('security_role_selections')
        .upsert(epmDwhRoleData, { onConflict: 'request_id' });

      if (error) throw error;

      toast.success('EPM Data Warehouse role selections saved successfully!');
      navigate('/success', { state: { requestId } });

    } catch (error) {
      console.error('Error saving EPM DWH role selections:', error);
      toast.error('Failed to save EPM Data Warehouse role selections. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="EPM Data Warehouse Role Selection"
        subtitle="Select specific roles and permissions for EPM Data Warehouse access"
      />
      
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
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
                <Database className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    EPM Data Warehouse Role Selection
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Select specific roles and permissions for EPM Data Warehouse access
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
              {/* Business Unit Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Business Unit Information</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Home Business Unit*
                    </label>
                    <input
                      type="text"
                      {...register('homeBusinessUnit', { 
                        required: 'Home business unit is required' 
                      })}
                      placeholder="Enter 5-character business unit code"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.homeBusinessUnit && (
                      <p className="mt-1 text-sm text-red-600">{errors.homeBusinessUnit.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Other Business Units
                    </label>
                    <input
                      type="text"
                      {...register('otherBusinessUnits')}
                      placeholder="Enter additional business unit codes (comma-separated)"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* HR/Payroll Warehouse Roles Table */}
              <div className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-green-600">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          RESTRICTED HR/PAYROLL WAREHOUSE ROLES (DATA COMES FROM SEMA4)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          Because of the risks involved and the sensitive nature of the information, access to SSN, Payroll Deductions, and excluded employee data is strictly limited. Payroll Deductions information can disclose private benefit and tax data. Excluded employees are undercover law enforcement officers and others for whom all employment information is—by law—confidential. The role is applicable only to users in the very small number of agencies that have such employees. When requesting one of these roles, the Human Resources Director of the agency must attach a written statement explaining why the role is essential to the user's job duties. The statement must also indicate why warehouse reporting is necessary (i.e., why access to individual records in SEMA4 is insufficient and the user requires broad warehouse reporting across many or all agency employees) and—in the case of SSN—why identification of employees by name and employee ID cannot meet the user's needs.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4">
                          <div className="grid grid-cols-3 gap-6">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('ssnView')}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">SSN View</span>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('payrollDeductions')}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Payroll Deductions</span>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('hrDataExcludedEmployees')}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">HR Data for Excluded Employees</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RAPS Table */}
              <div className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-green-600">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          REPORTING AND PLANNING SYSTEM (RAPS; DATA COMES FROM SEMA4 VIA DATA WAREHOUSE)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          RAPS provides audit reports that help agencies verify the HR data entered into SEMA4 during a selected range of action dates.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('biAuthor')}
                              disabled
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-700">BI Author (required for all RAPS users)</span>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Pre-selected
                            </span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('mEpmHcmLookup')}
                              disabled
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-700">M_EPM_HCM_LOOKUP (required for all RAPS users)</span>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Pre-selected
                            </span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('mRapsLink')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">M_RAPS_LINK (includes private data)</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 space-y-3">
                          <div className="text-sm text-gray-700">
                            Check here if new user to enter needed SEMA4 agency or department code(s)
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('rapsNewUser')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">New user</span>
                          </div>
                          {rapsNewUser && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700">
                                Enter the needed SEMA4 agency or department code(s)*
                              </label>
                              <input
                                type="text"
                                {...register('rapsSema4Codes', { 
                                  required: rapsNewUser ? 'SEMA4 agency or department codes are required for new users' : false 
                                })}
                                placeholder="Enter codes separated by commas if multiple"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                Enter multiple codes separated by commas if needed
                              </p>
                              {errors.rapsSema4Codes && (
                                <p className="mt-1 text-sm text-red-600">{errors.rapsSema4Codes.message}</p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Justification */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Justification</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role Justification*
                  </label>
                  <textarea
                    {...register('roleJustification', { 
                      required: 'Please provide justification for the requested EPM Data Warehouse roles' 
                    })}
                    rows={4}
                    placeholder="Please explain why these EPM Data Warehouse roles are necessary for your job responsibilities. Include specific tasks, responsibilities, and how these roles will be used..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.roleJustification && (
                    <p className="mt-1 text-sm text-red-600">{errors.roleJustification.message}</p>
                  )}
                </div>
              </div>

              {/* Supervisor Approval */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Approval Acknowledgment</h3>
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      {...register('supervisorApproval', { 
                        required: 'Supervisor approval acknowledgment is required' 
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      I acknowledge that supervisor approval is required for these EPM Data Warehouse roles 
                      and that my supervisor will be contacted to approve this request.
                    </span>
                  </label>
                  {errors.supervisorApproval && (
                    <p className="mt-1 text-sm text-red-600">{errors.supervisorApproval.message}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    saving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Submit EPM Data Warehouse Role Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EpmDwhRoleSelectionPage;