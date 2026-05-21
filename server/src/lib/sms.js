const { SolapiMessageService } = require('solapi');

let messageService = null;

function getService() {
  if (!messageService) {
    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;
    if (!apiKey || !apiSecret) return null;
    messageService = new SolapiMessageService(apiKey, apiSecret);
  }
  return messageService;
}

async function sendSMS(to, text) {
  const service = getService();
  const cleaned = to.replace(/[^0-9]/g, '');

  if (!service) {
    console.warn(`[SMS 미설정] to=${cleaned} | ${text}`);
    return;
  }

  try {
    await service.sendOne({
      message: {
        to: cleaned,
        from: process.env.SOLAPI_SENDER,
        text,
      },
    });
    console.log(`SMS sent to ${cleaned}`);
  } catch (err) {
    console.error('SMS send error:', err.message);
  }
}

async function sendRegistrationSMS(phone, data, otpCode) {
  if (otpCode) {
    await sendSMS(phone, `[진보당 평택]\n인증번호: ${otpCode}\n5분 이내에 입력해 주세요.`);
    return;
  }

  const { name, stationName, buildingName, date, timeSlot } = data;
  const timeLabel = timeSlot === '오전' ? '06:00~12:00' : '12:00~18:00';
  const text = `[진보당 평택]\n${name}님, 투표참관인 신청이 완료되었습니다.\n\n투표소: ${stationName}\n장소: ${buildingName || ''}\n일시: ${date} ${timeSlot}(${timeLabel})\n\n신청 확인/수정: ${process.env.SITE_URL || ''}/my\n문의: 진보당 평택시당`;

  await sendSMS(phone, text);
}

module.exports = { sendRegistrationSMS };
