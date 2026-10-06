const API_URL = '/api/communication';

export const communicationService = {
  // Get WhatsApp direct chat link
  getWhatsAppLink: async ({ phone, productName, shopName, customMessage }) => {
    try {
      const params = new URLSearchParams();
      if (phone) params.append('phone', phone);
      if (productName) params.append('productName', productName);
      if (shopName) params.append('shopName', shopName);
      if (customMessage) params.append('customMessage', customMessage);

      const res = await fetch(`${API_URL}/whatsapp-link?${params.toString()}`);
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('getWhatsAppLink error:', error);
      return { success: false, message: error.message };
    }
  },

  // Send OTP
  sendOTP: async () => {
    try {
      const token = localStorage.getItem('artisan_token');
      const res = await fetch(`${API_URL}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      return await res.json();
    } catch (error) {
      console.error('sendOTP error:', error);
      return { success: false, message: error.message };
    }
  },

  // Verify OTP
  verifyOTP: async (otp) => {
    try {
      const token = localStorage.getItem('artisan_token');
      const res = await fetch(`${API_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ otp })
      });
      return await res.json();
    } catch (error) {
      console.error('verifyOTP error:', error);
      return { success: false, message: error.message };
    }
  },

  // Get Notification Channel Preferences
  getPreferences: async () => {
    try {
      const token = localStorage.getItem('artisan_token');
      const res = await fetch(`${API_URL}/preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (error) {
      console.error('getPreferences error:', error);
      return { success: false, message: error.message };
    }
  },

  // Update Notification Channel Preferences
  updatePreferences: async (payload) => {
    try {
      const token = localStorage.getItem('artisan_token');
      const res = await fetch(`${API_URL}/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (error) {
      console.error('updatePreferences error:', error);
      return { success: false, message: error.message };
    }
  },

  // Send Test Multi-Channel Dispatch
  testDispatch: async ({ title, message }) => {
    try {
      const token = localStorage.getItem('artisan_token');
      const res = await fetch(`${API_URL}/test-dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, message })
      });
      return await res.json();
    } catch (error) {
      console.error('testDispatch error:', error);
      return { success: false, message: error.message };
    }
  }
};
