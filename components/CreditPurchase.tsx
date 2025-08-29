import React, { useState } from 'react';
import { purchaseCredits } from '../services/stripeService';
import { imageStateManager, type ImageState } from '../utils/security';

interface CreditPurchaseProps {
  userId: string;
  onPurchaseStart?: () => void;
  className?: string;
  imageState?: Omit<ImageState, 'timestamp'>;
}

const CreditPurchase: React.FC<CreditPurchaseProps> = ({ 
  userId, 
  onPurchaseStart,
  className = '',
  imageState
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCredits, setLastCredits] = useState<number | null>(null);

  const handlePurchase = async (credits: number) => {
  setLastCredits(credits);
    try {
      setIsLoading(true);
      setError(null);
      
      if (onPurchaseStart) {
        onPurchaseStart();
      }
      
      // Include image state preservation if provided
      await purchaseCredits(userId, credits, imageState);
    } catch (err) {
      // Normalize error message so we always show something useful to the user
      console.error('Purchase error:', err);
      const errorMessage = err instanceof Error
        ? err.message
        : (err && typeof err === 'object' && 'message' in (err as any))
          ? String((err as any).message)
          : String(err) || 'Failed to start purchase';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-4">
          🚀 Get More Credits
        </h3>
        <p className="text-gray-300 mb-6">
          Continue creating amazing images with AI-powered editing
        </p>

        {error && (
          <div className="bg-red-900 border border-red-700 rounded p-3 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
            <div className="mt-3">
              <button
                onClick={() => lastCredits && handlePurchase(lastCredits)}
                disabled={isLoading || lastCredits === null}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* Credit Packages */}
          <div className="grid gap-3">
            <CreditPackage
              credits={50}
              price="$5.00"
              popular={true}
              onPurchase={() => handlePurchase(50)}
              isLoading={isLoading}
            />
            <CreditPackage
              credits={100}
              price="$9.00"
              savings="Save $1"
              onPurchase={() => handlePurchase(100)}
              isLoading={isLoading}
            />
            <CreditPackage
              credits={200}
              price="$15.00"
              savings="Save $5"
              onPurchase={() => handlePurchase(200)}
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-400">
          <p>💳 Secure payment powered by Stripe</p>
          <p className="mt-1">🔒 Your payment information is never stored</p>
        </div>
      </div>
    </div>
  );
};

interface CreditPackageProps {
  credits: number;
  price: string;
  popular?: boolean;
  savings?: string;
  onPurchase: () => void;
  isLoading: boolean;
}

const CreditPackage: React.FC<CreditPackageProps> = ({
  credits,
  price,
  popular = false,
  savings,
  onPurchase,
  isLoading
}) => {
  return (
    <div className={`
      relative border rounded-lg p-4 transition-all hover:bg-gray-700
      ${popular ? 'border-blue-500 bg-gray-700' : 'border-gray-600'}
    `}>
      {popular && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="text-left">
          <div className="text-white font-medium">
            {credits} Credits
          </div>
          <div className="text-sm text-gray-300">
            {price}
            {savings && (
              <span className="ml-2 text-green-400 text-xs">
                {savings}
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={onPurchase}
          disabled={isLoading}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all
            ${popular 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-600 hover:bg-gray-500 text-white'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-blue-500
          `}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Loading...
            </div>
          ) : (
            'Buy Now'
          )}
        </button>
      </div>
    </div>
  );
};

export default CreditPurchase;