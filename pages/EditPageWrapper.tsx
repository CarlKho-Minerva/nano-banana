/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const [initialImage, setInitialImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for uploaded file in router state
    const state = location.state as { uploadedFile?: File } | null;
    console.log('🔧 EditPageWrapper state:', state);
    
    if (state?.uploadedFile) {
      console.log('🔧 Found uploaded file in state:', state.uploadedFile.name);
      setInitialImage(state.uploadedFile);
    } else {
      // No image uploaded, redirect back to home
      console.log('🔧 No uploaded file found, redirecting to home');
      navigate('/');
    }
    
    setIsLoading(false);
  }, [navigate, location.state]);

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

  if (!initialImage) {
    return (
      <div className="min-h-screen text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No image found</h1>
          <p className="text-gray-400">Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  return <EditPage initialImage={initialImage} />;
};

export default EditPageWrapper;