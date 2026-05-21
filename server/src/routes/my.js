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

function phoneMatch(a, b) {
  const ca = a.replace(/[^0-9]/g, '');
  const cb = b.replace(/[^0-9]/g, '');
  return ca === cb || ca.includes(cb) || cb.includes(ca);
}

// POST /api/my/lookup
router.post('/lookup', async (req, res) => {
  const phone = getVerifiedPhone(req);
  if (!phone) return res.status(401).json({ error: '연락처 인증이 필요합니다.' });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: '이름을 입력해 주세요.' });

  try {
    const all = await prisma.registration.findMany({
      where: { name: name.trim() },
      include: { slot: true },
    });

    const registrations = all.filter((r) => phoneMatch(r.phone, phone));

    if (registrations.length === 0) {
      return res.status(404).json({ error: '신청 내역을 찾을 수 없습니다. 이름 또는 연락처를 확인해 주세요.' });
    }

    res.json(registrations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// PUT /api/my/:id
router.put('/:id', async (req, res) => {
  const phone = getVerifiedPhone(req);
  if (!phone) return res.status(401).json({ error: '연락처 인증이 필요합니다.' });

  try {
    const reg = await prisma.registration.findUnique({ where: { id: Number(req.params.id) } });
    if (!reg) return res.status(404).json({ error: '신청 내역을 찾을 수 없습니다.' });
    if (!phoneMatch(reg.phone, phone)) return res.status(403).json({ error: '본인의 신청만 수정할 수 있습니다.' });

    const { gender, addressDong, address, bankAccount, isMember, isSupporter } = req.body;

    const updated = await prisma.registration.update({
      where: { id: Number(req.params.id) },
      data: {
        gender: gender !== undefined ? gender : reg.gender,
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

// DELETE /api/my/:id
router.delete('/:id', async (req, res) => {
  const phone = getVerifiedPhone(req);
  if (!phone) return res.status(401).json({ error: '연락처 인증이 필요합니다.' });

  try {
    const reg = await prisma.registration.findUnique({ where: { id: Number(req.params.id) } });
    if (!reg) return res.status(404).json({ error: '신청 내역을 찾을 수 없습니다.' });
    if (!phoneMatch(reg.phone, phone)) return res.status(403).json({ error: '본인의 신청만 취소할 수 있습니다.' });
    if (reg.isConfirmed) return res.status(403).json({ error: '확정된 신청은 취소할 수 없습니다. 관리자에게 문의하세요.' });

    await prisma.registration.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
