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

async function sendRegistrationSMS(phone, data) {
  const service = getService();
  if (!service) {
    console.warn('Solapi not configured, skipping SMS');
    return;
  }

  const { name, stationName, buildingName, date, timeSlot } = data;
  const timeLabel = timeSlot === '오전' ? '06:00~12:00' : '12:00~18:00';
  const text = `[진보당 평택]\n${name}님, 투표참관인 신청이 완료되었습니다.\n\n투표소: ${stationName}\n장소: ${buildingName || ''}\n일시: ${date} ${timeSlot}(${timeLabel})\n\n문의: 진보당 평택시당`;

  try {
    await service.sendOne({
      message: {
        to: phone.replace(/[^0-9]/g, ''),
        from: process.env.SOLAPI_SENDER,
        text,
      },
    });
    console.log(`SMS sent to ${phone}`);
  } catch (err) {
    console.error('SMS send error:', err.message);
  }
}

module.exports = { sendRegistrationSMS };
