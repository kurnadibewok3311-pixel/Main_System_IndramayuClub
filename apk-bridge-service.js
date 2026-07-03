/**
 * Indramayu Club APK Bridge Service
 * Menghubungkan Android APK dengan Web Portal
 * Mendukung Login Social Media dan Streaming Integration
 */

class APKBridgeService {
  constructor() {
    this.baseUrl = window.location.origin;
    this.sessionKey = null;
    this.userData = null;
    this.wsConnection = null;
  }

  /**
   * Initialize APK Bridge
   * Dipanggil saat APK pertama kali membuka halaman
   */
  initAPK(apkData) {
    const { userId, userLevel, socialMedia, accessToken } = apkData;
    
    this.userData = {
      userId,
      userLevel,
      socialMedia,
      accessToken,
      loginTime: new Date().toISOString(),
      deviceInfo: this.getDeviceInfo()
    };
    
    // Simpan session
    this.saveSession();
    
    // Authenticate dengan server
    return this.authenticateUser();
  }

  /**
   * Social Media Login Handler
   * Support: Facebook, WhatsApp, TikTok, Instagram
   */
  async handleSocialLogin(platform, accessToken) {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          accessToken,
          timestamp: new Date().toISOString()
        })
      });
      
      const data = await response.json();
      if (data.success) {
        this.userData = { ...this.userData, ...data.user };
        this.saveSession();
        return { success: true, data: data.user };
      }
      return { success: false, error: data.error };
    } catch (error) {
      console.error('Social login error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Link Streaming URL
   * Sesuaikan dengan level user
   */
  getStreamingUrl(userLevel) {
    const streamingPaths = {
      level1: '/streaming/level1.html',
      level2: '/streaming/level2.html',
      sultan: '/vvip4.html',
      raja: '/vvip3.html'
    };
    
    const path = streamingPaths[userLevel] || streamingPaths.level1;
    return `${this.baseUrl}${path}?userId=${this.userData.userId}&level=${userLevel}`;
  }

  /**
   * Get Coin Portal URL
   * Portal untuk mengelola koin
   */
  getCoinPortalUrl() {
    return `${this.baseUrl}/streaming-integration.html?userId=${this.userData.userId}&level=${this.userData.userLevel}`;
  }

  /**
   * Get Upload Video URL
   * Untuk upload video ke room streaming
   */
  getUploadVideoUrl(roomId) {
    return `${this.baseUrl}/api/upload?roomId=${roomId}&userId=${this.userData.userId}&token=${this.sessionKey}`;
  }

  /**
   * Register Device
   * Simpan device info untuk tracking
   */
  async registerDevice() {
    const deviceInfo = this.getDeviceInfo();
    try {
      const response = await fetch(`${this.baseUrl}/api/devices/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userData.userId,
          ...deviceInfo,
          registerTime: new Date().toISOString()
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Device registration error:', error);
      return { success: false };
    }
  }

  /**
   * Authenticate User
   * Validasi dengan server
   */
  async authenticateUser() {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userData.userId,
          accessToken: this.userData.accessToken
        })
      });
      
      const data = await response.json();
      if (data.success) {
        this.sessionKey = data.sessionKey;
        this.saveSession();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * WebSocket Connection untuk Real-time Updates
   * Untuk notifikasi gift, reward, dll
   */
  connectWebSocket() {
    const wsUrl = `ws://${window.location.host}/api/ws`;
    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onopen = () => {
      console.log('WebSocket connected');
      this.wsConnection.send(JSON.stringify({
        type: 'auth',
        userId: this.userData.userId,
        token: this.sessionKey
      }));
    };

    this.wsConnection.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleWebSocketMessage(message);
    };

    this.wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Retry connection
      setTimeout(() => this.connectWebSocket(), 5000);
    };
  }

  /**
   * Handle WebSocket Messages
   */
  handleWebSocketMessage(message) {
    const { type, data } = message;
    
    switch(type) {
      case 'gift_received':
        this.handleGiftReceived(data);
        break;
      case 'coin_earned':
        this.handleCoinEarned(data);
        break;
      case 'reward_available':
        this.handleRewardAvailable(data);
        break;
      case 'level_up':
        this.handleLevelUp(data);
        break;
    }
  }

  /**
   * Handle Gift Received Notification
   */
  handleGiftReceived(data) {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'gift_received',
        emoji: data.emoji,
        amount: data.amount,
        from: data.fromUser
      }, '*');
    }
  }

  /**
   * Handle Coin Earned Notification
   */
  handleCoinEarned(data) {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'coin_earned',
        coinType: data.coinType,
        amount: data.amount,
        reason: data.reason
      }, '*');
    }
  }

  /**
   * Handle Reward Available
   */
  handleRewardAvailable(data) {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'reward_available',
        reward: data
      }, '*');
    }
  }

  /**
   * Handle Level Up
   */
  handleLevelUp(data) {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'level_up',
        newLevel: data.newLevel
      }, '*');
    }
  }

  /**
   * Send Message to APK
   * Untuk komunikasi 2 arah dengan APK
   */
  sendToAPK(message) {
    if (window.parent !== window) {
      window.parent.postMessage(message, '*');
    }
  }

  /**
   * Get Device Information
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * Save Session to Storage
   */
  saveSession() {
    try {
      sessionStorage.setItem('apk_session', JSON.stringify({
        userData: this.userData,
        sessionKey: this.sessionKey,
        saveTime: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Session save error:', error);
    }
  }

  /**
   * Load Session from Storage
   */
  loadSession() {
    try {
      const session = sessionStorage.getItem('apk_session');
      if (session) {
        const { userData, sessionKey } = JSON.parse(session);
        this.userData = userData;
        this.sessionKey = sessionKey;
        return true;
      }
    } catch (error) {
      console.error('Session load error:', error);
    }
    return false;
  }

  /**
   * Logout
   */
  async logout() {
    try {
      await fetch(`${this.baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userData.userId })
      });
      
      sessionStorage.removeItem('apk_session');
      this.userData = null;
      this.sessionKey = null;
      
      if (this.wsConnection) {
        this.wsConnection.close();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APKBridgeService;
}

// Global instance
const apkBridge = new APKBridgeService();
