const express = require('express');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
  }
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

// GET /api/admin/registrations
router.get('/registrations', authMiddleware, async (req, res) => {
  try {
    const registrations = await prisma.registration.findMany({
      include: { slot: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(registrations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// GET /api/admin/slots-status
router.get('/slots-status', authMiddleware, async (req, res) => {
  try {
    const slots = await prisma.votingSlot.findMany({
      include: {
        registrations: { select: { name: true, phone: true, isConfirmed: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: [{ type: 'asc' }, { region: 'asc' }, { stationName: 'asc' }, { date: 'asc' }, { timeSlot: 'asc' }],
    });
    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// DELETE /api/admin/registrations/:id
router.delete('/registrations/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.registration.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// GET /api/admin/export
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const registrations = await prisma.registration.findMany({
      include: { slot: true },
      orderBy: [{ slot: { region: 'asc' } }, { createdAt: 'asc' }],
    });

    const rows = registrations.map((r) => ({
      구분: r.slot.type === 'ELECTION_DAY' ? '선거일' : '사전투표',
      지역: r.slot.region,
      투표소명: r.slot.stationName,
      건물명: r.slot.buildingName || '',
      날짜: r.slot.date,
      시간대: r.slot.timeSlot,
      이름: r.name,
      생년월일: r.birthDate,
      성별: r.gender || '',
      연락처: r.phone,
      읍면동: r.addressDong || '',
      주소: r.address || '',
      계좌번호: r.bankAccount || '',
      당원여부: r.isMember ? 'O' : '',
      지지자여부: r.isSupporter ? 'O' : '',
      확정여부: r.isConfirmed ? '확정' : '신규',
      신청일시: r.createdAt.toLocaleString('ko-KR'),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, '신청자목록');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="registrations.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
