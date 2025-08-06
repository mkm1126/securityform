import React, { useState } from 'react';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';

function TestApprovalOrder() {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const createTestRequest = async () => {
    setTesting(true);
    try {
      // Create a test request
      const testRequest = {
        start_date: '2025-01-15',
        employee_name: 'Test Employee',
        employee_id: 'TEST123',
        is_non_employee: false,
        email: 'test@example.com',
        agency_name: 'Test Agency',
        agency_code: 'TST',
        submitter_name: 'Test Submitter',
        submitter_email: 'submitter@test.com',
        supervisor_name: 'Test Supervisor',
        supervisor_email: 'supervisor@test.com',
        security_admin_name: 'Test Security Admin',
        security_admin_email: 'security@test.com',
        status: 'pending',
        poc_user: 'Test User'
      };

      const { data: request, error: requestError } = await supabase
        .from('security_role_requests')
        .insert(testRequest)
        .select()
        .single();

      if (requestError) throw requestError;

      // Create a security area to trigger area-specific approvals
      const { error: areaError } = await supabase
        .from('security_areas')
        .insert({
          request_id: request.id,
          area_type: 'accounting_procurement',
          director_name: 'Test Director',
          director_email: 'director@test.com'
        });

      if (areaError) throw areaError;

      // Wait a moment for triggers to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch the created approvals
      const { data: approvals, error: approvalsError } = await supabase
        .from('request_approvals')
        .select('*')
        .eq('request_id', request.id)
        .order('created_at', { ascending: true });

      if (approvalsError) throw approvalsError;

      // Sort approvals using the same logic as RequestDetailsPage
      const sortedApprovals = (approvals || []).sort((a, b) => {
        const stepOrder = {
          'user_signature': 1,
          'supervisor_approval': 2,
          'accounting_director_approval': 3,
          'hr_director_approval': 3,
          'elm_admin_approval': 3,
          'security_admin_approval': 4  // Always last
        };
        
        const orderA = stepOrder[a.step as keyof typeof stepOrder] || 3;
        const orderB = stepOrder[b.step as keyof typeof stepOrder] || 3;
        
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      setTestResults({
        requestId: request.id,
        rawApprovals: approvals,
        sortedApprovals: sortedApprovals,
        securityAdminIsLast: sortedApprovals[sortedApprovals.length - 1]?.step === 'security_admin_approval'
      });

      toast.success('Test request created successfully!');

    } catch (error) {
      console.error('Error creating test request:', error);
      toast.error('Failed to create test request');
    } finally {
      setTesting(false);
    }
  };

  const cleanupTestRequest = async () => {
    if (testResults?.requestId) {
      try {
        await supabase
          .from('security_role_requests')
          .delete()
          .eq('id', testResults.requestId);
        
        setTestResults(null);
        toast.success('Test request cleaned up');
      } catch (error) {
        console.error('Error cleaning up test request:', error);
        toast.error('Failed to cleanup test request');
      }
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Test Approval Order</h3>
      
      <div className="space-y-4">
        <button
          onClick={createTestRequest}
          disabled={testing}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {testing ? 'Creating Test Request...' : 'Create Test Request'}
        </button>

        {testResults && (
          <div className="mt-6 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-green-800">Test Results</h4>
              <p className="text-sm text-green-700 mt-1">
                Request ID: {testResults.requestId}
              </p>
              <p className="text-sm text-green-700">
                Security Admin is last: {testResults.securityAdminIsLast ? '✅ Yes' : '❌ No'}
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Approval Order:</h4>
              <ol className="list-decimal list-inside space-y-1">
                {testResults.sortedApprovals.map((approval: any, index: number) => (
                  <li key={approval.id} className="text-sm text-gray-700">
                    {approval.step.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    {approval.step === 'security_admin_approval' && (
                      <span className="ml-2 text-green-600 font-medium">← Should be last</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            <button
              onClick={cleanupTestRequest}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cleanup Test Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestApprovalOrder;