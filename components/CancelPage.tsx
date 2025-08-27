import React from 'react';

interface CancelPageProps {
  onReturn: () => void;
  onRetry?: () => void;
}

const CancelPage: React.FC<CancelPageProps> = ({ onReturn, onRetry }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Cancel Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-yellow-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Payment Cancelled
          </h1>
          
          <p className="text-gray-300 mb-6">
            Your payment was cancelled. No charges were made to your account.
          </p>

          {/* Information Box */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-white mb-2">💡 What happened?</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• You closed the payment window</li>
              <li>• You clicked the back button</li>
              <li>• The payment session expired</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Try Again 💳
              </button>
            )}
            
            <button
              onClick={onReturn}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Return to App
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-sm text-gray-400">
            <p>Need help? Contact support or try again later.</p>
            <p className="mt-1">
              Your account and credits remain unchanged.
            </p>
          </div>

          {/* Alternative Options */}
          <div className="mt-6 border-t border-gray-600 pt-4">
            <p className="text-sm text-gray-400 mb-2">
              Still want credits?
            </p>
            <div className="text-xs text-gray-500">
              <p>• Credit packages start at just $5</p>
              <p>• Secure payments powered by Stripe</p>
              <p>• Instant credit delivery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelPage;