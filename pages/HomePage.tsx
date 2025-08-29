/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StartScreen from '../components/StartScreen';
import ValueProp from '../components/ValueProp';
import RecentSessions from '../components/RecentSessions';
import { imageStateManager } from '../utils/security';
import { getUserId } from '../services/stripeService';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showRecentSessions, setShowRecentSessions] = useState(false);

  // Auto-restore logic DISABLED for better UX
  // Users can manually access recent sessions via the "Recent Sessions" button
  useEffect(() => {
    // Handle payment success/cancel redirects and error messages
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const stateMessage = (location.state as any)?.message;
    
    let notificationText = null;
    let backgroundColor = '#10B981'; // default green
    
    if (paymentStatus === 'success') {
      notificationText = '💳 Payment successful! You can continue editing.';
    } else if (stateMessage) {
      notificationText = stateMessage;
      backgroundColor = '#F59E0B'; // orange for warnings
    }
    
    if (notificationText) {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 16px;
        border-radius: 8px;
        z-index: 9999;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 300px;
      `;
      notification.textContent = notificationText;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 4000);
    }
    
    // Clean up URL and state
    if (paymentStatus || stateMessage) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [navigate, location.state]);

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
          <StartScreen 
            onFileSelect={handleFileSelect} 
            onShowRecentSessions={() => setShowRecentSessions(true)}
          />
        </div>
      </div>

      {/* Recent Sessions Modal */}
      {showRecentSessions && (
        <RecentSessions onClose={() => setShowRecentSessions(false)} />
      )}
    </div>
  );
};

export default HomePage;