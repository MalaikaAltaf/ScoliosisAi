/**
 * SpineAI API Client
 * Handles all communication with the FastAPI backend
 */

const API_BASE_URL = (() => {
  // In production (Docker), use relative path (proxy)
  // In development, use direct backend URL
  if (window.location.hostname === 'localhost' && window.location.port === '8000') {
    return 'http://localhost:8000';
  }
  return window.location.origin;
})();

class SpineAIClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Check backend health status
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      return null;
    }
  }

  /**
   * Send X-ray image for Cobb angle prediction
   * @param {File} imageFile - The X-ray image file (JPEG/PNG)
   * @returns {Promise<Object>} Prediction result with angles and severity
   */
  async predict(imageFile) {
    try {
      // Validate file
      if (!imageFile) {
        throw new Error('No image file provided');
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(imageFile.type)) {
        throw new Error('Invalid file type. Only JPEG and PNG are accepted.');
      }

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (imageFile.size > maxSize) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Prepare FormData
      const formData = new FormData();
      formData.append('file', imageFile);

      // Send request
      const response = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary
      });

      // Handle errors
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Prediction failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }
}

// Create global client instance
window.spineAIClient = new SpineAIClient();
