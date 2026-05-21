const { SolapiMessageService } = require('solapi');

let messageService = null;

function getService() {
  if (!messageService) {
    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;
    if (!apiKey || !apiSecret) {
      console.warn('[SMS] SOLAPI_API_KEY 또는 SOLAPI_API_SECRET 미설정');
      return null;
    }
    messageService = new SolapiMessageService(apiKey, apiSecret);
  }
  return messageService;
}

async function sendSMS(to, text) {
  const cleaned = to.replace(/[^0-9]/g, '');
  const sender = (process.env.SOLAPI_SENDER || '').replace(/[^0-9]/g, '');

  const service = getService();
  if (!service) {
    // 미설정 시 콘솔 출력 (개발/테스트 용)
    console.log(`[SMS 미설정] to=${cleaned} sender=${sender}\n${text}`);
    return;
  }

  console.log(`[SMS] 발송 시도: to=${cleaned} from=${sender}`);
  // 에러를 삼키지 않고 상위로 전파
  const result = await service.sendOne({
    to: cleaned,
    from: sender,
    text,
  });
  console.log(`[SMS] 발송 완료:`, JSON.stringify(result));
}

async function sendOtpSMS(phone, code) {
  await sendSMS(phone, `[진보당 평택]\n인증번호: ${code}\n5분 이내에 입력해 주세요.`);
}

async function sendRegistrationSMS(phone, data) {
  const { name, stationName, buildingName, date, timeSlot } = data;
  const timeLabel = timeSlot === '오전' ? '06:00~12:00' : '12:00~18:00';
  const siteUrl = process.env.SITE_URL || 'https://vote-oberver-production.up.railway.app';
  const text = `[진보당 평택]\n${name}님, 투표참관인 신청 완료!\n\n투표소: ${stationName}\n장소: ${buildingName || ''}\n일시: ${date} ${timeSlot}(${timeLabel})\n\n확인/수정: ${siteUrl}/my`;
  try {
    await sendSMS(phone, text);
  } catch (err) {
    console.error('[SMS] 신청확인 문자 발송 실패:', err.message);
  }
}

module.exports = { sendOtpSMS, sendRegistrationSMS };
