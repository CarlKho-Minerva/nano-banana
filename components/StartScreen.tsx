/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { UploadIcon, MagicWandIcon, PaletteIcon, SunIcon } from './icons';

interface StartScreenProps {
  onFileSelect: (files: FileList | null) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const validateFile = (file: File): string | null => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, or WebP)';
    }

    if (file.size > MAX_SIZE) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const error = validateFile(files[0]);
      if (error) {
        alert(error); // In production, use a proper toast/modal
        e.target.value = ''; // Clear the input
        return;
      }
    }
    onFileSelect(files);
  };

  return (
    <div className="h-full flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div
        className={`w-full max-w-xs sm:max-w-sm lg:max-w-md text-center transition-all duration-300 rounded-lg lg:rounded-xl border-2 ${isDraggingOver ? 'bg-white/10 border-dashed border-white' : 'border-transparent'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOver(false);
          const files = e.dataTransfer.files;
          if (files && files[0]) {
            const error = validateFile(files[0]);
            if (error) {
              alert(error);
              return;
            }
          }
          onFileSelect(files);
        }}
      >
        <div className="flex flex-col items-center gap-3 sm:gap-4 animate-fade-in">
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 sm:p-6 md:p-8 lg:p-12 w-full hover:border-gray-500 transition-colors">
              <label htmlFor="image-upload-start" className="cursor-pointer block">
                  <UploadIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 mx-auto text-white mb-2 sm:mb-3 md:mb-4" />
                  <p className="text-white font-medium text-sm sm:text-base md:text-lg mb-1">Drop an image here</p>
                  <p className="text-gray-400 text-xs sm:text-sm md:text-base">or click to browse</p>
              </label>
              <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-xs sm:text-sm font-light px-2">
              Try: "remove person", "change background", "add sunglasses"
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StartScreen;
