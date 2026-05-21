const express = require('express');
const crypto = require('crypto');
const { sendOtpSMS } = require('../lib/sms');
const { otpStore, verifiedTokens } = require('../lib/store');

const router = express.Router();

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/verify/send
router.post('/send', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: '연락처를 입력해 주세요.' });

  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length < 10) return res.status(400).json({ error: '올바른 연락처를 입력해 주세요.' });

  const existing = otpStore.get(cleaned);
  if (existing && Date.now() - existing.sentAt < 60 * 1000) {
    return res.status(429).json({ error: '60초 후 다시 요청해 주세요.' });
  }

  const code = generateOTP();
  otpStore.set(cleaned, { code, expiresAt: Date.now() + 5 * 60 * 1000, sentAt: Date.now() });

  try {
    await sendOtpSMS(cleaned, code);
    res.json({ success: true });
  } catch (err) {
    console.error('[OTP] 발송 실패:', err.message, err.response?.data || '');
    // OTP가 저장은 됐으므로 실패 알림 (Solapi 설정 문제일 경우)
    res.status(500).json({ error: `문자 발송에 실패했습니다. (${err.message})` });
  }
});

// POST /api/verify/check
router.post('/check', (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: '입력값이 올바르지 않습니다.' });

  const cleaned = phone.replace(/[^0-9]/g, '');
  const entry = otpStore.get(cleaned);

  if (!entry) return res.status(400).json({ error: '인증번호를 먼저 요청해 주세요.' });
  if (Date.now() > entry.expiresAt) return res.status(400).json({ error: '인증번호가 만료되었습니다. 다시 요청해 주세요.' });
  entry.attempts = (entry.attempts || 0) + 1;
  if (entry.attempts > 5) {
    otpStore.delete(cleaned);
    return res.status(429).json({ error: '시도 횟수를 초과했습니다. 인증번호를 다시 요청해 주세요.' });
  }
  if (entry.code !== code.trim()) return res.status(400).json({ error: '인증번호가 올바르지 않습니다.' });

  otpStore.delete(cleaned);

  const token = crypto.randomBytes(24).toString('hex');
  verifiedTokens.set(token, { phone: cleaned, expiresAt: Date.now() + 30 * 60 * 1000 });

  res.json({ success: true, token });
});

module.exports = router;
