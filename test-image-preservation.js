/**
 * Test Script for Image State Preservation
 * 
 * This script creates a comprehensive test for the credit purchase flow
 * with image state preservation. Run this in the browser console.
 */

// Mock image data for testing
const createTestImageData = () => {
  // Create a simple test image as base64
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  
  // Draw a simple test pattern
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, 50, 50);
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(50, 0, 50, 50);
  ctx.fillStyle = '#0000ff';
  ctx.fillRect(0, 50, 50, 50);
  ctx.fillStyle = '#ffff00';
  ctx.fillRect(50, 50, 50, 50);
  
  return canvas.toDataURL('image/png');
};

// Test image state preservation
const testImageStatePreservation = async () => {
  console.log('🧪 Starting Image State Preservation Test...');
  
  try {
    // Import the imageStateManager (assuming it's available globally or via window)
    const { imageStateManager } = window;
    
    if (!imageStateManager) {
      console.error('❌ imageStateManager not found - make sure you\'re on the edit page');
      return;
    }
    
    // Create test image state
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
    
    console.log('📊 Test state created:', testState);
    
    // Test 1: Save image state
    console.log('📝 Test 1: Saving image state...');
    const saveResult = await imageStateManager.saveImageState(testState);
    console.log(saveResult ? '✅ Save successful' : '❌ Save failed');
    
    // Test 2: Restore image state
    console.log('📝 Test 2: Restoring image state...');
    const restoredState = imageStateManager.restoreImageState();
    console.log(restoredState ? '✅ Restore successful' : '❌ Restore failed');
    
    if (restoredState) {
      console.log('🔍 Restored state:', restoredState);
      
      // Validate restored data
      const isValid = (
        restoredState.currentImage === testState.currentImage &&
        restoredState.originalImage === testState.originalImage &&
        restoredState.historyIndex === testState.historyIndex &&
        restoredState.activeTab === testState.activeTab &&
        restoredState.prompt === testState.prompt
      );
      
      console.log(isValid ? '✅ Data integrity verified' : '❌ Data integrity failed');
    }
    
    // Test 3: File conversion
    console.log('📝 Test 3: Testing file conversion...');
    try {
      const file = imageStateManager.base64ToFile(testImageBase64, 'test.png');
      console.log('✅ Base64 to File conversion successful:', file);
      
      const convertedBase64 = await imageStateManager.fileToBase64(file);
      const conversionMatch = convertedBase64 === testImageBase64;
      console.log(conversionMatch ? '✅ Round-trip conversion successful' : '❌ Round-trip conversion failed');
    } catch (error) {
      console.error('❌ File conversion failed:', error);
    }
    
    // Test 4: Compression
    console.log('📝 Test 4: Testing image compression...');
    try {
      const compressed = await imageStateManager.compressImage(testImageBase64, 0.8);
      console.log('✅ Image compression successful');
      console.log(`📊 Original size: ${testImageBase64.length} bytes`);
      console.log(`📊 Compressed size: ${compressed.length} bytes`);
      console.log(`📊 Compression ratio: ${((1 - compressed.length / testImageBase64.length) * 100).toFixed(1)}%`);
    } catch (error) {
      console.error('❌ Image compression failed:', error);
    }
    
    // Test 5: Storage limits
    console.log('📝 Test 5: Testing storage limits...');
    const largeHistory = Array(10).fill(testImageBase64);
    const largeState = { ...testState, history: largeHistory };
    
    const largeSaveResult = await imageStateManager.saveImageState(largeState);
    console.log(largeSaveResult ? '✅ Large state save successful' : '⚠️ Large state save failed (expected for very large data)');
    
    // Clean up
    console.log('🧹 Cleaning up test data...');
    imageStateManager.clearImageState();
    
    console.log('🎉 Image State Preservation Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Payment flow simulation test
const simulatePaymentFlow = async () => {
  console.log('💳 Starting Payment Flow Simulation...');
  
  try {
    const testImageBase64 = createTestImageData();
    const mockImageState = {
      currentImage: testImageBase64,
      originalImage: testImageBase64,
      history: [testImageBase64],
      historyIndex: 0,
      editHotspot: { x: 25, y: 25 },
      activeTab: 'retouch',
      prompt: 'payment flow test'
    };
    
    // Step 1: Simulate pre-purchase save
    console.log('1️⃣ Simulating pre-purchase image state save...');
    const saveSuccess = await window.imageStateManager?.saveImageState(mockImageState);
    console.log(saveSuccess ? '✅ Pre-purchase save successful' : '❌ Pre-purchase save failed');
    
    // Step 2: Simulate payment redirect (just a delay)
    console.log('2️⃣ Simulating payment redirect and processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Simulate payment return and restoration
    console.log('3️⃣ Simulating payment return and image restoration...');
    const restoredState = window.imageStateManager?.restoreImageState();
    
    if (restoredState) {
      console.log('✅ Image state successfully restored after payment');
      console.log('📸 Restored image data available:', !!restoredState.currentImage);
      console.log('🎯 Restored hotspot:', restoredState.editHotspot);
      console.log('📝 Restored prompt:', restoredState.prompt);
      
      // Step 4: Clean up
      window.imageStateManager?.clearImageState();
      console.log('🧹 Test cleanup complete');
    } else {
      console.error('❌ Failed to restore image state after payment simulation');
    }
    
    console.log('🎉 Payment Flow Simulation Complete!');
    
  } catch (error) {
    console.error('❌ Payment flow simulation failed:', error);
  }
};

// Export functions for manual testing
window.testImageStatePreservation = testImageStatePreservation;
window.simulatePaymentFlow = simulatePaymentFlow;

console.log(`
🧪 IMAGE STATE PRESERVATION TEST SUITE LOADED

Available test functions:
- testImageStatePreservation(): Comprehensive functionality test
- simulatePaymentFlow(): End-to-end payment flow simulation

To run tests:
1. Navigate to the edit page with an image loaded
2. Open browser console
3. Run: testImageStatePreservation()
4. Run: simulatePaymentFlow()

These tests will validate:
✓ Image state saving and restoration
✓ Data integrity and validation  
✓ File format conversions
✓ Image compression
✓ Storage limit handling
✓ Complete payment flow simulation
`);