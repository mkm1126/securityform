import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import SearchableSelect from './SearchableSelect';
import UserRoleDetails from './UserRoleDetails';

interface User {
  employee_name: string;
  employee_id: string;
  email: string;
  request_id?: string;
}

interface UserSelectProps {
  selectedUser: User | null;
  onUserChange: (user: User | null) => void;
  error?: string;
  required?: boolean;
  currentUser?: string | null;
}

function UserSelect({ selectedUser, onUserChange, error, required = false, currentUser }: UserSelectProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [roleSelections, setRoleSelections] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser?.request_id) {
      fetchUserDetails(selectedUser.request_id);
    } else {
      setUserDetails(null);
      setRoleSelections(null);
    }
  }, [selectedUser]);
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('security_role_requests')
        .select(`
          id,
          employee_name, 
          employee_id, 
          email,
          security_areas (
            area_type,
            director_name,
            director_email
          )
        `)
        .in('status', ['approved', 'completed']) // Show approved and completed requests
        .not('employee_name', 'is', null)
        .not('employee_id', 'is', null)
        .order('employee_name');

      if (error) throw error;

      console.log('All users fetched from approved/completed requests:', data);

      // Remove duplicates based on employee_id, keeping the most recent
      const uniqueUsers = data.reduce((acc: User[], current) => {
        const existingUser = acc.find(user => user.employee_id === current.employee_id);
        if (!existingUser) {
          acc.push({
            employee_name: current.employee_name,
            employee_id: current.employee_id || '',
            email: current.email,
            request_id: current.id
          });
        }
        return acc;
      }, []);

      setUsers(uniqueUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (requestId: string) => {
    setLoadingDetails(true);
    try {
      console.log('Fetching user details for request ID:', requestId);
      
      // Fetch request details with security areas
      const { data: requestData, error: requestError } = await supabase
        .from('security_role_requests')
        .select(`
          *,
          security_areas (
            area_type,
            director_name,
            director_email
          )
        `)
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;
      console.log('Request data fetched:', requestData);
      setUserDetails(requestData);

      // Fetch role selections
      const { data: roleData, error: roleError } = await supabase
        .from('security_role_selections')
        .select('*')
        .eq('request_id', requestId)
        .maybeSingle();

      if (roleError) throw roleError;
      console.log('Role data fetched:', roleData);
      setRoleSelections(roleData);

    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };
  const handleUserChange = (selectedValue: string) => {
    console.log('🔧 UserSelect handleUserChange called with:', selectedValue);
    
    if (!selectedValue) {
      console.log('🔧 No value selected, calling onUserChange with null');
      onUserChange(null);
      return;
    }

    const user = users.find(u => `${u.employee_name} (${u.employee_id})` === selectedValue);
    console.log('🔧 Found user:', user);
    console.log('🔧 Calling onUserChange with user:', user);
    onUserChange(user || null);
  };

  // Convert users to options format for SearchableSelect
  const userOptions = users.map(user => ({
    value: `${user.employee_name} (${user.employee_id})`,
    label: `${user.employee_name} (${user.employee_id})`
  }));

  const selectedValue = selectedUser ? `${selectedUser.employee_name} (${selectedUser.employee_id})` : '';

  return (
    <div>
      <SearchableSelect
        options={userOptions}
        value={selectedValue}
        onChange={handleUserChange}
        placeholder={loading ? "Loading users..." : "Search for a user to copy..."}
        label={`Select User to Copy${required ? '*' : ''}`}
        required={required}
        error={error}
        searchPlaceholder="Type to search users..."
      />
      {selectedUser && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Selected:</strong> {selectedUser.employee_name} ({selectedUser.employee_id})
          </p>
          <p className="text-sm text-blue-600">
            Email: {selectedUser.email}
          </p>
        </div>
      )}
      
      {/* Show selected user details */}
      {selectedUser && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Access Details to be Copied</h4>
          {loadingDetails ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <UserRoleDetails userDetails={userDetails} roleSelections={roleSelections} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserSelect;