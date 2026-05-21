const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/slots - 모든 슬롯과 잔여 여부 반환
router.get('/', async (req, res) => {
  try {
    const slots = await prisma.votingSlot.findMany({
      include: {
        _count: { select: { registrations: true } },
      },
      orderBy: [{ region: 'asc' }, { stationName: 'asc' }, { date: 'asc' }, { timeSlot: 'asc' }],
    });

    const result = slots.map((slot) => ({
      id: slot.id,
      type: slot.type,
      region: slot.region,
      stationName: slot.stationName,
      buildingName: slot.buildingName,
      stationAddress: slot.stationAddress,
      date: slot.date,
      timeSlot: slot.timeSlot,
      capacity: slot.capacity,
      registeredCount: slot._count.registrations,
      isFull: slot._count.registrations >= slot.capacity,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
