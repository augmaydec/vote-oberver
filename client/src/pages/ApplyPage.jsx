import { useState, useEffect, useMemo } from 'react';
import { fetchSlots, submitApply } from '../api';

const REGION_ORDER = [
  '진위면','서탄면','중앙동','서정동','송탄동','지산동','송북동',
  '신장1동','신장2동','신평동','원평동','통복동',
  '비전1동','비전2동','세교동','용이동','동삭동',
];

export default function ApplyPage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 선택 상태
  const [voteType, setVoteType] = useState(''); // 'ELECTION_DAY' | 'PRE_VOTE'
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  // 폼 상태
  const [form, setForm] = useState({
    name: '', birthDate: '', gender: '', phone: '',
    addressDong: '', address: '', bankAccount: '',
    isMember: false, isSupporter: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchSlots()
      .then(setSlots)
      .catch(() => setError('슬롯 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  // 투표 유형 변경 시 하위 선택 초기화
  function handleVoteType(type) {
    setVoteType(type);
    setSelectedRegion('');
    setSelectedStation('');
    setSelectedDate('');
    setSelectedTime('');
    setSelectedSlotId(null);
  }

  const filteredSlots = useMemo(
    () => slots.filter((s) => s.type === voteType),
    [slots, voteType]
  );

  const regions = useMemo(
    () => REGION_ORDER.filter((r) => filteredSlots.some((s) => s.region === r)),
    [filteredSlots]
  );

  const stationsForRegion = useMemo(
    () => [...new Set(filteredSlots.filter((s) => s.region === selectedRegion).map((s) => s.stationName))],
    [filteredSlots, selectedRegion]
  );

  const datesForStation = useMemo(
    () => voteType === 'ELECTION_DAY'
      ? ['6월3일']
      : [...new Set(filteredSlots.filter((s) => s.stationName === selectedStation).map((s) => s.date))],
    [filteredSlots, selectedStation, voteType]
  );

  const timeSlotsForDate = useMemo(
    () => filteredSlots.filter(
      (s) => s.stationName === selectedStation && s.date === selectedDate
    ),
    [filteredSlots, selectedStation, selectedDate]
  );

  function handleRegion(region) {
    setSelectedRegion(region);
    setSelectedStation('');
    setSelectedDate('');
    setSelectedTime('');
    setSelectedSlotId(null);
  }

  function handleStation(station) {
    setSelectedStation(station);
    setSelectedDate(voteType === 'ELECTION_DAY' ? '6월3일' : '');
    setSelectedTime('');
    setSelectedSlotId(null);
  }

  function handleDate(date) {
    setSelectedDate(date);
    setSelectedTime('');
    setSelectedSlotId(null);
  }

  function handleTime(slot) {
    if (slot.isFull) return;
    setSelectedTime(slot.timeSlot);
    setSelectedSlotId(slot.id);
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedSlotId) return;
    setSubmitting(true);
    try {
      await submitApply({ slotId: selectedSlotId, ...form });
      setDone(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedSlotInfo = slots.find((s) => s.id === selectedSlotId);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500 text-lg">불러오는 중...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-red-500">{error}</div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-primary mb-2">신청 완료!</h2>
        <p className="text-gray-600 mb-6">
          투표참관인 신청이 완료되었습니다.<br />
          확인 문자가 발송되었습니다.
        </p>
        {selectedSlotInfo && (
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-left space-y-1 mb-6">
            <div><span className="font-semibold">투표소:</span> {selectedSlotInfo.stationName}</div>
            <div><span className="font-semibold">장소:</span> {selectedSlotInfo.buildingName}</div>
            <div><span className="font-semibold">일시:</span> {selectedSlotInfo.date} {selectedSlotInfo.timeSlot === '오전' ? '오전 06:00~12:00' : '오후 12:00~18:00'}</div>
          </div>
        )}
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition"
        >
          처음으로 돌아가기
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-primary text-white py-6 px-4 shadow-md">
        <div className="max-w-2xl mx-auto">
          <div className="text-xs font-semibold tracking-widest mb-1 opacity-80">진보당 평택시당</div>
          <h1 className="text-2xl font-bold">6.3 대선 투표참관인 신청</h1>
          <p className="text-sm mt-1 opacity-90">갑병 지역 선착순 모집</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* 안내 박스 */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 space-y-1">
          <p className="font-semibold">참관인 근무 안내</p>
          <p>• 오전: 06:00~12:00 / 오후: 12:00~18:00</p>
          <p>• 선착순 1명 마감 (마감된 시간대는 선택 불가)</p>
          <p>• 사전투표: 5월 29일(목), 30일(금)</p>
          <p>• 선거일: 6월 3일(화)</p>
        </div>

        {/* STEP 1: 투표 유형 */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-base font-bold mb-3 text-gray-700">
            <span className="text-primary mr-1">1</span> 참관 일정 선택
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'PRE_VOTE', label: '사전투표', sub: '5/29(목) · 5/30(금)' },
              { value: 'ELECTION_DAY', label: '선거일', sub: '6/3(화)' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleVoteType(opt.value)}
                className={`border-2 rounded-xl p-4 text-center transition ${
                  voteType === opt.value
                    ? 'border-primary bg-red-50 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-bold text-lg">{opt.label}</div>
                <div className="text-xs text-gray-500 mt-1">{opt.sub}</div>
              </button>
            ))}
          </div>
        </section>

        {/* STEP 2: 지역 선택 */}
        {voteType && (
          <section className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold mb-3 text-gray-700">
              <span className="text-primary mr-1">2</span> 지역 선택
            </h2>
            <div className="flex flex-wrap gap-2">
              {regions.map((r) => (
                <button
                  key={r}
                  onClick={() => handleRegion(r)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                    selectedRegion === r
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-300 hover:border-primary hover:text-primary'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* STEP 3: 투표소 선택 */}
        {selectedRegion && (
          <section className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold mb-3 text-gray-700">
              <span className="text-primary mr-1">3</span> 투표소 선택
            </h2>
            <div className="space-y-2">
              {stationsForRegion.map((sn) => {
                const slotInfo = filteredSlots.find((s) => s.stationName === sn);
                return (
                  <button
                    key={sn}
                    onClick={() => handleStation(sn)}
                    className={`w-full text-left border-2 rounded-xl p-3 transition ${
                      selectedStation === sn
                        ? 'border-primary bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-sm">{sn}</div>
                    {slotInfo?.buildingName && (
                      <div className="text-xs text-gray-500 mt-0.5">{slotInfo.buildingName}</div>
                    )}
                    {slotInfo?.stationAddress && (
                      <div className="text-xs text-gray-400">{slotInfo.stationAddress}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* STEP 4: 날짜 선택 (사전투표만) */}
        {selectedStation && voteType === 'PRE_VOTE' && (
          <section className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold mb-3 text-gray-700">
              <span className="text-primary mr-1">4</span> 날짜 선택
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {datesForStation.map((d) => (
                <button
                  key={d}
                  onClick={() => handleDate(d)}
                  className={`border-2 rounded-xl p-4 text-center font-semibold transition ${
                    selectedDate === d
                      ? 'border-primary bg-red-50 text-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* STEP 5: 시간대 선택 */}
        {(selectedDate || (selectedStation && voteType === 'ELECTION_DAY')) && (
          <section className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold mb-3 text-gray-700">
              <span className="text-primary mr-1">{voteType === 'PRE_VOTE' ? '5' : '4'}</span> 시간대 선택
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {timeSlotsForDate.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => handleTime(slot)}
                  disabled={slot.isFull}
                  className={`border-2 rounded-xl p-4 text-center transition ${
                    slot.isFull
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : selectedSlotId === slot.id
                      ? 'border-primary bg-red-50 text-primary'
                      : 'border-gray-200 hover:border-primary hover:text-primary'
                  }`}
                >
                  <div className="font-bold">{slot.timeSlot}</div>
                  <div className="text-xs mt-0.5">
                    {slot.timeSlot === '오전' ? '06:00~12:00' : '12:00~18:00'}
                  </div>
                  {slot.isFull && (
                    <div className="text-xs mt-1 font-semibold text-red-400">마감</div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* STEP 6: 개인정보 입력 */}
        {selectedSlotId && (
          <section className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold mb-4 text-gray-700">
              <span className="text-primary mr-1">{voteType === 'PRE_VOTE' ? '6' : '5'}</span> 신청자 정보
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">이름 <span className="text-primary">*</span></label>
                  <input
                    name="name" value={form.name} onChange={handleFormChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">성별</label>
                  <select
                    name="gender" value={form.gender} onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="">선택</option>
                    <option value="남성">남성</option>
                    <option value="여성">여성</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">생년월일 <span className="text-primary">*</span></label>
                <input
                  name="birthDate" value={form.birthDate} onChange={handleFormChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="예: 19901231"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">연락처 <span className="text-primary">*</span></label>
                <input
                  name="phone" value={form.phone} onChange={handleFormChange} required
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="010-0000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">읍면동</label>
                <input
                  name="addressDong" value={form.addressDong} onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="예: 비전동"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">주소</label>
                <input
                  name="address" value={form.address} onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="상세 주소"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">계좌번호</label>
                <input
                  name="bankAccount" value={form.bankAccount} onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="은행명 계좌번호"
                />
              </div>

              <div className="flex gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox" name="isMember" checked={form.isMember} onChange={handleFormChange}
                    className="accent-primary w-4 h-4"
                  />
                  당원
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox" name="isSupporter" checked={form.isSupporter} onChange={handleFormChange}
                    className="accent-primary w-4 h-4"
                  />
                  지지자
                </label>
              </div>

              {/* 선택 요약 */}
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                <div className="font-semibold text-gray-600 mb-2">신청 내용 확인</div>
                <div><span className="text-gray-500">투표소:</span> {selectedSlotInfo?.stationName}</div>
                <div><span className="text-gray-500">장소:</span> {selectedSlotInfo?.buildingName}</div>
                <div><span className="text-gray-500">일시:</span> {selectedSlotInfo?.date} {selectedSlotInfo?.timeSlot === '오전' ? '오전 06:00~12:00' : '오후 12:00~18:00'}</div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold text-base hover:bg-primary-dark transition disabled:opacity-50"
              >
                {submitting ? '신청 중...' : '참관인 신청하기'}
              </button>
            </form>
          </section>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
