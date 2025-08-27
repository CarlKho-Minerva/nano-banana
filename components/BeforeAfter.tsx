/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface BeforeAfterProps {
  beforeSrc: string;
  afterSrc: string;
  alt?: string;
}

const BeforeAfter: React.FC<BeforeAfterProps> = ({ beforeSrc, afterSrc, alt = "Before and after comparison" }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const position = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mouseleave', handleGlobalMouseUp);
    }
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      className="relative w-full h-full select-none cursor-col-resize rounded-xl overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Before Image (Full) */}
      <img 
        src={beforeSrc} 
        alt={`Before - ${alt}`}
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
      />
      
      {/* After Image (Clipped) */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img 
          src={afterSrc} 
          alt={`After - ${alt}`}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
      
      {/* Slider Line */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Slider Handle */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-col-resize border-2 border-black"
          onMouseDown={handleMouseDown}
        >
          <div className="w-1 h-4 bg-black rounded-full"></div>
        </div>
      </div>
      
      {/* Labels */}
      <div className="absolute top-4 left-4 bg-black/60 text-white text-sm px-2 py-1 rounded">
        BEFORE
      </div>
      <div className="absolute top-4 right-4 bg-black/60 text-white text-sm px-2 py-1 rounded">
        AFTER
      </div>
    </div>
  );
};

export default BeforeAfter;