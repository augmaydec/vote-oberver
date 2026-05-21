import { useState, useEffect } from 'react';
import { adminLogin, fetchRegistrations, fetchSlotsStatus, deleteRegistration } from '../api';

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem('adminToken') || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState('list'); // 'list' | 'status'
  const [registrations, setRegistrations] = useState([]);
  const [slotsStatus, setSlotsStatus] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [filterType, setFilterType] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [search, setSearch] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const t = await adminLogin(password);
      sessionStorage.setItem('adminToken', t);
      setToken(t);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('adminToken');
    setToken('');
  }

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  async function loadData() {
    setLoadingData(true);
    try {
      const [regs, slots] = await Promise.all([
        fetchRegistrations(token),
        fetchSlotsStatus(token),
      ]);
      setRegistrations(regs);
      setSlotsStatus(slots);
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('인증')) {
        handleLogout();
      }
    } finally {
      setLoadingData(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('이 신청을 삭제하시겠습니까?')) return;
    try {
      await deleteRegistration(id, token);
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  function handleExport() {
    const url = `/api/admin/export`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = '투표참관인_신청자목록.xlsx';
        a.click();
      });
  }

  // 로그인 화면
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-primary text-2xl font-bold mb-1">관리자</div>
            <div className="text-gray-500 text-sm">진보당 평택시당 투표참관인 관리</div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
            />
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition disabled:opacity-50"
            >
              {loggingIn ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const regions = [...new Set(slotsStatus.map((s) => s.region))];

  const filteredRegs = registrations.filter((r) => {
    if (filterType && r.slot.type !== filterType) return false;
    if (filterRegion && r.slot.region !== filterRegion) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.name.includes(search) &&
        !r.phone.includes(search) &&
        !r.slot.stationName.includes(search)
      ) return false;
    }
    return true;
  });

  // 슬롯 현황 통계
  const totalSlots = slotsStatus.length;
  const filledSlots = slotsStatus.filter((s) => s._count.registrations >= s.capacity).length;
  const newRegs = registrations.filter((r) => !r.isConfirmed).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-primary text-white px-4 py-4 shadow">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="font-bold text-lg">투표참관인 관리</div>
            <div className="text-xs opacity-80">진보당 평택시당</div>
          </div>
          <button onClick={handleLogout} className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition">
            로그아웃
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loadingData ? (
          <div className="text-center py-20 text-gray-500">불러오는 중...</div>
        ) : (
          <>
            {/* 통계 카드 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: '총 슬롯', value: totalSlots, sub: '전체 투표소·시간대' },
                { label: '마감 슬롯', value: filledSlots, sub: `${totalSlots - filledSlots}개 잔여` },
                { label: '신규 신청', value: newRegs, sub: '홈페이지 접수' },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{card.value}</div>
                  <div className="text-sm font-medium text-gray-700">{card.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
                </div>
              ))}
            </div>

            {/* 탭 */}
            <div className="flex gap-2 mb-4">
              {[{ id: 'list', label: '신청자 목록' }, { id: 'status', label: '투표소 현황' }].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    tab === t.id ? 'bg-primary text-white' : 'bg-white text-gray-600 border hover:border-primary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <div className="flex-1" />
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
              >
                엑셀 다운로드
              </button>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
              >
                새로고침
              </button>
            </div>

            {/* 신청자 목록 탭 */}
            {tab === 'list' && (
              <div className="bg-white rounded-xl shadow-sm">
                {/* 필터 */}
                <div className="p-4 border-b flex flex-wrap gap-3">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="">전체 구분</option>
                    <option value="ELECTION_DAY">선거일</option>
                    <option value="PRE_VOTE">사전투표</option>
                  </select>
                  <select
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="">전체 지역</option>
                    {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="이름·연락처·투표소 검색"
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary flex-1 min-w-40"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-xs">
                      <tr>
                        {['구분','지역','투표소','날짜','시간','이름','연락처','생년월일','당원','신청일','상태','삭제'].map((h) => (
                          <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredRegs.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="text-center py-10 text-gray-400">신청자가 없습니다.</td>
                        </tr>
                      ) : filteredRegs.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              r.slot.type === 'ELECTION_DAY' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {r.slot.type === 'ELECTION_DAY' ? '선거일' : '사전투표'}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">{r.slot.region}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{r.slot.stationName}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{r.slot.date}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{r.slot.timeSlot}</td>
                          <td className="px-3 py-2 font-medium whitespace-nowrap">{r.name}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{r.phone}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{r.birthDate}</td>
                          <td className="px-3 py-2 text-center">{r.isMember ? 'O' : ''}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-400">
                            {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              r.isConfirmed ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                            }`}>
                              {r.isConfirmed ? '확정' : '신규'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {!r.isConfirmed && (
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="text-red-400 hover:text-red-600 text-xs"
                              >
                                삭제
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 text-xs text-gray-500 border-t">
                  총 {filteredRegs.length}명 (전체 {registrations.length}명)
                </div>
              </div>
            )}

            {/* 투표소 현황 탭 */}
            {tab === 'status' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs">
                    <tr>
                      {['구분','지역','투표소','건물명','날짜','시간','배정자','상태'].map((h) => (
                        <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {slotsStatus.map((slot) => {
                      const isFull = slot._count.registrations >= slot.capacity;
                      const assignee = slot.registrations[0];
                      return (
                        <tr key={slot.id} className={isFull ? 'bg-gray-50' : ''}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              slot.type === 'ELECTION_DAY' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {slot.type === 'ELECTION_DAY' ? '선거일' : '사전투표'}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">{slot.region}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{slot.stationName}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">{slot.buildingName || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{slot.date}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{slot.timeSlot}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {assignee ? (
                              <span className="font-medium">{assignee.name}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              isFull ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                            }`}>
                              {isFull ? '마감' : '모집중'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
