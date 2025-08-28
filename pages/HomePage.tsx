/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useNavigate } from 'react-router-dom';
import StartScreen from '../components/StartScreen';
import ValueProp from '../components/ValueProp';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleFileSelect = (files: FileList | null) => {
    console.log('🔧 HomePage handleFileSelect called with:', files);
    if (files && files[0]) {
      const file = files[0];
      console.log('🔧 Selected file:', file.name, file.size);

      // Navigate to edit page with file data in state
      navigate('/edit', {
        state: {
          uploadedFile: file
        }
      });
    } else {
      console.log('🔧 No file selected');
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