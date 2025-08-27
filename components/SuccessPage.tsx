import React, { useEffect, useState } from 'react';
import { getCheckoutSession } from '../services/stripeService';

interface SuccessPageProps {
  sessionId: string;
  onContinue: () => void;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ sessionId, onContinue }) => {
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const data = await getCheckoutSession(sessionId);
        setSessionData(data);
      } catch (err) {
        setError('Failed to load payment details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Processing your payment...
            </h2>
            <p className="text-gray-300">
              Please wait while we confirm your purchase
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">❌</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Error Loading Payment
            </h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={onContinue}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Return to App
            </button>
          </div>
        </div>
      </div>
    );
  }

  const credits = sessionData?.metadata?.credits || '50';
  const amount = sessionData?.amount_total ? (sessionData.amount_total / 100).toFixed(2) : '5.00';

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Success Animation */}
          <div className="w-16 h-16 mx-auto mb-6 bg-green-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            🎉 Payment Successful!
          </h1>
          
          <p className="text-gray-300 mb-6">
            Your credits have been added to your account
          </p>

          {/* Purchase Details */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">Credits purchased:</span>
              <span className="text-white font-semibold">{credits}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">Amount paid:</span>
              <span className="text-white font-semibold">${amount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Payment status:</span>
              <span className="text-green-400 font-semibold">✓ Confirmed</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onContinue}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Start Editing Images! 🎨
            </button>
            
            <p className="text-sm text-gray-400">
              Your credits are now available to use
            </p>
          </div>

          {/* Receipt Info */}
          <div className="mt-6 text-xs text-gray-500">
            <p>Receipt ID: {sessionData?.id?.substring(0, 20)}...</p>
            <p className="mt-1">
              A receipt has been sent to your email
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;