import React from 'react';
import { Check, Database, FileText, Users, Shield, AlertTriangle } from 'lucide-react';

interface UserRoleDetailsProps {
  userDetails: any;
  roleSelections: any;
}

function UserRoleDetails({ userDetails, roleSelections }: UserRoleDetailsProps) {
  if (!userDetails) return null;

  console.log('UserRoleDetails received userDetails:', userDetails);
  console.log('UserRoleDetails received roleSelections:', roleSelections);

  // Security area type labels
  const securityAreaLabels: Record<string, string> = {
    'accounting_procurement': 'Accounting / Procurement',
    'hr_payroll': 'HR / Payroll', 
    'epm_data_warehouse': 'EPM / Data Warehouse',
    'elm': 'ELM'
  };

  // Function to convert camelCase or snake_case to readable text
  const formatFieldName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Get all boolean fields that are true
  const getActiveBooleanRoles = () => {
    if (!roleSelections) {
      console.log('No role selections found');
      return [];
    }
    
    console.log('Processing role selections:', roleSelections);
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

  const activeBooleanRoles = getActiveBooleanRoles();
  const stringFieldValues = getStringFieldValues();
  console.log('Active boolean roles:', activeBooleanRoles);

  return (
    <div className="space-y-6">
      {/* Security Areas */}
      {userDetails.security_areas && userDetails.security_areas.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-medium text-blue-800 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Areas
          </h3>
          <div className="mt-3 space-y-3">
            {userDetails.security_areas.map((area: any, index: number) => (
              <div key={index} className="bg-white p-3 rounded border">
                <div className="flex items-center mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {securityAreaLabels[area.area_type] || area.area_type}
                  </span>
                </div>
                {area.director_name && (
                  <div className="text-sm">
                    <span className="text-gray-600">Director:</span>
                    <span className="ml-1 font-medium">{area.director_name}</span>
                    {area.director_email && (
                      <span className="ml-2 text-gray-500">({area.director_email})</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Selections */}
      {roleSelections ? (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-lg font-medium text-green-800 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Role Selections
          </h3>
          
          {activeBooleanRoles.length > 0 ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-600 mb-2">Active Roles:</p>
              <div className="flex flex-wrap gap-2">
                {activeBooleanRoles.map((role) => (
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
          ) : (
            <p className="mt-2 text-sm text-gray-600">No active boolean roles found.</p>
          )}

          {stringFieldValues.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Additional Settings:</p>
              <div className="grid grid-cols-2 gap-2">
                {stringFieldValues.map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-gray-500">{formatFieldName(key)}:</p>
                    <p className="text-sm font-medium">{value as string}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No Role Selections Found
              </h3>
              <p className="mt-2 text-sm text-yellow-700">
                This user doesn't have any specific role selections defined in the system.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Business Unit Information */}
      {roleSelections?.home_business_unit && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-lg font-medium text-purple-800 flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Business Unit Information
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-600">Home Business Unit:</p>
            <p className="text-sm font-medium">{roleSelections.home_business_unit}</p>
            
            {roleSelections.other_business_units && (
              <>
                <p className="text-sm text-gray-600 mt-2">Other Business Units:</p>
                <p className="text-sm font-medium">{roleSelections.other_business_units}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Justification */}
      {roleSelections?.role_justification && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-medium text-yellow-800 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Role Justification
          </h3>
          <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
            {roleSelections.role_justification}
          </p>
        </div>
      )}
    </div>
  );
}

export default UserRoleDetails;