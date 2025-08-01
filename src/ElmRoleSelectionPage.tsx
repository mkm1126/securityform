import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, AlertTriangle, BookOpen, Users, Shield, Settings, BarChart3, UserCheck, GraduationCap, Database } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';
import Header from './components/Header';

interface ElmRoleSelection {
  // 8 Main ELM Roles
  learningAdministrator: boolean;
  learningCatalogAdministrator: boolean;
  rosterAdministrator: boolean;
  enrollmentAdministrator: boolean;
  maintainApprovals: boolean;
  profileAdministrator: boolean;
  externalLearnerSecurityAdministrator: boolean;
  sandboxAccess: boolean;
  
  // Justification
  roleJustification: string;
  supervisorApproval: boolean;
}

const elmRoles = [
  {
    id: 'learningAdministrator',
    title: 'Learning Administrator',
    description: 'As a lead administrator for your agency, you will request this role. This has expanded menu options in the Enterprise Learning Folder.',
    icon: Shield,
    isHighRisk: true
  },
  {
    id: 'learningCatalogAdministrator',
    title: 'Learning Catalog Administrator',
    description: 'This role provides access to create and manage Learner Groups, create and maintain catalog functions; Manage Programs, Manage Courses, and Manage Classes.',
    icon: BookOpen,
    isHighRisk: false
  },
  {
    id: 'rosterAdministrator',
    title: 'Roster Administrator',
    description: 'This role will allow you to review and administer both Class and Program rosters in the Learner Tasks folder. You will also have the ability to create Ad Hoc announcements in the Notifications folder. This role also give you access to run both delivered and custom ELM reports.',
    icon: Users,
    isHighRisk: false
  },
  {
    id: 'enrollmentAdministrator',
    title: 'Enrollment Administrator',
    description: 'This role provides you with the menus to enroll learners in a class. Learners can be enrolled from the Enroll menu as well as directly from the rosters. You will also have access to maintain learning requests and add supplemental learning for your agency\'s learners. Monitoring and maintaining approvals are also part of the role.',
    icon: UserCheck,
    isHighRisk: false
  },
  {
    id: 'maintainApprovals',
    title: 'Maintain Approvals',
    description: 'This role is generally assigned to Agency Training Coordinators. You will have access to the Learner Task folder to monitor and maintain approvals.',
    icon: Settings,
    isHighRisk: false
  },
  {
    id: 'profileAdministrator',
    title: 'Profile Administrator',
    description: 'This role provides access to the User Profiles and Organization folders. You will be able to review internal learners\' profiles, and review and add External learner profiles. You will also have the ability to review reporting relationships in your agency.',
    icon: Users,
    isHighRisk: false
  },
  {
    id: 'externalLearnerSecurityAdministrator',
    title: 'External Learner Security Administrator',
    description: 'This role, combined with the External Learner Security role, provides you the ability to create external learners. (M_HR_External_Learner_Security and M_LMLELM_External_Learning_Adm)',
    icon: Shield,
    isHighRisk: true
  },
  {
    id: 'sandboxAccess',
    title: 'Sandbox Access',
    description: 'If this box is checked, the person will need same security roles in ELM92UQ in addition to ELM92AP. (M_ELM_TRAINING_LINK)',
    icon: Database,
    isHighRisk: false,
    specialNote: 'Note: If this box is checked, the person will need same security roles in ELM92UQ in addition to ELM92AP.'
  }
];

function ElmRoleSelectionPage() {
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
  } = useForm<ElmRoleSelection>();

  // Watch for role selections to show warnings
  const selectedRoles = watch();
  const supervisorApproval = watch('supervisorApproval');
  const sandboxAccess = watch('sandboxAccess');

  // Check if any high-risk roles are selected
  const hasHighRiskRoles = elmRoles
    .filter(role => role.isHighRisk)
    .some(role => selectedRoles?.[role.id as keyof ElmRoleSelection]);

  // Check if any roles are selected
  const hasSelectedRoles = elmRoles.some(role => selectedRoles?.[role.id as keyof ElmRoleSelection]);

  useEffect(() => {
    // Try to get requestId from location state
    const stateRequestId = location.state?.requestId;
    if (stateRequestId) {
      setRequestId(stateRequestId);
      fetchRequestDetails(stateRequestId);
    } else {
      // If no requestId, redirect back to main form
      toast.error('Please complete the main form first before selecting ELM roles.');
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

  const onSubmit = async (data: ElmRoleSelection) => {
    if (!supervisorApproval) {
      toast.error('Supervisor approval acknowledgment is required for ELM administrative access.');
      return;
    }

    if (!hasSelectedRoles) {
      toast.error('Please select at least one ELM role.');
      return;
    }

    if (!requestId) {
      toast.error('No request found. Please start from the main form.');
      navigate('/');
      return;
    }

    setSaving(true);

    try {
      // Store ELM role selections - mapping to database fields
      const elmRoleData = {
        request_id: requestId,
        home_business_unit: requestDetails?.agency_code?.padEnd(5, '0') || '00000', // Use agency code from request
        
        // Map the 8 ELM roles to existing database fields
        elm_system_administrator: data.learningAdministrator || false,
        elm_key_administrator: data.externalLearnerSecurityAdministrator || false,
        elm_course_administrator: data.learningCatalogAdministrator || false,
        elm_reporting_administrator: data.rosterAdministrator || false,
        
        // Use existing fields for other roles
        manage_user_accounts: data.profileAdministrator || false,
        assign_user_roles: data.enrollmentAdministrator || false,
        view_user_progress: data.maintainApprovals || false,
        system_backup_access: data.sandboxAccess || false,
        
        role_justification: data.roleJustification
      };

      // Update or insert ELM role selections with explicit conflict resolution
      const { error } = await supabase
        .from('security_role_selections')
        .upsert(elmRoleData, { onConflict: 'request_id' });

      if (error) throw error;

      toast.success('ELM role selections saved successfully!');
      navigate('/success', { state: { requestId } });

    } catch (error) {
      console.error('Error saving ELM role selections:', error);
      toast.error('Failed to save ELM role selections. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Enterprise Learning Management (ELM) Role Selection"
        subtitle="Select specific administrative roles and permissions for ELM access"
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
                <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Enterprise Learning Management (ELM) Role Selection
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Select specific administrative roles and permissions for ELM access
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
              {/* Descriptions Header */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Descriptions of the Enterprise Learning Management Roles
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        The definitions provided below will help determine the Administrative access that you will allow in your agencies. 
                        The Administrative roles do need to be specifically requested.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ELM Roles Selection */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">ELM Administrative Roles</h3>
                <p className="text-sm text-gray-600">
                  Select the ELM roles that match your job responsibilities. Each role provides specific permissions and access levels.
                </p>
                
                <div className="grid grid-cols-1 gap-6">
                  {elmRoles.map((role) => {
                    const IconComponent = role.icon;
                    return (
                      <div
                        key={role.id}
                        className={`border rounded-lg p-4 ${
                          selectedRoles?.[role.id as keyof ElmRoleSelection]
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              type="checkbox"
                              {...register(role.id as keyof ElmRoleSelection)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center">
                              <IconComponent className={`h-5 w-5 mr-2 ${role.isHighRisk ? 'text-red-600' : 'text-blue-600'}`} />
                              <label className="text-sm font-medium text-gray-900">
                                {role.title}
                                {role.isHighRisk && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    High-Level Access
                                  </span>
                                )}
                              </label>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                              {role.description}
                            </p>
                            {role.specialNote && (
                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-xs text-yellow-800">
                                  <strong>Important:</strong> {role.specialNote}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasHighRiskRoles && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          High-Level Access Selected
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>
                            You have selected roles that provide extensive access to ELM. 
                            Additional security review and approval may be required. Please ensure 
                            these roles are necessary for your job responsibilities.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {sandboxAccess && (
                  <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-orange-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-orange-800">
                          Sandbox Access Selected
                        </h3>
                        <div className="mt-2 text-sm text-orange-700">
                          <p>
                            <strong>Important:</strong> Since you selected Sandbox Access, you will need the same 
                            security roles in both ELM92UQ and ELM92AP environments. This will be configured 
                            during the approval process.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                      required: 'Please provide justification for the requested ELM roles' 
                    })}
                    rows={4}
                    placeholder="Please explain why these ELM administrative roles are necessary for your job responsibilities. Include specific tasks, responsibilities, and how these roles will be used..."
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
                      I acknowledge that supervisor approval is required for these ELM administrative roles 
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
                  disabled={saving || !hasSelectedRoles}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    saving || !hasSelectedRoles
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Submit ELM Role Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ElmRoleSelectionPage;