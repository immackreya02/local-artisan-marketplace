import { api } from './api';

export const communicationService = {
  // Get WhatsApp direct chat link
  getWhatsAppLink: async ({ phone, productName, shopName, customMessage }) => {
    try {
      const params = new URLSearchParams();
      if (phone) params.append('phone', phone);
      if (productName) params.append('productName', productName);
      if (shopName) params.append('shopName', shopName);
      if (customMessage) params.append('customMessage', customMessage);

      return await api.get(`/communication/whatsapp-link?${params.toString()}`);
    } catch (error) {
      console.error('getWhatsAppLink error:', error);
      return { success: false, message: error.message };
    }
  },

  // Send OTP
  sendOTP: async ({ phone } = {}) => {
    try {
      return await api.post('/communication/send-otp', { phone });
    } catch (error) {
      console.error('sendOTP error:', error);
      return { success: false, message: error.message };
    }
  },

  // Verify OTP
  verifyOTP: async (otp) => {
    try {
      return await api.post('/communication/verify-otp', { otp });
    } catch (error) {
      console.error('verifyOTP error:', error);
      return { success: false, message: error.message };
    }
  },

  // Get Notification Channel Preferences
  getPreferences: async () => {
    try {
      return await api.get('/communication/preferences');
    } catch (error) {
      console.error('getPreferences error:', error);
      return { success: false, message: error.message };
    }
  },

  // Update Notification Channel Preferences
  updatePreferences: async (payload) => {
    try {
      return await api.patch('/communication/preferences', payload);
    } catch (error) {
      console.error('updatePreferences error:', error);
      return { success: false, message: error.message };
    }
  },

  // Send Test Multi-Channel Dispatch
  testDispatch: async ({ title, message }) => {
    try {
      return await api.post('/communication/test-dispatch', { title, message });
    } catch (error) {
      console.error('testDispatch error:', error);
      return { success: false, message: error.message };
    }
  }
};

