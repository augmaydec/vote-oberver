const BASE = '/api';

export async function fetchSlots() {
  const res = await fetch(`${BASE}/slots`);
  if (!res.ok) throw new Error('슬롯 정보를 불러오지 못했습니다.');
  return res.json();
}

export async function submitApply(data) {
  const res = await fetch(`${BASE}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || '신청에 실패했습니다.');
  return json;
}

export async function adminLogin(password) {
  const res = await fetch(`${BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || '로그인 실패');
  return json.token;
}

export async function fetchRegistrations(token) {
  const res = await fetch(`${BASE}/admin/registrations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('목록을 불러오지 못했습니다.');
  return res.json();
}

export async function fetchSlotsStatus(token) {
  const res = await fetch(`${BASE}/admin/slots-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('슬롯 현황을 불러오지 못했습니다.');
  return res.json();
}

export async function deleteRegistration(id, token) {
  const res = await fetch(`${BASE}/admin/registrations/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('삭제에 실패했습니다.');
  return res.json();
}

export function getExportUrl(token) {
  return `${BASE}/admin/export?token=${token}`;
}
