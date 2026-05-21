const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ELECTION_DAY_STATIONS = [
  { region: '진위면', name: '진위면제1투', building: '진위면행정복지센터(1층, 구관 식당)' },
  { region: '진위면', name: '진위면제2투', building: '진위고등학교 체육관(1층, 밀알관)' },
  { region: '진위면', name: '진위면제3투', building: '갈곶초등학교 체육관(1층, 자람터)' },
  { region: '서탄면', name: '서탄면제1투', building: '서탄면주민자치센터(3층, 대회의실)' },
  { region: '서탄면', name: '서탄면제2투', building: '서탄초등학교 내수분교(1층, 급식실)' },
  { region: '서탄면', name: '서탄면제3투', building: '웃다리문화촌(1층, 세미나실)' },
  { region: '중앙동', name: '중앙동제1투', building: '중앙동행정복지센터(2층, 대회의실)' },
  { region: '중앙동', name: '중앙동제2투', building: '서정리초등학교 체육관(서두물꿈샘관)' },
  { region: '중앙동', name: '중앙동제3투', building: '평택시평생학습센터(1층, 강당)' },
  { region: '중앙동', name: '중앙동제4투', building: '현대아파트 관리사무소(1층, 경로당)' },
  { region: '중앙동', name: '중앙동제5투', building: '이충초등학교 별관(2층, 체육관)' },
  { region: '중앙동', name: '중앙동제6투', building: '장당초등학교(1층, 실내활동실)' },
  { region: '중앙동', name: '중앙동제7투', building: '장당중학교(1층, 교직원식당)' },
  { region: '중앙동', name: '중앙동제8투', building: '이충중학교(2층, 3-3반)' },
  { region: '중앙동', name: '중앙동제9투', building: '반지초등학교(2층, 체육관)' },
  { region: '중앙동', name: '중앙동제10투', building: '롯데캐슬아파트 관리사무소(1층, 경로당)' },
  { region: '서정동', name: '서정동제1투', building: '서정동행정복지센터(3층, 대회의실)' },
  { region: '서정동', name: '서정동제2투', building: '경기도교육청 평택도서관(1층, 강의실)' },
  { region: '서정동', name: '서정동제3투', building: '복창초등학교 체육관(1층)' },
  { region: '서정동', name: '서정동제4투', building: '신창다목적회관(1층, 경로당)' },
  { region: '서정동', name: '서정동제5투', building: '라온중학교(1층, 1-1반)' },
  { region: '서정동', name: '서정동제6투', building: '송일초등학교(1층 다목적체육관)' },
  { region: '서정동', name: '서정동제7투', building: '지장초등학교 체육관(1층)' },
  { region: '송탄동', name: '송탄동제1투', building: '송탄초등학교(1층, 덩덕쿵실)' },
  { region: '송탄동', name: '송탄동제2투', building: '송탄동주민자치센터(1층, 송탄작은도서관)' },
  { region: '송탄동', name: '송탄동제3투', building: '장안마을코오롱하늘채아파트 휘트니스센터(1층, GX룸)' },
  { region: '송탄동', name: '송탄동제4투', building: '평택새빛초등학교(2층, 체육관)' },
  { region: '송탄동', name: '송탄동제5투', building: '평택새빛초등학교(2층, 2-2반교실)' },
  { region: '지산동', name: '지산동제1투', building: '지산동행정복지센터(3층, 대회의실)' },
  { region: '지산동', name: '지산동제2투', building: '지산초등학교 체육관(1층)' },
  { region: '송북동', name: '송북동제1투', building: '송북동행정복지센터(2층, 회의실)' },
  { region: '송북동', name: '송북동제2투', building: '송탄농협중앙지점(2층, 다나재가복지센터)' },
  { region: '송북동', name: '송북동제3투', building: '송북초등학교 체육관(송북관, 1층)' },
  { region: '송북동', name: '송북동제4투', building: '아주2차아파트 경로당(1층)' },
  { region: '송북동', name: '송북동제5투', building: '송탄중학교 체육관(1층)' },
  { region: '신장1동', name: '신장1동제1투', building: '신장1동행정복지센터(3층, 대회의실)' },
  { region: '신장1동', name: '신장1동제2투', building: '송탄국제교류센터 다목적동(1층, 로비)' },
  { region: '신장2동', name: '신장2동제1투', building: '송신초등학교(체육관)' },
  { region: '신장2동', name: '신장2동제2투', building: '신장2동복지회관(청소년공부방)' },
  { region: '신평동', name: '신평동제1투', building: '합정주공3단지아파트 관리사무소(1층)' },
  { region: '신평동', name: '신평동제2투', building: '평택성동초등학교 체육관(1층)' },
  { region: '신평동', name: '신평동제3투', building: '합정초등학교 체육관(1층)' },
  { region: '신평동', name: '신평동제4투', building: '평일초등학교 체육관(1층)' },
  { region: '신평동', name: '신평동제5투', building: '유천3동 마을회관(1층)' },
  { region: '신평동', name: '신평동제6투', building: '참이슬아파트 관리사무소(1층, 경로당)' },
  { region: '원평동', name: '원평동제1투', building: '평택초등학교(체육관)' },
  { region: '원평동', name: '원평동제2투', building: '군문초등학교(1층, 방과후교실 1반)' },
  { region: '원평동', name: '원평동제3투', building: '원평동행정복지센터(3층, 대회의실)' },
  { region: '원평동', name: '원평동제4투', building: '신대2리 경로당(1층)' },
  { region: '통복동', name: '통복동제1투', building: '통복동행정복지센터(1층 민원실)' },
  { region: '통복동', name: '통복동제2투', building: '통복시장 고객센터(1층)' },
  { region: '비전1동', name: '비전1동제1투', building: '비전초등학교(1층, 시니어휴게실)' },
  { region: '비전1동', name: '비전1동제2투', building: '평택성동초등학교(1층, 늘봄교실-2)' },
  { region: '비전1동', name: '비전1동제3투', building: '소사벌더샵마스터뷰아파트 주민공동시설(1층, 북카페)' },
  { region: '비전1동', name: '비전1동제4투', building: '한성아파트 관리사무소(1층, 주민회관)' },
  { region: '비전1동', name: '비전1동제5투', building: '죽백초등학교(1층, 4-2반)' },
  { region: '비전1동', name: '비전1동제6투', building: '자란초등학교(1층, 1-3반)' },
  { region: '비전1동', name: '비전1동제7투', building: '비전중학교(1층, 관리실1)' },
  { region: '비전1동', name: '비전1동제8투', building: '가내초등학교 후관(1층, 돌봄교실2)' },
  { region: '비전1동', name: '비전1동제9투', building: 'LH배꽃마을4단지아파트 주민공동시설(2층, 탁구장)' },
  { region: '비전1동', name: '비전1동제10투', building: '평택이화초등학교(1층, 꿈마루반 2)' },
  { region: '비전1동', name: '비전1동제11투', building: '비전1동 행정복지센터(3층, 대회의실)' },
  { region: '비전1동', name: '비전1동제12투', building: '소사벌중학교(1층, 가사실)' },
  { region: '비전2동', name: '비전2동제1투', building: '평택여자중학교(2층, 체육관)' },
  { region: '비전2동', name: '비전2동제2투', building: '신한중학교(1층, 중앙현관)' },
  { region: '비전2동', name: '비전2동제3투', building: '비전2동 행정복지센터(3층, 대회의실)' },
  { region: '비전2동', name: '비전2동제4투', building: '덕동초등학교 도담마루 체육관(2층)' },
  { region: '비전2동', name: '비전2동제5투', building: '소사벌초등학교(1층, 체육관)' },
  { region: '비전2동', name: '비전2동제6투', building: '평택소사SK뷰아파트(지하1층, 문고)' },
  { region: '비전2동', name: '비전2동제7투', building: '평택뉴비전엘크루아파트 커뮤니티센터(지하1층, 커뮤니티센터)' },
  { region: '비전2동', name: '비전2동제8투', building: '평택효성해링턴플레이스2단지아파트 통합부대복리시설(지하1층, 주민회의실)' },
  { region: '비전2동', name: '비전2동제9투', building: '평택중학교(1층, 시청각실)' },
  { region: '비전2동', name: '비전2동제10투', building: '용죽초등학교(2층, 실내체육관)' },
  { region: '세교동', name: '세교동제1투', building: '평택중앙초등학교(1층, 체육관)' },
  { region: '세교동', name: '세교동제2투', building: '세교도서관(1층, 시청각실)' },
  { region: '세교동', name: '세교동제3투', building: '지제2동(세교11통) 마을회관(1층)' },
  { region: '세교동', name: '세교동제4투', building: '지제초등학교(1층, 시청각실)' },
  { region: '세교동', name: '세교동제5투', building: '세교동행정복지센터(3층, 대강당)' },
  { region: '세교동', name: '세교동제6투', building: '부영1차아파트 관리사무소(1층, 경로당)' },
  { region: '세교동', name: '세교동제7투', building: '세아초등학교(1층, 회의실)' },
  { region: '세교동', name: '세교동제8투', building: '영신초등학교(1층, 돌봄교실)' },
  { region: '용이동', name: '용이동제1투', building: '용이중학교(1층, 중앙현관)' },
  { region: '용이동', name: '용이동제2투', building: 'e편한세상평택아파트 커뮤니티센터(지하1층, 북카페)' },
  { region: '용이동', name: '용이동제3투', building: '금호어울림1단지아파트 커뮤니티센터(1층, 다목적실)' },
  { region: '용이동', name: '용이동제4투', building: '용이2차푸르지오아파트(1층, 입주자대표회의실)' },
  { region: '용이동', name: '용이동제5투', building: 'e편한세상평택용이1단지아파트 커뮤니티센터(1층, 주민회의실)' },
  { region: '용이동', name: '용이동제6투', building: '용이초등학교(1층, 중앙현관)' },
  { region: '동삭동', name: '동삭동제1투', building: '모산초등학교(1층, 맞춤1반)' },
  { region: '동삭동', name: '동삭동제2투', building: '더샵지제역센트럴파크1단지아파트 주민공동시설2(지하1층)' },
  { region: '동삭동', name: '동삭동제3투', building: '동삭초등학교 후관(1층, 기쁨반 돌봄3교실)' },
  { region: '동삭동', name: '동삭동제4투', building: '동삭중학교 후관동(1층, DREAM실)' },
  { region: '동삭동', name: '동삭동제5투', building: '평택센트럴자이3단지아파트 자이안센터(지하1층, 작은도서관 앞 현관)' },
  { region: '동삭동', name: '동삭동제6투', building: '평택센트럴자이1단지아파트 자이안센터(지하1층, 현관)' },
  { region: '동삭동', name: '동삭동제7투', building: '동삭동행정복지센터(2층, 프로그램실1)' },
  { region: '동삭동', name: '동삭동제8투', building: 'e편한세상지제역아파트 경로당(1층)' },
];

const PRE_VOTE_STATIONS = [
  { region: '진위면', name: '진위면사전투표소', building: '진위면행정복지센터(3층, 대회의실)', address: '평택시 진위면 봉남길 61' },
  { region: '서탄면', name: '서탄면사전투표소', building: '서탄면주민자치센터(3층, 대회의실)', address: '평택시 서탄면 금암2길 122' },
  { region: '중앙동', name: '중앙동사전투표소', building: '중앙동행정복지센터(2층, 대회의실)', address: '평택시 서정역로 16 (서정동)' },
  { region: '서정동', name: '서정동사전투표소', building: '서정동행정복지센터(3층, 대회의실)', address: '평택시 탄현로 170 (서정동)' },
  { region: '송탄동', name: '송탄동사전투표소', building: '송탄동행정복지센터(2층, 대회의실)', address: '평택시 방여울로 117 (가재동)' },
  { region: '지산동', name: '지산동사전투표소', building: '지산동행정복지센터(3층, 대회의실)', address: '평택시 송탄로 379 (지산동)' },
  { region: '송북동', name: '송북동사전투표소', building: '송북동행정복지센터(2층, 회의실)', address: '평택시 지산2로 113 (지산동)' },
  { region: '신장1동', name: '신장1동사전투표소', building: '신장1동행정복지센터(3층, 대회의실)', address: '평택시 신장로90번길 63 (신장동)' },
  { region: '신장2동', name: '신장2동사전투표소', building: '송신초등학교(1층, 체육관)', address: '평택시 송월로32번길 32 (신장동)' },
  { region: '신평동', name: '신평동사전투표소', building: null, address: null },
  { region: '원평동', name: '원평동사전투표소', building: null, address: null },
  { region: '통복동', name: '통복동사전투표소', building: null, address: null },
  { region: '비전1동', name: '비전1동사전투표소', building: '비전1동행정복지센터(3층, 대회의실)', address: '평택시 비전2로 330 (죽백동)' },
  { region: '비전2동', name: '비전2동사전투표소', building: '비전2동행정복지센터(3층, 대회의실)', address: '평택시 중앙로 261 (비전동)' },
  { region: '세교동', name: '세교동사전투표소', building: '세교동행정복지센터(3층, 대강당)', address: '평택시 세교3로 37 (세교동)' },
  { region: '용이동', name: '용이동사전투표소', building: '용이동행정복지센터(1층, 주민자치프로그램실)', address: '평택시 현촌5길 5-19 예솔빌딩' },
  { region: '동삭동', name: '동삭동사전투표소', building: '동삭동행정복지센터(2층, 프로그램실1)', address: '평택시 상서재로2길 56-10 센트럴프라자 2층' },
];

// 갑병지역 배치에서 확정된 참관인 (선거일)
const CONFIRMED_ELECTION_DAY = [
  { stationName: '중앙동제4투', timeSlot: '오전', name: '김미진', birthDate: '19760820', gender: '여성', phone: '010-3578-1004' },
  { stationName: '중앙동제7투', timeSlot: '오전', name: '전미형', birthDate: '19760905', gender: '여성', phone: '010-8525-5288' },
  { stationName: '중앙동제8투', timeSlot: '오전', name: '조한아름다움', birthDate: null, gender: null, phone: '010-2522-7935' },
  { stationName: '중앙동제9투', timeSlot: '오전', name: '문수경', birthDate: '19760927', gender: '여성', phone: '010-6761-0618' },
  { stationName: '서정동제1투', timeSlot: '오전', name: '장미자', birthDate: '19830425', gender: '여성', phone: '010-5251-3423' },
  { stationName: '송탄동제2투', timeSlot: '오전', name: '이미경', birthDate: '19730516', gender: '여성', phone: '010-2896-7335' },
  { stationName: '송탄동제3투', timeSlot: '오전', name: '이진용', birthDate: '19771014', gender: '남성', phone: '010-2030-8415' },
  { stationName: '지산동제1투', timeSlot: '오후', name: '곽선희', birthDate: '19820105', gender: '여성', phone: '010-8234-2011' },
  { stationName: '신평동제1투', timeSlot: '오전', name: '장지훈', birthDate: '19841210', gender: '남성', phone: '010-5775-2017' },
  { stationName: '신평동제2투', timeSlot: '오전', name: '최진숙', birthDate: '19700319', gender: '여성', phone: '010-9657-9920' },
  { stationName: '신평동제6투', timeSlot: '오전', name: '최유미', birthDate: '19710604', gender: '여성', phone: '010-4586-8450' },
  { stationName: '원평동제2투', timeSlot: '오전', name: '최원석', birthDate: '19750801', gender: '남성', phone: '010-2770-1975' },
  { stationName: '원평동제3투', timeSlot: '오전', name: '이신선', birthDate: '19681020', gender: '여성', phone: '010-6799-4201' },
  { stationName: '원평동제3투', timeSlot: '오후', name: '박기용', birthDate: '19690625', gender: '남성', phone: '010-6858-4065' },
  { stationName: '원평동제4투', timeSlot: '오전', name: '방재원', birthDate: '19901222', gender: '여성', phone: '010-4266-3658' },
  { stationName: '통복동제1투', timeSlot: '오전', name: '이영훈', birthDate: '19910916', gender: '남성', phone: '010-5344-4937' },
  { stationName: '통복동제2투', timeSlot: '오전', name: '최유리', birthDate: '19940612', gender: '여성', phone: '010-5318-6012' },
  { stationName: '비전1동제3투', timeSlot: '오전', name: '김정애', birthDate: '19670225', gender: '여성', phone: '010-9119-3860' },
  { stationName: '비전1동제5투', timeSlot: '오전', name: '길상옥', birthDate: '19570413', gender: '여성', phone: '010-5690-8592' },
  { stationName: '비전1동제6투', timeSlot: '오전', name: '박금화', birthDate: '19750124', gender: '여성', phone: '010-8810-7239' },
  { stationName: '비전1동제7투', timeSlot: '오전', name: '박종임', birthDate: '19680218', gender: '여성', phone: '010-5400-4342' },
  { stationName: '비전1동제8투', timeSlot: '오전', name: '정경희', birthDate: '19750416', gender: '여성', phone: '010-4210-8048' },
  { stationName: '비전1동제9투', timeSlot: '오전', name: '최성미', birthDate: '19721215', gender: '여성', phone: '010-3238-1505' },
  { stationName: '비전1동제10투', timeSlot: '오전', name: '정문희', birthDate: null, gender: null, phone: '010-3456-6107' },
  { stationName: '비전1동제10투', timeSlot: '오후', name: '이호성', birthDate: '19600725', gender: '남성', phone: '010-4159-4464' },
  { stationName: '비전1동제11투', timeSlot: '오전', name: '안경희', birthDate: '19750302', gender: '여성', phone: '010-2067-7322' },
  { stationName: '비전1동제11투', timeSlot: '오후', name: '이순덕', birthDate: null, gender: null, phone: null },
  { stationName: '비전1동제12투', timeSlot: '오전', name: '이승자', birthDate: '19770225', gender: '여성', phone: '010-4651-0202' },
  { stationName: '비전1동제12투', timeSlot: '오후', name: '송연경', birthDate: '19950321', gender: '여성', phone: '010-3796-8260' },
  { stationName: '비전2동제1투', timeSlot: '오전', name: '김예지', birthDate: '19980414', gender: '여성', phone: '010-7773-7545' },
  { stationName: '비전2동제2투', timeSlot: '오전', name: '김동영', birthDate: '19990322', gender: '남성', phone: '010-3073-3034' },
  { stationName: '비전2동제3투', timeSlot: '오전', name: '이승임', birthDate: '19730107', gender: '여성', phone: '010-7582-4705' },
  { stationName: '비전2동제4투', timeSlot: '오전', name: '공성준', birthDate: '19970430', gender: '남성', phone: null },
  { stationName: '비전2동제5투', timeSlot: '오전', name: '공성욱', birthDate: '19990804', gender: '남성', phone: '010-4174-1580' },
  { stationName: '비전2동제6투', timeSlot: '오전', name: '김형덕', birthDate: '19640223', gender: '여성', phone: '010-5797-7636' },
  { stationName: '비전2동제7투', timeSlot: '오전', name: '최덕우', birthDate: '19690327', gender: '남성', phone: '010-6422-5859' },
  { stationName: '비전2동제8투', timeSlot: '오전', name: '김순자', birthDate: '19731217', gender: '여성', phone: null },
  { stationName: '비전2동제8투', timeSlot: '오후', name: '정미향', birthDate: '19690310', gender: '남성', phone: '010-3008-1172' },
  { stationName: '비전2동제9투', timeSlot: '오전', name: '김경순', birthDate: '19740504', gender: '여성', phone: '010-4727-4274' },
  { stationName: '세교동제1투', timeSlot: '오전', name: '최준혁', birthDate: '20070910', gender: '남성', phone: '010-7644-2363' },
  { stationName: '세교동제1투', timeSlot: '오후', name: '배혜진', birthDate: '19761026', gender: '여성', phone: '010-8985-9948' },
  { stationName: '세교동제2투', timeSlot: '오전', name: '김기숙', birthDate: '19710507', gender: '여성', phone: '010-3186-9146' },
  { stationName: '세교동제3투', timeSlot: '오후', name: '전금옥', birthDate: '19650225', gender: '여성', phone: '010-7302-6273' },
  { stationName: '세교동제4투', timeSlot: '오전', name: '박성현', birthDate: '19780919', gender: '여성', phone: '010-8718-7359' },
  { stationName: '세교동제5투', timeSlot: '오전', name: '정미선', birthDate: '19621011', gender: '여성', phone: '010-9157-1057' },
  { stationName: '세교동제7투', timeSlot: '오전', name: '박혜진', birthDate: '19820406', gender: '여성', phone: '010-8597-7963' },
  { stationName: '용이동제1투', timeSlot: '오전', name: '김지연', birthDate: '19590809', gender: '여성', phone: '010-4021-9635' },
  { stationName: '용이동제2투', timeSlot: '오전', name: '백숙경', birthDate: '19761117', gender: '여성', phone: '010-9117-7611' },
  { stationName: '용이동제3투', timeSlot: '오전', name: '지정균', birthDate: '20040407', gender: '남성', phone: '010-5662-3060' },
  { stationName: '용이동제3투', timeSlot: '오후', name: '안명숙', birthDate: '19730301', gender: '여성', phone: '010-5572-6773' },
  { stationName: '용이동제4투', timeSlot: '오전', name: '이예주', birthDate: '19800616', gender: '여성', phone: null },
  { stationName: '용이동제4투', timeSlot: '오후', name: '최성우', birthDate: '19040907', gender: '남성', phone: '010-4885-6773' },
  { stationName: '용이동제5투', timeSlot: '오전', name: '김시윤', birthDate: '20080421', gender: '남성', phone: null },
  { stationName: '용이동제6투', timeSlot: '오전', name: '김도연', birthDate: '20050317', gender: '여성', phone: '010-8547-7611' },
  { stationName: '동삭동제2투', timeSlot: '오전', name: '박경원', birthDate: '19720611', gender: '여성', phone: '010-9093-4156' },
  { stationName: '동삭동제6투', timeSlot: '오전', name: '한선화', birthDate: '19820113', gender: '여성', phone: null },
];

// 갑병 사전투표 배치에서 확정된 참관인
const CONFIRMED_PRE_VOTE = [
  { stationName: '신장2동사전투표소', date: '5월30일', timeSlot: '오후', name: '최진숙', birthDate: '19700319', gender: null, phone: null },
  { stationName: '용이동사전투표소', date: '5월29일', timeSlot: '오전', name: '문혜민', birthDate: '19890508', gender: '남성', phone: null },
];

async function main() {
  const existingSlots = await prisma.votingSlot.count();
  if (existingSlots > 0) {
    console.log('Seed data already exists, skipping...');
    return;
  }

  console.log('Seeding voting slots...');

  // 선거일 투표소 슬롯 생성
  for (const station of ELECTION_DAY_STATIONS) {
    for (const timeSlot of ['오전', '오후']) {
      await prisma.votingSlot.create({
        data: {
          type: 'ELECTION_DAY',
          region: station.region,
          stationName: station.name,
          buildingName: station.building,
          stationAddress: null,
          date: '6월3일',
          timeSlot,
        },
      });
    }
  }

  // 사전투표 슬롯 생성
  for (const station of PRE_VOTE_STATIONS) {
    for (const date of ['5월29일', '5월30일']) {
      for (const timeSlot of ['오전', '오후']) {
        await prisma.votingSlot.create({
          data: {
            type: 'PRE_VOTE',
            region: station.region,
            stationName: station.name,
            buildingName: station.building,
            stationAddress: station.address,
            date,
            timeSlot,
          },
        });
      }
    }
  }

  console.log('Seeding confirmed registrations (election day)...');

  for (const reg of CONFIRMED_ELECTION_DAY) {
    const slot = await prisma.votingSlot.findUnique({
      where: {
        stationName_date_timeSlot: {
          stationName: reg.stationName,
          date: '6월3일',
          timeSlot: reg.timeSlot,
        },
      },
    });
    if (!slot) {
      console.warn(`Slot not found: ${reg.stationName} ${reg.timeSlot}`);
      continue;
    }
    await prisma.registration.create({
      data: {
        name: reg.name,
        birthDate: reg.birthDate || '',
        gender: reg.gender,
        phone: reg.phone || '',
        isConfirmed: true,
        slotId: slot.id,
      },
    });
  }

  console.log('Seeding confirmed registrations (pre-vote)...');

  for (const reg of CONFIRMED_PRE_VOTE) {
    const slot = await prisma.votingSlot.findUnique({
      where: {
        stationName_date_timeSlot: {
          stationName: reg.stationName,
          date: reg.date,
          timeSlot: reg.timeSlot,
        },
      },
    });
    if (!slot) {
      console.warn(`Slot not found: ${reg.stationName} ${reg.date} ${reg.timeSlot}`);
      continue;
    }
    await prisma.registration.create({
      data: {
        name: reg.name,
        birthDate: reg.birthDate || '',
        gender: reg.gender,
        phone: reg.phone || '',
        isConfirmed: true,
        slotId: slot.id,
      },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
