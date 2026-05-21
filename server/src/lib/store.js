// 인메모리 OTP 및 인증 토큰 저장소
const otpStore = new Map();      // phone -> { code, expiresAt, sentAt }
const verifiedTokens = new Map(); // token -> { phone, expiresAt }

// 만료된 항목 주기적 정리
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of otpStore.entries()) {
    if (v.expiresAt < now) otpStore.delete(k);
  }
  for (const [k, v] of verifiedTokens.entries()) {
    if (v.expiresAt < now) verifiedTokens.delete(k);
  }
}, 60 * 1000);

module.exports = { otpStore, verifiedTokens };
