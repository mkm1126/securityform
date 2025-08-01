import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import Header from './components/Header';

interface RequestDetails {
  employee_name: string;
}

interface ApprovalDetails {
  step: string;
}

const approvalText: Record<string, string> = {
  user_signature: `I understand that all SWIFT systems contain some types of data about employees, vendors, customers, and other individuals that are classified as private or confidential under state and/or federal laws. This protected data may appear in a variety of reports, pages, tables, records, and fields. I have been provided with access to the applicable portions of the Minnesota Government Data Practices Act (Minnesota Statutes, Chapter 13, https://www.revisor.mn.gov/pubs/) or summaries of them. I agree to comply with the requirements of the Act regarding all data that is not public. Applies only to users who are authorized for at least one HR/payroll role in SEMA4 or in the EPM data warehouse: (1) I also understand that a majority of the HR/payroll information available through SEMA4 or the warehouse is classified as private under the provisions of the Minnesota Government Data Practices Act. I have read and understand the guide "Data Practices for Personnel Records," which is available on the MMB website at https://www.mn.gov/mmb/employee-relations/labor-relations/resources-for-agencies/data-practices.jsp. (2) I have read the "Data Protection Policy for Human Resource Systems," https://www.mn.gov/mmb/employee relations/laws-policies-and-rules/statewide-hr-policies/ (click on Data and Technology). I understand the requirements of the policy and acknowledge that I am responsible for complying with the policy. I understand that if I fail to comply with the policy, I may be subject to disciplinary action, up to and including discharge. Applies only to users who are authorized for any role in Enterprise Learning Management (ELM): I will not modify any data that is not my own or data that I am not authorized to modify, such as certain rosters and employee training data.`,
  supervisor_approval: `I certify that the user needs the roles and agencies indicated on this form in order to carry out the responsibilities of his/her job.`,
  accounting_director_approval: `Accounting Director/Chief Financial Officer: Must sign request to add a new user or to add new security roles and/or agencies/department IDs for FMS and warehouse accounting, procurement, and payroll.`,
  hr_director_approval: `Human Resources Director: Must sign request to add a new user or to add new security roles and/or agencies/department IDs for SEMA4 and warehouse human resources data.`,
  elm_admin_approval: `Agency ELM Key Administrator: Must sign request to add a new user or to add new security roles for Enterprise Learning Management.`,
  security_admin_approval: `Security administrator's statement: I understand that authorizing the user for any role is likely to result in access to private or confidential data about employees, vendors, customers, and/or other individuals. Non-public data may appear in a variety of reports, pages, tables, records, and fields. I certify that the user needs the roles and agencies indicated on this form in order to carry out the responsibilities of his/her job. If the user is authorized for at least one SEMA4 role, I certify that he/she has been trained to accomplish the applicable tasks and provided with access to the two documents mentioned in the second paragraph of the user's statement.`
};

function SignaturePage() {
  const { requestId, approvalId } = useParams<{ requestId: string; approvalId: string }>();
  const [searchParams] = useSearchParams();
  const isReviewMode = searchParams.get('mode') === 'review';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [approval, setApproval] = useState<ApprovalDetails | null>(null);

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId, approvalId]);

  async function fetchRequestDetails() {
    if (!requestId || !approvalId) return;

    // Check if approvalId is the string 'undefined'
    if (approvalId === 'undefined') {
      setError('Invalid approval ID. Please check the URL and try again.');
      return;
    }

    try {
      // Fetch request details
      const { data: requestData, error: requestError } = await supabase
        .from('security_role_requests')
        .select('employee_name')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;
      setRequest(requestData);

      // Fetch approval details
      const { data: approvalData, error: approvalError } = await supabase
        .from('request_approvals')
        .select('step')
        .eq('id', approvalId)
        .single();

      if (approvalError) throw approvalError;
      setApproval(approvalData);
    } catch (err) {
      console.error('Error fetching details:', err);
      setError('Failed to load request details. Please try again.');
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const validateApprover = async (approverEmail: string) => {
    try {
      const { data: approval, error } = await supabase
        .from('request_approvals')
        .select('approver_email')
        .eq('id', approvalId)
        .single();

      if (error) throw error;
      return approval.approver_email === approverEmail;
    } catch (err) {
      console.error('Error validating approver:', err);
      return false;
    }
  };

  const saveSignature = async () => {
    if (!hasAgreed) {
      setError('You must agree to the terms before signing.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      setError('Signature canvas not available. Please refresh and try again.');
      return;
    }

    // Check if signature was actually drawn
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Unable to access signature canvas. Please refresh and try again.');
      return;
    }

    // Check if canvas is blank (no signature drawn)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const isBlank = imageData.data.every(pixel => pixel === 0 || pixel === 255);
    
    if (isBlank) {
      setError('Please provide your signature before submitting.');
      return;
    }

    try {
      // If in review mode, prompt for email validation
      if (isReviewMode) {
        const approverEmail = prompt('Please enter your email address to verify your identity:');
        if (!approverEmail) return;

        const isValidApprover = await validateApprover(approverEmail);
        if (!isValidApprover) {
          setError('Invalid approver email. Please try again.');
          return;
        }
      }

      // Convert canvas to base64 string
      const signatureData = canvas.toDataURL('image/png');

      // Update the approval record
      const { error } = await supabase
        .from('request_approvals')
        .update({
          signature_data: signatureData,
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', approvalId);

      if (error) throw error;

      // Show success message in review mode
      if (isReviewMode) {
        alert('Thank you! Your approval has been recorded.');
        window.close();
      } else {
        // Navigate back to the request details page
        navigate(`/requests/${requestId}`);
      }
    } catch (err) {
      console.error('Error saving signature:', err);
      setError('Failed to save signature. Please try again.');
    }
  };

  if (!request || !approval) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Digital Signature"
        subtitle={`Approval of security request for ${request.employee_name}`}
      />
      
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {!isReviewMode && (
            <div className="mb-8">
              <Link
                to={`/requests/${requestId}`}
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Request Details
              </Link>
            </div>
          )}

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">
                Approval of security request for {request.employee_name}
              </h2>
            </div>

            <div className="px-4 py-5 sm:p-6">
              {/* Statement Text */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  {stepLabels[approval.step]}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {approvalText[approval.step]}
                </div>
              </div>

              {/* Agreement Checkbox */}
              <div className="mb-6">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I have read and agree to the above statement
                  </span>
                </label>
                {!hasAgreed && error && (
                  <p className="mt-1 text-sm text-red-600">
                    You must agree to the terms before signing
                  </p>
                )}
              </div>

              {/* Signature Canvas */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digital Signature <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-gray-300 rounded-lg bg-white relative">
                  <div className="absolute top-2 left-2 text-xs text-gray-400 pointer-events-none">
                    Sign here
                  </div>
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={200}
                  className="w-full touch-none cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Use your mouse or touch to sign above
                </p>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <X className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={saveSignature}
                  disabled={!hasAgreed}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    hasAgreed
                      ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {hasAgreed ? 'Save Signature' : 'Please agree to terms first'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const stepLabels: Record<string, string> = {
  'user_signature': 'User Signature',
  'supervisor_approval': 'Supervisor Approval',
  'accounting_director_approval': 'Accounting Director / CFO Approval',
  'hr_director_approval': 'HR Director Approval',
  'elm_admin_approval': 'ELM Key Administrator Approval',
  'security_admin_approval': 'Security Administrator Approval'
};

export default SignaturePage;