# Indramayu Club Coin System

## 📱 Sistem Koin Terintegrasi untuk Android APK + Web Streaming

Sistem koin yang menghubungkan aplikasi Android dengan portal streaming web.

### 🪙 Jenis Koin

1. **RpNur (💰 Rupiah)**
   - Koin utama dengan nilai rupiah
   - Dapat digunakan untuk gifting
   - Dipengaruhi oleh level user (multiplier)
   - Desimal: 0 (integer)

2. **GifNur (🎁 Gift Points)**
   - Poin untuk hadiah khusus
   - Bisa ditukar dengan voucher
   - Nilai decimal
   - Desimal: 2 (0.00)

3. **VoucherNur (🎫 Voucher)**
   - Tiket untuk akses konten premium
   - Integer (bilangan bulat)
   - Desimal: 0

### 📊 Level User & Multiplier

| Level | Nama | Multiplier | Max Daily Earn |
|-------|------|------------|----------------|
| 1 | Level 1 | 1.0x | 50,000 RpNur |
| 2 | Level 2 | 1.5x | 100,000 RpNur |
| Sultan | Sultan | 2.5x | 250,000 RpNur |
| Raja | Raja | 3.5x | 500,000 RpNur |

### 💎 Reward Schedule

#### Daily Login
- **Level 1**: 5,000 RpNur + 0.5 GifNur
- **Level 2**: 7,500 RpNur + 0.75 GifNur
- **Sultan**: 12,500 RpNur + 1.25 GifNur
- **Raja**: 17,500 RpNur + 1.75 GifNur

#### Streaming Activity
- Per jam streaming: 1,000 RpNur + 0.1 GifNur + 1 VoucherNur
- Per jam watching: 500 RpNur + 0.05 GifNur
- Gifting: 2,000 RpNur base

### 🔧 Implementasi di APK

#### 1. Koneksi Initial

```javascript
const apkData = {
  userId: 'user123',
  userLevel: 'sultan',
  socialMedia: 'facebook',
  accessToken: 'token_xxxxx'
};

const result = await apkBridge.initAPK(apkData);
```

#### 2. Social Media Login

```javascript
const result = await apkBridge.handleSocialLogin('facebook', accessToken);
if (result.success) {
  // Redirect ke streaming portal
  window.location = apkBridge.getStreamingUrl(result.data.userLevel);
}
```

#### 3. Get Streaming URL

```javascript
// URL otomatis sesuai level
const streamUrl = apkBridge.getStreamingUrl('sultan');
// Hasil: /vvip4.html?userId=user123&level=sultan
```

#### 4. Coin Portal

```javascript
const coinPortalUrl = apkBridge.getCoinPortalUrl();
// Hasil: /streaming-integration.html?userId=user123&level=sultan
```

#### 5. Upload Video

```javascript
const uploadUrl = apkBridge.getUploadVideoUrl('M005');
// Hasil: /api/upload?roomId=M005&userId=user123&token=...
```

### 📡 WebSocket Real-time Updates

```javascript
// Connect ke WebSocket
apkBridge.connectWebSocket();

// Terima notifikasi real-time
window.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  if (type === 'gift_received') {
    console.log(`Menerima gift: ${data.emoji} dari ${data.from}`);
  }
  
  if (type === 'coin_earned') {
    console.log(`Earning: +${data.amount} ${data.coinType}`);
  }
});
```

### 🎬 Streaming Portal URLs

**Level 1 & 2 (4 Streamer)**
```
/streaming-integration.html?userId=USER&level=level1
Member: M001, M002, M003, M004
```

**Sultan (6 Streamer Besar)**
```
/vvip4.html?userId=USER&level=sultan
Member: M005-M010 (BESAR)
```

**Raja (4 Streamer)**
```
/vvip3.html?userId=USER&level=raja
Member: M001-M004 + M007-M010 (Mix)
```

### 📝 Transaction History

Setiap transaksi dicatat dengan detail:
- Timestamp
- Jenis koin
- Jumlah
- Tipe transaksi (reward, spend, gift, etc)
- Deskripsi
- Balance akhir

### 🛡️ Security Notes

- Session key generated per session
- Token verification setiap request
- Social media access token encrypted
- Device fingerprinting untuk fraud detection
- Max 100 transaction history disimpan

### 📂 File Structure

```
├── coin-system-api.js          # Core coin system
├── streaming-integration.html  # Portal coin + streaming
├── apk-bridge-service.js       # APK bridge & WebSocket
├── BANKMAKRIFAT.html          # Kasir AI (tidak berubah)
├── vvip4.html                 # Sultan Portal
├── vvip3.html                 # Raja Portal
├── vvip2.html                 # Level 2 Portal (baru)
└── perempuan_khusus.html      # Special portal (baru)
```

### 🚀 Quick Start di Android APK

```javascript
// 1. Inject di WebView saat load
webView.addJavascriptInterface(
  new APKInterface(), 
  "androidAPK"
);

// 2. Tangkap callback dari JS
window.androidAPK.onGiftReceived(emoji, amount);

// 3. Gunakan coin system
const coins = new CoinSystem(userId, level);
coins.throwGift('rpnur', 1000, 'M005', '💰');
```

### 🔗 Links untuk Deploy

**GitHub Link:**
https://github.com/indramayuclubmakrifat-tech/Main_System_IndramayuClub/

**Streaming Portals:**
- Level 1: `https://[domain]/streaming-integration.html`
- Sultan: `https://[domain]/vvip4.html`
- Raja: `https://[domain]/vvip3.html`

---

**Created**: 2026-07-03  
**Version**: 1.0.0  
**Status**: Active 🟢
