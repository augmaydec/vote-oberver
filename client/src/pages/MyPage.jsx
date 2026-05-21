import { useState } from 'react';
import { sendVerifyCode, checkVerifyCode, lookupMyRegistration, updateMyRegistration, deleteMyRegistration } from '../api';

function PhoneVerify({ onVerified }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  function startCooldown() {
    setCooldown(60);
    const t = setInterval(() => {
      setCooldown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
    }, 1000);
  }

  async function handleSend() {
    setError('');
    setSending(true);
    try {
      await sendVerifyCode(phone);
      setCodeSent(true);
      startCooldown();
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
      const t = await checkVerifyCode(phone, code);
      setToken(t);
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  }

  async function handleLookup() {
    setError('');
    setLooking(true);
    try {
      const regs = await lookupMyRegistration(token, name);
      onVerified(token, regs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLooking(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">이름</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">신청 시 등록한 연락처</label>
        <div className="flex gap-2">
          <input value={phone} onChange={(e) => { setPhone(e.target.value); setCodeSent(false); setCode(''); setToken(''); }}
            type="tel" placeholder="010-0000-0000"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          <button type="button" onClick={handleSend} disabled={sending || cooldown > 0 || !phone}
            className="shrink-0 px-3 py-2 bg-gray-700 text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-gray-800 transition">
            {sending ? '발송 중...' : cooldown > 0 ? `${cooldown}초` : codeSent ? '재발송' : '인증번호 발송'}
          </button>
        </div>
      </div>

      {codeSent && !token && (
        <div className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} placeholder="인증번호 6자리"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          <button type="button" onClick={handleCheck} disabled={checking || code.length !== 6}
            className="shrink-0 px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-primary-dark transition">
            {checking ? '확인 중...' : '인증 확인'}
          </button>
        </div>
      )}

      {token && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-300 rounded-lg px-3 py-2 text-sm text-green-700">
          <span>✓ 인증 완료</span>
        </div>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}

      {token && (
        <button onClick={handleLookup} disabled={looking || !name.trim()}
          className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition disabled:opacity-50">
          {looking ? '조회 중...' : '내 신청 내역 확인'}
        </button>
      )}
    </div>
  );
}

function RegistrationCard({ reg, verifyToken, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    gender: reg.gender || '',
    addressDong: reg.addressDong || '',
    address: reg.address || '',
    bankAccount: reg.bankAccount || '',
    isMember: reg.isMember,
    isSupporter: reg.isSupporter,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const updated = await updateMyRegistration(reg.id, form, verifyToken);
      onUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`'${reg.slot.stationName} ${reg.slot.date} ${reg.slot.timeSlot}' 신청을 취소하시겠습니까?\n취소 후 해당 슬롯이 다시 열리며 되돌릴 수 없습니다.`)) return;
    setDeleting(true);
    try {
      await deleteMyRegistration(reg.id, verifyToken);
      onDeleted(reg.id);
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  }

  const timeLabel = reg.slot.timeSlot === '오전' ? '오전 06:00~12:00' : '오후 12:00~18:00';

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${reg.slot.type === 'ELECTION_DAY' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
            {reg.slot.type === 'ELECTION_DAY' ? '선거일' : '사전투표'}
          </span>
          <h3 className="font-bold text-lg mt-1">{reg.slot.stationName}</h3>
          <p className="text-sm text-gray-500">{reg.slot.buildingName}</p>
          <p className="text-sm font-semibold text-primary mt-1">{reg.slot.date} {timeLabel}</p>
        </div>
        {!reg.isConfirmed && !editing && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:border-primary hover:text-primary transition">
              수정
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="px-3 py-1.5 border border-red-300 rounded-lg text-xs text-red-500 hover:bg-red-50 disabled:opacity-50 transition">
              {deleting ? '취소 중...' : '신청 취소'}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-3 border-t pt-4">
          <p className="text-xs text-gray-500 mb-2">이름, 생년월일, 연락처는 관리자 문의 시 변경 가능합니다.</p>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">성별</label>
            <select name="gender" value={form.gender} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option value="">선택</option>
              <option value="남성">남성</option>
              <option value="여성">여성</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">읍면동</label>
            <input name="addressDong" value={form.addressDong} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">주소</label>
            <input name="address" value={form.address} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">계좌번호</label>
            <input name="bankAccount" value={form.bankAccount} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="isMember" checked={form.isMember} onChange={handleChange} className="accent-primary" /> 당원
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="isSupporter" checked={form.isSupporter} onChange={handleChange} className="accent-primary" /> 지지자
            </label>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)}
              className="flex-1 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              취소
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t pt-4 grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-gray-500">이름</span><span className="font-medium">{reg.name}</span>
          <span className="text-gray-500">생년월일</span><span>{reg.birthDate}</span>
          <span className="text-gray-500">성별</span><span>{reg.gender || '-'}</span>
          <span className="text-gray-500">연락처</span><span>{reg.phone}</span>
          <span className="text-gray-500">읍면동</span><span>{reg.addressDong || '-'}</span>
          <span className="text-gray-500">주소</span><span className="break-all">{reg.address || '-'}</span>
          <span className="text-gray-500">계좌번호</span><span className="break-all">{reg.bankAccount || '-'}</span>
          <span className="text-gray-500">당원/지지자</span>
          <span>{[reg.isMember && '당원', reg.isSupporter && '지지자'].filter(Boolean).join(', ') || '-'}</span>
        </div>
      )}
    </div>
  );
}

export default function MyPage() {
  const [verifyToken, setVerifyToken] = useState('');
  const [registrations, setRegistrations] = useState([]);

  function handleVerified(token, regs) {
    setVerifyToken(token);
    setRegistrations(regs);
  }

  function handleUpdated(updated) {
    setRegistrations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  function handleDeleted(id) {
    setRegistrations((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary text-white py-5 px-4 shadow-md">
        <div className="max-w-2xl mx-auto">
          <div className="text-xs opacity-80 mb-1">진보당</div>
          <h1 className="text-xl font-bold">내 신청 확인 · 수정</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {!verifyToken ? (
          <section className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-sm text-gray-600 mb-4">신청 시 등록한 이름과 연락처로 본인 인증 후 조회하실 수 있습니다.</p>
            <PhoneVerify onVerified={handleVerified} />
          </section>
        ) : (
          <>
            {registrations.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
                신청 내역이 없습니다.
              </div>
            ) : (
              registrations.map((reg) => (
                <RegistrationCard key={reg.id} reg={reg} verifyToken={verifyToken} onUpdated={handleUpdated} onDeleted={handleDeleted} />
              ))
            )}
          </>
        )}

        <div className="text-center">
          <a href="/" className="text-sm text-gray-400 underline">신청 페이지로 돌아가기</a>
        </div>
      </div>
    </div>
  );
}
