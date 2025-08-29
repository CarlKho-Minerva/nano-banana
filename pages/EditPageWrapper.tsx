/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import EditPage from './EditPage';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

const EditPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId: urlSessionId } = useParams<{ sessionId: string }>();
  const [initialImage, setInitialImage] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEditSession = async () => {
      console.log('🔧 EditPageWrapper loading...', { urlSessionId, locationState: location.state });
      
      // Check for uploaded file in router state (new image upload)
      const state = location.state as { uploadedFile?: File } | null;
      
      if (state?.uploadedFile && urlSessionId) {
        // NEW IMAGE UPLOAD with session ID from URL
        console.log('🔧 New image upload for session:', urlSessionId);
        setInitialImage(state.uploadedFile);
        setSessionId(urlSessionId);
        
        // Don't navigate - we're already at the right URL
        
      } else if (urlSessionId) {
        // EXISTING SESSION - try to restore from URL
        console.log('🔧 Existing session from URL:', urlSessionId);
        setSessionId(urlSessionId);
        
        // Try to restore image state from storage using the stable getUserId
        const { getUserId } = await import('../services/stripeService');
        const { imageStateManager } = await import('../utils/security');
        const stableUserId = getUserId(); // Use the stable function
        console.log('🔑 Using stable User ID for restoration:', stableUserId);
        
        const restoredState = imageStateManager.restoreImageStateBySession(stableUserId, urlSessionId);
        
        if (restoredState) {
          console.log('✅ Restored image state for session:', urlSessionId);
          // Convert base64 back to File
          const restoredFile = imageStateManager.base64ToFile(
            restoredState.currentImage, 
            `restored-${urlSessionId}.png`
          );
          setInitialImage(restoredFile);
        } else {
          console.log('❌ No valid image state found for this session:', urlSessionId, 'and user:', stableUserId);
          // Don't redirect immediately. This might be a fresh load after payment.
          // The EditPage component itself will handle the final redirect if needed after its own checks.
        }
        
      } else {
        // NO SESSION ID AND NO NEW IMAGE - redirect to home
        console.log('🔧 No session ID or new image, redirecting to home');
        navigate('/');
        return;
      }
      
      setIsLoading(false);
    };
    
    loadEditSession();
  }, [navigate, location.state, urlSessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="mt-4 text-gray-300">Loading your image...</p>
        </div>
      </div>
    );
  }

  // Allow EditPage to handle the case where no initial image is found
  // This is important for payment success flows where the image needs to be restored
  // inside EditPage's useEffect after checking URL parameters
  return <EditPage initialImage={initialImage} sessionId={sessionId} />;
};

export default EditPageWrapper;