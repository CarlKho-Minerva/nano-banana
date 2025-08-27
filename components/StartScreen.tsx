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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  return (
    <div className="min-h-[50vh] lg:h-full flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div 
        className={`w-full max-w-sm sm:max-w-md lg:max-w-lg text-center transition-all duration-300 rounded-xl lg:rounded-2xl border-2 ${isDraggingOver ? 'bg-white/10 border-dashed border-white' : 'border-transparent'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOver(false);
          onFileSelect(e.dataTransfer.files);
        }}
      >
        <div className="flex flex-col items-center gap-4 sm:gap-6 animate-fade-in">
          <div className="border-2 border-dashed border-gray-600 rounded-lg sm:rounded-xl p-6 sm:p-8 md:p-12 lg:p-16 w-full hover:border-gray-500 transition-colors">
              <label htmlFor="image-upload-start" className="cursor-pointer block">
                  <UploadIcon className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto text-white mb-3 sm:mb-4 md:mb-6" />
                  <p className="text-white font-medium text-base sm:text-lg md:text-xl mb-1 sm:mb-2">Drop an image here</p>
                  <p className="text-gray-400 text-sm sm:text-base md:text-lg">or click to browse</p>
              </label>
              <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="text-center mt-2 sm:mt-4">
            <p className="text-gray-400 text-xs sm:text-sm md:text-base font-light px-2">
              Try: "remove person", "change background", "add sunglasses"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
