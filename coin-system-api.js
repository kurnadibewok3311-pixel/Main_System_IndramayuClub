/**
 * Indramayu Club Coin System API
 * Terintegrasi dengan Android APK + Streaming Portal
 * Support: RpNur, GifNur, VoucherNur untuk Level 1, 2, Sultan, Raja
 */

const COIN_CONFIG = {
  levels: {
    level1: { name: 'Level 1', multiplier: 1, maxDailyEarn: 50000 },
    level2: { name: 'Level 2', multiplier: 1.5, maxDailyEarn: 100000 },
    sultan: { name: 'Sultan', multiplier: 2.5, maxDailyEarn: 250000 },
    raja: { name: 'Raja', multiplier: 3.5, maxDailyEarn: 500000 }
  },
  coins: {
    rpnur: { name: 'RpNur (Rupiah)', icon: '💰', decimals: 0 },
    gifnur: { name: 'GifNur (Gift)', icon: '🎁', decimals: 2 },
    vouchernur: { name: 'VoucherNur', icon: '🎫', decimals: 0 }
  },
  rewards: {
    dailyLogin: { rpnur: 5000, gifnur: 0.5 },
    streaming: { rpnur: 1000, gifnur: 0.1, vouchernur: 1 },
    watching: { rpnur: 500, gifnur: 0.05 },
    gifting: { rpnur: 2000 }
  }
};

class CoinSystem {
  constructor(userId, userLevel = 'level1') {
    this.userId = userId;
    this.userLevel = userLevel;
    this.storageKey = `coins_${userId}`;
    this.initData();
  }

  initData() {
    const existing = this.getFromStorage();
    if (!existing) {
      this.data = {
        rpnur: 0,
        gifnur: 0,
        vouchernur: 0,
        lastLogin: null,
        totalEarned: 0,
        transactions: []
      };
      this.saveToStorage();
    } else {
      this.data = existing;
    }
  }

  // Storage Operations
  getFromStorage() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey));
    } catch (e) {
      console.error('Storage read error:', e);
      return null;
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }

  // Coin Operations
  addRpNur(amount, reason = 'reward') {
    const multiplied = amount * COIN_CONFIG.levels[this.userLevel].multiplier;
    this.data.rpnur += multiplied;
    this.data.totalEarned += multiplied;
    this.logTransaction('rpnur', multiplied, reason);
    this.saveToStorage();
    return { success: true, amount: multiplied, coin: 'rpnur', reason };
  }

  addGifNur(amount, reason = 'reward') {
    const multiplied = amount * COIN_CONFIG.levels[this.userLevel].multiplier;
    this.data.gifnur += multiplied;
    this.data.totalEarned += multiplied;
    this.logTransaction('gifnur', multiplied, reason);
    this.saveToStorage();
    return { success: true, amount: multiplied, coin: 'gifnur', reason };
  }

  addVoucherNur(amount, reason = 'reward') {
    this.data.vouchernur += amount;
    this.data.totalEarned += amount;
    this.logTransaction('vouchernur', amount, reason);
    this.saveToStorage();
    return { success: true, amount, coin: 'vouchernur', reason };
  }

  spendCoin(coinType, amount, description = '') {
    if (this.data[coinType] >= amount) {
      this.data[coinType] -= amount;
      this.logTransaction(coinType, -amount, 'spend', description);
      this.saveToStorage();
      return { success: true, remaining: this.data[coinType] };
    }
    return { success: false, error: 'Insufficient balance' };
  }

  // Daily Login Reward
  claimDailyReward() {
    const today = new Date().toDateString();
    if (this.data.lastLogin === today) {
      return { success: false, error: 'Already claimed today' };
    }
    
    const reward = COIN_CONFIG.rewards.dailyLogin;
    this.addRpNur(reward.rpnur, 'daily_login');
    if (reward.gifnur > 0) this.addGifNur(reward.gifnur, 'daily_login');
    
    this.data.lastLogin = today;
    this.saveToStorage();
    
    return { 
      success: true, 
      reward: { rpnur: reward.rpnur * COIN_CONFIG.levels[this.userLevel].multiplier, gifnur: reward.gifnur * COIN_CONFIG.levels[this.userLevel].multiplier },
      message: 'Daily reward claimed!' 
    };
  }

  // Streaming Rewards
  earnFromStreaming(durationMinutes, roomId) {
    const streamReward = COIN_CONFIG.rewards.streaming;
    const earnMultiplier = Math.min(durationMinutes / 60, 1); // Cap at 1x per hour
    
    this.addRpNur(streamReward.rpnur * earnMultiplier, `streaming_${roomId}`);
    this.addGifNur(streamReward.gifnur * earnMultiplier, `streaming_${roomId}`);
    this.addVoucherNur(streamReward.vouchernur, `streaming_${roomId}`);
    
    return {
      success: true,
      earned: {
        rpnur: streamReward.rpnur * earnMultiplier,
        gifnur: streamReward.gifnur * earnMultiplier,
        vouchernur: streamReward.vouchernur
      }
    };
  }

  // Gift Throwing (from viewing)
  throwGift(coinType, amount, targetRoomId, emoji) {
    const result = this.spendCoin(coinType, amount, `gift_to_${targetRoomId}`);
    if (result.success) {
      return {
        success: true,
        targetRoom: targetRoomId,
        emoji,
        amount,
        timestamp: new Date().toISOString()
      };
    }
    return result;
  }

  // Transaction Log
  logTransaction(coinType, amount, type, description = '') {
    this.data.transactions.push({
      timestamp: new Date().toISOString(),
      coinType,
      amount,
      type,
      description,
      balance: this.data[coinType]
    });
    // Keep last 100 transactions
    if (this.data.transactions.length > 100) {
      this.data.transactions.shift();
    }
  }

  // Get balance info
  getBalance() {
    return {
      rpnur: Math.floor(this.data.rpnur),
      gifnur: this.data.gifnur.toFixed(2),
      vouchernur: Math.floor(this.data.vouchernur),
      totalEarned: Math.floor(this.data.totalEarned),
      lastLogin: this.data.lastLogin
    };
  }

  // Get recent transactions
  getTransactionHistory(limit = 20) {
    return this.data.transactions.slice(-limit).reverse();
  }

  // API Response Format
  toJSON() {
    return {
      userId: this.userId,
      level: this.userLevel,
      balance: this.getBalance(),
      levelConfig: COIN_CONFIG.levels[this.userLevel]
    };
  }
}

// Export for Node/Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CoinSystem, COIN_CONFIG };
}
