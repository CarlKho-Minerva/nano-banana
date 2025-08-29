import React, { useState } from 'react';
import { imageStateManager } from '../utils/security';

const TestingPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const createTestImageData = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 50, 50);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(50, 0, 50, 50);
      ctx.fillStyle = '#0000ff';
      ctx.fillRect(0, 50, 50, 50);
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(50, 50, 50, 50);
    }
    
    return canvas.toDataURL('image/png');
  };

  const runImageStateTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      addResult('🧪 Starting Image State Preservation Test...');
      
      const testImageBase64 = createTestImageData();
      const testState = {
        currentImage: testImageBase64,
        originalImage: testImageBase64,
        history: [testImageBase64],
        historyIndex: 0,
        editHotspot: { x: 50, y: 50 },
        activeTab: 'retouch',
        prompt: 'test prompt'
      };
      
      addResult('📊 Test state created');
      
      // Test 1: Save image state
      addResult('📝 Test 1: Saving image state...');
      const saveResult = await imageStateManager.saveImageState(testState);
      addResult(saveResult ? '✅ Save successful' : '❌ Save failed');
      
      // Test 2: Restore image state
      addResult('📝 Test 2: Restoring image state...');
      const restoredState = imageStateManager.restoreImageState();
      addResult(restoredState ? '✅ Restore successful' : '❌ Restore failed');
      
      if (restoredState) {
        const isValid = (
          restoredState.currentImage === testState.currentImage &&
          restoredState.originalImage === testState.originalImage &&
          restoredState.historyIndex === testState.historyIndex &&
          restoredState.activeTab === testState.activeTab &&
          restoredState.prompt === testState.prompt
        );
        
        addResult(isValid ? '✅ Data integrity verified' : '❌ Data integrity failed');
      }
      
      // Test 3: File conversion
      addResult('📝 Test 3: Testing file conversion...');
      try {
        const file = imageStateManager.base64ToFile(testImageBase64, 'test.png');
        addResult(`✅ Base64 to File conversion successful: ${file.name} (${file.size} bytes)`);
        
        const convertedBase64 = await imageStateManager.fileToBase64(file);
        const conversionMatch = convertedBase64 === testImageBase64;
        addResult(conversionMatch ? '✅ Round-trip conversion successful' : '❌ Round-trip conversion failed');
      } catch (error) {
        addResult(`❌ File conversion failed: ${error}`);
      }
      
      // Test 4: Compression
      addResult('📝 Test 4: Testing image compression...');
      try {
        const compressed = await imageStateManager.compressImage(testImageBase64, 0.8);
        addResult('✅ Image compression successful');
        addResult(`📊 Original size: ${testImageBase64.length} bytes`);
        addResult(`📊 Compressed size: ${compressed.length} bytes`);
        addResult(`📊 Compression ratio: ${((1 - compressed.length / testImageBase64.length) * 100).toFixed(1)}%`);
      } catch (error) {
        addResult(`❌ Image compression failed: ${error}`);
      }
      
      imageStateManager.clearImageState();
      addResult('🎉 Image State Preservation Test Complete!');
      
    } catch (error) {
      addResult(`❌ Test failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const simulatePaymentFlow = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      addResult('💳 Starting Payment Flow Simulation...');
      
      const testImageBase64 = createTestImageData();
      const testUserId = 'test_user_123';
      const testSessionId = 'test_session_' + Date.now();
      
      const mockImageState = {
        currentImage: testImageBase64,
        originalImage: testImageBase64,
        history: [testImageBase64],
        historyIndex: 0,
        editHotspot: { x: 25, y: 25 },
        activeTab: 'retouch',
        prompt: 'payment flow test',
        sessionId: testSessionId,
        userId: testUserId
      };
      
      // Step 1: Simulate pre-purchase save
      addResult(`1️⃣ Simulating pre-purchase save (session: ${testSessionId})...`);
      const saveSuccess = await imageStateManager.saveImageState(mockImageState);
      addResult(saveSuccess ? '✅ Pre-purchase save successful' : '❌ Pre-purchase save failed');
      
      // Step 2: Simulate payment redirect (just a delay)
      addResult('2️⃣ Simulating payment redirect and processing...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 3: Simulate payment return and restoration
      addResult('3️⃣ Simulating payment return and image restoration...');
      
      // Try session-based restoration first
      let restoredState = imageStateManager.restoreImageStateBySession(testUserId, testSessionId);
      
      if (!restoredState) {
        addResult('ℹ️ Session-based restoration failed, trying latest state...');
        restoredState = imageStateManager.restoreLatestImageState(testUserId);
      }
      
      if (!restoredState) {
        addResult('ℹ️ Latest state restoration failed, trying legacy method...');
        restoredState = imageStateManager.restoreImageState();
      }
      
      if (restoredState) {
        addResult('✅ Image state successfully restored after payment');
        addResult(`📸 Restored image data available: ${!!restoredState.currentImage}`);
        addResult(`🎯 Restored hotspot: x:${restoredState.editHotspot?.x}, y:${restoredState.editHotspot?.y}`);
        addResult(`📝 Restored prompt: "${restoredState.prompt}"`);
        addResult(`🆔 Session ID: ${restoredState.sessionId || 'legacy'}`);
        
        // Step 4: Clean up
        imageStateManager.clearImageState(testUserId, testSessionId);
        addResult('🧹 Test cleanup complete');
      } else {
        addResult('❌ Failed to restore image state after payment simulation');
        addResult('🔍 This could indicate an issue with state preservation or restoration logic');
      }
      
      addResult('🎉 Payment Flow Simulation Complete!');
      
    } catch (error) {
      addResult(`❌ Payment flow simulation failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testBackendConnection = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      addResult('🔗 Testing backend connection...');
      
      // Test health endpoint
      const healthResponse = await fetch('http://localhost:3001/api/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        addResult(`✅ Backend health check passed: ${healthData.status}`);
      } else {
        addResult(`❌ Backend health check failed: ${healthResponse.status}`);
        return;
      }
      
      // Test Stripe endpoint
      addResult('🔗 Testing Stripe checkout creation...');
      const stripeResponse = await fetch('http://localhost:3001/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'test_user_123',
          credits: 50,
          sessionId: 'test_session_123'
        })
      });
      
      if (stripeResponse.ok) {
        const stripeData = await stripeResponse.json();
        addResult(`✅ Stripe session created successfully: ${stripeData.sessionId}`);
      } else {
        const errorText = await stripeResponse.text();
        addResult(`❌ Stripe session creation failed: ${stripeResponse.status} - ${errorText}`);
      }
      
    } catch (error) {
      addResult(`❌ Backend connection test failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-800 border border-gray-600 rounded-lg p-4 z-50 max-h-96 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">🧪 Testing Panel</h3>
        <button
          onClick={clearResults}
          className="text-gray-400 hover:text-white text-sm"
        >
          Clear
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={testBackendConnection}
          disabled={isRunning}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          {isRunning ? 'Testing...' : 'Backend Test'}
        </button>
        <button
          onClick={runImageStateTest}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          {isRunning ? 'Running...' : 'State Test'}
        </button>
        <button
          onClick={simulatePaymentFlow}
          disabled={isRunning}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          {isRunning ? 'Running...' : 'Payment Flow'}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-gray-900 rounded p-2">
        {testResults.length === 0 ? (
          <div className="text-gray-400 text-sm">
            Click a test button to run validation tests
          </div>
        ) : (
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <div key={index} className="text-xs text-gray-300 font-mono leading-tight">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestingPanel;