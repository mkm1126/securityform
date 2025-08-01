import React, { useState } from 'react';
import { 
  agencies, 
  healthLicensingBoards, 
  smartAgencies,
  findAgencyByName, 
  findHealthLicensingBoardByName,
  findSmartAgencyByName 
} from '../lib/agencyData';
import SearchableSelect from './SearchableSelect';

interface AgencySelectProps {
  value: string;
  onChange: (agencyName: string, agencyCode: string) => void;
  error?: string;
  required?: boolean;
}

function AgencySelect({ value, onChange, error, required = false }: AgencySelectProps) {
  const [showHealthBoards, setShowHealthBoards] = useState(false);
  const [showSmartAgencies, setShowSmartAgencies] = useState(false);
  const [selectedHealthBoard, setSelectedHealthBoard] = useState('');
  const [selectedSmartAgency, setSelectedSmartAgency] = useState('');

  const handleAgencyChange = (selectedAgencyName: string) => {
    if (selectedAgencyName === 'Health Licensing Boards') {
      setShowHealthBoards(true);
      setShowSmartAgencies(false);
      setSelectedHealthBoard('');
      setSelectedSmartAgency('');
      // Don't set the agency code yet, wait for health board selection
      onChange(selectedAgencyName, '');
    } else if (selectedAgencyName === 'SMART') {
      setShowSmartAgencies(true);
      setShowHealthBoards(false);
      setSelectedHealthBoard('');
      setSelectedSmartAgency('');
      // Don't set the agency code yet, wait for SMART agency selection
      onChange(selectedAgencyName, '');
    } else {
      setShowHealthBoards(false);
      setShowSmartAgencies(false);
      setSelectedHealthBoard('');
      setSelectedSmartAgency('');
      const agency = findAgencyByName(selectedAgencyName);
      
      if (agency) {
        onChange(agency.name, agency.code);
      } else {
        onChange(selectedAgencyName, '');
      }
    }
  };

  const handleHealthBoardChange = (selectedBoardName: string) => {
    setSelectedHealthBoard(selectedBoardName);
    
    const healthBoard = findHealthLicensingBoardByName(selectedBoardName);
    
    if (healthBoard) {
      // Set the agency name to the specific health board name and use its code
      onChange(healthBoard.name, healthBoard.code);
    } else {
      onChange(selectedBoardName, '');
    }
  };

  const handleSmartAgencyChange = (selectedSmartAgencyName: string) => {
    setSelectedSmartAgency(selectedSmartAgencyName);
    
    const smartAgency = findSmartAgencyByName(selectedSmartAgencyName);
    
    if (smartAgency) {
      // Set the agency name to the specific SMART agency name and use its code
      onChange(smartAgency.name, smartAgency.code);
    } else {
      onChange(selectedSmartAgencyName, '');
    }
  };

  // Determine what to show in the main dropdown
  const getMainDropdownValue = () => {
    if (showHealthBoards) return 'Health Licensing Boards';
    if (showSmartAgencies) return 'SMART';
    return value;
  };

  // Convert agencies to options format for SearchableSelect
  const agencyOptions = agencies.map(agency => ({
    value: agency.name,
    label: agency.name
  }));

  // Convert health licensing boards to options format
  const healthBoardOptions = healthLicensingBoards.map(board => ({
    value: board.name,
    label: board.name
  }));

  // Convert SMART agencies to options format
  const smartAgencyOptions = smartAgencies.map(agency => ({
    value: agency.name,
    label: agency.name
  }));

  return (
    <div className="space-y-4">
      <div>
        <SearchableSelect
          options={agencyOptions}
          value={getMainDropdownValue()}
          onChange={handleAgencyChange}
          placeholder="Search agencies..."
          label="Agency Name"
          required={required}
          error={error}
          searchPlaceholder="Search agencies..."
        />
      </div>

      {showHealthBoards && (
        <div>
          <SearchableSelect
            options={healthBoardOptions}
            value={selectedHealthBoard}
            onChange={handleHealthBoardChange}
            placeholder="Search health licensing boards..."
            label="Select Health Licensing Board"
            required={required}
            searchPlaceholder="Search health licensing boards..."
          />
          <p className="mt-1 text-sm text-gray-500">
            Please select the specific health licensing board from the list above.
          </p>
        </div>
      )}

      {showSmartAgencies && (
        <div>
          <SearchableSelect
            options={smartAgencyOptions}
            value={selectedSmartAgency}
            onChange={handleSmartAgencyChange}
            placeholder="Search SMART agencies..."
            label="Select SMART Agency"
            required={required}
            searchPlaceholder="Search SMART agencies..."
          />
          <p className="mt-1 text-sm text-gray-500">
            Please select the specific SMART agency from the list above.
          </p>
        </div>
      )}
    </div>
  );
}

export default AgencySelect;