/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StartScreen from '../components/StartScreen';
import ValueProp from '../components/ValueProp';
import { imageStateManager } from '../utils/security';
import { getUserId } from '../services/stripeService';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Check for preserved image state on home page load and offer to restore
  useEffect(() => {
    // TEMPORARILY DISABLED - causing redirect issues after Stripe
    // TODO: Re-enable this but check if user just came from payment flow
    
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    // Only auto-restore if user didn't just come from payment
    if (!paymentStatus) {
      const userId = getUserId();
      const restoredState = imageStateManager.restoreLatestImageState(userId);
      
      if (restoredState) {
        
        // Show a brief notification and auto-redirect to specific session
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10B981;
          color: white;
          padding: 16px;
          border-radius: 8px;
          z-index: 9999;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.textContent = '✅ Restoring your previous editing session...';
        document.body.appendChild(notification);
        
        // Auto-redirect to specific session URL after a brief moment
        setTimeout(() => {
          document.body.removeChild(notification);
          navigate(`/edit/${restoredState.sessionId}`);
        }, 2000);
      }
    }
  }, [navigate]);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];

      // Generate unique session ID for new upload
      const newSessionId = `session_${Math.random().toString(36).substring(2)}_${Date.now().toString(36)}`;

      // Navigate to session-based URL with file data in state
      navigate(`/edit/${newSessionId}`, {
        state: {
          uploadedFile: file
        }
      });
    } else {
    }
  };

  return (
    <div className="min-h-screen text-gray-100">
      <div className="min-h-screen flex flex-col lg:flex-row overflow-x-hidden">
        <ValueProp />
        <div className="w-full lg:w-1/2 flex-1">
          <StartScreen onFileSelect={handleFileSelect} />
        </div>
      </div>
    </div>
  );
};

export default HomePage;