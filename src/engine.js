(function () {
  'use strict';

  const demoPhone = '010-0000-1234';
  const demoAddress = '서울 영등포구 문래동';
  const welcome = '안녕하세요. SK매직 상담 챗봇입니다. 궁금한 내용을 입력하거나 상담 메뉴에서 선택해 주세요.';
  const defaultPlaceholder = '메시지를 입력하세요';
  const auditFlows = window.SKIX_FLOW_OVERLAYS ?? {};
  const otpAttemptLimit = 5;
  const phoneConsent = '휴대폰 확인을 위해 이름과 휴대폰 번호를 이용해요. 개인정보 수집 및 이용에 동의하시겠어요?';
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
      '14:S05': [context.changedField === 'phone' ? 'phone' : 'symptom'], '17:S06': ['description'],
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
    return `${digits.slice(0, 3)}-••••-${digits.slice(-4)}`;
  }

  function validationError(field, input) {
    if (field.readonly) return '';
    if (!input) return field.required ? `${field.label} 항목을 입력해 주세요.` : '';
    const digits = input.replace(/\D/g, '');
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) return '이메일 주소 형식을 확인해 주세요.';
    if (/휴대폰/.test(field.label) && !/^01[016789]\d{7,8}$/.test(digits)) return '휴대폰 번호를 확인해 주세요.';
    if (/팩스/.test(field.label) && !/^0\d{8,10}$/.test(digits)) return '지역번호를 포함한 팩스 번호를 입력해 주세요.';
    if (/카드번호/.test(field.label) && !/^\d{15,16}$/.test(digits)) return '카드번호는 숫자 15~16자리로 입력해 주세요.';
    if (/생년월일|인증번호/.test(field.label) && !/^\d{6}$/.test(input)) return '숫자 6자리를 입력해 주세요.';
    if (/계좌번호/.test(field.label) && !/^\d{8,16}$/.test(digits)) return '계좌번호는 숫자 8~16자리로 입력해 주세요.';
    if (/유효기간/.test(field.label) && !/^(0[1-9]|1[0-2])\s*\/?\s*\d{2}$/.test(input)) return '유효기간을 MM/YY 형식으로 입력해 주세요.';
    if (field.type === 'date') {
      const date = new Date(`${input}T12:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input) {
        return '날짜를 선택해 주세요.';
      }
    }
    if (/(?:이름|주소|제조번호|제품명)/.test(field.label) && input.length < 2) return `${field.label} 항목을 확인해 주세요.`;
    return '';
  }

  function dateLabel(iso) {
    const date = new Date(`${iso}T12:00:00+09:00`);
    return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', timeZone: 'Asia/Seoul' })
      .format(date).replace(/일\s*/, '일');
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
    const compact = normalize(query);
    if (!compact) return 0;
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
        messages: [...this.messages],
        actions: this.actionList().map(({ target, ...action }) => action),
        fields: this.fields.map((field) => ({ ...field })),
        verification: this.context.otpCode && this.fields.some((field) => field.label === '인증번호')
          ? { kind: 'sms', code: this.context.otpCode } : null,
        placeholder: this.screen?.placeholder || defaultPlaceholder,
        secure: Boolean(this.screen?.secure || this.screen?.id === '$auth' || this.fields.some((field) => field.type === 'password')),
        inputDisabled: Boolean(this.fields.length || this.screen?.kind === 'internal-only' || this.screen?.id === '$auth'),
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
      this.scenario = scenario;
      this.context = { request: customerText || '' };
      if ([1, 2, 3, 7].includes(scenario.no)) this.context.product = previous.product;
      const originalEntry = scenario.no === 6 && this.partnerCards().length
        ? scenario.screens.find((screen) => screen.id === 'S02') ?? scenario.screens[0]
        : scenario.screens[0];
      const first = this.screenSource(auditFlows[scenario.no]?.entry) ?? originalEntry;
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
        this.synthetic(phoneConsent, {
          id: '$nativeSmsConsent',
          actions: [['동의하고 계속', '$nativeSmsConsent'], ['동의하지 않음', '$auditSmsDecline']]
        });
        return;
      }
      this.screen = screen;
      this.candidates = [];
      this.fields = this.buildFields(screen);
      this.sayScreen(properties);
    }

    synthetic(text, { id = '$synthetic', kind = 'choice', condition = '', actions = [], fields = [], items = [], demo = true } = {}) {
      this.show({ id, kind, condition, message: text, explicitActions: actions, explicitFields: fields, items, demo });
    }

    buildFields(screen) {
      if (!this.scenario) return [];
      const definitions = screen.explicitFields ?? fieldsFor(this.scenario.no, screen, this.context);
      return definitions.map((definition, index) => {
        const item = typeof definition === 'string' ? fieldTemplates[definition] : definition;
        if (!item) throw new Error('Unknown workflow field: ' + definition);
        const type = item.type ?? 'text';
        const sample = item.label === '인증번호' ? this.context.otpCode
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
      if (screen.kind === 'internal-only') message.status = '별도 검토';
      if (this.scenario.phase === '별도 검토' && !message.status) message.status = '별도 검토';
      if (no === 1 && screen.id === 'S03' && this.context.product === '공기청정기') {
        message.items = [
          { title: '공기청정기', detail: '제품코드 ACL-1000\n사용 주소 서울 영등포구 문래동' },
          { title: '결제정보', detail: '출금 유형  은행계좌 자동이체\n은행  KB국민은행\n계좌번호  ••••-••••-1234\n이체일  매월 25일\n월 구독료  29,900원' },
          ...items.slice(2)
        ];
      }
      if (no === 49 && screen.id === 's5' && this.context.consent === '동의하기') {
        message.items = [{ title: '변경 결과', detail: '동의' }];
      }
      if (no === 14 && screen.id === 'S10' && this.context.serviceChange) {
        message.items = [items[0], { title: '변경된 항목', detail: this.context.serviceChange }];
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
          { title: '입금할 금액', detail: '29,900원' },
          { title: '안내받을 연락처', detail: this.context.maskedPhone || maskNumber(demoPhone) },
          { title: '납부 상태', detail: '입금 대기' }
        ];
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
        message.links = [{ label: '공식 혜택·신청 안내', href: href || partnerBenefitsUrl }];
        message.demo = !id;
      }
      if (screen.id === '$auth') message.status = '인증 안내';
      if (screen.id === '$handoff') message.status = '상담사 연결';
      this.messages.push(message);
    }

    fill(value) {
      const variables = this.scenario.demoValues ?? {};
      let text = String(value ?? '').replace(/\[([^\[\]]+)\]/g, (token, key) => {
        if (/발송|전송/.test(key) && /방법|채널|방식/.test(key) && this.context.channel) return this.context.channel;
        if (/마스킹된\s*수신처/.test(key) && this.context.receiptRecipient) return this.context.receiptRecipient;
        if (key === '마스킹된 번호' && this.context.maskedPhone) return this.context.maskedPhone;
        if (key === '변경 항목' && this.context.modifiedCategory) return this.context.modifiedCategory;
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

    activeSelection() {
      const no = this.scenario?.no;
      const id = this.screen?.id;
      if (no === 6 && id === 'S02') {
        return { kind: 'partner-card', title: '제휴카드 선택', detail: '카드별 혜택과 신청 안내를 확인해 주세요.' };
      }
      if (id === '$issuerPicker' || id === '$savedPicker') {
        return { kind: 'card-issuer', title: id === '$savedPicker' ? '등록된 카드 선택' : '사용할 카드 선택' };
      }
      if (id === '$receiptPicker') {
        return { kind: 'card-transaction', title: '카드 결제 내역 선택' };
      }
      if ((no === 3 && id === 'S03') || (no === 4 && id === 'S02') || (no === 5 && id === 'S04')
        || ([4, 5].includes(no) && id === 'oneTimeMethods')) {
        return { kind: 'payment-method', title: '결제수단 선택' };
      }
      return null;
    }

    selectionActions() {
      const no = this.scenario.no;
      const id = this.screen.id;
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
      if (id === '$issuerPicker') {
        return sampleIssuers.map((card, index) => ({
          id: 'issuer:' + index, target: no === 5 ? 'S05' : 'S04', label: card.title, card
        }));
      }
      if (id === '$savedPicker') {
        return [
          { id: 'saved:sample', label: '신한카드 선택', target: '$confirmPayment', card: savedCard },
          { id: 'saved:external', label: '타인 명의라면?', target: no === 4 ? 'S03' : '$unavailableSavedCard' }
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
      if (!screen || screen.kind === 'internal-only') return [];
      const no = this.scenario.no;
      const targets = optionTargets[no]?.[screen.id] ?? [];
      const steps = screen.explicitActions ?? (screen.options ?? []).map((label, index) => [label, targets[index] ?? this.graphTarget(label)]);
      const extras = screen.explicitActions ? [] : continuation[no]?.[screen.id] ?? [];
      const custom = this.selectionActions();
      const defaults = [...steps, ...extras];
      const additions = (screen.addActions ?? []).filter(([label]) => !defaults.some(([original]) => original === label));
      const defaultActions = [...defaults, ...additions].map(([label, target], index) => ({ id: `action:${index}`, label, target }))
        .filter(({ target, label }) => (target !== '$date' || label !== `${this.context.date} 선택`)
          && (target !== '$address' || this.context.checkedAddress !== screen.id));
      const actions = custom ?? defaultActions;
      const paymentMethods = this.activeSelection()?.kind === 'payment-method';
      if (paymentMethods) {
        for (const action of actions) action.card = methodCards[action.label];
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
      if (!query || this.screen?.kind === 'internal-only' || this.screen?.id === '$auth') return this.getState();
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
      if (action?.target === '$address' && field.label !== '주소') return '';
      const error = validationError(field, input);
      if (!error && this.scenario.no === 7 && field.type === 'date') {
        const { today, until } = estimateDateRange();
        if (input < today || input > until) return '오늘부터 한 달 이내의 날짜를 입력해 주세요.';
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
        if (!error && datePair && input >= inputs[datePair[1]]) {
          error = `${datePair[0]}은 ${datePair[1]}보다 앞선 날짜를 입력해 주세요.`;
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
      this.capture(action.label, values, action.card);
      const dateRequired = ['접수 요청', '변경 요청'].includes(action.label)
        && dateScenarios.has(this.scenario.no) && this.screen.options?.some((label) => /\d+월 \d+일.+ 선택$/.test(label));
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

    capture(label, values, card) {
      const screen = this.screen.id;
      const no = this.scenario.no;
      this.captureRouteMatches(label, values);
      if (card?.kind === 'partner') this.context.partnerCard = card;
      if (card?.kind === 'issuer') this.context.issuer = card;
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
      if (/정수기 선택|공기청정기 선택/.test(label)) this.context.product = label.replace(' 선택', '');
      if (/주소/.test(label) || no === 17) this.context.modifiedAddress = values.주소 || this.context.modifiedAddress;
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
      if (values['희망 날짜']) this.context.date = dateLabel(values['희망 날짜']);
      if (values['휴대폰 번호'] && !values['인증번호']) this.context.maskedPhone = maskNumber(values['휴대폰 번호']);
      if (label === '등록된 번호로 받기') this.context.channel = '알림톡';
      if (no === 14 && label === '변경 요청') {
        if (values.주소) this.context.serviceChange = `방문주소 · ${values.주소}`;
        else if (values['휴대폰 번호']) this.context.serviceChange = `방문 연락처 · ${this.context.maskedPhone}`;
        else if (values['접수 증상']) this.context.serviceChange = '접수 증상 변경';
        else this.context.serviceChange = undefined;
      }
      if (no === 17 && screen === 'S03') this.context.modifiedAddress = undefined;
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
          this.synthetic('상담을 마쳤어요. 다시 도움이 필요하시면 말씀해 주세요.', { kind: 'result', demo: false });
          break;
        case '$handoff':
          this.synthetic('요청하신 내용은 상담사가 확인해야 해요. 연결이 필요한 업무를 아래에서 확인해 주세요.', {
            id: '$handoff', kind: 'handoff', items: [{ title: '상담 분류', detail: this.scenario.displayTitle || this.scenario.title }]
          });
          break;
        case '$authSuccess': {
          const { target: next } = this.context.auth;
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
          this.execute(this.context.nativeSmsReturn);
          break;
        case '$auditSms':
          this.context.auditAuth = this.screen.auth;
          this.synthetic(phoneConsent, {
            id: '$auditSmsConsent',
            actions: [['동의하고 계속', '$auditSmsInput'], ['동의하지 않음', '$auditSmsDecline']]
          });
          break;
        case '$auditSmsDecline':
          this.synthetic('동의가 필요한 휴대폰 확인을 마쳤어요. 다른 문의를 입력해 주세요.', {
            kind: 'result', actions: [['다른 문의', '$menu']]
          });
          break;
        case '$auditSmsInput':
          this.form('확인에 사용할 이름과 휴대폰 번호를 알려 주세요.', ['name', 'phone'], '$auditSendOtp', '인증번호 받기');
          break;
        case '$auditSendOtp':
          this.context.otpTries = 0;
          this.context.otpCode = nextOtp(this.context.otpCode);
          this.synthetic('인증 문자를 확인하고 6자리 인증번호를 입력해 주세요.', {
            id: '$auditSmsCode', kind: 'input', fields: ['otp'],
            actions: [['확인', '$auditVerifyOtp'], ['인증번호 재전송', '$resendOtp']]
          });
          break;
        case '$sendOtp':
          this.context.otpTries = 0;
          this.context.otpCode = nextOtp(this.context.otpCode);
          if (this.scenario.screens.some((item) => item.id === 'phoneConfirm')) {
            this.execute('phoneConfirm');
          } else {
            this.synthetic('인증 문자를 확인하고 6자리 인증번호를 입력해 주세요.', {
              id: '$phoneConfirm', kind: 'input', condition: '휴대폰 인증번호 확인',
              fields: [{ ...fieldTemplates.phone, readonly: true }, 'otp'],
              actions: [['확인', '$verifyOtp'], ['인증번호 재전송', '$resendOtp']]
            });
          }
          break;
        case '$resendOtp':
          this.context.otpCode = nextOtp(this.context.otpCode);
          this.fields = this.fields.map((field) => field.label === '인증번호'
            ? { ...field, sample: this.context.otpCode, error: undefined } : field);
          this.sayBot('인증번호를 다시 요청했어요. 새로 받은 6자리 번호를 입력해 주세요.', { status: '인증 안내' });
          break;
        case '$auditVerifyOtp':
        case '$verifyOtp':
          const shared = target === '$auditVerifyOtp';
          if (this.context.otpCode && values['인증번호'] === this.context.otpCode) {
            this.context.otpCode = undefined;
            this.execute(shared ? this.context.auditAuth?.success ?? '$finish' : this.screen.auth?.success ?? phoneSuccess[no]);
          } else {
            this.context.otpTries = (this.context.otpTries ?? 0) + 1;
            if (this.context.otpTries >= otpAttemptLimit) {
              this.context.otpCode = undefined;
              this.execute(shared ? this.context.auditAuth?.failure ?? '$handoff' : this.screen.auth?.failure ?? phoneFailures[no]);
            } else {
              this.fields = this.fields.map((field) => field.label === '인증번호'
                ? { ...field, error: `인증번호가 일치하지 않아요. ${otpAttemptLimit - this.context.otpTries}번 더 입력할 수 있어요.` } : field);
            }
          }
          break;
        case '$issuerPicker':
          this.synthetic(this.scenario.no === 3 ? '등록할 카드의 카드사를 선택해 주세요.' : '결제에 사용할 카드의 카드사를 선택해 주세요.', { id: '$issuerPicker' });
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
            actions: [['납부 요청', 'S07'], ['나가기', no === 5 ? 'S04' : 'S02']],
            items: [
              { title: '납부 방법', detail: savedCard.title + ' · ••••-••••-••••-1234' },
              { title: '납부 금액', detail: '29,900원' }
            ]
          });
          break;
        case '$date':
          this.context.date = label.replace(/ 선택$/, '');
          this.sayBot(`${this.context.date}을 선택했어요. 다음 버튼을 눌러 요청을 완료해 주세요.`, { demo: true });
          break;
        case '$moreDates':
          this.context.dateScreen = screen;
          this.synthetic('추가로 예약할 수 있는 날짜예요.', {
            actions: (no === 17 ? ['12월 3일(목)', '12월 4일(금)'] : ['11월 30일(월)', '12월 1일(화)'])
              .map((date) => [`${date} 선택`, '$pickExtraDate'])
          });
          break;
        case '$pickExtraDate':
          this.context.date = label.replace(/ 선택$/, '');
          this.execute(this.context.dateScreen);
          this.sayBot(`${this.context.date}을 선택했어요. 변경 요청을 눌러 주세요.`, { demo: true });
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
        case '$symptom':
          this.synthetic('제품에서 나타나는 증상을 선택해 주세요.', {
            actions: [['물이 나오지 않아요', 'S05'], ['누수·연기·탄 냄새가 나요', 'S04'], ['그 외 증상', 'S06']]
          });
          break;
        case '$selfHelp':
          this.synthetic('출수가 되지 않으면 단수 여부와 제품 표시창의 오류 메시지를 확인해 주세요. 증상이 계속되면 AS 방문을 접수할 수 있어요.', {
            kind: 'result', actions: [['문제가 계속돼요', 'S06'], ['해결했어요', '$finish']]
          });
          break;
        case '$editSymptom':
        case '$editPhone':
          this.context.changedField = target === '$editPhone' ? 'phone' : 'symptom';
          this.execute('S05');
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
