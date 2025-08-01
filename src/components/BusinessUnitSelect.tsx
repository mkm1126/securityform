import React from 'react';
import { businessUnits, findBusinessUnitByDescription } from '../lib/businessUnitData';
import SearchableSelect from './SearchableSelect';

interface BusinessUnitSelectProps {
  businessUnitDescription: string;
  businessUnitValue: string;
  onBusinessUnitChange: (description: string, value: string) => void;
  error?: string;
  required?: boolean;
}

function BusinessUnitSelect({ 
  businessUnitDescription, 
  businessUnitValue, 
  onBusinessUnitChange, 
  error, 
  required = false 
}: BusinessUnitSelectProps) {
  const handleBusinessUnitChange = (selectedDescription: string) => {
    const businessUnit = findBusinessUnitByDescription(selectedDescription);
    
    if (businessUnit) {
      onBusinessUnitChange(businessUnit.description, businessUnit.businessUnit);
    } else {
      onBusinessUnitChange(selectedDescription, '');
    }
  };

  // Convert business units to options format for SearchableSelect
  const businessUnitOptions = businessUnits.map(unit => ({
    value: unit.description,
    label: unit.description
  }));

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <SearchableSelect
          options={businessUnitOptions}
          value={businessUnitDescription}
          onChange={handleBusinessUnitChange}
          placeholder="Search business units..."
          label="Home Business Unit"
          required={required}
          error={error}
          searchPlaceholder="Search business units..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Home Business Unit Code
        </label>
        <input
          type="text"
          value={businessUnitValue}
          readOnly
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
          placeholder="Business unit code will appear here"
        />
      </div>
    </div>
  );
}

export default BusinessUnitSelect;