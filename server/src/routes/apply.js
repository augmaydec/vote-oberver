const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { sendRegistrationSMS } = require('../lib/sms');
const { verifiedTokens } = require('../lib/store');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { slotId, name, birthDate, gender, phone, addressDong, address, bankAccount, isMember, isSupporter, verifyToken } = req.body;

  if (!slotId || !name || !phone || !birthDate || !addressDong || !address || !bankAccount) {
    return res.status(400).json({ error: '필수 항목을 모두 입력해 주세요.' });
  }

  const tokenEntry = verifiedTokens.get(verifyToken);
  const cleanedPhone = phone.replace(/[^0-9]/g, '');
  if (!tokenEntry || Date.now() > tokenEntry.expiresAt || tokenEntry.phone !== cleanedPhone) {
    return res.status(400).json({ error: '연락처 인증이 필요합니다.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const slot = await tx.votingSlot.findUnique({
        where: { id: Number(slotId) },
        include: { _count: { select: { registrations: true } } },
      });

      if (!slot) throw new Error('존재하지 않는 투표소입니다.');
      if (slot._count.registrations >= slot.capacity) throw new Error('마감된 시간대입니다.');

      return await tx.registration.create({
        data: {
          slotId: slot.id,
          name: name.trim(),
          birthDate: birthDate.trim(),
          gender: gender || null,
          phone: phone.trim(),
          addressDong: addressDong.trim(),
          address: address.trim(),
          bankAccount: bankAccount.trim(),
          isMember: Boolean(isMember),
          isSupporter: Boolean(isSupporter),
        },
        include: { slot: true },
      });
    });

    verifiedTokens.delete(verifyToken);

    sendRegistrationSMS(phone, {
      name,
      stationName: result.slot.stationName,
      buildingName: result.slot.buildingName,
      date: result.slot.date,
      timeSlot: result.slot.timeSlot,
    });

    res.json({ success: true, message: '신청이 완료되었습니다.', id: result.id });
  } catch (err) {
    if (err.message === '마감된 시간대입니다.' || err.message === '존재하지 않는 투표소입니다.') {
      return res.status(409).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
