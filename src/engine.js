(function () {
  'use strict';

  const demoPhone = '010-0000-1234';
  const demoAddress = '서울 영등포구 문래동';
  const welcome = '안녕하세요. SK매직 상담 챗봇입니다. 궁금한 내용을 입력하거나 상담 메뉴에서 선택해 주세요.';
  const defaultPlaceholder = '메시지를 입력하세요';
  const auditFlows = window.SKIX_FLOW_OVERLAYS ?? {};
  const billingContractScreens = { 1: 'S02', 2: 'S02', 3: 'changeContract', 4: 'chargeContract', 5: 'arrearsContract', 7: 'S04' };
  const otpAttemptLimit = 5;
  const otpValidityMs = 180_000;
  const phoneConsent = '휴대폰 확인을 위해 이름과 휴대폰 번호를 이용해요. 개인정보 수집 및 이용에 동의하시겠어요?';
  const businessRegistration = { label: '사업자등록번호', placeholder: '사업자등록번호 10자리', type: 'password', sample: '000-00-00000' };
  const partnerBenefitsUrl = 'https://www.skmagic.com/event/cardbenefit';
  const sampleIssuers = [
    { title: '신한카드', detail: '신용카드', kind: 'issuer', last4: '1234' },
    { title: 'KB국민카드', detail: '체크카드', kind: 'issuer', last4: '4321' }
  ];
  const samplePartner = {
    title: '제휴카드 혜택', detail: '이용실적에 따라 구독료 청구 할인', kind: 'partner'
  };
  const methodCards = {
    '등록 결제수단': { kind: 'saved', detail: '등록된 카드 선택', title: '등록 결제수단' },
    '신용·체크카드': { kind: 'credit', detail: '카드 등록 · PASS 본인인증', title: '신용·체크카드' },
    '카드': { kind: 'credit', detail: '신용카드·체크카드 · PASS 본인인증', title: '카드' },
    '일회성 납부수단': { kind: 'credit', detail: '카드·계좌이체·가상계좌', title: '일회성 납부수단' },
    '은행 계좌': { kind: 'transfer', detail: '자동이체 등록 · PASS 전자서명', title: '은행 계좌' },
    '실시간 계좌이체': { kind: 'transfer', detail: '계좌에서 바로 납부 · PASS 전자서명', title: '실시간 계좌이체' },
    '가상계좌': { kind: 'virtual', detail: '발급된 계좌로 직접 입금', title: '가상계좌' }
  };
  const savedCard = {
    title: '신한카드', detail: '••••-••••-••••-1234 · 계약자 본인 명의', kind: 'saved'
  };
  const sampleTransaction = {
    title: '2026년 11월 카드 결제', detail: '신한카드 · 끝자리 1234 · 29,900원', kind: 'payment-record'
  };

  const registeredServiceProduct = { title: '직수 정수기', detail: 'WPU-1000', family: 'water', icon: 'water', kind: 'product' };
  const serviceVisits = {
    water: { id: 'AS-261125-001', product: '직수 정수기', symptom: '정수 출수 안 됨', family: 'water', days: 2 },
    bidet: { id: 'ES-261125-002', product: '비데', service: '재설치', family: 'bidet', days: 7, subscription: true },
    split: { id: 'ES-261125-003', product: '비데', service: '분리', family: 'bidet', days: 5 },
    air: { id: 'AS-261125-004', product: '공기청정기', symptom: '전원이 켜지지 않음', family: 'air', days: 2 },
    oven: { id: 'AS-261125-005', product: '전기오븐', symptom: '온도 표시 오류', family: 'oven', days: 8 },
    dishwasher: { id: 'AS-261125-006', product: '식기세척기', symptom: '세척 중 멈춤', family: 'dishwasher', days: 10 }
  };
  const visitListScreens = { 13: 'S02', 14: 'S01', 15: 'S02' };
  const deliveryOrders = {
    water: { id: 'DL-261125-001', product: '직수 정수기', days: 5 },
    air: { id: 'DL-261125-002', product: '공기청정기', days: 8, type: 'created' },
    package: { id: 'DL-261125-003', product: '정수기·비데 패키지', components: '직수 정수기 · 비데', days: 13, type: 'package' }
  };
  const commonSymptoms = [
    { title: '작동·전원', detail: '전원, 소음, 오류 표시', icon: 'power', groups: [
      { title: '전원·조작', issues: [{ title: '전원이 켜지지 않아요' }, { title: '버튼이 작동하지 않아요' }] },
      { title: '소음·진동', issues: [{ title: '소리가 커졌어요' }, { title: '제품이 심하게 떨려요' }] },
      { title: '표시등·오류', issues: [{ title: '오류 코드가 표시돼요' }, { title: '표시등이 계속 깜빡여요' }] }
    ] },
    { title: '누수·안전', detail: '물샘, 연기, 타는 냄새', icon: 'warning', groups: [
      { title: '물샘(누수)', issues: [{ title: '물이 새요', outcome: 'urgent' }] },
      { title: '과열·연기', issues: [{ title: '연기나 타는 냄새가 나요', outcome: 'urgent' }, { title: '제품이 지나치게 뜨거워요', outcome: 'urgent' }] }
    ] },
    { title: '기타', detail: '다른 제품 증상', icon: 'tools', groups: [
      { title: '기타 증상', issues: [{ title: '위 항목에 없는 증상이에요' }] }
    ] }
  ];
  const productSymptoms = {
    water: [{ title: '물·급수', detail: '출수, 물맛, 물 온도', icon: 'water', groups: [
      { title: '출수', issues: [{ title: '물이 나오지 않아요', outcome: 'noWater' }, { title: '출수량이 줄었어요' }] },
      { title: '물맛·냄새', issues: [{ title: '물맛이나 냄새가 이상해요' }, { title: '물에 이물질이 보여요' }] },
      { title: '냉온수', issues: [{ title: '물 온도가 맞지 않아요' }] }
    ] }],
    bidet: [{ title: '교체/파손', detail: '노즐과 제품 부품', icon: 'tools', groups: [
      { title: '노즐', issues: [{ title: '노즐팁 빠짐' }] }
    ] }]
  };

  // Destinations follow the order of the option labels on each Figma screen.
  // @ starts a related scenario. $ invokes an on-screen interaction.
  const optionTargets = {
    1: { S01: ['S02'], S02: ['S03', 'S03'], S03: ['@3', '@7'], S08: ['S02'], S09: ['$handoff'] },
    2: { S01: ['S02'], S02: ['S03'], S03: ['@3', '@7'], S04: ['@5', '@3', '@7'], S06: ['S02'], S07: ['$handoff'] },
    3: { S02: ['S03', '$finish'], S03: ['$issuerPicker', 'S05'], S04: ['S08'], S05: ['S08'], S06: ['$handoff'], S07: ['$handoff'] },
    4: { S01: ['S02'], S02: ['$savedPicker', '$issuerPicker', 'S05'], S03: ['$handoff'], S04: ['S07'], S05: ['S07'], S06: ['S07V'], S08: ['$handoff'], S09: ['$handoff'] },
    5: { S01: ['S02'], S02: ['S04', '$menu'], S03: ['$menu'], S04: ['$issuerPicker', 'S05T'], S05: ['S07'], S05T: ['S07'], S06: ['S08'], S07: ['$menu'], S09: ['$handoff'] },
    6: { S02: ['S03'], S03: ['$cardBenefits'], S04: ['S05', 'S06'] },
    7: { S01: ['S02'], S02: ['$contractPurpose'], S04: ['S05'], S05: ['S06'], S07: ['$handoff'], S08: ['$handoff'] },
    8: { S01: ['phoneInput', 'phoneInput'], S02: ['S04', '$otherProduct'], S03: ['@13', 'S04'], S04: ['$address', 'S05'], S05: ['$date', 'S06'], S07: ['@5'], S08: ['$handoff'] },
    9: { S01: ['phoneInput', 'phoneInput'], S02: ['S04', '$otherProduct'], S03: ['@13', 'S04'], S04: ['$address', 'S05'], S05: ['$date', 'S06'], S07: ['@5'], S08: ['S04', '$handoff'] },
    10: { S01: ['$transferPurpose'], S03: ['S06'], S04: ['@4'], S05: ['$handoff'], S06: ['$transferPerson', '$transferBusiness', 'S07'], S09: ['$handoff'] },
    11: { S01: ['S02'], S02: ['$symptom'], S04: ['$handoff'], S05: ['$selfHelp'], S06: ['@12', '$handoff', '$menu'], S07: ['$handoff'] },
    12: { S01: ['S02'], S03: ['@13', 'S04'], S04: ['$address', 'S05'], S05: ['$date', 'S06'], regAddrPass: ['S05'], S07: ['@5'], S08: ['S04', '$handoff'], S09: ['$handoff'] },
    13: { S02: ['S03'], S03: ['@14', '@15'], S04: ['@14', '@15'], S07: ['$handoff'] },
    14: { S01: ['S02'], S02: ['S03', 'S04', '$editSymptom', '$editPhone'], S03: ['$address', 'S10'], S04: ['$date', '$moreDates', 'S10'], S05: ['S10'], S06: ['$handoff'], S07: ['$handoff'], S08: ['S03', '$handoff'], S11: ['$handoff'] },
    15: { S02: ['S03'], S03: ['S04', 'S04', 'S04', 'S04', 'S04'], S04: ['S05', '$finish'], S07: ['$handoff'], S08: ['$handoff'] },
    16: { S02: ['S03'], S05: ['$handoff'], S06: ['$handoff'], S07: ['$menu', '$finish'] },
    17: { S02: ['S03'], S03: ['S04', 'S05', 'S06'], S04: ['$address', 'S07'], S05: ['$date', '$moreDates', 'S07'], S06: ['S08'], S09: ['S04', '$handoff'], S10: ['$handoff'] },
    18: { s2: ['$contactIdentity', '$contactIdentity', '$contactIdentity', 's3'], s4: ['s5', '$alternateContact'], s6: ['s3'] },
    19: { s1: ['s2', 's3', 's4'], s2: ['$billingPeriod', '$recurring'], s3: ['s7', '$delivery'], s4: ['$delivery', '$delivery', '$delivery'], s6: ['@4', '$finish'] },
    20: { s2: ['$terminationState'], s4: ['$delivery', '$delivery', '$delivery'] },
    21: { s2: ['$delivery', '$delivery', '$delivery'] },
    22: { s3: ['s4', 's4', 's4', 's4'], s4: ['$delivery', '$delivery', '$delivery'] },
    23: { s2: ['s3', 's4'], s3: ['$delivery', '$delivery', '$delivery'], s4: ['$slipDestination', '$slipDestination', '$slipDestination'], s5: ['$receiptPicker'] },
    24: { s1: ['s3', 's4', '$existingAccount'], s4: ['$delivery', '$delivery', '$delivery'], s7: ['@4'] },
    25: { s2: ['s5', 's5'], s4: ['@3', '$finish'], s5: ['s6', 's6'], s6: ['$handoff'] },
    26: { s2: ['$representative'], s3: ['s5', '$finish'], s4: ['@3', 's2'], s5: ['s7', 's7'], E7: ['@25'] },
    27: { s2: ['$splitAll', 's4'], s3: ['s2', '$finish'], s4: ['$splitSome'], E7: ['@25'] },
    28: { s1: ['s2', '$userDetails', 's4', 's5'], s2: ['s7'], passRetry: ['s7'], s3: ['s1'], s5: ['$handoff'], s6: ['@9'], s8: ['$resendUnavailable', '$finish'] },
    29: { s1: ['s2', 's6'], s3: ['$carrier'], s4: ['s5', '$filterAddress'] },
    30: { s3: ['s5'], s4: ['@4', '$finish'], s5: ['$handoff'], E7: ['@4'], E8: ['$handoff'] },
    31: { s1: ['s2', 's3'], s4: ['s5', '$finish'], s5: ['$handoff'], E6: ['$handoff'] },
    32: { s3: ['$handoff'], s4: ['@35', '@31'], s6: ['$handoff', '$finish'], E6: ['$handoff'] },
    33: { s1: ['s3', 's3', 's2'], s4: ['s3'], s5: ['s6', '$finish'] },
    34: { s5: ['s6', 's7'] },
    35: { s1: ['s2', 's2', 's2'], s6: ['s7', '$finish'] },
    36: { s1: ['s2', '@16'], s5: ['s6', 's8', '$finish'] },
    37: { s1: ['s3', 's3', 's3', 's3', 's3'], s2: ['s3', '$finish'], s5: ['s7', 's6'], s7: ['$delivery', '$delivery', '$delivery'] },
    38: { s3: ['$cancelOrder', 's2'] },
    39: { s1: ['s2', 's2', 's2'], reuse006Pass: ['$paymentLookup'] },
    40: { s5: ['s6', '$finish'], s7: ['s8', '$finish'] },
    41: { s3: ['$delivery', '$finish'] },
    42: { s1: ['s3', 'E7', 's6'], s4: ['s5', '$finish'] },
    43: { s1: ['s3', 's4', 's7', 's6'], s4: ['s5', 's7'] },
    44: { s1: ['s2', 's2', 's6'], s5: ['s6', '$finish'], s8: ['E8', '$finish'], E8: ['@34'] },
    45: { s1: ['s3', 's6', 's8'], s4: ['s5', 's7', '$finish'], s5: ['s6', 's6'], s6: ['s7'], E8: ['@7', '@10'] },
    46: { s1: ['s2', 's2'] },
    47: { s1: ['s3', 's5', 's6', 's7'] },
    48: { s1: ['s5', 's5', 's7'], s5: ['$delivery', '$delivery', '$delivery'], s7: ['$receiptEnabled', '$finish'] },
    49: { s4: ['s5', 's5', '$finish'] }
  };

  // Buttons required to continue between Figma screens whose static designs had no controls.
  const continuation = {
    1: { S07: [['다시 확인하기', 'S01']] },
    3: { S01: [['결제수단 선택', 'S03']] },
    4: { S02: [['가상계좌', 'S06']], S03: [['가상계좌', 'S06']] },
    5: { S04: [['등록 결제수단', '$savedPicker'], ['가상계좌', 'S06']] },
    6: { S01: [['제휴카드 보기', 'S02']] },
    7: { S03: [['위약금 조회', 'S04']] },
    10: { S07: [['신청 접수', 'S08']] },
    11: { S03: [['대행업체 확인', '@41']] },
    13: { S05: [['다시 확인하기', 'S01']] },
    16: { S03: [['계속하기', 'S07']] },
    18: { s1: [['연락 유형 선택', 's2']], s5: [['관련 상담 이어가기', '$relatedContact']] },
    20: { s1: [['계약 확인', 's2']] },
    21: { s1: [['계약 확인', 's2']], s3: [['상담사 연결', '$handoff']] },
    22: { s1: [['계약 제품', 's3'], ['일반 서비스', 's2']] },
    23: { s1: [['카드 결제 이력 확인', '$receiptPicker']] },
    25: { s1: [['지로 납부 계약 확인', 's2']] },
    26: { s1: [['계약 확인', 's2']] },
    27: { s1: [['계약 확인', 's2']] },
    30: { s1: [['방문 일정 확인', 's2']], s2: [['방문 담당자 연락 요청', 's5'], ['연락처 변경', 's6']] },
    32: { s1: [['보유 제품 확인', 's2']], s5: [['가입 안내 보기', 's6']] },
    33: { s2: [['전화 재연락 요청', 's3']] },
    34: { s1: [['접수 정보 확인', 's2']], s4: [['계속하기', 's5']] },
    35: { s3: [['계속하기', 's6']], s4: [['계속하기', 's6']], s5: [['계속하기', 's6']], s7: [['서비스 접수 시작', '$relatedService']] },
    36: { s4: [['계속하기', 's5']] },
    38: { s1: [['주문 확인', 's2']], s6: [['취소 요청 전달', '$handoff']] },
    39: { s1: [['미납요금 조회·납부', 's2'], ['면제·청구 금액 확인', 's2']], s6: [['미납요금 납부', '@5'], ['결제정보 변경', '@3']], s8: [['상담사 연결', '$handoff']] },
    40: { s1: [['해약 신청 확인', 's2']], s6: [['계속하기', 's8']] },
    41: { s2: [['문자 발송 안내', 's3']] },
    43: { s7: [['판매처 상담 문의', '$handoff']] },
    44: { s3: [['설치 가능 여부 확인', 's4']], s4: [['계속하기', 's5']], s7: [['계속하기', 's8']] },
    45: { s3: [['계속하기', 's4']], s8: [['해약·명의변경 안내', 'E8']] },
    46: { s3: [['설치 주문 취소 안내', '@38']] },
    47: { s5: [['결제정보 변경', '@3']], s8: [['상담사 연결', '$handoff']] },
    48: { s3: [['납부방법 변경 안내', 's4']], s4: [['결제정보 변경', '@3']] },
    49: { s1: [['휴대폰으로 확인', 's2']], s3: [['다시 확인하기', 's2']] }
  };

  const inputTargets = {
    6: { S05: '$menu' }, 8: { S04: 'S05' }, 9: { S04: 'S05' }, 11: { S02: '$symptom' },
    12: { S01: 'S02', S04: 'S05' }, 14: { S03: 'S10', S05: 'S10' },
    17: { S04: 'S07', S06: 'S08' }, 18: { s3: 's4' }, 20: { s3: 's4' }, 22: { s2: 's3' },
    28: { s4: 's7' }, 29: { s6: 's7' }, 30: { s6: '$contactChanged' },
    31: { s2: 's4', s3: 's5' }, 32: { s2: 's5' }, 33: { s3: 's5' }, 34: { s2: 's4', s3: 's4' },
    35: { s2: '$costResult' }, 36: { s2: 's4', s6: 's7' }, 37: { s3: 's5', s6: 's7' }, 38: { s2: 's3' },
    39: { s2: 'reuse006Pass' }, 40: { s2: 's5' }, 41: { s1: '$serviceProvider' },
    43: { s6: 's7' }, 44: { s2: '$installationResult', s6: 's7' }, 46: { s2: '$refundResult' },
    47: { s6: '$refundRegistered', s7: 's8' }
  };

  const authFailures = {
    1: { S01: 'S08', S08: 'S09' }, 2: { S01: 'S06', S06: 'S07' },
    3: { S04: 'S07', S05: 'S07' }, 4: { S01: 'S09', S04: 'S09', S05: 'S09' },
    5: { S01: 'S09', S05: 'S09', S05T: 'S09' }, 7: { S01: 'S08' }, 10: { S01: 'S09' },
    12: { regAddrPass: 'S09' }, 28: { s2: 'passRetry', passRetry: 's3' }, 39: { reuse006Pass: 's3' }
  };

  const phoneSuccess = { 8: 'S02', 9: 'S02', 12: 'S04', 13: 'S02', 14: 'S01', 15: 'S02', 16: 'S02', 17: 'S02', 49: 's4' };
  const phoneFailures = { 8: 'S08', 9: 'S08', 12: 'S09', 13: 'S07', 14: 'S11', 15: 'S08', 16: 'S06', 17: 'S10', 49: 's3' };
  const dateScenarios = new Set([8, 9, 12, 14, 17]);
  const schedulingScreens = { 8: 'S05', 9: 'S05', 12: 'S05', 14: 'S04', 17: 'S05' };
  const addressScreens = new Set(['8:S04', '9:S04', '12:S04', '14:S03', '17:S04']);

  const fromLabel = (label, placeholder, type = 'text', sample = '') => ({ label, placeholder, type, sample });
  const fieldTemplates = {
    name: fromLabel('이름', '이름 입력', 'text', '김매직'),
    bank: fromLabel('은행', '은행명 입력', 'text', 'KB국민은행'),
    phone: fromLabel('휴대폰 번호', '010-0000-0000', 'tel', demoPhone),
    address: fromLabel('주소', '시·구·동 또는 도로명 입력', 'text', demoAddress),
    email: fromLabel('이메일 주소', 'name@example.com', 'email', 'magic@example.com'),
    fax: fromLabel('팩스 번호', '지역번호를 포함해 입력', 'tel', '02-0000-1234'),
    date: fromLabel('희망 날짜', '', 'date', '2026-11-30'),
    product: fromLabel('제품명 또는 모델명', '예: 직수 정수기', 'text', '직수 정수기'),
    contract: fromLabel('계약 또는 제품명', '예: 직수 정수기 계약', 'text', '직수 정수기 계약'),
    description: fromLabel('요청 내용', '내용을 입력해 주세요', 'text', '방문 전에 연락해 주세요.'),
    otp: fromLabel('인증번호', '6자리 인증번호 입력', 'password'),
    symptom: fromLabel('접수 증상', '예: 물이 나오지 않아요', 'text', '정수기에서 물이 나오지 않아요')
  };

  function fieldsFor(no, screen, context) {
    const key = `${no}:${screen.id}`;
    const custom = {
      '4:S06': ['bank', 'phone'], '5:S06': ['bank', 'phone'],
      '7:S05': ['date'], '12:S01': ['product', 'symptom'],
      '17:S06': ['description'],
      '18:s3': ['phone', 'description'], '20:s3': ['description', 'date'], '22:s2': ['name', 'phone'],
      '28:s2': ['phone'], '28:s4': ['email'], '29:s6': ['address', 'phone'], '30:s6': ['phone'], '33:s3': ['phone', 'name'],
      '34:s2': ['phone', 'name', 'address'], '34:s3': ['name', 'address'], '35:s2': ['product'],
      '36:s2': ['contract'], '36:s6': ['date'], '37:s3': ['contract'], '37:s6': ['date'],
      '38:s2': ['contract', 'description'], '39:s2': ['contract'], '40:s2': ['contract'], '41:s1': ['product'],
      '43:s6': ['description'], '44:s2': ['product', 'description'], '44:s6': ['address', 'date', 'phone'],
      '46:s2': ['contract'], '47:s6': ['name', 'description'], '47:s7': ['description']
    };
    if (screen.fields?.length) return screen.fields.map((field) => figmaField(field, screen));
    if (addressScreens.has(key)) {
      return no === 14 || no === 17 ? ['address'] : ['address', 'phone'];
    }
    if (custom[key]) return custom[key];
    if (key === '6:S05' || key === '37:s7') return [];
    if (screen.kind !== 'input') return [];
    if (key === '32:s2') return [fromLabel('제품 제조번호', screen.placeholder, 'text', 'SKIX-2026-0123')];
    if (key === '31:s2' || key === '31:s3') return ['product'];
    return screen.placeholder ? [{ ...fieldTemplates.description, placeholder: screen.placeholder }] : [];
  }

  function figmaField(field, screen) {
    const label = field.label;
    if (/인증번호/.test(label)) return 'otp';
    if (/휴대폰/.test(label)) {
      return screen.id === 'phoneConfirm' ? { ...fieldTemplates.phone, readonly: true } : 'phone';
    }
    if (label === '이름') return 'name';
    if (/카드번호/.test(label)) return fromLabel(label, '숫자 16자리', 'password', '0000000000001234');
    if (/유효기간/.test(label)) return fromLabel(label, 'MM / YY', 'password', '12 / 30');
    if (/생년월일/.test(label)) return fromLabel(label, 'YYMMDD', 'password', '900101');
    if (/계좌번호/.test(label)) return fromLabel(label, '숫자만 입력', 'password', '000000001234');
    if (/할부/.test(label)) return { ...fromLabel(label, '', 'text', '일시불'), value: '일시불', readonly: true, required: false };
    return fromLabel(label, field.value, 'text', field.value);
  }

  function normalize(text) {
    return String(text ?? '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  }

  function maskNumber(phone) {
    const digits = phone.replace(/\D/g, '');
    return `${digits.slice(0, digits.startsWith('02') ? 2 : 3)}-••••-${digits.slice(-4)}`;
  }

  function neighborhood(address) {
    const district = /^(.*?(?:시|도|구|군|읍|면|동|리))(?=\s|$)/.exec(address);
    const locality = /^(.*?(?:읍|면|동|리))(?=\s|$)/.exec(address);
    return locality?.[1] || district?.[1] || '등록한 주소';
  }

  function validationError(field, input) {
    if (field.readonly) return '';
    if (!input) return field.required ? `${field.label} 항목을 입력해 주세요.` : '';
    if (field.options?.length) {
      const key = field.label === '정기 발송일'
        ? (value) => normalize(value).replace(/^매월/, '').replace(/^(\d+)일$/, '$1') : normalize;
      const allowed = field.options.some((choice) => (typeof choice === 'string' ? [choice] : [choice.value, choice.label])
        .some((value) => typeof value === 'string' && key(value) === key(input)));
      if (!allowed) return field.label === '정기 발송일'
        ? '정기 발송일은 12일부터 28일까지 또는 말일 중에서 선택해 주세요.' : '안내된 항목 중에서 선택해 주세요.';
    }
    const digits = input.replace(/\D/g, '');
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) return '이메일 주소 형식을 확인해 주세요.';
    if (/휴대폰/.test(field.label) && !/^01[016789]\d{7,8}$/.test(digits)) return '휴대폰 번호를 확인해 주세요.';
    if (field.label === '연락요청번호' && !/^(?:010\d{8}|0[2-6]\d{8,9})$/.test(digits)) {
      return '010 휴대폰 번호나 지역번호를 포함한 전화번호 10~11자리를 입력해 주세요.';
    }
    if (/팩스/.test(field.label) && !/^0\d{8,10}$/.test(digits)) return '지역번호를 포함한 팩스 번호를 입력해 주세요.';
    if (/카드번호/.test(field.label) && !/^\d{15,16}$/.test(digits)) return '카드번호는 숫자 15~16자리로 입력해 주세요.';
    if (/사업자등록번호/.test(field.label) && !/^\d{10}$/.test(digits)) return '사업자등록번호는 숫자 10자리로 입력해 주세요.';
    if (field.type !== 'date' && /생년월일|인증번호/.test(field.label) && !/^\d{6}$/.test(input)) return '숫자 6자리를 입력해 주세요.';
    if (/계좌번호/.test(field.label) && !/^\d{8,16}$/.test(digits)) return '계좌번호는 숫자 8~16자리로 입력해 주세요.';
    if (/유효기간/.test(field.label) && !/^(0[1-9]|1[0-2])\s*\/?\s*\d{2}$/.test(input)) return '유효기간을 MM/YY 형식으로 입력해 주세요.';
    if (field.type === 'date') {
      const date = new Date(`${input}T12:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input) {
        return '날짜를 선택해 주세요.';
      }
      if (field.minAge) {
        const today = estimateDateRange().today;
        if (input > (`${Number(today.slice(0, 4)) - field.minAge}` + today.slice(4))) {
          return `만 ${field.minAge}세 이상이어야 해요. 생년월일을 확인해 주세요.`;
        }
      }
    }
    if (/(?:이름|주소|제조번호|제품명|모델명)/.test(field.label) && input.length < 2) return `${field.label} 항목을 확인해 주세요.`;
    return '';
  }

  function dateLabel(iso) {
    const date = new Date(`${iso}T12:00:00+09:00`);
    return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', timeZone: 'Asia/Seoul' })
      .format(date).replace(/일\s*/, '일');
  }

  function offsetDate(iso, days) {
    const date = new Date(iso + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function nextWeekday(iso) {
    const day = new Date(iso + 'T12:00:00Z').getUTCDay();
    return offsetDate(iso, day === 5 ? 3 : day === 6 ? 2 : 1);
  }

  function counselorIsAvailable(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Seoul', weekday: 'short', hour: '2-digit', hourCycle: 'h23'
    }).formatToParts(now);
    const weekday = parts.find(({ type }) => type === 'weekday').value;
    const hour = Number(parts.find(({ type }) => type === 'hour').value);
    return !['Sat', 'Sun'].includes(weekday) && hour >= 9 && hour < 18;
  }

  function billingLookupTarget(no) {
    if (!billingContractScreens[no]) return undefined;
    return auditFlows[no]?.screens?.S01?.actions?.find(([label]) => label === 'PASS 본인인증')?.[1];
  }

  function estimateDateRange() {
    const today = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
    const end = new Date(today + 'T12:00:00Z');
    const day = end.getUTCDate();
    end.setUTCDate(1);
    end.setUTCMonth(end.getUTCMonth() + 1);
    const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
    end.setUTCDate(Math.min(day, lastDay));
    return { today, until: end.toISOString().slice(0, 10) };
  }

  function searchScore(scenario, query) {
    const direct = /^(?:no\.?\s*)?(\d{1,2})(?:번)?$/i.exec(query.trim());
    if (direct) return Number(direct[1]) === scenario.no ? 1000 : 0;
    const consultation = /^상담\s*코드\s*[:#]?\s*(\d+)$/u.exec(query.trim());
    if (consultation) return scenario.consultationCode?.split('/').some((code) => code.trim() === consultation[1]) ? 1000 : 0;
    const compact = normalize(query);
    if (!compact) return 0;
    const firstPhaseCode = scenario.firstPhaseScenario?.split(' ', 1)[0];
    if (firstPhaseCode && normalize(firstPhaseCode) === compact) return 1000;
    const terms = new Set([scenario.displayTitle, scenario.title, ...(scenario.keywords ?? []),
      ...scenario.screens.map((screen) => screen.customer)].map(normalize).filter((term) => term.length > 1));
    if (terms.has(compact)) return 200 + compact.length;
    const matches = [...terms].filter((term) => compact.includes(term));
    const aliasScore = matches.length ? Math.max(...matches.map((term) => term.length)) + 4 : 0;
    let ruleScore = 0;
    for (const rule of scenario.intentRules ?? []) {
      const matchedLengths = rule.map((group) => Math.max(0, ...group.map(normalize)
        .filter((term) => term && compact.includes(term)).map((term) => term.length)));
      if (matchedLengths.every((length) => length > 0)) {
        ruleScore = Math.max(ruleScore, 2 * rule.length + matchedLengths.reduce((sum, length) => sum + length, 0));
      }
    }
    const partial = compact.length > 1 && [...terms].some((term) => term.includes(compact)) ? 1 : 0;
    return Math.max(aliasScore, ruleScore, partial) + 0.01 * matches.length;
  }

  function rankedScenarios(scenarios, text) {
    return scenarios.map((scenario) => ({ scenario, score: searchScore(scenario, text) }))
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score || a.scenario.no - b.scenario.no);
  }

  function nextOtp(previous) {
    const numbers = new Uint32Array(1);
    if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(numbers);
    else numbers[0] = Math.floor(Math.random() * 0x100000000);
    const generated = 100000 + numbers[0] % 900000;
    return String(String(generated) === previous ? 100000 + (generated - 99999) % 900000 : generated);
  }

  class SKIXChat {
    static corporateReply(message) {
      const text = String(message ?? '').normalize('NFKC');
      const subject = normalize(text)
        .replace(/법인(?:용)?(?:신용|체크)?카드/g, '')
        .replace(/(?:법인(?:사업자|고객|회원|계약|명의|직원)?|(?:회사|기업|기관|단체)(?:의)?(?:명의|계약|계정|고객|사업자))[은는이가을를]?(?:아니고|아니라|아닙니다|아니에요|아닌|말고|빼고|제외하고|제외한)/g, '');
      const entity = /법인|주식회사|유한책임회사|유한회사/u.test(subject)
        || /(?:회사|기업|기관|단체)(?:의)?(?:명의|계약|계정|고객|사업자|구독|렌탈|견적|전용|로그인)/u.test(subject)
        || /기업(?:의)?(?:문의|상담|회원)/u.test(subject)
        || /\b(?:b[\s-]*2[\s-]*b|corporate)\b|(?:^|\s)\(주\)(?=\s|[가-힣])/iu.test(text);
      return entity ? '현재 이 상담은 개인과 개인사업자 고객만 이용할 수 있어요.' : '';
    }

    constructor(scenarios = []) {
      this.scenarios = [...scenarios];
      this.reset();
    }

    reset() {
      this.history = [];
      this.messages = [{ role: 'bot', text: welcome }];
      this.clearWorkflow();
      this.resolving = new Set();
      return this.getState();
    }

    clearWorkflow() {
      this.scenario = null;
      this.screen = null;
      this.context = {};
      this.fields = [];
      this.candidates = [];
    }

    getState() {
      return {
        scenario: this.scenario,
        screen: this.screen,
        selection: this.activeSelection(),
        selectedDate: this.context.date || '',
        messages: [...this.messages],
        actions: this.actionList().map(({ target, ...action }) => action),
        fields: this.fields.map((field) => ({ ...field })),
        verification: this.context.otpCode && this.fields.some((field) => field.label === '인증번호')
          ? { kind: 'sms', code: this.context.otpCode } : null,
        placeholder: this.screen?.placeholder || defaultPlaceholder,
        secure: Boolean(this.screen?.secure || this.screen?.id === '$auth' || this.fields.some((field) => field.type === 'password')),
        inputDisabled: Boolean(this.fields.length || ['internal-only', 'closed'].includes(this.screen?.kind) || this.screen?.id === '$auth'),
        canBack: this.history.length > 0,
        detail: this.screen?.condition || '',
        demoCases: this.scenario?.screens.filter((screen) => screen.id !== this.screen?.id).map((screen) => ({
          id: screen.id, label: screen.condition, kind: screen.kind
        })) ?? []
      };
    }

    find(query) {
      if (SKIXChat.corporateReply(query)) return [];
      return rankedScenarios(this.scenarios, String(query ?? '')).map(({ scenario }) => scenario);
    }

    remember() {
      this.history.push({
        scenario: this.scenario, screen: this.screen, length: this.messages.length,
        context: { ...this.context }, fields: this.fields.map((field) => ({ ...field })), candidates: [...this.candidates]
      });
    }

    goBack() {
      const previous = this.history.pop();
      if (!previous) return this.getState();
      this.messages.length = previous.length;
      this.scenario = previous.scenario;
      this.screen = previous.screen;
      this.context = previous.context;
      this.fields = previous.fields;
      this.candidates = previous.candidates;
      return this.getState();
    }

    start(no, customerText) {
      if (!this.scenarios.some((scenario) => scenario.no === Number(no))) return this.getState();
      this.remember();
      this.openScenario(no, customerText, true);
      return this.getState();
    }

    openScenario(no, customerText, echo) {
      const scenario = this.scenarios.find((item) => item.no === Number(no));
      if (!scenario) return;
      const previous = this.context;
      const previousNo = this.scenario?.no;
      const reuseServiceDetails = previousNo === 11 && scenario.no === 12
        && previous.serviceProduct && previous.serviceSymptom;
      const reuseVisit = !echo && previous.phoneVerified && ((scenario.no === 13 && [12, 14, 15].includes(previousNo))
        || ([13, 14].includes(previousNo) && [14, 15].includes(scenario.no) && previous.serviceVisit));
      const reuseDelivery = !echo && previous.phoneVerified && previousNo === 16 && scenario.no === 17
        && this.screen?.id === 'S03';
      const billingEntry = billingLookupTarget(scenario.no);
      const reuseBilling = !echo && previous.billingVerified && billingEntry;
      this.scenario = scenario;
      this.context = { request: customerText || '' };
      const originalEntry = scenario.no === 6 && this.partnerCards().length
        ? scenario.screens.find((screen) => screen.id === 'S02') ?? scenario.screens[0]
        : scenario.screens[0];
      if (reuseServiceDetails) {
        this.context.serviceProduct = previous.serviceProduct;
        this.context.serviceSymptom = previous.serviceSymptom;
      }
      let entry = reuseServiceDetails ? this.serviceRegistrationEntry() : auditFlows[scenario.no]?.entry;
      if (reuseBilling) {
        Object.assign(this.context, { billingVerified: true, product: previous.product });
        const contractScreen = billingContractScreens[scenario.no];
        const choices = auditFlows[scenario.no]?.screens?.[contractScreen]?.actions;
        const selected = previous.product && choices?.find(([label]) => label === previous.product + ' 선택');
        entry = (scenario.no !== 7 || /위약금|해약비/.test(customerText))
          ? selected?.[1] ?? billingEntry : billingEntry;
      }
      if (reuseVisit) {
        Object.assign(this.context, { phoneVerified: true, maskedPhone: previous.maskedPhone,
          serviceVisit: previous.serviceVisit, sameDayVisit: previous.sameDayVisit, subscriptionVisit: previous.subscriptionVisit,
          visitProfile: previous.visitProfile, visitEdits: previous.visitEdits, cancelledVisits: previous.cancelledVisits });
        if (scenario.no === 13) {
          this.showVisitResults();
          return;
        }
        entry = this.visitRequestEntry();
      }
      if (reuseDelivery) {
        Object.assign(this.context, { phoneVerified: true, maskedPhone: previous.maskedPhone,
          deliveryType: previous.deliveryType, deliveryProfile: previous.deliveryProfile, deliveryOrderKey: previous.deliveryOrderKey });
        entry = this.deliveryOrderEntry();
      }
      const first = this.screenSource(entry) ?? originalEntry;
      if (echo && first?.kind !== 'internal-only') this.sayUser(customerText || scenario.displayTitle || scenario.title);
      this.show(first);
    }

    showDemoScreen(id) {
      const screen = this.screenSource(id);
      if (!screen) return this.getState();
      this.remember();
      this.context = {};
      this.show(screen, { demo: true });
      return this.getState();
    }

    screenSource(id) {
      if (!id || !this.scenario) return undefined;
      return this.scenario.screens.find((screen) => screen.id === id)
        ?? (auditFlows[this.scenario.no]?.screens?.[id] ? { id } : undefined);
    }

    show(screen, properties = {}) {
      if (!screen) return;
      const patch = auditFlows[this.scenario.no]?.screens?.[screen.id];
      if (patch) {
        const { actions, fields, ...display } = patch;
        screen = { ...screen, ...display };
        if (actions) screen.explicitActions = actions;
        if (fields) screen.explicitFields = fields;
      }
      if (screen.resolve && !properties.demo) {
        const key = this.scenario.no + ':' + screen.id;
        if (this.resolving.has(key)) throw new Error('Circular workflow resolution: ' + key);
        const matched = screen.resolve.rules?.find((rule, index) =>
          this.context.routeMatches?.[screen.id + ':' + index]?.length);
        const target = matched?.target ?? screen.resolve.default;
        if (target && target !== screen.id) {
          this.screen = screen;
          this.resolving.add(key);
          try {
            this.execute(target);
          } finally {
            this.resolving.delete(key);
          }
          return;
        }
      }
      const collectsIdentity = screen.id === 'phoneInput'
        || screen.options?.some((label) => /인증번호 받기/.test(label))
        || screen.explicitActions?.some(([, target]) => target === '$sendOtp');
      if (collectsIdentity && !this.context.nativeSmsConsent) {
        this.context.nativeSmsReturn = screen.id;
        const firstPhase = this.scenario.phase === '1차';
        this.synthetic(firstPhase ? phoneConsent + ' 개인사업자는 사업자등록번호도 확인해요.' : phoneConsent, {
          id: '$nativeSmsConsent',
          actions: [['동의하고 계속', '$nativeSmsConsent'],
            ...(firstPhase ? [['개인사업자로 동의하고 계속', [16, 17].includes(this.scenario.no)
              ? '$deliveryBusinessConsent' : '$nativeSmsBusinessConsent']] : []),
            ['동의하지 않음', '$auditSmsDecline']]
        });
        return;
      }
      this.screen = screen;
      if (typeof screen.paymentAmount === 'number') {
        this.context.paymentAmount = screen.paymentAmount;
        this.context.paymentOptions = screen.id;
        this.context.paymentReceiptRequested = false;
      }
      this.candidates = [];
      this.fields = this.buildFields(screen);
      this.sayScreen(properties);
    }

    synthetic(text, { id = '$synthetic', kind = 'choice', condition = '', actions = [], fields = [], items = [], demo = true } = {}) {
      this.show({ id, kind, condition, message: text, explicitActions: actions, explicitFields: fields, items, demo });
    }

    buildFields(screen) {
      if (!this.scenario) return [];
      const original = screen.explicitFields ?? fieldsFor(this.scenario.no, screen, this.context);
      const definitions = this.context.nativeSmsBusiness && screen.id === this.context.nativeSmsReturn
        ? [...original, businessRegistration] : original;
      return definitions.map((definition, index) => {
        const item = typeof definition === 'string' ? fieldTemplates[definition] : definition;
        if (!item) throw new Error('Unknown workflow field: ' + definition);
        const type = item.type ?? 'text';
        const sample = item.label === '인증번호' ? this.context.otpCode
          : item.label === '희망 배송일' ? offsetDate(estimateDateRange().today, 7)
          : item.label === '카드번호' && this.context.issuer?.last4
            ? '000000000000' + this.context.issuer.last4 : item.sample;
        const keyboard = type === 'password' ? 'numeric' : type === 'tel' ? 'tel' : type === 'email' ? 'email' : undefined;
        return {
          ...item, sample, id: `field-${index}`, type, inputMode: keyboard, required: item.required !== false && !item.readonly,
          value: item.readonly ? item.value ?? this.context.maskedPhone ?? maskNumber(demoPhone) : undefined
        };
      });
    }

    sayScreen(properties) {
      const screen = this.screen;
      const no = this.scenario.no;
      const items = screen.items?.map((item) => ({ ...item, title: this.fill(item.title), detail: this.fill(item.detail) })) ?? [];
      const message = {
        role: 'bot', text: this.fill(screen.message), items,
        demo: Boolean(screen.demo || properties.demo), status: properties.status, links: screen.links
      };
      if (this.activeSelection()?.kind === 'service-product') message.items = [];
      if (visitListScreens[no] === screen.id) {
        const visits = this.availableVisits();
        message.text = `미처리 접수가 ${visits.length}건 있어요. 방문예정일이 가까운 순으로 최대 5건을 보여드려요. 확인할 접수를 선택해 주세요.${visits.length > 5 ? ' 다른 접수는 상담사에게 문의해 주세요.' : ''}`;
        message.items = visits.slice(0, 5).map((key) => ({
          title: [serviceVisits[key].product, serviceVisits[key].service].filter(Boolean).join(' '),
          detail: `${this.visitDetail(key)} · ${dateLabel(this.serviceVisitDate(key))}`
        }));
      }
      const visitKey = this.context.serviceVisit;
      if (no === 13 && ['S03', 'S04'].includes(screen.id) || no === 14 && ['S02', 'S10'].includes(screen.id)
        || no === 15 && ['visitDetails', 'S03', 'S04', 'S05'].includes(screen.id)) {
        const key = visitKey ?? (screen.id === 'S04' && no === 13 ? 'bidet' : 'water');
        message.items = this.visitItems(key);
        if (no === 15 && this.context.cancellationReason && ['S04', 'S05'].includes(screen.id)) {
          message.items.push({ title: '취소 사유', detail: this.context.cancellationReason });
        }
      }
      if ([16, 17].includes(no) && screen.id === 'S02') {
        message.items = this.deliveryOrderKeys().map((key) => {
          const order = deliveryOrders[key];
          const detail = this.deliveryItems({ key }).filter(({ title }) => title !== '제품명')
            .map(({ title, detail }) => `${title} ${detail}`).join('\n');
          return { title: order.product, detail: order.components ? `제품명 ${order.components}\n${detail}` : detail };
        });
      }
      if ([16, 17].includes(no) && ['S03', 'subscriptionOrder'].includes(screen.id)) {
        message.items = this.deliveryItems();
      }
      if (no === 17 && screen.id === 'S07' && (this.context.modifiedAddress || this.context.date)) {
        message.items = this.deliveryItems({ address: this.context.modifiedAddress, date: this.context.dateIso });
        if (this.deliveryOrderType() === 'created') {
          message.text += ' 변경 내용은 설치마스터에게 전달하는 처리로 이어져요.';
        }
      }
      if (no === 17 && screen.id === 'S08' && this.context.deliveryNote) {
        message.items = [{ title: '요청사항', detail: this.context.deliveryNote }];
      }
      if (no === 12 && screen.id === 'S06' && this.context.serviceProduct && this.context.serviceSymptom) {
        message.items = [...items, { title: '접수 제품', detail: this.serviceProductLabel() },
          { title: '접수 증상', detail: this.context.serviceSymptom }];
      }
      if (screen.kind === 'internal-only') message.status = '별도 검토';
      if (this.scenario.phase === '별도 검토' && !message.status) message.status = '별도 검토';
      if (no === 49 && screen.id === 's5' && this.context.consent === '동의하기') {
        message.items = [{ title: '변경 결과', detail: '동의' }];
      }
      if (no === 37 && screen.id === 's8' && this.context.document) {
        message.text = `${this.context.document} 발송 요청을 처리했어요.`;
        message.items = [
          { title: '발송 방식', detail: this.context.channel || items[0].detail },
          { title: '발송 구분', detail: this.context.recurring ? '매월 정기 발송' : '일회성 발송' }
        ];
      }
      if (no === 3 && screen.id === 'S08' && this.context.payment) {
        const { account, bank, masked, title } = this.context.payment;
        message.items = [
          { title: '변경된 수단', detail: account ? '은행계좌 자동이체 · ' + bank : title + ' 자동납부' },
          { title: account ? '계좌번호' : '카드번호', detail: masked },
          { title: account ? '이체일' : '결제일', detail: items[2].detail }
        ];
      }
      if ([4, 5].includes(no) && screen.id === 'S07' && this.context.payment) {
        const { account, bank, masked, title } = this.context.payment;
        const method = account ? bank + ' · ' + masked : title + ' · ' + masked;
        message.items = [...items, { title: '결제수단', detail: method }];
      }
      if ((no === 4 && screen.id === 'S07V' || no === 5 && screen.id === 'S08') && this.context.virtualBank) {
        message.items = [
          { title: '가상계좌', detail: this.context.virtualBank + ' · ••••-••••-1234' },
          { title: '입금할 금액', detail: this.fill('[납부 금액]') },
          { title: '안내받을 연락처', detail: this.context.maskedPhone || maskNumber(demoPhone) },
          { title: '납부 상태', detail: '입금 대기' }
        ];
      }
      if ([4, 5].includes(no) && ['S07', 'S07V', 'S08'].includes(screen.id) && this.context.paymentReceiptRequested) {
        message.items.push({ title: '현금영수증', detail: '계약자 명의로 발행 신청' });
      }
      if ((no === 4 && screen.id === 'S02') || (no === 5 && screen.id === 'S04')) {
        message.text = '같은 요금을 이미 납부하셨는지 먼저 확인해 주세요.\n' + message.text;
      }
      if ([3, 4, 5].includes(no) && this.context.issuer && screen.fields?.some((field) => field.label === '카드번호')) {
        message.items = [...items, { title: '선택한 카드', detail: this.context.issuer.title }];
      }
      if (no === 6 && screen.id === 'S02') {
        message.items = [];
        if (this.partnerCards().length) message.demo = false;
      }
      if (no === 6 && screen.id === 'S03' && this.context.partnerCard) {
        const { id, title, issuer, detail, phone, phoneLabel, href } = this.context.partnerCard;
        message.items = [{ title, detail: [issuer, detail].filter(Boolean).join('\n'), mediaKey: id }];
        if (phone) message.items.push({ title: phoneLabel || '카드사 신청 문의', detail: phone });
        message.links = [{ label: href ? '카드사 상세·신청 안내' : 'SK매직몰 제휴카드 혜택', href: href || partnerBenefitsUrl }];
        message.demo = !id;
      }
      if (screen.id === '$auth') message.status = '인증 안내';
      if (screen.id === '$handoff') message.status = '상담사 연결';
      this.messages.push(message);
    }

    fill(value) {
      const variables = this.scenario.demoValues ?? {};
      let text = String(value ?? '').replace(/\[([^\[\]]+)\]/g, (token, key) => {
        if (key === '납부 금액' && [4, 5].includes(this.scenario.no)) {
          return (this.context.paymentAmount ?? 29900).toLocaleString('ko-KR') + '원';
        }
        if (key === '할부 기간' && [4, 5].includes(this.scenario.no)) return this.context.installmentPeriod ?? '일시불';
        if (key === '방문 제품' && [8, 9].includes(this.scenario.no)) return this.context.product || '직수 정수기';
        if ([8, 9, 12].includes(this.scenario.no)) {
          const details = {
            '받으실 분': this.context.visitApplicant || '김○○',
            '방문 주소': this.context.visitAddress || demoAddress,
            '분리 방문 주소': this.context.splitVisitAddress || demoAddress,
            '재설치 방문 주소': this.context.reinstallVisitAddress || demoAddress,
            '방문 연락처': this.context.visitPhone || this.context.maskedPhone || maskNumber(demoPhone),
            '분리 방문일': this.context.splitDate ? dateLabel(this.context.splitDate) : undefined,
            '재설치 방문일': this.context.reinstallDate ? dateLabel(this.context.reinstallDate) : undefined,
            '접수 제품': this.serviceProductLabel() || registeredServiceProduct.title,
            '접수 증상': this.context.serviceSymptom || '미입력'
          };
          if (details[key]) return details[key];
        }
        if (/발송|전송/.test(key) && /방법|채널|방식/.test(key) && this.context.channel) return this.context.channel;
        if (/마스킹된\s*수신처/.test(key) && this.context.receiptRecipient) return this.context.receiptRecipient;
        if (key === '마스킹된 번호' && this.context.maskedPhone) return this.context.maskedPhone;
        if (key === '변경 항목' && this.context.modifiedCategory) return this.context.modifiedCategory;
        if (key === '선택한 날짜' && this.context.date) return this.context.date;
        if (key === '마스킹된 수신처' && this.context.receiptRecipient) return this.context.receiptRecipient;
        return variables[key] ?? token;
      });
      text = text.replace(/이메일으로/g, '이메일로').replace(/팩스으로/g, '팩스로');
      if (this.screen.kind === 'result' && this.context.date && (dateScenarios.has(this.scenario.no) || [7, 36].includes(this.scenario.no))) {
        const sample = [17, 36].includes(this.scenario.no) ? '12월 2일(수)'
          : this.scenario.no === 14 ? '11월 30일(월)' : this.scenario.no === 7 ? '11월 30일' : '11월 27일(금)';
        text = text.replaceAll(sample, this.context.date);
      }
      if (this.screen.kind === 'result' && this.scenario.no === 17 && this.screen.id === 'S07' && this.context.modifiedAddress) {
        text = text.replace(/배송 예정일 · .+/, `배송주소 · ${this.context.modifiedAddress}`);
      }
      return text;
    }

    sayUser(text) {
      if (text) this.messages.push({ role: 'user', text });
    }

    sayBot(text, extra = {}) {
      this.messages.push({ role: 'bot', text, ...extra });
    }

    partnerCards() {
      return window.SKIX_PARTNER_CARDS ?? [];
    }

    serviceProductLabel() {
      const item = this.context.serviceProduct;
      return item ? [item.title, item.detail].filter(Boolean).join(' · ') : '';
    }

    serviceVisitDate(key) {
      const changed = this.context.visitEdits?.[key]?.date;
      if (changed) return changed;
      const { today } = estimateDateRange();
      const days = key === 'water' && this.context.sameDayVisit ? 0 : serviceVisits[key].days;
      return offsetDate(today, days);
    }

    visitDetail(key) {
      const visit = serviceVisits[key];
      return visit.service || this.context.visitEdits?.[key]?.symptom || visit.symptom;
    }

    visitItems(key) {
      const { id, product, service } = serviceVisits[key];
      const changed = this.context.visitEdits?.[key];
      return [
        { title: '접수번호', detail: id },
        { title: '접수제품', detail: product },
        { title: service ? '서비스 종류' : '접수 증상', detail: this.visitDetail(key) },
        { title: '방문 예정일', detail: dateLabel(this.serviceVisitDate(key)) },
        { title: '담당 매니저', detail: '영등포센터 김○○ 매니저' },
        { title: '서비스 받으실 분', detail: '김○○' },
        { title: '방문 연락처', detail: changed?.phone || this.context.maskedPhone || maskNumber(demoPhone) },
        { title: '방문 주소', detail: changed?.address ? neighborhood(changed.address) : demoAddress }
      ];
    }

    availableVisits() {
      const keys = this.context.visitProfile === 'single' ? ['water']
        : this.context.visitProfile === 'multiple' ? Object.keys(serviceVisits) : ['water', 'bidet'];
      return keys.filter((key) => !this.context.cancelledVisits?.includes(key)).sort((left, right) =>
        this.serviceVisitDate(left).localeCompare(this.serviceVisitDate(right))
        || serviceVisits[left].id.localeCompare(serviceVisits[right].id));
    }

    showVisitResults() {
      const no = this.scenario.no;
      const visits = this.availableVisits();
      if (!visits.length) this.execute({ 13: 'S06', 14: 'S09', 15: 'S06' }[no]);
      else if (visits.length === 1) {
        this.context.serviceVisit = visits[0];
        this.execute(no === 13 ? this.visitDetailScreen() : no === 14 ? this.visitRequestEntry() : 'visitDetails');
      } else this.execute(visitListScreens[no]);
    }

    visitDetailScreen() {
      return serviceVisits[this.context.serviceVisit]?.service ? 'S04' : 'S03';
    }

    visitRequestEntry() {
      const sameDay = this.context.serviceVisit && this.serviceVisitDate(this.context.serviceVisit) === estimateDateRange().today;
      if (this.scenario.no === 14) return sameDay ? 'S06' : 'S02';
      return sameDay ? 'S07' : 'S03';
    }

    deliveryOrderKeys() {
      return this.context.deliveryProfile === 'multiple' ? Object.keys(deliveryOrders) : ['water'];
    }

    deliveryOrderType(key = this.context.deliveryOrderKey ?? 'water') {
      return this.context.deliveryProfile === 'multiple' ? deliveryOrders[key].type : this.context.deliveryType;
    }

    deliveryItems({ address, date, key = this.context.deliveryOrderKey ?? 'water' } = {}) {
      const order = deliveryOrders[key];
      const type = this.deliveryOrderType(key);
      return [
        { title: '수령인', detail: '김○○' },
        { title: '수령인 연락처', detail: this.context.maskedPhone || maskNumber(demoPhone) },
        { title: '배송지', detail: address || demoAddress },
        { title: '배송일자', detail: dateLabel(date || offsetDate(estimateDateRange().today, order.days)) },
        { title: '주문번호', detail: order.id },
        { title: '제품명', detail: order.components || (type === 'package' ? '직수 정수기 · 공기청정기' : order.product) },
        { title: '주문상태', detail: { created: '납품생성', dispatched: '출고' }[type] || '납품대기' },
        { title: '판매유형', detail: type === 'subscription' ? '구독' : '일시불' }
      ];
    }

    deliveryOrderEntry() {
      return { subscription: 'subscriptionOrder', dispatched: 'createdOrder' }[this.deliveryOrderType()] || 'S03';
    }

    serviceRegistrationEntry() {
      return this.context.serviceProduct?.detail || this.context.serviceProduct?.model ? 'S02' : 'serviceModel';
    }

    symptomStep() {
      const id = this.screen?.id;
      if ((this.scenario?.no === 11 && id === 'S02') || id === 'serviceSymptom' || id === 'editSymptomPicker') return 0;
      if (id === '$symptomGroup') return 1;
      if (id === '$symptomIssue') return 2;
      return null;
    }

    symptomOptions(step) {
      const path = this.context.symptomPath ?? [];
      const family = this.context.serviceProduct?.family ?? serviceVisits[this.context.serviceVisit]?.family ?? 'water';
      const categories = [...(productSymptoms[family] ?? []), ...commonSymptoms];
      if (step === 0) return categories;
      const category = categories.find((item) => item.title === path[0]);
      if (step === 1) return category?.groups ?? [];
      return category?.groups.find((item) => item.title === path[1])?.issues ?? [];
    }

    scheduleDates(all = false) {
      const no = this.scenario.no;
      const { today } = estimateDateRange();
      let first = offsetDate(today, [14, 17].includes(no) ? 0 : 1);
      let last = offsetDate(today, 30);
      const move = this.context.moveDate;
      const visitService = serviceVisits[this.context.serviceVisit]?.service;
      if (move && (no === 8 || no === 14 && visitService === '분리') && move <= last) last = offsetDate(move, -1);
      if (move && (no === 9 || no === 14 && visitService === '재설치')) {
        const minimum = no === 9 ? offsetDate(move, 1) : nextWeekday(move);
        if (minimum > first) first = minimum;
      }
      if (no === 17 && this.deliveryOrderType() === 'unavailable') return [];
      if (no === 17 && !all) {
        const requested = this.context.deliveryDate || offsetDate(today, 7);
        const minimum = offsetDate(requested, -2);
        const maximum = offsetDate(requested, 2);
        if (minimum > first) first = minimum;
        if (maximum < last) last = maximum;
      }
      return Array.from({ length: 31 }, (_, index) => offsetDate(first, index)).filter((date) => date <= last);
    }

    showSymptomStep(step) {
      if (step === 0) {
        this.execute({ 11: 'S02', 12: 'serviceSymptom', 14: 'editSymptomPicker' }[this.scenario.no]);
        return;
      }
      this.synthetic(step === 1 ? '어느 항목에 문제가 있나요?' : '가장 가까운 증상을 선택해 주세요.', {
        id: step === 1 ? '$symptomGroup' : '$symptomIssue', demo: false
      });
    }

    finishSymptom(text, outcome) {
      this.context.serviceSymptom = text;
      if (this.scenario.no === 11) {
        this.execute(outcome === 'urgent' ? 'S04' : outcome === 'noWater' ? 'S05' : 'S06');
      } else if (this.scenario.no === 12) {
        this.execute(outcome === 'urgent' ? 'serviceSafety' : this.serviceRegistrationEntry());
      } else {
        this.execute('editSymptomConfirm');
      }
    }

    activeSelection() {
      const no = this.scenario?.no;
      const id = this.screen?.id;
      if (([11, 12].includes(no) && id === 'S01') || ([8, 9].includes(no) && id === 'S02')) {
        return { kind: 'service-product', title: '보유 제품 선택' };
      }
      const step = this.symptomStep();
      if (step !== null) {
        return { kind: 'service-symptom', title: '증상 선택', step,
          detail: this.serviceProductLabel(), path: [...(this.context.symptomPath ?? [])] };
      }
      if (no === 6 && id === 'S02') {
        return { kind: 'partner-card', title: '제휴카드 선택', detail: '카드별 혜택과 신청 안내를 확인해 주세요.' };
      }
      if (id === '$issuerPicker' || id === '$installmentIssuerPicker' || id === '$savedPicker') {
        return { kind: 'card-issuer', title: id === '$savedPicker' ? '등록된 카드 선택' : '사용할 카드 선택' };
      }
      if (id === '$receiptPicker') {
        return { kind: 'card-transaction', title: '카드 결제 내역 선택' };
      }
      if ((no === 3 && id === 'S03') || ([4, 5].includes(no) && (
        typeof this.screen.paymentAmount === 'number' || ['oneTimeMethods', 'receiptPaymentMethods'].includes(id)
      ))) {
        return { kind: 'payment-method', title: '결제수단 선택' };
      }
      return null;
    }

    selectionActions() {
      const no = this.scenario.no;
      const id = this.screen.id;
      if (visitListScreens[no] === id) {
        const visits = this.availableVisits();
        const target = { 13: '$visitDetails', 14: '$visitChange', 15: 'visitDetails' }[no];
        const actions = visits.slice(0, 5).map((key) => {
          const { product, service } = serviceVisits[key];
          return { id: 'visit:' + key, label: [product, service, '접수 선택'].filter(Boolean).join(' '),
            target };
        });
        if (visits.length > 5) actions.push({ id: 'visit:handoff', label: '다른 접수 건 상담사 문의', target: '$handoff' });
        return actions;
      }
      if ([16, 17].includes(no) && id === 'S02') return this.deliveryOrderKeys().map((key) => ({
        id: 'delivery:' + key, label: `${deliveryOrders[key].product} 주문 선택`, target: no === 16 ? 'S03' : '$deliveryOrder'
      }));
      const step = this.symptomStep();
      if (step !== null) {
        const choices = this.symptomOptions(step).map((item, index) => ({
          id: `symptom:${step}:${index}`, label: item.title, target: '$selectSymptom',
          card: { kind: 'symptom', title: item.title, detail: item.detail, icon: item.icon }
        }));
        return [...choices, { id: 'symptom:manual', label: '증상 직접 입력', target: 'customSymptom' },
          { id: 'symptom:back', label: step === 0 && no === 14 ? '변경 항목으로' : step === 0 ? '제품 다시 선택' : '이전 단계', target: '$symptomBack' }];
      }
      const list = this.partnerCards();
      if (no === 6 && id === 'S02') {
        const cards = list.length ? list : [samplePartner];
        return cards.map((card, index) => ({
          id: 'partner:' + index, target: 'S03',
          label: list.length ? card.title : '제휴카드 혜택 보기',
          card: {
            id: card.id, title: card.title, issuer: card.issuer, detail: card.detail, phone: card.phone,
            phoneLabel: card.phoneLabel, href: card.href, mediaKey: card.id, kind: 'partner'
          }
        }));
      }
      if (no === 6 && id === 'S03' && this.context.partnerCard?.id) {
        return [
          { id: 'partner:restart', label: '다른 제휴카드 보기', target: 'S02' },
          { id: 'partner:continue', label: '계속하기', target: 'S04' }
        ];
      }
      if (id === '$issuerPicker' || id === '$installmentIssuerPicker') {
        const target = id === '$installmentIssuerPicker' ? 'installmentCard' : no === 5 ? 'S05' : 'S04';
        return sampleIssuers.map((card, index) => ({
          id: 'issuer:' + index, target, label: card.title, card
        }));
      }
      if (id === '$savedPicker') {
        return [
          { id: 'saved:sample', label: '신한카드 선택', target: '$confirmPayment', card: savedCard },
          { id: 'saved:back', label: '다른 납부 방법', target: '$paymentOptions' }
        ];
      }
      if (id === '$receiptPicker') {
        return [{ id: 'receipt:sample', label: '11월 카드 결제 내역 선택', target: 's2', card: sampleTransaction }];
      }
      return null;
    }

    actionList() {
      if (this.candidates.length) return this.candidates.map((scenario) => ({
        id: `intent:${scenario.no}`, label: scenario.displayTitle || scenario.title, target: `@${scenario.no}`
      }));
      const screen = this.screen;
      if (!screen || screen.kind === 'internal-only' || screen.kind === 'closed') return [];
      const no = this.scenario.no;
      const targets = optionTargets[no]?.[screen.id] ?? [];
      const steps = screen.explicitActions ?? (screen.options ?? []).map((label, index) => [label, targets[index] ?? this.graphTarget(label)]);
      const extras = screen.explicitActions ? [] : continuation[no]?.[screen.id] ?? [];
      const custom = this.selectionActions();
      const defaults = [...steps, ...extras];
      if (schedulingScreens[no] === screen.id && defaults.some(([, target]) => target === '$date')) {
        const dates = this.scheduleDates();
        const ordinary = defaults.filter(([, target]) => target !== '$date' && target !== '$moreDates');
        if (!dates.length) return [{ id: 'schedule:unavailable', label: '예약 상담 연결', target: '$handoff', variant: 'primary' }];
        const initialCount = no === 17 ? 5 : 4;
        defaults.splice(0, defaults.length, ...dates.slice(0, initialCount).map((date) => [dateLabel(date) + ' 선택', '$date']),
          ...(this.scheduleDates(true).length > Math.min(dates.length, initialCount) ? [['더보기', '$moreDates']] : []), ...ordinary);
      }
      const additions = (screen.addActions ?? []).filter(([label]) => !defaults.some(([original]) => original === label));
      const defaultActions = [...defaults, ...additions].map(([label, target], index) => ({ id: `action:${index}`, label, target }))
        .filter(({ target, label }) => (target !== '$date' || label !== `${this.context.date} 선택`)
          && (target !== '$address' || this.context.checkedAddress !== screen.id));
      const actions = custom ?? defaultActions;
      const selectionKind = this.activeSelection()?.kind;
      if (selectionKind === 'payment-method') {
        for (const action of actions) action.card = methodCards[action.label];
      }
      if (selectionKind === 'service-product') {
        for (const action of actions) {
          if (/^(직수 )?정수기 선택$/.test(action.label)) action.card = registeredServiceProduct;
        }
      }
      if (this.fields.length && !actions.length) actions.push({ id: 'submit', label: '확인', target: inputTargets[no]?.[screen.id] || this.graphTarget('확인') });
      if (!actions.length && screen.kind !== 'input') {
        if (screen.kind === 'handoff' && !/전달했|완료|등록됐/.test(screen.message) && screen.id !== '$handoff') {
          actions.push({ id: 'handoff', label: '상담사 연결', target: '$handoff' });
        }
        actions.push({ id: 'menu', label: '다른 문의', target: '$menu' });
      }
      return actions.map((action, index) => ({
        ...action,
        requiresFields: Boolean(this.fields.length && action.target !== '$resendOtp' && !/재전송|취소|뒤로|나가기/.test(action.label)),
        variant: action.label === this.context.date + ' 선택' ? 'selected' : index === 0 ? 'primary' : 'secondary'
      }));
    }

    graphTarget(label) {
      const screen = this.screen;
      if (screen.id === 'phoneConfirm' || screen.id === '$phoneConfirm') {
        return /재전송/.test(label) ? '$resendOtp' : '$verifyOtp';
      }
      if (/인증번호 받기|휴대폰 확인/.test(label) && this.fields.some((field) => /휴대폰/.test(field.label))) return '$sendOtp';
      if (/상담사 연결|상담 문의하기/.test(label)) return '$handoff';
      if (/추가 문의|다른 문의/.test(label)) return '$menu';
      if (/상담 종료|나가기|여기서 마치기/.test(label)) return '$finish';
      const queue = this.scenario.edges.filter((edge) => edge.from === screen.stepId);
      const visited = new Set([screen.stepId]);
      while (queue.length) {
        queue.sort((a, b) => this.edgeScore(b, label) - this.edgeScore(a, label));
        const edge = queue.shift();
        if (visited.has(edge.to)) continue;
        visited.add(edge.to);
        const candidate = this.scenario.screens.find((item) => item.stepId === edge.to && ['choice', 'input', 'result'].includes(item.kind));
        if (candidate) return candidate.id;
        queue.push(...this.scenario.edges.filter((next) => next.from === edge.to));
      }
      return '$finish';
    }

    edgeScore(edge, label) {
      const text = normalize(edge.label);
      const word = normalize(label);
      if (text.length > 1 && word.length > 1 && (text.includes(word) || word.includes(text))) return 10;
      return /실패|미확인|불가|없음/.test(edge.label ?? '') ? -1 : 0;
    }

    submit(text) {
      const query = String(text ?? '').trim();
      if (!query || ['internal-only', 'closed'].includes(this.screen?.kind) || this.screen?.id === '$auth') return this.getState();
      const action = this.actionList().find((item) => normalize(item.label) === normalize(query));
      if (action && !action.requiresFields) return this.choose(action.id);
      if (this.fields.length === 1) return this.submitFields({ [this.fields[0].id]: query });
      if (this.fields.length) return this.getState();
      const scope = SKIXChat.corporateReply(query);
      if (scope) {
        this.remember();
        this.clearWorkflow();
        this.sayUser(query);
        this.sayBot(scope);
        return this.getState();
      }
      if (/^(?:처음으로|다른\s*문의|상담\s*메뉴)$/.test(query)) {
        this.remember();
        this.sayUser(query);
        this.execute('$menu');
        return this.getState();
      }
      if (/^(?:상담사|상담원|상담사\s*연결|상담원\s*연결)$/.test(query)) {
        this.remember();
        this.sayUser(query);
        if (this.scenario) this.execute('$handoff');
        else this.sayBot('문의 내용을 먼저 알려주시면 적합한 상담을 안내할게요.');
        return this.getState();
      }
      const candidates = rankedScenarios(this.scenarios, query);
      const first = candidates[0];
      const next = candidates[1];
      if (first && first.score >= 6 && (!next || first.score >= 200 || first.score - next.score > 0.015)) return this.start(first.scenario.no, query);
      this.remember();
      this.sayUser(query);
      const possible = candidates.filter(({ score }) => score >= Math.max(1, (first?.score ?? 0) - 4));
      this.candidates = possible.slice(0, 4).map(({ scenario }) => scenario);
      this.sayBot(this.candidates.length
        ? '말씀하신 내용과 관련 있는 상담이에요. 원하시는 항목을 선택해 주세요.'
        : '어떤 업무를 도와드릴까요? ‘결제일’, ‘배송조회’, ‘AS 접수’처럼 궁금한 내용을 짧게 입력해 주세요.');
      return this.getState();
    }

    choose(actionId, values = {}, options = {}) {
      const action = this.actionList().find((item) => item.id === actionId || item.label === actionId);
      if (!action) return this.getState();
      return action.requiresFields ? this.submitFields(values, action.id, options) : this.applyAction(action, {}, options);
    }

    validateFieldValue(id, input, actionId) {
      const field = this.fields.find((item) => item.id === id);
      if (!field) return '';
      const action = this.actionList().find((item) => item.id === actionId);
      if (action?.target === '$address' && !field.label.endsWith('주소')) return '';
      const error = validationError(field, input);
      if (!error && input && this.scenario.no === 7 && field.type === 'date') {
        const { today, until } = estimateDateRange();
        if (input < today || input > until) return '오늘부터 한 달 이내의 날짜를 입력해 주세요.';
      }
      if (!error && input && field.type === 'date') {
        const no = this.scenario.no;
        const { today } = estimateDateRange();
        if (no === 17 && field.label === '희망 배송일' && (input < today || input > offsetDate(today, 30))) {
          return '희망 배송일은 오늘부터 30일 이내에서 입력해 주세요.';
        }
        if ([8, 9].includes(no)) {
          if (field.label === '이사 예정일' && input <= today) return '이사 예정일은 내일 이후 날짜를 입력해 주세요.';
          if (/방문 희망일$/.test(field.label) && (input <= today || input > offsetDate(today, 30))) {
            return '방문 희망일은 내일부터 30일 이내에서 입력해 주세요.';
          }
          if (field.label === '재설치 방문 희망일' && this.context.moveDate && input <= this.context.moveDate) {
            return '재설치 방문 희망일은 이사 예정일 다음 날부터 입력해 주세요.';
          }
        }
      }
      return error;
    }

    submitFields(values, actionId, options = {}) {
      const choices = this.actionList().filter((action) => action.requiresFields);
      const action = (actionId && choices.find((item) => item.id === actionId || item.label === actionId))
        || choices.find((item) => item.target !== '$address') || choices[0];
      if (!action) return this.getState();
      const inputs = {};
      for (const field of this.fields) {
        inputs[field.label] = String(values?.[field.id] ?? values?.[field.label] ?? field.value ?? '').trim();
      }
      const allowed = this.screen.validate?.oneOf;
      const dateOrder = this.screen.validate?.dateOrder ?? [];
      this.fields = this.fields.map((field) => {
        const input = inputs[field.label];
        let error = this.validateFieldValue(field.id, input, action.id);
        if (!error && allowed?.field === field.label
          && !allowed.sources.some((name) => normalize(inputs[name]) === normalize(input))) {
          error = '입력하신 계약 중에서 대표 계약을 입력해 주세요.';
        }
        const datePair = dateOrder.find(([earlier, later]) => earlier === field.label && inputs[later]);
        if (!error && input && datePair && (datePair[2] ? input > inputs[datePair[1]] : input >= inputs[datePair[1]])) {
          error = datePair[2] ? `${datePair[0]}은 ${datePair[1]}과 같거나 그보다 앞서야 해요.`
            : `${datePair[0]}은 ${datePair[1]}보다 앞선 날짜를 입력해 주세요.`;
        }
        if (!error && [25, 26].includes(this.scenario.no) && field.label === '두 번째 계약'
          && normalize(input) === normalize(inputs['첫 번째 계약'])) {
          error = '첫 번째 계약과 다른 계약을 입력해 주세요.';
        }
        return { ...field, value: field.readonly ? field.value : undefined, error };
      });
      return this.fields.some((field) => field.error) ? this.getState() : this.applyAction(action, inputs, options);
    }

    applyAction(action, values, options = {}) {
      this.remember();
      if (options.echo !== false) this.sayUser(action.label);
      if (this.candidates.length) {
        this.candidates = [];
        this.openScenario(action.target.slice(1), action.label, false);
        return this.getState();
      }
      this.capture(action.label, values, action.card, action.id);
      const dateRequired = (['접수 요청', '변경 요청'].includes(action.label)
        || this.scenario.no === 17 && action.label === '확인') && schedulingScreens[this.scenario.no] === this.screen.id;
      if (dateRequired && !this.context.date) {
        this.sayBot('날짜를 먼저 선택해 주세요.');
        return this.getState();
      }
      if (/PASS/.test(action.label) && /인증|서명|재시도|다시 시도/.test(action.label)) {
        this.openAuth(/서명/.test(action.label) ? 'PASS 전자서명' : 'PASS 본인인증', action.target);
      } else {
        this.execute(action.target, action.label, values);
      }
      return this.getState();
    }

    capture(label, values, card, actionId = '') {
      const screen = this.screen.id;
      const no = this.scenario.no;
      if (card?.kind === 'product' && [11, 12].includes(no)) {
        this.context.serviceProduct = card;
        this.context.symptomPath = [];
        this.context.serviceSymptom = undefined;
      }
      if ([13, 14, 15].includes(no)) {
        const visitKey = actionId.startsWith('visit:') ? actionId.slice(6) : '';
        if (serviceVisits[visitKey]) this.context.serviceVisit = visitKey;
        if (label === '인증번호 받기' && values['휴대폰 번호']) {
          const digits = values['휴대폰 번호'].replace(/\D/g, '');
          this.context.sameDayVisit = digits === '01000000001';
          this.context.subscriptionVisit = digits === '01000000007';
          this.context.visitProfile = { '01000000008': 'single', '01000000009': 'multiple' }[digits];
        }
      }
      if ([16, 17].includes(no) && label === '인증번호 받기' && values['휴대폰 번호']) {
        const digits = values['휴대폰 번호'].replace(/\D/g, '');
        this.context.deliveryProfile = digits === '01000000001' ? 'multiple' : undefined;
        this.context.deliveryType = { '01000000003': 'subscription', '01000000004': 'dispatched',
          '01000000006': 'created', '01000000007': 'package', '01000000009': 'unavailable' }[digits];
      }
      if ([16, 17].includes(no) && actionId.startsWith('delivery:')) {
        this.context.deliveryOrderKey = actionId.slice(9);
      }
      if (no === 12 && screen === 'serviceModel' && values.모델명) {
        this.context.serviceProduct = { ...this.context.serviceProduct, detail: values.모델명 };
      }
      if ([8, 9, 12].includes(no)) {
        if (values.이름) this.context.visitApplicant = Array.from(values.이름)[0] + '○○';
        if (values.주소) {
          const address = neighborhood(values.주소);
          this.context.visitAddress = address;
          if (screen === 'pairSplitAddress') this.context.splitVisitAddress = address;
          if (screen === 'pairInstallAddress') this.context.reinstallVisitAddress = address;
        }
        const phone = values['서비스 당일 연락받으실 휴대폰 번호'];
        if (phone) this.context.visitPhone = maskNumber(phone);
        if (values['분리 방문 희망일']) this.context.splitDate = values['분리 방문 희망일'];
        if (values['재설치 방문 희망일']) this.context.reinstallDate = values['재설치 방문 희망일'];
      }
      this.captureRouteMatches(label, values);
      if (card?.kind === 'partner') this.context.partnerCard = card;
      if (card?.kind === 'issuer') this.context.issuer = card;
      if ([4, 5].includes(no) && screen === 'eligibleInstallments' && /일시불|개월 할부/.test(label)) {
        this.context.installmentPeriod = label;
      }
      if ([4, 5].includes(no) && ['receiptTransfer', 'receiptVirtual'].includes(screen)) {
        this.context.paymentReceiptRequested = label === '현금영수증 신청';
      }
      if ([8, 9].includes(no) && values['제품명 또는 모델명']) this.context.product = values['제품명 또는 모델명'];
      if ([3, 4, 5].includes(no) && values.카드번호) {
        this.context.payment = {
          title: this.context.issuer?.title || '신한카드',
          masked: '••••-••••-••••-' + values.카드번호.replace(/\D/g, '').slice(-4)
        };
      }
      if ([3, 4, 5].includes(no) && values.계좌번호) {
        this.context.payment = {
          account: true, bank: values.은행,
          masked: '••••-••••-' + values.계좌번호.replace(/\D/g, '').slice(-4)
        };
      }
      if ([4, 5].includes(no) && screen === 'S06') this.context.virtualBank = values.은행;
      if (this.screen.explicitActions?.some(([, target]) => target === '$deliverNow' || target === '$slipHandoff')) {
        const email = values['이메일 주소'];
        const fax = values['팩스 번호'];
        const phone = values['휴대폰 번호'];
        if (email) {
          const [name, host] = email.split('@');
          this.context.receiptRecipient = name.slice(0, 1) + '••@' + host;
        }
        if (fax) this.context.receiptRecipient = '••-••••-' + fax.replace(/\D/g, '').slice(-4);
        if (phone) this.context.receiptRecipient = maskNumber(phone);
      }
      if ((screen === billingContractScreens[no] || no === 7 && screen === 'S02') && / 선택$/.test(label)) {
        this.context.product = label.replace(/ 선택$/, '');
      } else if (/정수기 선택|공기청정기 선택/.test(label)) {
        this.context.product = label.replace(' 선택', '');
      }
      if (/주소/.test(label) || no === 17) {
        this.context.modifiedAddress = values.주소 || values['배송 주소'] || this.context.modifiedAddress;
      }
      if (screen === 's1' && no === 35) this.context.serviceKind = label;
      if (screen === 's1' && no === 39) this.context.paymentKind = label;
      if (screen === 's1' && no === 44) this.context.installationKind = label;
      if (screen === 's1' && no === 46) this.context.refundKind = label;
      if (screen === 's2' && no === 18) this.context.contactTopic = label;
      if (screen === 's4' && no === 49) this.context.consent = label;
      if (screen === 's1' && no === 28) this.context.modifiedCategory = label;
      if (screen === 's1' && no === 37) this.context.document = label;
      if (screen === 's5' && no === 37) this.context.recurring = label === '매월 받기';
      if (no === 38 && screen === 's2') this.context.oneTimeOrder = /일시불/.test(values['계약 또는 제품명']);
      const requestedDate = no === 7 && Object.hasOwn(values, '해약접수 예정일')
        ? values['해약접수 예정일'] || estimateDateRange().today : values['희망 날짜'];
      if (requestedDate) this.context.date = dateLabel(requestedDate);
      if ([8, 9, 14, 17].includes(no) && (Object.hasOwn(values, '이사 예정일') || Object.hasOwn(values, '희망 배송일'))) {
        if (Object.hasOwn(values, '이사 예정일')) this.context.moveDate = values['이사 예정일'];
        if (Object.hasOwn(values, '희망 배송일')) this.context.deliveryDate = values['희망 배송일'];
        this.context.date = '';
        this.context.dateIso = '';
      }
      if (values['휴대폰 번호'] && !values['인증번호']) this.context.maskedPhone = maskNumber(values['휴대폰 번호']);
      if (label === '등록된 번호로 받기') this.context.channel = '알림톡';
      if (no === 14 && screen === 'S02') {
        this.context.modifiedAddress = undefined;
        this.context.dateIso = undefined;
        this.context.date = undefined;
      }
      if (no === 15 && screen === 'S03') this.context.cancellationReason = label;
      if (no === 17 && ['S03', 'subscriptionOrder'].includes(screen)) {
        this.context.modifiedAddress = undefined;
        this.context.dateIso = undefined;
        this.context.date = undefined;
      }
      if (no === 17 && screen === 'S06') this.context.deliveryNote = values['전달 요청 사항'];
    }

    captureRouteMatches(label, values) {
      const previous = this.context.routeMatches ?? {};
      const matches = { ...previous };
      const editable = new Set(this.fields.filter((field) => !field.readonly).map((field) => field.label));
      for (const [id, data] of Object.entries(auditFlows[this.scenario.no]?.screens ?? {})) {
        for (const [index, rule] of (data.resolve?.rules ?? []).entries()) {
          const key = id + ':' + index;
          const prior = matches[key] ?? [];
          const eligible = rule.fields ?? ['$choice'];
          const pattern = new RegExp(rule.match, 'iu');
          const observed = eligible.filter((field) => field === '$choice'
            ? pattern.test(label) : editable.has(field) && Object.hasOwn(values, field));
          if (!observed.length) continue;
          matches[key] = [
            ...prior.filter((field) => !observed.includes(field)),
            ...observed.filter((field) => {
              const value = String(field === '$choice' ? label : values[field]);
              return pattern.test(/휴대폰|전화번호/.test(field) ? value.replace(/\D/g, '') : value);
            }),
          ];
        }
      }
      this.context.routeMatches = matches;
    }

    openAuth(method, target) {
      this.context.auth = { method, target, source: this.screen.id, failure: this.screen.auth?.failure };
      const signing = method === 'PASS 전자서명';
      this.synthetic(signing
        ? 'PASS에서 자동이체 내용을 확인하고 전자서명을 진행해 주세요.'
        : 'PASS 본인인증 화면에서 명의자 정보를 확인해 주세요.', {
        id: '$auth', condition: method,
        actions: [[signing ? '전자서명 확인' : '본인인증 확인', '$authSuccess'], ['취소', '$authCancel']]
      });
    }

    execute(target, label = '', values = {}) {
      if (!target) return;
      if (target.startsWith('@')) {
        this.openScenario(target.slice(1), label, false);
        return;
      }
      if (target.startsWith('$')) {
        this.command(target, label, values);
        return;
      }
      this.show(this.screenSource(target));
    }

    issueOtp() {
      this.context.otpCode = nextOtp(this.context.otpCode);
      this.context.otpExpiresAt = Date.now() + otpValidityMs;
      this.context.phoneVerified = false;
    }

    command(target, label, values) {
      if (target === '$menu') {
        this.clearWorkflow();
        this.sayBot('다른 문의를 입력하거나 상담 메뉴에서 선택해 주세요.');
        return;
      }
      const no = this.scenario.no;
      const screen = this.screen.id;
      switch (target) {
        case '$finish':
          if (this.scenario.phase === '1차') {
            this.context = {};
            this.synthetic('상담을 마쳤어요. 이용해 주셔서 감사합니다.', { kind: 'closed', demo: false });
          } else {
            this.synthetic('상담을 마쳤어요. 다시 도움이 필요하시면 말씀해 주세요.', { kind: 'result', demo: false });
          }
          break;
        case '$handoff': {
          const items = [{ title: '상담 분류', detail: this.scenario.displayTitle || this.scenario.title }];
          if (this.scenario.phase !== '1차') {
            this.synthetic('요청하신 내용은 상담사가 확인해야 해요. 연결이 필요한 업무를 아래에서 확인해 주세요.', {
              id: '$handoff', kind: 'handoff', items
            });
          } else if (counselorIsAvailable()) {
            this.synthetic('상담사가 문의 내용을 확인할 수 있도록 채팅 상담 연결을 요청하시겠어요?', {
              id: '$handoff', kind: 'handoff', items,
              actions: [['채팅 상담 연결 요청', '$chatHandoffReview'], ['다른 문의', '$menu']]
            });
          } else {
            this.synthetic('지금은 상담사 운영시간이 아니에요. 전화 상담을 요청하시면 운영시간에 상담을 이어갈 수 있어요.', {
              id: '$handoff', kind: 'handoff', items: [...items, { title: '상담사 운영시간', detail: '평일 09:00–18:00' }],
              actions: [['상담사 전화 예약', '$callbackIntake'], ['다른 문의', '$menu']]
            });
          }
          break;
        }
        case '$chatHandoffReview':
          this.synthetic('채팅 상담 연결 요청을 확인했어요. 실제 상담사 연결은 운영 환경에서 진행돼요.', {
            kind: 'result', actions: [['다른 문의', '$menu'], ['상담 종료', '$finish']]
          });
          break;
        case '$callbackIntake':
          this.form('전화 상담을 받으실 휴대폰 번호를 입력해 주세요.', ['phone'], '$callbackReview', '전화 예약 요청');
          break;
        case '$callbackReview':
          this.synthetic('전화 상담 요청 내용을 확인했어요. 실제 예약 등록은 운영 환경에서 진행돼요.', {
            kind: 'result', actions: [['다른 문의', '$menu'], ['상담 종료', '$finish']]
          });
          break;
        case '$authSuccess': {
          const { target: next, method } = this.context.auth;
          if (method === 'PASS 본인인증' && next === billingLookupTarget(no)) this.context.billingVerified = true;
          this.context.auth = undefined;
          this.execute(next);
          break;
        }
        case '$authFailure': {
          const { source, target: next, method, failure: configuredFailure } = this.context.auth;
          const failure = configuredFailure ?? authFailures[no]?.[source];
          this.context.auth = undefined;
          if (failure) {
            this.execute(failure);
          } else {
            this.synthetic(`${method}을 완료하지 못했어요. 다시 시도하거나 상담 메뉴로 돌아갈 수 있어요.`, {
              actions: [[`${method} 다시 시도`, next], ['다른 문의', '$menu']]
            });
          }
          break;
        }
        case '$authCancel':
          this.goBack();
          this.goBack();
          this.sayBot('인증을 취소했어요. 다시 시도할 수 있어요.', { status: '인증 안내' });
          break;
        case '$nativeSmsConsent':
          this.context.nativeSmsConsent = true;
          this.context.nativeSmsBusiness = false;
          this.execute(this.context.nativeSmsReturn);
          break;
        case '$nativeSmsBusinessConsent':
          this.context.nativeSmsConsent = true;
          this.context.nativeSmsBusiness = true;
          this.execute(this.context.nativeSmsReturn);
          break;
        case '$deliveryBusinessConsent':
          this.context.nativeSmsConsent = true;
          this.execute('deliveryBusinessInput');
          break;
        case '$auditSms':
          this.context.auditAuth = this.screen.auth;
          this.synthetic(phoneConsent, {
            id: '$auditSmsConsent',
            actions: [['동의하고 계속', '$auditSmsInput'], ['동의하지 않음', '$auditSmsDecline']]
          });
          break;
        case '$auditSmsDecline':
          this.synthetic('휴대폰 확인을 진행하려면 개인정보 수집 및 이용 동의가 필요해요. 다른 문의도 이어서 하실 수 있어요.', {
            kind: 'result', actions: [['다른 문의', '$menu']]
          });
          break;
        case '$auditSmsInput':
          this.form('확인에 사용할 이름과 휴대폰 번호를 알려 주세요.', ['name', 'phone'], '$auditSendOtp', '인증번호 받기');
          break;
        case '$auditSendOtp':
          this.context.otpTries = 0;
          this.issueOtp();
          this.synthetic('인증 문자에 있는 6자리 번호를 3분 안에 입력해 주세요.', {
            id: '$auditSmsCode', kind: 'input', fields: ['otp'],
            actions: [['확인', '$auditVerifyOtp'], ['인증번호 재전송', '$resendOtp']]
          });
          break;
        case '$sendOtp':
          this.context.otpTries = 0;
          this.issueOtp();
          if (this.scenario.screens.some((item) => item.id === 'phoneConfirm')) {
            this.execute('phoneConfirm');
          } else {
            this.synthetic('인증 문자에 있는 6자리 번호를 3분 안에 입력해 주세요.', {
              id: '$phoneConfirm', kind: 'input', condition: '휴대폰 인증번호 확인',
              fields: [{ ...fieldTemplates.phone, readonly: true }, 'otp'],
              actions: [['확인', '$verifyOtp'], ['인증번호 재전송', '$resendOtp']]
            });
          }
          break;
        case '$resendOtp':
          this.issueOtp();
          this.fields = this.fields.map((field) => field.label === '인증번호'
            ? { ...field, sample: this.context.otpCode, error: undefined } : field);
          this.sayBot('인증번호를 다시 요청했어요. 새로 받은 번호를 3분 안에 입력해 주세요.', { status: '인증 안내' });
          break;
        case '$auditVerifyOtp':
        case '$verifyOtp':
          const shared = target === '$auditVerifyOtp';
          if (this.context.otpExpiresAt && Date.now() >= this.context.otpExpiresAt) {
            this.fields = this.fields.map((field) => field.label === '인증번호'
              ? { ...field, error: '인증번호의 유효 시간이 지났어요. 인증번호를 다시 받아 주세요.' } : field);
            break;
          }
          if (this.context.otpCode && values['인증번호'] === this.context.otpCode) {
            this.context.otpCode = undefined;
            this.context.otpExpiresAt = undefined;
            this.context.phoneVerified = true;
            this.execute(shared ? this.context.auditAuth?.success ?? '$finish' : this.screen.auth?.success ?? phoneSuccess[no]);
          } else {
            this.context.otpTries = (this.context.otpTries ?? 0) + 1;
            if (this.context.otpTries >= otpAttemptLimit) {
              this.context.otpCode = undefined;
              this.context.otpExpiresAt = undefined;
              if (this.scenario.phase === '1차') {
                this.synthetic('인증번호 입력 횟수를 모두 사용해 휴대폰 확인을 완료하지 못했어요.', {
                  id: '$phoneConfirmationFailed', kind: 'exception',
                  actions: [['처음으로', '$menu'], ['상담사 연결', '$handoff']]
                });
              } else {
                this.execute(shared ? this.context.auditAuth?.failure ?? '$handoff' : this.screen.auth?.failure ?? phoneFailures[no]);
              }
            } else {
              this.fields = this.fields.map((field) => field.label === '인증번호'
                ? { ...field, error: `인증번호가 일치하지 않아요. ${otpAttemptLimit - this.context.otpTries}번 더 입력할 수 있어요.` } : field);
            }
          }
          break;
        case '$issuerPicker':
          if ([4, 5].includes(no) && this.context.paymentAmount >= 50000) {
            this.execute('eligibleInstallments');
            break;
          }
          this.synthetic(no === 3 ? '등록할 카드의 카드사를 선택해 주세요.' : '결제에 사용할 카드의 카드사를 선택해 주세요.', { id: target });
          break;
        case '$installmentIssuerPicker':
          this.synthetic('결제에 사용할 카드의 카드사를 선택해 주세요.', { id: target });
          break;
        case '$paymentOptions':
          this.execute(this.context.paymentOptions ?? (no === 5 ? 'S04' : 'S02'));
          break;
        case '$savedPicker':
          this.synthetic('등록된 카드 중 납부에 사용할 카드를 선택해 주세요.', { id: '$savedPicker' });
          break;
        case '$unavailableSavedCard':
          this.synthetic('다른 분 명의로 등록된 카드로는 납부할 수 없어요. 가상계좌 또는 상담사 연결을 선택해 주세요.', {
            kind: 'choice', actions: [['가상계좌', 'S06'], ['상담사 연결', '$handoff']]
          });
          break;
        case '$confirmPayment':
          this.context.payment = { title: savedCard.title, masked: '••••-••••-••••-1234' };
          this.synthetic('같은 요금을 이미 납부하셨는지 확인해 주세요. 등록된 본인 명의의 카드로 납부할까요?', {
            actions: [['납부 요청', 'S07'], ['나가기', '$paymentOptions']],
            items: [
              { title: '납부 방법', detail: savedCard.title + ' · ••••-••••-••••-1234' },
              { title: '납부 금액', detail: this.fill('[납부 금액]') }
            ]
          });
          break;
        case '$date':
          this.context.date = label.replace(/ 선택$/, '');
          if ([14, 17].includes(no)) this.context.dateIso = this.scheduleDates(true)
            .find((date) => dateLabel(date) === this.context.date);
          this.sayBot(`${this.context.date}을 선택했어요. 다음 버튼을 눌러 요청을 완료해 주세요.`, { demo: true });
          break;
        case '$moreDates':
          this.context.dateScreen = screen;
          const shownDates = this.scheduleDates().slice(0, no === 17 ? 5 : 4);
          this.synthetic('추가로 예약할 수 있는 날짜예요.', {
            actions: this.scheduleDates(true).filter((date) => !shownDates.includes(date))
              .map((date) => [`${dateLabel(date)} 선택`, '$pickExtraDate'])
          });
          break;
        case '$pickExtraDate':
          this.context.date = label.replace(/ 선택$/, '');
          if ([14, 17].includes(no)) this.context.dateIso = this.scheduleDates(true)
            .find((date) => dateLabel(date) === this.context.date);
          this.execute(this.context.dateScreen);
          this.sayBot(`${this.context.date}을 선택했어요. ${no === 17 ? '확인' : '변경 요청'}을 눌러 주세요.`, { demo: true });
          break;
        case '$address':
          this.context.checkedAddress = screen;
          this.sayBot('주소를 확인했어요. 입력하신 주소가 맞으면 계속 진행해 주세요.');
          break;
        case '$otherProduct':
          this.form('다른 제품의 모델명이나 제품명을 입력해 주세요.', ['product'], 'S04');
          break;
        case '$cardBenefits':
          this.synthetic('이용 실적을 충족하면 구독료 청구 할인이 적용될 수 있어요. 카드별 혜택과 이용 조건을 확인해 주세요.', {
            kind: 'result', actions: [['계속하기', 'S04']]
          });
          break;
        case '$contractPurpose':
          if (/위약금|해약비/.test(this.context.request)) this.execute('S04');
          else this.synthetic('어떤 계약 정보를 확인할까요?', {
            actions: [['계약기간 조회', 'S03'], ['위약금 조회', 'S04']]
          });
          break;
        case '$transferPurpose':
          this.synthetic('명의변경 방법을 확인하거나 신청을 시작할 수 있어요.', {
            actions: [['신청 방법 문의', 'S02'], ['명의변경 신청', 'S03']]
          });
          break;
        case '$transferPerson':
        case '$transferBusiness':
          this.form('새 계약자의 정보를 입력해 주세요.', ['name', 'phone'], target === '$transferPerson' ? 'S08' : 'S07', '다음');
          break;
        case '$identifyServiceProduct': {
          const name = values['제품명 또는 모델명'];
          const key = normalize(name);
          const provider = /필립스/.test(key) ? '필립스' : /삼성전자|^삼성$/.test(key) ? '삼성전자'
            : !/eonb450/.test(key) && /경동나비엔|가스레인지|전기레인지|인덕션레인지|전기오븐레인지/.test(key) ? '경동나비엔' : '';
          if (provider) {
            this.synthetic('이 제품의 서비스는 해당 대행업체에서 접수해 주세요.', {
              kind: 'handoff', items: [{ title: '서비스 대행업체', detail: provider }],
              actions: [['대행업체 안내 보기', '@41'], ['제품 다시 선택', 'S01']]
            });
            break;
          }
          const family = /비데|bidet/i.test(name) ? 'bidet' : /정수기|wpu/i.test(name) ? 'water' : 'other';
          const model = name.match(/\b(?=[A-Z\d-]{4,}\b)(?=[A-Z\d-]*\d)[A-Z][A-Z\d]*(?:-[A-Z\d]+)*\b/i)?.[0];
          this.context.serviceProduct = { title: name, family, model };
          this.context.symptomPath = [];
          this.context.serviceSymptom = undefined;
          this.showSymptomStep(0);
          break;
        }
        case '$selectSymptom': {
          const step = this.symptomStep();
          const choice = this.symptomOptions(step).find((item) => item.title === label);
          if (!choice) break;
          if (step === 2) {
            this.finishSymptom(label, choice.outcome);
          } else {
            const path = this.context.symptomPath ?? [];
            this.context.symptomPath = [...path.slice(0, step), label];
            this.showSymptomStep(step + 1);
          }
          break;
        }
        case '$symptomBack': {
          const step = this.symptomStep();
          if (step === 0) {
            this.context.serviceProduct = undefined;
            this.context.symptomPath = [];
            this.context.serviceSymptom = undefined;
            this.execute(no === 14 ? 'S02' : 'S01');
          } else {
            this.context.symptomPath = this.context.symptomPath.slice(0, step - 1);
            this.showSymptomStep(step - 1);
          }
          break;
        }
        case '$symptom': {
          const issue = values['접수 증상'];
          if (!issue) {
            this.context.symptomPath = [];
            this.showSymptomStep(0);
            break;
          }
          const query = normalize(issue).replace(/(?:누수|물샘|연기|타는냄새|탄냄새)(?:는|가|은|이)?(?:없|안나)/g, '');
          const needsSafety = /누수|물샘|물이새|물이샌|연기|타는냄새|탄냄새|과열/.test(query);
          const noWater = this.context.serviceProduct?.family === 'water'
            && /(?:물|온수|냉수|출수).{0,10}(?:안나|못나|나오지않|안됩|안돼|안되)/.test(query);
          this.finishSymptom(issue, needsSafety ? 'urgent' : noWater ? 'noWater' : 'general');
          break;
        }
        case '$selfHelp':
          this.synthetic('출수가 되지 않으면 단수 여부와 제품 표시창의 오류 메시지를 확인해 주세요. 증상이 계속되면 AS 방문을 접수할 수 있어요.', {
            kind: 'result', actions: [['문제가 계속돼요', 'S06'], ['해결했어요', '$finish']]
          });
          break;
        case '$visitResults':
          this.showVisitResults();
          break;
        case '$visitDetails':
          this.execute(this.visitDetailScreen());
          break;
        case '$visitChange':
        case '$visitCancel':
          this.execute(this.visitRequestEntry());
          break;
        case '$commitVisitChange': {
          const key = this.context.serviceVisit;
          if (key) {
            const changed = { ...this.context.visitEdits?.[key] };
            if (this.context.modifiedAddress) changed.address = this.context.modifiedAddress;
            if (this.context.dateIso) changed.date = this.context.dateIso;
            if (this.context.serviceSymptom && screen === 'editSymptomConfirm') changed.symptom = this.context.serviceSymptom;
            if (values.연락요청번호) changed.phone = maskNumber(values.연락요청번호);
            this.context.visitEdits = { ...this.context.visitEdits, [key]: changed };
          }
          this.execute('S10');
          break;
        }
        case '$commitVisitCancellation':
          this.context.cancelledVisits = [...(this.context.cancelledVisits ?? []), this.context.serviceVisit];
          this.execute('S05');
          break;
        case '$changeVisitAddress':
          this.execute(this.context.subscriptionVisit || serviceVisits[this.context.serviceVisit]?.subscription ? 'S07' : 'S03');
          break;
        case '$deliveryOrder':
          this.execute(this.deliveryOrderEntry());
          break;
        case '$deliveryEditAddress':
        case '$deliveryEditDate': {
          const next = target === '$deliveryEditAddress' ? 'S04' : 'requestedDeliveryDate';
          this.context.deliveryEdit = next;
          this.execute(this.deliveryOrderType() === 'package' ? 'packageChange' : next);
          break;
        }
        case '$confirmPackageChange':
          this.execute(this.context.deliveryEdit);
          break;
        case '$deliveryDateLookup':
          this.execute(this.deliveryOrderType() === 'unavailable' ? 'noDeliveryDates' : 'S05');
          break;
        case '$editSymptom':
          this.context.symptomPath = [];
          this.context.serviceSymptom = undefined;
          this.showSymptomStep(0);
          break;
        case '$editPhone':
          this.execute('S05');
          break;
        case '$continueServiceRegistration':
          this.execute(this.serviceRegistrationEntry());
          break;
        case '$contactIdentity':
          this.form('연락을 받으신 분의 정보를 입력해 주세요.', ['name', 'phone'], 's5');
          break;
        case '$alternateContact':
          this.synthetic('별도로 등록할 연락처가 있으신가요?', {
            actions: [['없어요', 's7'], ['다른 연락처가 있어요', '$handoff']]
          });
          break;
        case '$relatedContact':
          this.execute(this.context.contactTopic === '배송·설치 연락' ? '@16' : this.context.contactTopic === '계약·위약금 연락' ? '@7' : '@13');
          break;
        case '$billingPeriod':
          this.form('신청할 문서와 조회 기간을 입력해 주세요.', [
            fromLabel('문서 종류', '예: 청구서, 수납내역서', 'text', '청구서'),
            fromLabel('조회 기간', '예: 2026년 11월', 'text', '2026년 11월')
          ], 's4');
          break;
        case '$recurring':
          this.synthetic('청구서와 수납내역서는 정기 발송을 신청할 수 있어요. 받으실 방법을 선택해 주세요.', {
            actions: [['발송 방법 선택', 's4'], ['여기서 마치기', '$finish']]
          });
          break;
        case '$receiptPicker':
          this.synthetic('발급할 서류의 카드 결제 내역을 선택해 주세요.', { id: '$receiptPicker' });
          break;
        case '$slipDestination':
          this.context.channel = label;
          this.form('상담사에게 전달할 수신처를 입력해 주세요.', [
            label === '이메일' ? 'email' : label === '팩스' ? 'fax' : 'phone'
          ], '$slipHandoff', '상담 요청');
          break;
        case '$slipHandoff':
          this.synthetic('카드매출전표는 담당 상담사가 확인한 뒤 발송해 드려요. 요청하신 수신처를 확인해 주세요.', {
            id: '$handoff', kind: 'handoff',
            items: [
              { title: '수신 방법', detail: this.context.channel },
              { title: '수신처', detail: this.context.receiptRecipient }
            ]
          });
          break;
        case '$delivery':
          this.delivery(label);
          break;
        case '$deliverNow':
          this.execute(this.context.deliveryTarget);
          break;
        case '$terminationState':
          this.synthetic('해약 신청 여부에 따라 발송할 문서가 달라요. 현재 상태를 선택해 주세요.', {
            actions: [['해약 신청 전', 's3'], ['해약 신청 후', 's4']]
          });
          break;
        case '$existingAccount':
          this.context.channel = '알림톡';
          this.synthetic('가상계좌 발급 이력을 확인했어요. 등록된 번호로 확인서를 받으시겠어요?', {
            actions: [['등록된 번호로 받기', 's6'], ['발급 이력 없음 체험', 's7']]
          });
          break;
        case '$representative':
          this.form('통합할 계약과 대표 계약을 입력해 주세요.', [
            fromLabel('통합할 계약', '예: 정수기, 공기청정기', 'text', '직수 정수기, 공기청정기'),
            fromLabel('대표 계약', '예: 직수 정수기', 'text', '직수 정수기')
          ], 's5');
          break;
        case '$splitAll':
          this.synthetic('대표 계약에 묶인 계약을 모두 나누시겠어요?', {
            actions: [['전체 계약 분리', 's5'], ['나가기', 's2']]
          });
          break;
        case '$splitSome':
          this.form('묶음에서 분리할 계약을 입력해 주세요.', ['contract'], 's6', '분리 요청');
          break;
        case '$userDetails':
          this.form('주소나 사용자 정보를 입력해 주세요.', ['address', 'name'], 's7', '변경 요청');
          break;
        case '$resendUnavailable':
          this.synthetic('이미 발행된 세금계산서 재발송 가능 여부를 담당자가 확인해 드려요.', {
            kind: 'handoff', actions: [['상담사 연결', '$handoff']]
          });
          break;
        case '$carrier':
          this.synthetic('수령 여부는 배송 내역에 표시된 택배사와 운송장 번호로 확인할 수 있어요.', { kind: 'result' });
          break;
        case '$filterAddress':
          this.form('필터를 받으실 주소를 입력해 주세요.', ['address'], 's5', '재발송 요청');
          break;
        case '$contactChanged':
          this.synthetic('안심OK 방문 안내를 받을 연락처를 변경했어요.', {
            kind: 'result', items: [{ title: '변경된 연락처', detail: this.context.maskedPhone }]
          });
          break;
        case '$costResult':
          this.execute(this.context.serviceKind === '필터 교체' ? 's4' : this.context.serviceKind === 'AS 점검' ? 's5' : 's3');
          break;
        case '$relatedService':
          this.execute(this.context.serviceKind === '이전설치' ? '@8' : this.context.serviceKind === '필터 교체' ? '@30' : '@12');
          break;
        case '$cancelOrder':
          this.synthetic('선택하신 주문을 취소할까요?', {
            actions: [['주문 취소 확인', this.context.oneTimeOrder ? 's5' : 's4'], ['다시 확인', 's3']]
          });
          break;
        case '$paymentLookup':
          this.execute({
            '사용 기간': 's7', '이중 결제·가상계좌 입금': 's8',
            '미납요금 조회·납부': 's6', '면제·청구 금액 확인': 's5'
          }[this.context.paymentKind] || 's4');
          break;
        case '$serviceProvider': {
          const product = values['제품명 또는 모델명'] || '';
          this.execute(/필립스|커피|에스프레소/i.test(product) ? 's5' : /삼성/.test(product) ? 's6' : /온수|보일러|경동|가스레인지/.test(product) ? 's2' : 's7');
          break;
        }
        case '$installationResult':
          this.execute(this.context.installationKind === '타공 크기·호스' ? 's3' : 's4');
          break;
        case '$refundResult':
          this.execute(this.context.refundKind === '설치 주문 취소' ? 's3' : 's4');
          break;
        case '$refundRegistered':
          this.synthetic('환불에 필요한 내용을 확인했어요. 담당자가 검토한 후 처리 결과를 안내해 드려요.', {
            kind: 'handoff', actions: [['상담사 연결', '$handoff']]
          });
          break;
        case '$receiptEnabled':
          this.synthetic('현금영수증 발행 설정을 적용했어요. 일반 신청은 신청월분부터 적용돼요.', {
            kind: 'result', actions: [['전월분 소급발행 확인', 's8'], ['여기서 마치기', '$finish']]
          });
          break;
      }
    }

    form(message, fields, target, label = '확인') {
      this.synthetic(message, { kind: 'input', fields, actions: [[label, target]] });
    }

    delivery(label) {
      const no = this.scenario.no;
      const delivery = this.screen.delivery;
      const target = delivery?.target
        ?? { 19: 's7', 20: 's6', 21: 's6', 22: 's6', 23: 's7', 24: 's5', 37: 's8', 41: 's4', 48: 's6' }[no];
      const email = /이메일/.test(label);
      const fax = /팩스/.test(label);
      this.context.channel = email && fax ? '이메일과 팩스' : email ? '이메일' : fax ? '팩스' : no === 41 ? '문자' : '알림톡';
      if (!email && !fax && no !== 41 && delivery?.useRegisteredNumber !== false) {
        if (no === 23) this.context.receiptRecipient = maskNumber(demoPhone);
        this.execute(target);
        return;
      }
      this.context.deliveryTarget = target;
      const fields = no === 41 || !email && !fax ? ['phone'] : [email && 'email', fax && 'fax'].filter(Boolean);
      this.form('문서를 받으실 수신처를 입력해 주세요.', fields, '$deliverNow', '발송 요청');
    }
  }

  window.SKIXChat = SKIXChat;
})();
