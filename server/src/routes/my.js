const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifiedTokens } = require('../lib/store');

const router = express.Router();
const prisma = new PrismaClient();

function getVerifiedPhone(req) {
  const token = req.headers['x-verify-token'];
  if (!token) return null;
  const entry = verifiedTokens.get(token);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.phone;
}

// POST /api/my/lookup - 이름+인증된 전화번호로 신청 조회
router.post('/lookup', async (req, res) => {
  const phone = getVerifiedPhone(req);
  if (!phone) return res.status(401).json({ error: '연락처 인증이 필요합니다.' });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: '이름을 입력해 주세요.' });

  try {
    const registrations = await prisma.registration.findMany({
      where: {
        name: name.trim(),
        phone: { contains: phone },
      },
      include: { slot: true },
    });

    if (registrations.length === 0) {
      return res.status(404).json({ error: '신청 내역을 찾을 수 없습니다. 이름 또는 연락처를 확인해 주세요.' });
    }

    res.json(registrations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// PUT /api/my/:id - 신청 정보 수정
router.put('/:id', async (req, res) => {
  const phone = getVerifiedPhone(req);
  if (!phone) return res.status(401).json({ error: '연락처 인증이 필요합니다.' });

  try {
    const reg = await prisma.registration.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!reg) return res.status(404).json({ error: '신청 내역을 찾을 수 없습니다.' });
    if (!reg.phone.includes(phone) && !phone.includes(reg.phone)) {
      return res.status(403).json({ error: '본인의 신청만 수정할 수 있습니다.' });
    }

    const { gender, addressDong, address, bankAccount, isMember, isSupporter } = req.body;

    const updated = await prisma.registration.update({
      where: { id: Number(req.params.id) },
      data: {
        gender: gender || reg.gender,
        addressDong: addressDong !== undefined ? addressDong : reg.addressDong,
        address: address !== undefined ? address : reg.address,
        bankAccount: bankAccount !== undefined ? bankAccount : reg.bankAccount,
        isMember: isMember !== undefined ? Boolean(isMember) : reg.isMember,
        isSupporter: isSupporter !== undefined ? Boolean(isSupporter) : reg.isSupporter,
      },
      include: { slot: true },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
