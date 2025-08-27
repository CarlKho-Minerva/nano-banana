/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import BeforeAfter from './BeforeAfter';

const ValueProp: React.FC = () => {
  const [currentDemo, setCurrentDemo] = useState(0);
  
  const demos = [
    {
      before: '/assets/before-after/1/before -  alicia-steels-5AxRCxe_fa0-unsplash.jpg',
      after: '/assets/before-after/1/after -  alicia-steels-5AxRCxe_fa0-unsplash.jpeg',
      description: 'Remove unwanted objects'
    },
    {
      before: '/assets/before-after/2/before - gabriella-clare-marino-PLlgbMBbmHU-unsplash.jpg',
      after: '/assets/before-after/2/after - gabriella-clare-marino-PLlgbMBbmHU-unsplash.jpeg',
      description: 'Clean up backgrounds'
    },
    {
      before: '/assets/before-after/3/before - zachary-kadolph-Hl_o1K6OPsA-unsplash.jpg',
      after: '/assets/before-after/3/after - zachary-kadolph-Hl_o1K6OPsA-unsplash.png',
      description: 'Perfect your shots'
    },
    {
      before: '/assets/before-after/4/before - clayton-cardinalli-mMnU-UMmXok-unsplash.jpg',
      after: '/assets/before-after/4/after - clayton-cardinalli-mMnU-UMmXok-unsplash.jpeg',
      description: 'Enhance details'
    },
    {
      before: '/assets/before-after/5/before - ksama-u35PU4Peo_8-unsplash.jpg',
      after: '/assets/before-after/5/after - ksama-u35PU4Peo_8-unsplash.jpeg',
      description: 'Transform scenes'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDemo((prev) => (prev + 1) % demos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [demos.length]);

  return (
    <div className="w-full lg:w-1/2 min-h-screen px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 md:py-12 flex flex-col justify-center lg:border-r border-white/10">
      {/* Demo Slideshow - Full Focus */}
      <div className="w-full max-w-xl lg:max-w-2xl mx-auto lg:mx-0">
        <div className="w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[4/3] lg:aspect-[16/10] border border-white/20 rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl">
          <BeforeAfter 
            beforeSrc={demos[currentDemo].after} 
            afterSrc={demos[currentDemo].before} 
            alt={demos[currentDemo].description}
          />
        </div>
        
        <div className="flex justify-center gap-4 mt-8">
          {demos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentDemo(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentDemo ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
        
        <div className="text-center mt-4 sm:mt-6 md:mt-8">
          <p className="text-gray-400 text-base sm:text-lg md:text-xl font-light mb-4 sm:mb-6">
            {demos[currentDemo].description}
          </p>
          
          <div className="text-left max-w-sm sm:max-w-md lg:max-w-lg mx-auto">
            <p className="text-gray-500 text-xs sm:text-sm font-light mb-3 sm:mb-4">
              Magic Eraser, Unblur, Best Take — previously Google Pixel exclusive
            </p>
            
            <blockquote className="border-l border-white/20 pl-4 sm:pl-6">
              <p className="text-gray-400 italic text-sm sm:text-base md:text-lg font-light leading-relaxed">
                "I used to think this was just a Google Pixel feature. 
                Now I can edit any photo like this."
              </p>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10">
                <p className="text-gray-500 text-xs sm:text-sm font-light">
                  Try 3 edits free • More with credits
                </p>
              </div>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValueProp;