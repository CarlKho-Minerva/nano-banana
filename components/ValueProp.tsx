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
    <div className="w-full lg:w-1/2 h-screen px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6 md:py-8 flex flex-col justify-center lg:border-r border-white/10 overflow-hidden">
      {/* Demo Slideshow - Full Focus */}
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto lg:mx-0">
        <div className="w-full aspect-[4/3] sm:aspect-[3/2] lg:aspect-[4/3] border border-white/20 rounded-xl lg:rounded-2xl overflow-hidden shadow-2xl">
          <BeforeAfter
            beforeSrc={demos[currentDemo].after}
            afterSrc={demos[currentDemo].before}
            alt={demos[currentDemo].description}
          />
        </div>

        <div className="flex justify-center gap-2 sm:gap-3 mt-4 sm:mt-6">
          {demos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentDemo(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                index === currentDemo ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        <div className="text-center mt-3 sm:mt-4 md:mt-6">
          <p className="text-gray-400 text-sm sm:text-base lg:text-lg font-light mb-2 sm:mb-3 md:mb-4">
            {demos[currentDemo].description}
          </p>

          <div className="text-left max-w-xs sm:max-w-sm lg:max-w-md mx-auto">
            <p className="text-gray-500 text-xs font-light mb-2 sm:mb-3">
              Magic Eraser, Unblur, Best Take — previously Google Pixel exclusive
            </p>

            <blockquote className="border-l border-white/20 pl-3 sm:pl-4">
              <p className="text-gray-400 italic text-xs sm:text-sm lg:text-base font-light leading-relaxed">
                "I used to think this was just a Google Pixel feature.
                Now I can edit any photo like this."
              </p>
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/10">
                <p className="text-gray-500 text-xs font-light">
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