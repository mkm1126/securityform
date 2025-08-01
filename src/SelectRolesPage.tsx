import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, DollarSign } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';
import Header from './components/Header';
import BusinessUnitSelect from './components/BusinessUnitSelect';

interface SecurityRoleSelection {
  // Business Unit Details
  homeBusinessUnit: string;
  homeBusinessUnitDescription: string;
  otherBusinessUnits: string;
  
  // Role Justification
  roleJustification: string;

  // Accounts Payable
  voucherEntry: boolean;
  voucherApprover1: string;
  voucherApprover2: string;
  voucherApprover3: string;
  maintenanceVoucherBuildErrors: boolean;
  matchOverride: boolean;
  apInquiryOnly: boolean;

  // Accounts Receivable and Cash Management
  cashMaintenance: boolean;
  receivableSpecialist: boolean;
  receivableSupervisor: boolean;
  writeoffApprovalBusinessUnits: string;
  billingCreate: boolean;
  billingSpecialist: boolean;
  billingSupervisor: boolean;
  creditInvoiceApprovalBusinessUnits: string;
  customerMaintenanceSpecialist: boolean;
  arBillingSetup: boolean;
  arBillingInquiryOnly: boolean;
  cashManagementInquiryOnly: boolean;

  // Budgets/Commitment Control & Appropriation Maintenance
  budgetJournalEntryOnline: boolean;
  budgetJournalLoad: boolean;
  journalApprover: boolean;
  appropriationSources: string;
  expenseBudgetSource: string;
  revenueBudgetSource: string;
  budgetTransferEntryOnline: boolean;
  transferApprover: boolean;
  transferAppropriationSources: string;
  budgetInquiryOnly: boolean;

  // General Ledger and NVISION Reporting
  journalEntryOnline: boolean;
  journalLoad: boolean;
  agencyChartfieldMaintenance: boolean;
  glAgencyApprover: boolean;
  glAgencyApproverSources: string;
  generalLedgerInquiryOnly: boolean;
  nvisionReportingAgencyUser: boolean;
  needsDailyReceiptsReport: boolean;

  // Grants
  awardDataEntry: boolean;
  grantFiscalManager: boolean;
  programManager: boolean;
  gmAgencySetup: boolean;
  grantsInquiryOnly: boolean;

  // Project Costing
  federalProjectInitiator: boolean;
  oimInitiator: boolean;
  projectInitiator: boolean;
  projectManager: boolean;
  capitalProgramsOffice: boolean;
  projectCostAccountant: boolean;
  projectFixedAsset: boolean;
  categorySubcategoryManager: boolean;
  projectControlDates: boolean;
  projectAccountingSystems: boolean;
  mndotProjectsInquiry: boolean;
  projectsInquiryOnly: boolean;
  mndotProjectApprover: boolean;
  routeControl: string;

  // Cost Allocation
  costAllocationInquiryOnly: boolean;

  // Asset Management
  financialAccountantAssets: boolean;
  assetManagementInquiryOnly: boolean;
  physicalInventoryApproval1: boolean;
  physicalInventoryBusinessUnits: string;
  physicalInventoryApproval2: boolean;
  physicalInventoryDepartmentIds: string;
}

function SelectRolesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SecurityRoleSelection>();

  // Watch for role selections to show warnings
  const selectedRoles = watch();

  // Check if any roles are selected
  const hasSelectedRoles = Object.values(selectedRoles || {}).some(value => 
    typeof value === 'boolean' ? value : (typeof value === 'string' && value.trim() !== '')
  );

  const handleBusinessUnitChange = (description: string, value: string) => {
    setValue('homeBusinessUnitDescription', description);
    setValue('homeBusinessUnit', value);
  };
  useEffect(() => {
    // Try to get requestId from location state
    const stateRequestId = location.state?.requestId;
    if (stateRequestId) {
      setRequestId(stateRequestId);
      fetchRequestDetails(stateRequestId);
      fetchExistingRoleSelections(stateRequestId);
    } else {
      // If no requestId, redirect back to main form
      toast.error('Please complete the main form first before selecting roles.');
      navigate('/');
    }
  }, [location.state, navigate]);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingRoleSelections = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('security_role_selections')
        .select('*')
        .eq('request_id', id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Pre-populate form with existing selections
        setValue('homeBusinessUnitDescription', ''); // We don't store description, so leave empty
        setValue('homeBusinessUnit', data.home_business_unit || '');
        setValue('otherBusinessUnits', data.other_business_units || '');
        setValue('roleJustification', data.role_justification || '');
        
        // Accounts Payable
        setValue('voucherEntry', data.voucher_entry || false);
        setValue('voucherApprover1', data.voucher_approver_1 || '');
        setValue('voucherApprover2', data.voucher_approver_2 || '');
        setValue('voucherApprover3', data.voucher_approver_3 || '');
        setValue('maintenanceVoucherBuildErrors', data.maintenance_voucher_build_errors || false);
        setValue('matchOverride', data.match_override || false);
        setValue('apInquiryOnly', data.ap_inquiry_only || false);

        // Accounts Receivable and Cash Management
        setValue('cashMaintenance', data.cash_maintenance || false);
        setValue('receivableSpecialist', data.receivable_specialist || false);
        setValue('receivableSupervisor', data.receivable_supervisor || false);
        setValue('writeoffApprovalBusinessUnits', data.writeoff_approval_business_units || '');
        setValue('billingCreate', data.billing_create || false);
        setValue('billingSpecialist', data.billing_specialist || false);
        setValue('billingSupervisor', data.billing_supervisor || false);
        setValue('creditInvoiceApprovalBusinessUnits', data.credit_invoice_approval_business_units || '');
        setValue('customerMaintenanceSpecialist', data.customer_maintenance_specialist || false);
        setValue('arBillingSetup', data.ar_billing_setup || false);
        setValue('arBillingInquiryOnly', data.ar_billing_inquiry_only || false);
        setValue('cashManagementInquiryOnly', data.cash_management_inquiry_only || false);

        // Budgets/Commitment Control & Appropriation Maintenance
        setValue('budgetJournalEntryOnline', data.budget_journal_entry_online || false);
        setValue('budgetJournalLoad', data.budget_journal_load || false);
        setValue('journalApprover', data.journal_approver || false);
        setValue('appropriationSources', data.appropriation_sources || '');
        setValue('expenseBudgetSource', data.expense_budget_source || '');
        setValue('revenueBudgetSource', data.revenue_budget_source || '');
        setValue('budgetTransferEntryOnline', data.budget_transfer_entry_online || false);
        setValue('transferApprover', data.transfer_approver || false);
        setValue('transferAppropriationSources', data.transfer_appropriation_sources || '');
        setValue('budgetInquiryOnly', data.budget_inquiry_only || false);

        // General Ledger and NVISION Reporting
        setValue('journalEntryOnline', data.journal_entry_online || false);
        setValue('journalLoad', data.journal_load || false);
        setValue('agencyChartfieldMaintenance', data.agency_chartfield_maintenance || false);
        setValue('glAgencyApprover', data.gl_agency_approver || false);
        setValue('glAgencyApproverSources', data.gl_agency_approver_sources || '');
        setValue('generalLedgerInquiryOnly', data.general_ledger_inquiry_only || false);
        setValue('nvisionReportingAgencyUser', data.nvision_reporting_agency_user || false);
        setValue('needsDailyReceiptsReport', data.needs_daily_receipts_report || false);

        // Grants
        setValue('awardDataEntry', data.award_data_entry || false);
        setValue('grantFiscalManager', data.grant_fiscal_manager || false);
        setValue('programManager', data.program_manager || false);
        setValue('gmAgencySetup', data.gm_agency_setup || false);
        setValue('grantsInquiryOnly', data.grants_inquiry_only || false);

        // Project Costing
        setValue('federalProjectInitiator', data.federal_project_initiator || false);
        setValue('oimInitiator', data.oim_initiator || false);
        setValue('projectInitiator', data.project_initiator || false);
        setValue('projectManager', data.project_manager || false);
        setValue('capitalProgramsOffice', data.capital_programs_office || false);
        setValue('projectCostAccountant', data.project_cost_accountant || false);
        setValue('projectFixedAsset', data.project_fixed_asset || false);
        setValue('categorySubcategoryManager', data.category_subcategory_manager || false);
        setValue('projectControlDates', data.project_control_dates || false);
        setValue('projectAccountingSystems', data.project_accounting_systems || false);
        setValue('mndotProjectsInquiry', data.mndot_projects_inquiry || false);
        setValue('projectsInquiryOnly', data.projects_inquiry_only || false);
        setValue('mndotProjectApprover', data.mndot_project_approver || false);
        setValue('routeControl', data.route_control || '');

        // Cost Allocation
        setValue('costAllocationInquiryOnly', data.cost_allocation_inquiry_only || false);

        // Asset Management
        setValue('financialAccountantAssets', data.financial_accountant_assets || false);
        setValue('assetManagementInquiryOnly', data.asset_management_inquiry_only || false);
        setValue('physicalInventoryApproval1', data.physical_inventory_approval_1 || false);
        setValue('physicalInventoryBusinessUnits', data.physical_inventory_business_units || '');
        setValue('physicalInventoryApproval2', data.physical_inventory_approval_2 || false);
        setValue('physicalInventoryDepartmentIds', data.physical_inventory_department_ids || '');
      }
    } catch (error) {
      console.error('Error fetching existing role selections:', error);
      // Don't show error toast as this is optional data
    }
  };
  const onSubmit = async (data: SecurityRoleSelection) => {
    if (!hasSelectedRoles) {
      toast.error('Please select at least one role or permission.');
      return;
    }

    if (!requestId) {
      toast.error('No request found. Please start from the main form.');
      navigate('/');
      return;
    }

    setSaving(true);

    try {
      // Store role selections
      const roleData = {
        request_id: requestId,
        home_business_unit: data.homeBusinessUnit,
        other_business_units: data.otherBusinessUnits,
        
        // Accounts Payable
        voucher_entry: data.voucherEntry || false,
        voucher_approver_1: data.voucherApprover1 || null,
        voucher_approver_2: data.voucherApprover2 || null,
        voucher_approver_3: data.voucherApprover3 || null,
        maintenance_voucher_build_errors: data.maintenanceVoucherBuildErrors || false,
        match_override: data.matchOverride || false,
        ap_inquiry_only: data.apInquiryOnly || false,

        // Accounts Receivable and Cash Management
        cash_maintenance: data.cashMaintenance || false,
        receivable_specialist: data.receivableSpecialist || false,
        receivable_supervisor: data.receivableSupervisor || false,
        writeoff_approval_business_units: data.writeoffApprovalBusinessUnits || null,
        billing_create: data.billingCreate || false,
        billing_specialist: data.billingSpecialist || false,
        billing_supervisor: data.billingSupervisor || false,
        credit_invoice_approval_business_units: data.creditInvoiceApprovalBusinessUnits || null,
        customer_maintenance_specialist: data.customerMaintenanceSpecialist || false,
        ar_billing_setup: data.arBillingSetup || false,
        ar_billing_inquiry_only: data.arBillingInquiryOnly || false,
        cash_management_inquiry_only: data.cashManagementInquiryOnly || false,

        // Budgets/Commitment Control & Appropriation Maintenance
        budget_journal_entry_online: data.budgetJournalEntryOnline || false,
        budget_journal_load: data.budgetJournalLoad || false,
        journal_approver: data.journalApprover || false,
        appropriation_sources: data.appropriationSources || null,
        expense_budget_source: data.expenseBudgetSource || null,
        revenue_budget_source: data.revenueBudgetSource || null,
        budget_transfer_entry_online: data.budgetTransferEntryOnline || false,
        transfer_approver: data.transferApprover || false,
        transfer_appropriation_sources: data.transferAppropriationSources || null,
        budget_inquiry_only: data.budgetInquiryOnly || false,

        // General Ledger and NVISION Reporting
        journal_entry_online: data.journalEntryOnline || false,
        journal_load: data.journalLoad || false,
        agency_chartfield_maintenance: data.agencyChartfieldMaintenance || false,
        gl_agency_approver: data.glAgencyApprover || false,
        gl_agency_approver_sources: data.glAgencyApproverSources || null,
        general_ledger_inquiry_only: data.generalLedgerInquiryOnly || false,
        nvision_reporting_agency_user: data.nvisionReportingAgencyUser || false,
        needs_daily_receipts_report: data.needsDailyReceiptsReport || false,

        // Grants
        award_data_entry: data.awardDataEntry || false,
        grant_fiscal_manager: data.grantFiscalManager || false,
        program_manager: data.programManager || false,
        gm_agency_setup: data.gmAgencySetup || false,
        grants_inquiry_only: data.grantsInquiryOnly || false,

        // Project Costing
        federal_project_initiator: data.federalProjectInitiator || false,
        oim_initiator: data.oimInitiator || false,
        project_initiator: data.projectInitiator || false,
        project_manager: data.projectManager || false,
        capital_programs_office: data.capitalProgramsOffice || false,
        project_cost_accountant: data.projectCostAccountant || false,
        project_fixed_asset: data.projectFixedAsset || false,
        category_subcategory_manager: data.categorySubcategoryManager || false,
        project_control_dates: data.projectControlDates || false,
        project_accounting_systems: data.projectAccountingSystems || false,
        mndot_projects_inquiry: data.mndotProjectsInquiry || false,
        projects_inquiry_only: data.projectsInquiryOnly || false,
        mndot_project_approver: data.mndotProjectApprover || false,
        route_control: data.routeControl || null,

        // Cost Allocation
        cost_allocation_inquiry_only: data.costAllocationInquiryOnly || false,

        // Asset Management
        financial_accountant_assets: data.financialAccountantAssets || false,
        asset_management_inquiry_only: data.assetManagementInquiryOnly || false,
        physical_inventory_approval_1: data.physicalInventoryApproval1 || false,
        physical_inventory_business_units: data.physicalInventoryBusinessUnits || null,
        physical_inventory_approval_2: data.physicalInventoryApproval2 || false,
        physical_inventory_department_ids: data.physicalInventoryDepartmentIds || null,
        
        // Role Justification
        role_justification: data.roleJustification,
      };

      // Update or insert role selections with explicit conflict resolution
      const { error } = await supabase
        .from('security_role_selections')
        .upsert(roleData, { onConflict: 'request_id' });

      if (error) throw error;

      toast.success('Role selections saved successfully!');
      navigate('/success', { state: { requestId } });

    } catch (error) {
      console.error('Error saving role selections:', error);
      toast.error('Failed to save role selections. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          title="Accounting / Procurement Role Selection"
          subtitle="Select specific roles and permissions for accounting and procurement access"
        />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Accounting / Procurement Role Selection"
        subtitle="Select specific roles and permissions for accounting and procurement access"
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
                <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Accounting / Procurement Role Selection
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Select specific roles and permissions for accounting and procurement access
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
                
                <div className="space-y-6">
                  <div>
                    <BusinessUnitSelect
                      businessUnitDescription={watch('homeBusinessUnitDescription') || ''}
                      businessUnitValue={watch('homeBusinessUnit') || ''}
                      onBusinessUnitChange={handleBusinessUnitChange}
                      error={errors.homeBusinessUnit?.message}
                      required
                    />
                    {/* Hidden field to maintain form validation */}
                    <input
                      type="hidden"
                      {...register('homeBusinessUnit', { 
                        required: 'Home business unit is required' 
                      })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Other Business Units
                    </label>
                    <p className="text-sm text-gray-500 mb-2">
                      Enter additional business unit codes (comma-separated)
                    </p>
                    <input
                      type="text"
                      {...register('otherBusinessUnits')}
                      placeholder="e.g., G0201, H1201, T7901"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Accounts Payable */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Accounts Payable</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('voucherEntry')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">Voucher Entry</label>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Voucher Approver 1</label>
                      <input
                        type="text"
                        {...register('voucherApprover1')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Voucher Approver 2</label>
                      <input
                        type="text"
                        {...register('voucherApprover2')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Voucher Approver 3</label>
                      <input
                        type="text"
                        {...register('voucherApprover3')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('maintenanceVoucherBuildErrors')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Maintenance Voucher Build Errors</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('matchOverride')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Match Override</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('apInquiryOnly')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">AP Inquiry Only</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accounts Receivable and Cash Management */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Accounts Receivable and Cash Management</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('cashMaintenance')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Cash Maintenance</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('receivableSpecialist')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Receivable Specialist</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('receivableSupervisor')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Receivable Supervisor</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('billingCreate')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Billing Create</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('billingSpecialist')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Billing Specialist</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('billingSupervisor')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Billing Supervisor</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('customerMaintenanceSpecialist')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Customer Maintenance Specialist</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('arBillingSetup')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">AR Billing Setup</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('arBillingInquiryOnly')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">AR Billing Inquiry Only</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('cashManagementInquiryOnly')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Cash Management Inquiry Only</label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Writeoff Approval Business Units</label>
                      <input
                        type="text"
                        {...register('writeoffApprovalBusinessUnits')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Credit Invoice Approval Business Units</label>
                      <input
                        type="text"
                        {...register('creditInvoiceApprovalBusinessUnits')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Budgets/Commitment Control & Appropriation Maintenance */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Budgets/Commitment Control & Appropriation Maintenance</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('budgetJournalEntryOnline')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Budget Journal Entry Online</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('budgetJournalLoad')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Budget Journal Load</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('journalApprover')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Journal Approver</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('budgetTransferEntryOnline')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Budget Transfer Entry Online</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('transferApprover')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Transfer Approver</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('budgetInquiryOnly')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Budget Inquiry Only</label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Appropriation Sources</label>
                      <input
                        type="text"
                        {...register('appropriationSources')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expense Budget Source</label>
                      <input
                        type="text"
                        {...register('expenseBudgetSource')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Revenue Budget Source</label>
                      <input
                        type="text"
                        {...register('revenueBudgetSource')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Transfer Appropriation Sources</label>
                    <input
                      type="text"
                      {...register('transferAppropriationSources')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* General Ledger and NVISION Reporting */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">General Ledger and NVISION Reporting</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('journalEntryOnline')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Journal Entry Online</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('journalLoad')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Journal Load</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('agencyChartfieldMaintenance')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Agency Chartfield Maintenance</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('glAgencyApprover')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">GL Agency Approver</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('generalLedgerInquiryOnly')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">General Ledger Inquiry Only</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('nvisionReportingAgencyUser')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">NVISION Reporting Agency User</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('needsDailyReceiptsReport')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Needs Daily Receipts Report</label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">GL Agency Approver Sources</label>
                    <input
                      type="text"
                      {...register('glAgencyApproverSources')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Grants */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Grants</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('awardDataEntry')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">Award Data Entry</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('grantFiscalManager')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">Grant Fiscal Manager</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('programManager')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">Program Manager</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('gmAgencySetup')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">GM Agency Setup</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('grantsInquiryOnly')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">Grants Inquiry Only</label>
                  </div>
                </div>
              </div>

              {/* Project Costing */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Costing</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('federalProjectInitiator')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Federal Project Initiator</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('oimInitiator')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">OIM Initiator</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('projectInitiator')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Project Initiator</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('projectManager')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Project Manager</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('capitalProgramsOffice')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Capital Programs Office</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('projectCostAccountant')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Project Cost Accountant</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('projectFixedAsset')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Project Fixed Asset</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('categorySubcategoryManager')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Category Subcategory Manager</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('projectControlDates')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Project Control Dates</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('projectAccountingSystems')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Project Accounting Systems</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('mndotProjectsInquiry')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">MNDOT Projects Inquiry</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('projectsInquiryOnly')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Projects Inquiry Only</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('mndotProjectApprover')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">MNDOT Project Approver</label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Route Control</label>
                    <input
                      type="text"
                      {...register('routeControl')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Cost Allocation */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Allocation</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('costAllocationInquiryOnly')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">Cost Allocation Inquiry Only</label>
                </div>
              </div>

              {/* Asset Management */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Management</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('financialAccountantAssets')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Financial Accountant Assets</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('assetManagementInquiryOnly')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Asset Management Inquiry Only</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('physicalInventoryApproval1')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Physical Inventory Approval 1</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('physicalInventoryApproval2')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Physical Inventory Approval 2</label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Physical Inventory Business Units</label>
                      <input
                        type="text"
                        {...register('physicalInventoryBusinessUnits')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Physical Inventory Department IDs</label>
                      <input
                        type="text"
                        {...register('physicalInventoryDepartmentIds')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              {/* Role Justification */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Role Justification</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Please explain why these accounting/procurement roles are necessary for your job responsibilities*
                  </label>
                  <textarea
                    {...register('roleJustification', { 
                      required: 'Please provide justification for the requested roles' 
                    })}
                    rows={4}
                    placeholder="Please explain why these roles are necessary for your job responsibilities. Include specific tasks, responsibilities, and how these roles will be used..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.roleJustification && (
                    <p className="mt-1 text-sm text-red-600">{errors.roleJustification.message}</p>
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
                  {saving ? 'Saving...' : 'Submit Role Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectRolesPage;