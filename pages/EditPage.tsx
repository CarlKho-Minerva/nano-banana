import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { generateEditedImage, generateFilteredImage, generateAdjustedImage } from '../services/geminiService';
import Spinner from '../components/Spinner';
import FilterPanel from '../components/FilterPanel';
import AdjustmentPanel from '../components/AdjustmentPanel';
import CropPanel from '../components/CropPanel';
import { UndoIcon, RedoIcon, EyeIcon } from '../components/icons';
import BeforeAfter from '../components/BeforeAfter';
import TestingPanel from '../components/TestingPanel';
import { sanitizePrompt, apiRateLimiter, secureStorage, sessionManager, imageStateManager, type ImageState } from '../utils/security';
import { purchaseCredits, getUserId, getUserCredits } from '../services/stripeService';

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

type Tab = 'retouch' | 'adjust' | 'filters' | 'crop';

interface EditPageProps {
  initialImage?: File;
  sessionId?: string;
}


const EditPage: React.FC<EditPageProps> = ({ initialImage, sessionId: propSessionId }) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<File[]>(initialImage ? [initialImage] : []);
  const [historyIndex, setHistoryIndex] = useState<number>(initialImage ? 0 : -1);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('retouch');

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [showBeforeAfter, setShowBeforeAfter] = useState<boolean>(false);
  const [userId] = useState<string>(() => getUserId());
  const [sessionId] = useState<string>(() => propSessionId || imageStateManager.generateSessionId());
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number>(() => {
    sessionManager.initializeSession();
    secureStorage.cleanExpired();

    const envCredits = import.meta.env.VITE_INITIAL_CREDITS;
    const initialCredits = envCredits ? parseInt(envCredits) : 3;

    if (import.meta.env.DEV && envCredits !== undefined) {
      return initialCredits;
    }

    if (!sessionManager.isSessionValid()) {
      sessionManager.clearSession();
      sessionManager.initializeSession();
      return initialCredits;
    }

    const saved = secureStorage.getItem('creditsRemaining');
    const finalCredits = saved ? parseInt(saved) : initialCredits;
    return finalCredits;
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  // Make imageStateManager available globally for console testing (dev only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).imageStateManager = imageStateManager;
      (window as any).debugStorage = () => {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes('imageState') || key?.includes('latestSession')) {
          }
        }
      };
    }
  }, [sessionId]);

  // Save initial image state for new uploads and clean up expired sessions
  useEffect(() => {

    // Clean up expired sessions first
    imageStateManager.cleanExpiredSessions(userId);

    // For new uploads, save initial state immediately
    if (initialImage && sessionId && history.length > 0) {
      const saveInitialState = async () => {
        try {
          const initialImageBase64 = await imageStateManager.fileToBase64(initialImage);
          const imageState = {
            currentImage: initialImageBase64,
            originalImage: initialImageBase64,
            history: [initialImageBase64],
            historyIndex: 0,
            editHotspot: null,
            activeTab: 'retouch' as Tab,
            prompt: '',
            sessionId,
            userId
          };

          await imageStateManager.saveImageState(imageState);
        } catch (error) {
        }
      };

      saveInitialState();
    }
  }, [userId, initialImage, history.length, historyIndex, sessionId]);

  // Additional useEffect to save state when history gets populated (backup)
  useEffect(() => {
    if (initialImage && sessionId && history.length > 0 && historyIndex === 0 && history[0] === initialImage) {
      const ensureStateSaved = async () => {
        // Check if state already exists
        const existing = imageStateManager.restoreImageStateBySession(userId, sessionId);
        if (!existing) {
          const initialImageBase64 = await imageStateManager.fileToBase64(initialImage);
          const imageState = {
            currentImage: initialImageBase64,
            originalImage: initialImageBase64,
            history: [initialImageBase64],
            historyIndex: 0,
            editHotspot: null,
            activeTab: 'retouch' as Tab,
            prompt: '',
            sessionId,
            userId
          };
          await imageStateManager.saveImageState(imageState);
        } else {
        }
      };
      ensureStateSaved();
    }
  }, [initialImage, sessionId, history.length, historyIndex, userId]);

  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Effect to create and revoke object URLs safely for the current image
  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);

  // Effect to create and revoke object URLs safely for the original image
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);

  // Handle payment success redirect and image restoration
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const stripeSessionId = urlParams.get('session_id');
    const userIdFromUrl = urlParams.get('user_id');

    if (paymentStatus === 'success' && stripeSessionId && userIdFromUrl === userId) {
      setPaymentSuccess(stripeSessionId);

      // Refresh credits from backend
      getUserCredits(userId)
        .then(credits => {
          setCreditsRemaining(credits);
          secureStorage.setItem('creditsRemaining', credits, 1440);

          // Restore image state using current session ID
          const savedState = imageStateManager.restoreImageStateBySession(userId, sessionId);

          if (savedState) {
            try {
              // Convert base64 back to File objects
              const restoredHistory = savedState.history.map((base64, index) =>
                imageStateManager.base64ToFile(base64, `restored-${index}.png`)
              );

              setHistory(restoredHistory);
              setHistoryIndex(savedState.historyIndex);
              setActiveTab(savedState.activeTab as Tab);
              setPrompt(savedState.prompt || '');
              setEditHotspot(savedState.editHotspot);


            } catch (restoreError) {
              setError('Images restored but there was an issue. You can continue editing.');
            }
          }
        })
        .catch(error => {
        });

      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);

      // Clear success message after 5 seconds
      setTimeout(() => setPaymentSuccess(null), 5000);
    } else if (paymentStatus === 'cancelled') {

      // Restore image state from current session
      const savedState = imageStateManager.restoreImageStateBySession(userId, sessionId);

      if (savedState) {
        try {
          const restoredHistory = savedState.history.map((base64, index) =>
            imageStateManager.base64ToFile(base64, `restored-${index}.png`)
          );

          setHistory(restoredHistory);
          setHistoryIndex(savedState.historyIndex);
          setActiveTab(savedState.activeTab as Tab);
          setPrompt(savedState.prompt || '');
          setEditHotspot(savedState.editHotspot);


        } catch (restoreError) {
        }
      }

      setError('Payment was cancelled. Your image has been restored and you can try purchasing credits again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [userId, sessionId]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, [history, historyIndex]);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeTab !== 'retouch') return;

    if (showBeforeAfter) {
      setShowBeforeAfter(false);
    }

    const img = e.currentTarget;
    const container = imgContainerRef.current;
    if (!container) return;

    // Get absolute position of click relative to page
    const containerRect = container.getBoundingClientRect();
    const clickX = e.clientX - containerRect.left;
    const clickY = e.clientY - containerRect.top;

    // Set display hotspot using absolute positioning
    setDisplayHotspot({
      x: clickX,
      y: clickY
    });

    // Calculate coordinates for API using image bounds
    const imgRect = img.getBoundingClientRect();
    const imgClickX = e.clientX - imgRect.left;
    const imgClickY = e.clientY - imgRect.top;

    // Convert to natural image coordinates
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    const originalX = Math.round(imgClickX * scaleX);
    const originalY = Math.round(imgClickY * scaleY);

    setEditHotspot({ x: originalX, y: originalY });
  };

  const handleGenerate = useCallback(async () => {
    if (!currentImage) {
      setError('No image loaded to edit.');
      return;
    }

    sessionManager.updateActivity();

    if (!sessionManager.isSessionValid()) {
      sessionManager.clearSession();
      setError('Session expired. Please refresh the page.');
      return;
    }

    const sanitizedPrompt = sanitizePrompt(prompt);
    if (!sanitizedPrompt.trim()) {
        setError('Please enter a valid description for your edit.');
        return;
    }

    if (!editHotspot) {
        setError('Please click on the image to select an area to edit.');
        return;
    }

    if (!apiRateLimiter.isAllowed('user')) {
      setError('Too many requests. Please wait a moment before trying again.');
      return;
    }

    if (creditsRemaining <= 0) {
      setError("No credits remaining. Purchase more to continue editing.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
        const editedImageUrl = await generateEditedImage(currentImage, sanitizedPrompt, editHotspot);
        const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
        addImageToHistory(newImageFile);

        const newCredits = creditsRemaining - 1;
        setCreditsRemaining(newCredits);
        secureStorage.setItem('creditsRemaining', newCredits, 1440);

        setEditHotspot(null);
        setDisplayHotspot(null);
        setPrompt('');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate the image. ${errorMessage}`);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, prompt, editHotspot, addImageToHistory, creditsRemaining]);

  // Other handler functions (handleApplyFilter, handleApplyAdjustment, etc.) - same as App.tsx
  const handleApplyFilter = useCallback(async (filterPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to apply a filter to.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
        const filteredImageUrl = await generateFilteredImage(currentImage, filterPrompt);
        const newImageFile = dataURLtoFile(filteredImageUrl, `filtered-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the filter. ${errorMessage}`);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyAdjustment = useCallback(async (adjustmentPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to apply an adjustment to.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
        const adjustedImageUrl = await generateAdjustedImage(currentImage, adjustmentPrompt);
        const newImageFile = dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the adjustment. ${errorMessage}`);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyCrop = useCallback(() => {
    if (!completedCrop || !imgRef.current) {
        setError('Please select an area to crop.');
        return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        setError('Could not process the crop.');
        return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );

    const croppedImageUrl = canvas.toDataURL('image/png');
    const newImageFile = dataURLtoFile(croppedImageUrl, `cropped-${Date.now()}.png`);
    addImageToHistory(newImageFile);
  }, [completedCrop, addImageToHistory]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [canUndo, historyIndex]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [canRedo, historyIndex]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setHistoryIndex(0);
      setError(null);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [history]);

  const handleDownload = useCallback(() => {
      if (currentImage) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(currentImage);
          link.download = `edited-${currentImage.name}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
      }
  }, [currentImage]);

  if (error) {
    return (
      <div className="min-h-screen text-gray-100 flex items-center justify-center">
        <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-md flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold text-red-300">An Error Occurred</h2>
          <p className="text-md text-red-400">{error}</p>
          <button
              onClick={() => setError(null)}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
            >
              Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentImageUrl) {
    return (
      <div className="min-h-screen text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No image loaded</h1>
          <p className="text-gray-400">Go back to upload an image first.</p>
        </div>
      </div>
    );
  }

  const imageDisplay = showBeforeAfter && originalImageUrl && currentImageUrl && historyIndex > 0 ? (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="max-w-full max-h-full">
        <BeforeAfter
          beforeSrc={originalImageUrl}
          afterSrc={currentImageUrl}
          alt="Photo edit comparison"
        />
      </div>
    </div>
  ) : (
    <div ref={imgContainerRef} className="relative w-full h-full flex items-center justify-center p-4">
      <img
          ref={imgRef}
          key={currentImageUrl}
          src={currentImageUrl}
          alt="Current"
          onClick={handleImageClick}
          className={`max-w-full max-h-full object-contain rounded-lg md:rounded-xl transition-opacity duration-200 ease-in-out ${isComparing ? 'opacity-0' : 'opacity-100'} ${activeTab === 'retouch' ? 'cursor-crosshair' : 'cursor-pointer'}`}
      />
      {originalImageUrl && (
          <img
              key={originalImageUrl}
              src={originalImageUrl}
              alt="Original"
              className="absolute max-w-full max-h-full object-contain rounded-lg md:rounded-xl pointer-events-none"
              style={{ opacity: isComparing ? 1 : 0 }}
          />
      )}
    </div>
  );

  const cropImageElement = (
    <img
      ref={imgRef}
      key={`crop-${currentImageUrl}`}
      src={currentImageUrl}
      alt="Crop this image"
      className="max-w-full max-h-[70vh] object-contain rounded-xl"
    />
  );

  return (
    <div className="min-h-screen text-gray-100">
      <div className="h-screen flex flex-col p-2 sm:p-3 md:p-4 gap-2 sm:gap-3 md:gap-4">
        <div className="relative flex-1 min-h-0 shadow-2xl rounded-lg md:rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
            {isLoading && (
                <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
                    <Spinner />
                    <p className="text-gray-300">AI is working its magic...</p>
                </div>
            )}

            {paymentSuccess && (
                <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg z-40 animate-fade-in">
                    <p className="font-medium">🎉 Payment successful!</p>
                    <p className="text-sm text-green-100">Credits have been added to your account</p>
                </div>
            )}

            {activeTab === 'crop' ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <ReactCrop
                  crop={crop}
                  onChange={c => setCrop(c)}
                  onComplete={c => setCompletedCrop(c)}
                  aspect={aspect}
                  className="max-w-full max-h-full"
                >
                  {cropImageElement}
                </ReactCrop>
              </div>
            ) : imageDisplay }

            {displayHotspot && !isLoading && activeTab === 'retouch' && (
                <div
                  className="absolute rounded-full w-6 h-6 bg-white/50 border-2 border-white pointer-events-none z-10"
                  style={{
                    left: `${displayHotspot.x}px`,
                    top: `${displayHotspot.y}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="absolute inset-0 rounded-full w-6 h-6 animate-ping bg-white"></div>
                </div>
            )}
        </div>

        <div className="border border-white/20 rounded-lg p-2 flex items-center justify-center gap-2 backdrop-blur-sm">
            {(['retouch', 'crop', 'adjust', 'filters'] as Tab[]).map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full capitalize font-semibold py-3 px-5 rounded-md transition-all duration-200 text-base ${
                        activeTab === tab
                        ? 'bg-white text-black'
                        : 'text-white hover:bg-white/10'
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>

        <div className="space-y-4">
            {activeTab === 'retouch' && (
                <div className="flex flex-col gap-4">
                    <div className="text-center space-y-2">
                        <p className="text-md text-gray-400">
                            {editHotspot ? 'Great! Now describe your edit.' : 'Click an area on the image to edit.'}
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <p className="text-sm text-gray-500">
                                {creditsRemaining} credits remaining
                            </p>
                            {creditsRemaining <= 0 && (
                                <button
                                    onClick={async () => {
                                        // 1. Set loading state to provide user feedback
                                        setIsPurchasing(true);
                                        setError(null);

                                        try {
                                            // 2. Prepare the image state for preservation. This is a critical async step.
                                            let imageStateToSave: Omit<ImageState, 'timestamp'> | undefined = undefined;
                                            if (history.length > 0) {
                                                
                                                // Convert all File objects in history to base64 strings
                                                const historyBase64 = await Promise.all(
                                                    history.map(file => imageStateManager.fileToBase64(file))
                                                );
                                                
                                                imageStateToSave = {
                                                    currentImage: historyBase64[historyIndex] || '',
                                                    originalImage: historyBase64[0] || '',
                                                    history: historyBase64,
                                                    historyIndex,
                                                    editHotspot,
                                                    activeTab,
                                                    prompt,
                                                    sessionId,
                                                    userId
                                                };
                                            }

                                            // 3. Call the service. It now saves state internally and returns the URL.
                                            const checkoutUrl = await purchaseCredits(userId, 50, imageStateToSave, sessionId);

                                            // 4. If we get a URL, redirect the user. This only happens AFTER state is saved.
                                            if (checkoutUrl) {
                                                window.location.href = checkoutUrl;
                                            }

                                        } catch (error) {
                                            setError(error instanceof Error ? error.message : 'Failed to start purchase. Please try again.');
                                            setIsPurchasing(false); // Stop loading on error
                                        }
                                        // No need for a `finally` block, as a successful redirect will unload the page.
                                    }}
                                    disabled={isPurchasing || isLoading} // Disable while purchasing or doing other AI work
                                    className="bg-white text-black px-4 py-2 rounded text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-60 disabled:cursor-wait"
                                >
                                    {isPurchasing ? 'Redirecting...' : 'Buy 50 Credits ($5)'}
                                </button>
                            )}
                        </div>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={editHotspot ? "e.g., 'remove this person'" : "First click a point on the image"}
                            className="flex-grow border border-white/20 text-white rounded-lg p-4 text-lg focus:ring-2 focus:ring-white focus:outline-none transition disabled:cursor-not-allowed disabled:opacity-60 bg-white/5"
                            disabled={isLoading || !editHotspot}
                        />
                        <button
                            type="submit"
                            className="bg-white text-black font-bold py-4 px-6 text-lg rounded-lg transition-all duration-200 hover:bg-gray-200 active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed"
                            disabled={isLoading || !prompt.trim() || !editHotspot}
                        >
                            Generate
                        </button>
                    </form>
                </div>
            )}
            {activeTab === 'crop' && <CropPanel onApplyCrop={handleApplyCrop} onSetAspect={setAspect} isLoading={isLoading} isCropping={!!completedCrop?.width && completedCrop.width > 0} />}
            {activeTab === 'adjust' && <AdjustmentPanel onApplyAdjustment={handleApplyAdjustment} isLoading={isLoading} />}
            {activeTab === 'filters' && <FilterPanel onApplyFilter={handleApplyFilter} isLoading={isLoading} />}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
            <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="flex items-center justify-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5"
                aria-label="Undo last action"
            >
                <UndoIcon className="w-4 h-4 mr-1" />
                Undo
            </button>
            <button
                onClick={handleRedo}
                disabled={!canRedo}
                className="flex items-center justify-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5"
                aria-label="Redo last action"
            >
                <RedoIcon className="w-4 h-4 mr-1" />
                Redo
            </button>

            {canUndo && (
              <>
                <button
                    onClick={() => {
                      setShowBeforeAfter(!showBeforeAfter);
                      if (!showBeforeAfter) {
                        setEditHotspot(null);
                        setDisplayHotspot(null);
                      }
                    }}
                    className={`flex items-center justify-center border border-white/20 font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out hover:border-white/30 active:scale-95 text-sm ${
                      showBeforeAfter ? 'bg-white text-black' : 'bg-white/10 text-gray-200 hover:bg-white/20'
                    }`}
                    aria-label="Toggle before/after comparison"
                >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    Before/After
                </button>
                <button
                    onMouseDown={() => setIsComparing(true)}
                    onMouseUp={() => setIsComparing(false)}
                    onMouseLeave={() => setIsComparing(false)}
                    onTouchStart={() => setIsComparing(true)}
                    onTouchEnd={() => setIsComparing(false)}
                    className="flex items-center justify-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-sm"
                    aria-label="Press and hold to see original image"
                >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    Quick Compare
                </button>
              </>
            )}

            <button
                onClick={handleReset}
                disabled={!canUndo}
                className="bg-transparent border border-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/10 hover:border-white/30 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-transparent"
              >
                Reset
            </button>

            <button
                onClick={async (e) => {
                  const button = e.currentTarget;
                  const originalText = button.innerHTML;
                  
                  // Show saving feedback
                  button.innerHTML = `
                    <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Saving...
                  `;
                  button.disabled = true;
                  
                  // Save current state before leaving
                  if (currentImage && sessionId) {
                    try {
                      // Convert files to base64 for storage
                      const currentImageBase64 = await imageStateManager.fileToBase64(currentImage);
                      const originalImageBase64 = history[0] ? await imageStateManager.fileToBase64(history[0]) : '';
                      const historyBase64 = await Promise.all(
                        history.map(img => imageStateManager.fileToBase64(img))
                      );
                      
                      const currentState: Omit<ImageState, 'timestamp'> = {
                        sessionId,
                        userId,
                        originalImage: originalImageBase64,
                        currentImage: currentImageBase64,
                        history: historyBase64,
                        historyIndex,
                        editHotspot,
                        prompt
                      };
                      await imageStateManager.saveImageState(currentState);
                    } catch (error) {
                      console.error('Failed to save session:', error);
                      // Restore button on error
                      button.innerHTML = originalText;
                      button.disabled = false;
                      return;
                    }
                  }
                  navigate('/');
                }}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-all duration-200 active:scale-95 text-sm"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Save & Go Back
            </button>

            <button
                onClick={handleDownload}
                className="bg-white text-black font-bold py-2 px-4 rounded-md transition-all duration-200 hover:bg-gray-200 active:scale-95 text-sm"
            >
                Download
            </button>
        </div>
      </div>

      <TestingPanel />
    </div>
  );
};

export default EditPage;