/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { imageStateManager } from '../utils/security';
import { getUserId } from '../services/stripeService';

interface RecentSessionsProps {
  onClose: () => void;
}

const RecentSessions: React.FC<RecentSessionsProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(() => {
    const userId = getUserId();
    return imageStateManager.getAllUserSessions(userId);
  });

  const handleSessionSelect = (sessionId: string) => {
    navigate(`/edit/${sessionId}`);
    onClose();
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const userId = getUserId();
    imageStateManager.clearImageState(sessionId);
    setSessions(imageStateManager.getAllUserSessions(userId));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black/95 border border-white/20 rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Recent Sessions</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Click to resume editing a previous session
          </p>
        </div>

        <div className="overflow-y-auto max-h-96">
          {sessions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500 mb-2">
                <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-gray-400">No recent sessions found</p>
              <p className="text-gray-500 text-sm mt-1">Upload an image to start editing</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  onClick={() => handleSessionSelect(session.sessionId)}
                  className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-lg p-4 cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        {session.currentImage && (
                          <img
                            src={session.currentImage}
                            alt="Session preview"
                            className="w-12 h-12 object-cover rounded border border-white/20"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">
                            Session {session.sessionId.split('_')[1]?.substring(0, 8)}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {formatDate(session.timestamp)}
                          </p>
                          {session.history && session.history.length > 1 && (
                            <p className="text-gray-500 text-xs">
                              {session.history.length - 1} edit{session.history.length > 2 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteSession(session.sessionId, e)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all p-1"
                      title="Delete session"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white py-2 px-4 rounded-lg transition-colors font-light"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentSessions;