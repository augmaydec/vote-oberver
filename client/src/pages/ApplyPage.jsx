import { useState, useEffect, useMemo } from 'react';
import { fetchSlots, submitApply, sendVerifyCode, checkVerifyCode } from '../api';

const REGION_ORDER = [
  '진위면','서탄면','중앙동','서정동','송탄동','지산동','송북동',
  '신장1동','신장2동','신평동','원평동','통복동',
  '비전1동','비전2동','세교동','용이동','동삭동',
];

function StatusTable({ slots }) {
  const preVoteDates = ['5월29일', '5월30일'];
  const times = ['오전', '오후'];

  const preVote = {};
  const election = { 오전: { total: 0, filled: 0 }, 오후: { total: 0, filled: 0 } };

  for (const d of preVoteDates) {
    preVote[d] = {};
    for (const t of times) preVote[d][t] = { total: 0, filled: 0 };
  }

  for (const s of slots) {
    if (s.type === 'PRE_VOTE') {
      if (preVote[s.date]?.[s.timeSlot]) {
        preVote[s.date][s.timeSlot].total++;
        if (s.isFull) preVote[s.date][s.timeSlot].filled++;
      }
    } else {
      if (election[s.timeSlot]) {
        election[s.timeSlot].total++;
        if (s.isFull) election[s.timeSlot].filled++;
      }
    }
  }

  const Cell = ({ stat }) => (
    <td className="px-3 py-2 text-center">
      <span className={`font-bold ${stat.filled === stat.total ? 'text-red-500' : 'text-green-600'}`}>
        {stat.total - stat.filled}
      </span>
      <span className="text-gray-400 text-xs">/{stat.total}</span>
    </td>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 overflow-x-auto">
      <h2 className="text-sm font-bold text-gray-600 mb-3">신청 현황 (잔여/전체)</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 border-b">
            <th className="px-3 py-2 text-left">구분</th>
            <th className="px-3 py-2 text-center">오전 06~12시</th>
            <th className="px-3 py-2 text-center">오후 12~18시</th>
          </tr>
        </thead>
        <tbody>
          {preVoteDates.map((d) => (
            <tr key={d} className="border-b last:border-0">
              <td className="px-3 py-2 font-medium text-orange-600">사전투표 {d}</td>
              <Cell stat={preVote[d]['오전']} />
              <Cell stat={preVote[d]['오후']} />
            </tr>
          ))}
          <tr>
            <td className="px-3 py-2 font-medium text-blue-600">선거일 6월3일</td>
            <Cell stat={election['오전']} />
            <Cell stat={election['오후']} />
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-2">* 숫자: 잔여 슬롯 수 (0이면 마감)</p>
    </div>
  );
}

function PhoneVerify({ phone, setPhone, onVerified }) {
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleSend() {
    setError('');
    setSending(true);
    try {
      await sendVerifyCode(phone);
      setCodeSent(true);
      setCooldown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleCheck() {
    setError('');
    setChecking(true);
    try {
      const token = await checkVerifyCode(phone, code);
      onVerified(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-600">
        연락처 <span className="text-primary">*</span>
      </label>
      <div className="flex gap-2">
        <input
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setCodeSent(false); setCode(''); }}
          type="tel"
          placeholder="010-0000-0000"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || cooldown > 0 || !phone}
          className="shrink-0 px-3 py-2 bg-gray-700 text-white rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-50 transition"
        >
          {sending ? '발송 중...' : cooldown > 0 ? `${cooldown}초` : codeSent ? '재발송' : '인증번호 발송'}
        </button>
      </div>
      {codeSent && (
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            placeholder="인증번호 6자리"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={handleCheck}
            disabled={checking || code.length !== 6}
            className="shrink-0 px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark disabled:opacity-50 transition"
          >
            {checking ? '확인 중...' : '인증 확인'}
          </button>
        </div>
      )}
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

export default function ApplyPage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [voteType, setVoteType] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const [form, setForm] = useState({
    name: '', birthDate: '', gender: '', phone: '',
    addressDong: '', address: '', bankAccount: '',
    isMember: false, isSupporter: false,
  });
  const [verifyToken, setVerifyToken] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchSlots()
      .then(setSlots)
      .catch(() => setError('슬롯 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  function handleVoteType(type) {
    setVoteType(type);
    setSelectedRegion(''); setSelectedStation('');
    setSelectedDate(''); setSelectedSlotId(null);
  }

  const filteredSlots = useMemo(() => slots.filter((s) => s.type === voteType), [slots, voteType]);
  const regions = useMemo(() => REGION_ORDER.filter((r) => filteredSlots.some((s) => s.region === r)), [filteredSlots]);
  const stationsForRegion = useMemo(() => [...new Set(filteredSlots.filter((s) => s.region === selectedRegion).map((s) => s.stationName))], [filteredSlots, selectedRegion]);
  const datesForStation = useMemo(() => voteType === 'ELECTION_DAY' ? ['6월3일'] : [...new Set(filteredSlots.filter((s) => s.stationName === selectedStation).map((s) => s.date))], [filteredSlots, selectedStation, voteType]);
  const timeSlotsForDate = useMemo(() => filteredSlots.filter((s) => s.stationName === selectedStation && s.date === selectedDate), [filteredSlots, selectedStation, selectedDate]);

  function handleRegion(r) { setSelectedRegion(r); setSelectedStation(''); setSelectedDate(''); setSelectedSlotId(null); }
  function handleStation(s) { setSelectedStation(s); setSelectedDate(voteType === 'ELECTION_DAY' ? '6월3일' : ''); setSelectedSlotId(null); }
  function handleDate(d) { setSelectedDate(d); setSelectedSlotId(null); }
  function handleTime(slot) { if (!slot.isFull) setSelectedSlotId(slot.id); }
  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!verifyToken) { alert('연락처 인증을 완료해 주세요.'); return; }
    setShowConfirm(true);
  }

  async function handleConfirmedSubmit() {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      await submitApply({ slotId: selectedSlotId, ...form, verifyToken });
      setDone(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedSlotInfo = slots.find((s) => s.id === selectedSlotId);
  const stepNum = (n) => voteType === 'PRE_VOTE' ? n : n - 1;

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">불러오는 중...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-primary mb-2">신청 완료!</h2>
        <p className="text-gray-600 mb-4">투표참관인 신청이 완료되었습니다.<br />확인 문자가 발송되었습니다.</p>
        {selectedSlotInfo && (
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-left space-y-1 mb-4">
            <div><span className="font-semibold">투표소:</span> {selectedSlotInfo.stationName}</div>
            <div><span className="font-semibold">장소:</span> {selectedSlotInfo.buildingName}</div>
            <div><span className="font-semibold">일시:</span> {selectedSlotInfo.date} {selectedSlotInfo.timeSlot === '오전' ? '오전 06:00~12:00' : '오후 12:00~18:00'}</div>
          </div>
        )}
        <a href="/my" className="block w-full py-3 mb-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition text-sm">
          신청 내용 확인/수정하기
        </a>
        <button onClick={() => window.location.reload()} className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition">
          처음으로 돌아가기
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary text-white py-5 px-4 shadow-md">
        <div className="max-w-2xl mx-auto">
          <div className="text-xs font-semibold tracking-widest mb-1 opacity-80">진보당</div>
          <h1 className="text-2xl font-bold">6.3 지방선거 투표참관인 신청</h1>
          <p className="text-sm mt-1 opacity-90">갑병 지역 선착순 모집</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* 신청 현황 표 */}
        <StatusTable slots={slots} />

        {/* 안내 */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 space-y-1">
          <p className="font-bold">참관인 근무 안내</p>
          <p>• 오전: 06:00~12:00 / 오후: 12:00~18:00</p>
          <p>• 투표소당 시간대별 1명 선착순 마감</p>
          <p>• 사전투표: 5월 29일(목), 30일(금) / 선거일: 6월 3일(화)</p>
        </div>

        {/* STEP 1 */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-base font-bold mb-3 text-gray-700"><span className="text-primary mr-1">1</span> 참관 일정 선택</h2>
          <div className="grid grid-cols-2 gap-3">
            {[{ value: 'PRE_VOTE', label: '사전투표', sub: '5/29(목) · 5/30(금)' }, { value: 'ELECTION_DAY', label: '선거일', sub: '6/3(화)' }].map((opt) => (
              <button key={opt.value} onClick={() => handleVoteType(opt.value)}
                className={`border-2 rounded-xl p-4 text-center transition ${voteType === opt.value ? 'border-primary bg-red-50 text-primary' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="font-bold text-lg">{opt.label}</div>
                <div className="text-xs text-gray-500 mt-1">{opt.sub}</div>
              </button>
            ))}
          </div>
        </section>

        {/* STEP 2: 지역 */}
        {voteType && (
          <section className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold mb-3 text-gray-700"><span className="text-primary mr-1">2</span> 지역 선택</h2>
            <div className="flex flex-wrap gap-2">
              {regions.map((r) => (
                <button key={r} onClick={() => handleRegion(r)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition ${selectedRegion === r ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:border-primary hover:text-primary'}`}>
                  {r}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* STEP 3: 투표소 */}
        {selectedRegion && (
          <section className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold mb-3 text-gray-700"><span className="text-primary mr-1">3</span> 투표소 선택</h2>
            <div className="space-y-2">
              {stationsForRegion.map((sn) => {
                const info = filteredSlots.find((s) => s.stationName === sn);
                return (
                  <button key={sn} onClick={() => handleStation(sn)}
                    className={`w-full text-left border-2 rounded-xl p-3 transition ${selectedStation === sn ? 'border-primary bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="font-semibold text-sm">{sn}</div>
                    {info?.buildingName && <div className="text-xs text-gray-500 mt-0.5">{info.buildingName}</div>}
                    {info?.stationAddress && <div className="text-xs text-gray-400">{info.stationAddress}</div>}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* STEP 4: 날짜 (사전투표만) */}
        {selectedStation && voteType === 'PRE_VOTE' && (
          <section className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold mb-3 text-gray-700"><span className="text-primary mr-1">4</span> 날짜 선택</h2>
            <div className="grid grid-cols-2 gap-3">
              {datesForStation.map((d) => (
                <button key={d} onClick={() => handleDate(d)}
                  className={`border-2 rounded-xl p-4 text-center font-semibold transition ${selectedDate === d ? 'border-primary bg-red-50 text-primary' : 'border-gray-200 hover:border-gray-300'}`}>
                  {d}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* STEP 5: 시간대 */}
        {(selectedDate || (selectedStation && voteType === 'ELECTION_DAY')) && (
          <section className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold mb-3 text-gray-700"><span className="text-primary mr-1">{stepNum(5)}</span> 시간대 선택</h2>
            <div className="grid grid-cols-2 gap-3">
              {timeSlotsForDate.map((slot) => (
                <button key={slot.id} onClick={() => handleTime(slot)} disabled={slot.isFull}
                  className={`border-2 rounded-xl p-4 text-center transition ${slot.isFull ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' : selectedSlotId === slot.id ? 'border-primary bg-red-50 text-primary' : 'border-gray-200 hover:border-primary hover:text-primary'}`}>
                  <div className="font-bold">{slot.timeSlot}</div>
                  <div className="text-xs mt-0.5">{slot.timeSlot === '오전' ? '06:00~12:00' : '12:00~18:00'}</div>
                  {slot.isFull && <div className="text-xs mt-1 font-semibold text-red-400">마감</div>}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* STEP 6: 신청자 정보 */}
        {selectedSlotId && (
          <section className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold mb-1 text-gray-700"><span className="text-primary mr-1">{stepNum(6)}</span> 신청자 정보</h2>

            {/* 정보 정확 입력 강조 */}
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 mb-4 text-xs text-yellow-800">
              <p className="font-bold text-sm mb-1">⚠️ 정보를 정확하게 입력해 주세요</p>
              <p>• 이름, 생년월일, 연락처, 계좌번호는 활동비 지급에 사용됩니다.</p>
              <p>• 부정확한 정보로 인한 불이익은 책임지지 않습니다.</p>
              <p>• 신청 후 수정이 필요하면 <a href="/my" className="underline font-semibold">내 신청 확인</a> 페이지를 이용하세요.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">이름 <span className="text-primary">*</span></label>
                  <input name="name" value={form.name} onChange={handleFormChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="홍길동" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">성별</label>
                  <select name="gender" value={form.gender} onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option value="">선택</option>
                    <option value="남성">남성</option>
                    <option value="여성">여성</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">생년월일 <span className="text-primary">*</span></label>
                <input name="birthDate" value={form.birthDate} onChange={handleFormChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="예: 19901231" />
              </div>

              {/* 연락처 인증 */}
              {verifyToken ? (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">연락처 <span className="text-primary">*</span></label>
                  <div className="flex items-center gap-2 border border-green-400 bg-green-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-700 flex-1">{form.phone}</span>
                    <span className="text-green-600 text-sm font-bold">✓ 인증완료</span>
                  </div>
                </div>
              ) : (
                <PhoneVerify
                  phone={form.phone}
                  setPhone={(v) => setForm((p) => ({ ...p, phone: v }))}
                  onVerified={setVerifyToken}
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">읍면동 <span className="text-primary">*</span></label>
                <input name="addressDong" value={form.addressDong} onChange={handleFormChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="예: 비전동" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">주소 <span className="text-primary">*</span></label>
                <input name="address" value={form.address} onChange={handleFormChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="상세 주소" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">계좌번호 <span className="text-primary">*</span> <span className="text-xs text-gray-400">(활동비 지급용)</span></label>
                <input name="bankAccount" value={form.bankAccount} onChange={handleFormChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="은행명 계좌번호" />
              </div>

              <div className="flex gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="isMember" checked={form.isMember} onChange={handleFormChange} className="accent-primary w-4 h-4" /> 당원
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="isSupporter" checked={form.isSupporter} onChange={handleFormChange} className="accent-primary w-4 h-4" /> 지지자
                </label>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                <div className="font-semibold text-gray-600 mb-2">신청 내용 확인</div>
                <div><span className="text-gray-500">투표소:</span> {selectedSlotInfo?.stationName}</div>
                <div><span className="text-gray-500">장소:</span> {selectedSlotInfo?.buildingName}</div>
                <div><span className="text-gray-500">일시:</span> {selectedSlotInfo?.date} {selectedSlotInfo?.timeSlot === '오전' ? '오전 06:00~12:00' : '오후 12:00~18:00'}</div>
              </div>

              <button type="submit" disabled={submitting || !verifyToken}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold text-base hover:bg-primary-dark transition disabled:opacity-50">
                {submitting ? '신청 중...' : !verifyToken ? '연락처 인증 후 신청 가능' : '참관인 신청하기'}
              </button>
            </form>
          </section>
        )}

        {/* 확인 모달 */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold mb-2 text-gray-800">신청 전 최종 확인</h3>
              <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 mb-4 text-sm text-yellow-800 space-y-1">
                <p className="font-bold">아래 내용을 반드시 확인해 주세요.</p>
                <p>• 입력하신 모든 정보가 정확한지 확인했습니까?</p>
                <p>• 이름, 생년월일은 신분증과 일치해야 합니다.</p>
                <p>• 계좌번호는 활동비 지급에 사용됩니다.</p>
                <p>• 부정확한 정보로 인한 불이익은 책임지지 않습니다.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1 mb-4">
                <div><span className="text-gray-500">이름:</span> <span className="font-semibold">{form.name}</span></div>
                <div><span className="text-gray-500">연락처:</span> {form.phone}</div>
                <div><span className="text-gray-500">투표소:</span> {selectedSlotInfo?.stationName}</div>
                <div><span className="text-gray-500">일시:</span> {selectedSlotInfo?.date} {selectedSlotInfo?.timeSlot === '오전' ? '오전 06:00~12:00' : '오후 12:00~18:00'}</div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50">
                  다시 확인
                </button>
                <button onClick={handleConfirmedSubmit}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark">
                  정보 확인 완료, 신청하기
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-gray-400 pb-8">
          <a href="/my" className="underline">내 신청 확인/수정</a>
        </div>
      </div>
    </div>
  );
}
