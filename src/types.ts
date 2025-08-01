export interface SecurityRoleRequest {
  // Employee Details
  startDate: string;
  employeeName: string;
  employeeId?: string;
  isNonEmployee: boolean;
  workLocation?: string;
  workPhone?: string;
  email: string;
  agencyName: string;
  agencyCode: string;
  justification?: string;

  // Submitter Details
  submitterName: string;
  submitterEmail: string;

  // Approver Details
  supervisorName: string;
  supervisorUsername: string;
  securityAdminName: string;
  securityAdminUsername: string;

  // Security Details - Changed to single selection
  securityArea: 'accounting_procurement' | 'hr_payroll' | 'epm_data_warehouse' | 'elm';
  
  // Accounting/Procurement fields
  accountingDirector?: string;
  accountingDirectorUsername?: string;
  
  // HR/Payroll fields
  hrMainframeLogonId?: string;
  hrViewStatewide?: boolean;
  
  // ELM fields
  elmKeyAdmin?: string;
  elmKeyAdminUsername?: string;

  // Copy User Details
  copyFromUser: boolean;
  copyUserName?: string;
  copyUserEmployeeId?: string;
  copyUserSema4Id?: string;

  // Non-Employee fields
  nonEmployeeType?: string;
  accessEndDate?: string;
  securityMeasures?: string;
}

export interface SecurityRoleSelection {
  // Business Unit Details
  homeBusinessUnit: string;
  otherBusinessUnits?: string;

  // Accounts Payable
  voucherEntry: boolean;
  voucherApprover1?: string;
  voucherApprover2?: string;
  voucherApprover3?: string;
  maintenanceVoucherBuildErrors: boolean;
  matchOverride: boolean;
  apInquiryOnly: boolean;

  // Accounts Receivable and Cash Management
  cashMaintenance: boolean;
  receivableSpecialist: boolean;
  receivableSupervisor: boolean;
  writeoffApprovalBusinessUnits?: string;
  billingCreate: boolean;
  billingSpecialist: boolean;
  billingSupervisor: boolean;
  creditInvoiceApprovalBusinessUnits?: string;
  customerMaintenanceSpecialist: boolean;
  arBillingSetup: boolean;
  arBillingInquiryOnly: boolean;
  cashManagementInquiryOnly: boolean;

  // Budgets/Commitment Control & Appropriation Maintenance
  budgetJournalEntryOnline: boolean;
  budgetJournalLoad: boolean;
  journalApprover: boolean;
  appropriationSources?: string;
  expenseBudgetSource?: string;
  revenueBudgetSource?: string;
  budgetTransferEntryOnline: boolean;
  transferApprover: boolean;
  transferAppropriationSources?: string;
  budgetInquiryOnly: boolean;

  // General Ledger and NVISION Reporting
  journalEntryOnline: boolean;
  journalLoad: boolean;
  agencyChartfieldMaintenance: boolean;
  glAgencyApprover: boolean;
  glAgencyApproverSources?: string;
  generalLedgerInquiryOnly: boolean;
  nvisionReportingAgencyUser: boolean;
  needsDailyReceiptsReport?: boolean;

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
  routeControl?: string;

  // Cost Allocation
  costAllocationInquiryOnly: boolean;

  // Asset Management
  financialAccountantAssets: boolean;
  assetManagementInquiryOnly: boolean;
  physicalInventoryApproval1: boolean;
  physicalInventoryBusinessUnits?: string;
  physicalInventoryApproval2: boolean;
  physicalInventoryDepartmentIds?: string;
}