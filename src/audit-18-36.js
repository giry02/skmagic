(() => {
  'use strict';

  const choice = (message, actions) => ({ kind: 'choice', message, actions });
  const field = (label, placeholder, sample, type = 'text') => ({ label, placeholder, sample, type });
  const form = (message, fields, target, label = '확인') => ({ kind: 'input', message, fields, actions: [[label, target]] });
  const auth = (message, success, failure) => ({
    ...choice(message, [['휴대폰 확인', '$auditSms']]),
    auth: { success, failure }
  });
  const handoff = (message, actions = [['상담사 연결', '$handoff']]) => ({ kind: 'handoff', message, actions });
  const result = (message, actions = [], items = []) => ({ kind: 'result', message, actions, items, demo: true });
  const exception = (message, actions) => ({ kind: 'exception', message, actions });
  const senderChannels = [['알림톡', '$delivery'], ['이메일', '$delivery'], ['팩스', '$delivery']];
  const dateFrom = field('시작일', 'YYYY-MM-DD', '2026-11-01', 'date');
  const dateTo = field('종료일', 'YYYY-MM-DD', '2026-11-25', 'date');
  const periodForm = (message, target, fields = [dateFrom, dateTo]) => ({
    ...form(message, fields, target), validate: { dateOrder: [[dateFrom.label, dateTo.label, true]] }
  });
  const contractField = field('계약 또는 제품명', '예: 직수 정수기 계약', '직수 정수기');
  const lookupScope = '개인과 개인사업자 계약은 계약자 본인이 조회할 수 있어요.';
  const lookupContract = (message, target) => form(message, [contractField], target, '계약 확인');
  const resolved = (fallback, rules = []) => ({ resolve: { default: fallback, rules } });
  const contractCase = (target, code, fields = [contractField.label]) => ({ target, fields, match: '^SK-' + code + '$' });
  const waterDocumentContract = '(?:직수\\s*정수기(?:\\s*계약)?|정수기|WPU-1000|CT-250601-001)';
  const airDocumentContract = '(?:공기청정기(?:\\s*계약)?|ACL-1000|CT-250901-001)';
  const inquiryDocumentContracts = `(?:${waterDocumentContract}|${airDocumentContract})`;
  const calculatedDocumentContracts = '(?:SK-261125-020|SK-261125-021)';
  const knownDocumentList = (target, label, contracts) => ({
    target, fields: [label], match: `^${contracts}(?:\\s*,\\s*${contracts})*$`
  });
  const hasDocumentContract = (contract) => `(?=.*(?:^|,)\\s*${contract}(?=\\s*(?:,|$)))`;
  const documentListContains = (target, label, ...contracts) => ({
    target, fields: [label], match: contracts.map(hasDocumentContract).join('')
  });
  const documentOutput = (message, target, format) => ({
    ...choice(message, senderChannels),
    items: [{ title: '출력 구분', detail: format }],
    delivery: { target, useRegisteredNumber: false, format }
  });
  const phoneCase = (target, suffix) => ({ target, fields: ['휴대폰 번호'], match: '^010-?0000-?' + suffix + '$' });
  const paymentGroupContract = '^(?:직수\\s*정수기(?:\\s*계약)?|정수기|WPU-1000|공기청정기(?:\\s*계약)?|ACL-1000|비데(?:\\s*계약)?|BID-1000|SK-261125-02[5-9])$';
  const groupContractCase = (target, label) => ({ target, fields: [label], match: paymentGroupContract });
  const knownGroupContracts = (target) => ({ target, fields: ['첫 번째 계약', '두 번째 계약'], match: paymentGroupContract, all: true });
  const deferred = [['다른 문의', '$menu']];
  const userMatch = '^김매직$';
  const ownerPhoneMatch = '^010-?0000-?1234$';
  const addressMatch = '^(?:서울(?:특별시)?\\s*)?영등포구\\s*문래동(?:\\s*.*)?$';
  const matchIdentity = (target, patterns) => ({ target, fields: Object.keys(patterns), all: true, patterns, match: '' });
  const careRequest = (message) => form(message, ['description'], 'careRequested', '요청 내용 확인');

  Object.assign(window.SKIX_FLOW_OVERLAYS ??= {}, {
    18: {
      screens: {
        s2: { actions: [
          ['배송·설치 연락', 'deliveryContact'], ['계약·위약금 연락', '@7'], ['AS 안내', 'serviceContact'],
          ['모르는 지로 고지서', '@24'], ['제 것이 아닌 연락', 's3']
        ] },
        deliveryContact: choice('받으신 배송·설치 연락에서 무엇을 확인하실까요?', [
          ['배송·설치 일정 확인', '@16'], ['배송정보 확인·변경', '@17'], ['제 것이 아닌 연락', 's3']
        ]),
        serviceContact: choice('받으신 AS 연락에서 무엇을 확인하실까요?', [
          ['AS 접수 확인', '@13'], ['AS 방문 접수', '@12'], ['제 것이 아닌 연락', 's3']
        ]),
        s3: form('연락을 받으신 휴대폰 번호와 안내 내용을 입력해 주세요. 안내에 인증번호가 있다면 그 번호는 빼고 적어 주세요.', ['phone', 'description'], 'contactLookup'),
        contactLookup: resolved('s4', [phoneCase('s6', '0000')]),
        s4: { actions: [['관계가 있어요', 's5'], ['관계가 없어요', 'alternateNumber']] },
        s5: { message: '확인하실 업무를 선택해 주세요. 관련 계약이나 접수 정보는 해당 업무에서 확인한 뒤 안내해 드려요.', actions: [
          ['배송·설치 확인', 'deliveryContact'], ['계약·위약금 확인', '@7'], ['AS 안내 확인', 'serviceContact']
        ] },
        alternateNumber: resolved('s7', [phoneCase('replaceNumber', '0002')]),
        s7: { message: '잘못 전달된 연락의 수신 번호에 대한 미사용 처리 요청을 확인했어요.', items: [] },
        replaceNumber: handoff('대체 연락처 변경은 관련 고객에게 연락해 확인한 뒤 처리해요. 다음 절차를 담당 상담사가 안내할 수 있어요.')
      }
    },
    19: {
      entry: 'documentIdentity',
      screens: {
        documentIdentity: auth(lookupScope + ' 문서 발송에 앞서 고객 정보를 확인해 주세요.', 'documentOwner', 's5'),
        documentOwner: resolved('s1', [phoneCase('s5', '0000')]),
        s1: { actions: [['청구·수납 문서', 'billDocuments'], ['계약서·계약정보확인서', 'contractDocuments'], ['가상계좌확인서', 'virtualDocument']] },
        s2: { message: '한 번 받으시겠어요, 정기적으로 받으시겠어요?', actions: [['일회 발송', 'billPeriod'], ['정기 발송일 선택', 'billMonthly']] },
        s3: { message: '[발송 문서]는 등록된 계약자 번호로 알림톡을 보내거나 이메일로 받으실 수 있어요.',
          items: [{ title: '등록 휴대폰 번호', detail: '[마스킹된 번호]' }],
          actions: [['등록된 번호로 알림톡 받기', '$delivery'], ['이메일로 받기', '$delivery']], delivery: { target: 's7', useRegisteredNumber: true } },
        s4: { actions: senderChannels, delivery: { target: 's7', useRegisteredNumber: false } },
        s7: { items: [{ title: '발송 문서', detail: '[발송 문서]' }, { title: '발송 방법', detail: '[발송 방법]' }, { title: '수신처', detail: '[마스킹된 수신처]' }] },
        billDocuments: choice('어떤 청구·수납 문서가 필요하신가요?', [
          ['청구서', 's2'], ['상세 청구서', 's2'], ['완납증명서', 'billPeriod'],
          ['수납내역서', 'receiptFrequency'], ['미납내역서', 'billProvisionalPeriod'], ['구독계획표', 'billPeriod'],
          ['부채증명서', 'billProvisionalPeriod']
        ]),
        receiptFrequency: choice('수납내역서를 한 번 받으시겠어요, 정기적으로 받으시겠어요?', [
          ['일회 발송', 'billAdvancePeriod'], ['정기 발송일 선택', 'billAdvanceMonthly']
        ]),
        billAdvancePeriod: periodForm('수납내역서의 조회 시작일과 종료일을 입력해 주세요.', 'billAdvance'),
        billAdvance: choice('수납내역서에 선수금을 포함할까요?', [['포함', 'billTax'], ['제외', 'billTax']]),
        billAdvanceMonthly: choice('정기 발송일을 선택해 주세요.', [3, 10, 20, 25].map((day) => ['매월 ' + day + '일', 'billMonthlyAdvance'])),
        billMonthlyAdvance: choice('정기 수납내역서에 선수금을 포함할까요?', [['포함', 'billMonthlyTax'], ['제외', 'billMonthlyTax']]),
        billProvisionalPeriod: periodForm('문서의 조회 시작일과 종료일을 입력해 주세요.', 'billProvisional'),
        billProvisional: choice('문서에 가해약 계약을 포함할까요?', [['포함', 'billTax'], ['제외', 'billTax']]),
        billMonthly: choice('정기 발송일을 선택해 주세요.', [3, 10, 20, 25].map((day) => ['매월 ' + day + '일', 'billMonthlyTax'])),
        billMonthlyTax: choice('정기 발송 문서의 부가세 기준을 선택해 주세요.', [['건별', 'billMonthlyChannel'], ['총액', 'billMonthlyChannel']]),
        billMonthlyChannel: {
          ...choice('정기 발송 문서를 어떤 방법으로 받으실까요?', senderChannels),
          delivery: { target: 'billMonthlySaved', useRegisteredNumber: false }
        },
        billMonthlySaved: result('정기 발송 요청 내용을 확인했어요.', deferred, [
          { title: '발송 문서', detail: '[발송 문서]' }, { title: '정기 발송일', detail: '[정기 발송일]' },
          { title: '발송 방법', detail: '[발송 방법]' }, { title: '수신처', detail: '[마스킹된 수신처]' }
        ]),
        billPeriod: periodForm('일회 발송에 필요한 조회 시작일과 종료일을 입력해 주세요.', 'billTax'),
        billTax: choice('부가세 기준을 선택해 주세요.', [['건별', 's4'], ['총액', 's4']]),
        contractDocuments: choice('발급하실 계약 문서를 선택해 주세요.', [['구독계약서', 'subscriptionDocument'], ['계약정보확인서', 'confirmationDocument']]),
        subscriptionDocument: lookupContract('구독계약서를 받을 계약번호나 제품명을 입력해 주세요.', 'subscriptionDocumentStatus'),
        subscriptionDocumentStatus: resolved('s3', [contractCase('s5', '261125-000'), contractCase('reissuedSubscription', '261125-019')]),
        reissuedSubscription: result('명의변경이 반영된 계약서로 확인했어요. 받으실 방법을 선택해 주세요.', [['발송 방법 선택', 's3']]),
        confirmationDocument: lookupContract('계약정보확인서를 받을 계약번호나 제품명을 입력해 주세요.', 'confirmationDocumentStatus'),
        confirmationDocumentStatus: resolved('s3', [contractCase('s5', '261125-000')]),
        virtualDocument: lookupContract('가상계좌확인서를 받을 계약번호나 제품명을 입력해 주세요.', 'virtualDocumentStatus'),
        virtualDocumentStatus: resolved('s4', [contractCase('s5', '261125-000'), contractCase('s6', '261125-058')])
      }
    },
    20: {
      screens: {
        s1: { actions: [['휴대폰 확인', '$auditSms']], auth: { success: 'terminationOwner', failure: 's5' } },
        terminationOwner: resolved('s5', [matchIdentity('s2', { 이름: userMatch, '휴대폰 번호': ownerPhoneMatch })]),
        s2: { actions: [['계약 선택하기', 'terminationContracts']] },
        s3: { message: '해약 신청 전에는 문의내역서를 받을 수 있어요. 해약 유형과 사유, 희망 회수일을 입력해 주세요.', actions: [['해약 사유와 회수일 확인', 'terminationInquiryFormat']], fields: [
          field('해약 유형', '해약 유형 입력', '구독 해약'), field('해약 사유', '해약 사유 입력', '제품 이용 종료'),
          field('희망 회수일', 'YYYY-MM-DD', '2026-11-30', 'date')
        ] },
        s4: documentOutput('해약 위약금 산정내역서를 어떤 방법으로 받으실까요?', 's6', '개별 출력'),
        s6: { message: '해약 위약금 산정내역서를 [발송 방법]으로 보냈어요.', items: [
          { title: '발송 문서', detail: '해약 위약금 산정내역서' }, { title: '출력 구분', detail: '[출력 구분]' }, { title: '수신처', detail: '[마스킹된 수신처]' }
        ] },
        terminationContracts: form('조회할 계약 또는 제품을 입력해 주세요. 여러 계약은 쉼표로 나눠 적을 수 있어요.', [
          field('조회할 계약', '예: 직수 정수기, 공기청정기', '직수 정수기')
        ], 'terminationStatus'),
        terminationStatus: resolved('terminationContractUnknown', [
          knownDocumentList('terminationKnownStatus', '조회할 계약', `(?:${inquiryDocumentContracts}|${calculatedDocumentContracts})`)
        ]),
        terminationKnownStatus: resolved('s3', [
          documentListContains('terminationMixedStatus', '조회할 계약', inquiryDocumentContracts, calculatedDocumentContracts),
          documentListContains('terminationFormat', '조회할 계약', calculatedDocumentContracts)
        ]),
        terminationContractUnknown: exception('입력하신 계약 가운데 본인 명의로 확인되지 않는 계약이 있어요. 계약번호나 제품명을 확인해 다시 입력해 주세요.', [
          ['계약 다시 입력', 'terminationContracts'], ['다른 문의', '$menu']
        ]),
        terminationMixedStatus: exception('선택하신 계약은 해약 신청 상태가 달라 같은 내역서로 받을 수 없어요. 같은 상태의 계약을 다시 입력하거나 상담으로 확인해 주세요.', [
          ['계약 다시 선택', 'terminationContracts'], ['상담사 연결', '$handoff']
        ]),
        terminationFormat: resolved('s4', [documentListContains('terminationCombinedChannel', '조회할 계약', 'SK-261125-020', 'SK-261125-021')]),
        terminationCombinedChannel: documentOutput('선택하신 계약의 해약 위약금 산정내역서를 한 문서로 받을 수 있어요.', 's6', '통합 출력'),
        terminationInquiryFormat: resolved('terminationInquiryChannel', [documentListContains('terminationInquiryCombinedChannel', '조회할 계약', waterDocumentContract, airDocumentContract)]),
        terminationInquiryChannel: documentOutput('해약 위약금 문의내역서를 어떤 방법으로 받으실까요?', 'terminationInquirySent', '개별 출력'),
        terminationInquiryCombinedChannel: documentOutput('선택하신 계약의 해약 위약금 문의내역서를 한 문서로 받을 수 있어요.', 'terminationInquirySent', '통합 출력'),
        terminationInquirySent: result('해약 위약금 문의내역서를 [발송 방법]으로 보냈어요.', deferred, [
          { title: '발송 문서', detail: '해약 위약금 문의내역서' }, { title: '출력 구분', detail: '[출력 구분]' }, { title: '수신처', detail: '[마스킹된 수신처]' }
        ])
      }
    },
    21: {
      screens: {
        s1: { actions: [['휴대폰 확인', '$auditSms']], auth: { success: 'terminationConfirmationOwner', failure: 's5' } },
        terminationConfirmationOwner: resolved('s5', [matchIdentity('returnContractLookup', { 이름: userMatch, '휴대폰 번호': ownerPhoneMatch })]),
        s2: documentOutput('해약이 확정되어 확인서를 받을 수 있어요. 어떤 방법으로 보내드릴까요?', 's6', '개별 출력'),
        s3: { message: '제품 회수는 완료됐어요. 아직 해약 확정이 반영되지 않아, 다음 날 확정 여부를 확인한 뒤 확인서를 발급받을 수 있어요.', actions: [['확정 상태 재확인 상담', '$handoff'], ['다른 계약 확인', 'returnContractLookup']] },
        s4: { actions: [['회수 일정 확인', '@36'], ['다른 계약 확인', 'returnContractLookup']] },
        s6: { items: [{ title: '발송 문서', detail: '해약확인서' }, { title: '출력 구분', detail: '[출력 구분]' }, { title: '수신처', detail: '[마스킹된 수신처]' }] },
        returnContractLookup: lookupContract('해약확인서를 받을 계약번호나 제품명을 입력해 주세요. 여러 계약은 쉼표로 나눠 적어 주세요.', 'returnStatus'),
        returnStatus: resolved('returnContractUnknown', [
          knownDocumentList('returnKnownStatus', contractField.label, `(?:${inquiryDocumentContracts}|SK-261125-022|SK-261125-023)`)
        ]),
        returnKnownStatus: resolved('s2', [
          documentListContains('s4', contractField.label, 'SK-261125-023'),
          documentListContains('s3', contractField.label, 'SK-261125-022'),
          documentListContains('returnCombinedChannel', contractField.label, waterDocumentContract, airDocumentContract)
        ]),
        returnContractUnknown: exception('입력하신 계약 가운데 본인 명의로 확인되지 않는 계약이 있어요. 계약번호나 제품명을 확인해 다시 입력해 주세요.', [
          ['계약 다시 입력', 'returnContractLookup'], ['다른 문의', '$menu']
        ]),
        returnCombinedChannel: documentOutput('선택하신 계약의 해약확인서를 한 문서로 받을 수 있어요.', 's6', '통합 출력')
      }
    },
    22: {
      screens: {
        s1: { actions: [['계약 제품', 'serviceIdentity'], ['일반 서비스', 's2']] },
        s2: form('서비스를 신청하실 때 사용한 휴대폰 번호, 성함, 주소를 입력해 주세요.', ['phone', 'name', 'address'], 'serviceRecordLookup'),
        s3: { message: '조회하실 서비스 종류를 선택해 주세요.', actions: [['일반 AS', 'servicePeriod'], ['재설치', 'servicePeriod'], ['분리', 'servicePeriod'], ['필터 서비스', 'servicePeriod']] },
        s4: { delivery: { target: 's6', useRegisteredNumber: false } },
        s6: { items: [{ title: '발송 문서', detail: '서비스처리내역확인서' }, { title: '서비스 종류', detail: '[서비스 종류]' },
          { title: '처리기간', detail: '[조회 기간]' }, { title: '발송 방법', detail: '[발송 방법]' }, { title: '수신처', detail: '[마스킹된 수신처]' }] },
        serviceIdentity: auth(lookupScope + ' 계약을 확인해 주세요.', 'serviceContractOwner', 's5'),
        serviceContractOwner: resolved('serviceContractLookup', [phoneCase('s5', '0000')]),
        serviceContractLookup: lookupContract('서비스를 받은 계약번호나 제품명을 입력해 주세요.', 'serviceContractStatus'),
        serviceContractStatus: resolved('s3', [contractCase('s5', '261125-000')]),
        serviceRecordLookup: resolved('s3', [phoneCase('s5', '0000')]),
        servicePeriod: periodForm('서비스를 받은 제품과 처리기간을 입력해 주세요.', 'servicePeriodLookup', ['product', dateFrom, dateTo]),
        servicePeriodLookup: resolved('s4', [{ target: 'serviceNoPeriodRecord', fields: ['제품명 또는 모델명'], match: '^SK-261125-000$' }]),
        serviceNoPeriodRecord: exception('해당 제품과 기간에 처리된 서비스 내역을 찾지 못했어요.', [['조회 조건 변경', 'servicePeriod'], ['다른 문의', '$menu']])
      }
    },
    23: {
      screens: {
        s1: { actions: [['카드 결제 이력 확인', 'receiptContractLookup']] },
        s4: { message: '카드매출전표는 담당 상담사가 이지페이에서 확인한 뒤 발송해 드려요. 요청과 함께 전달할 수신 방법을 선택해 주세요.' },
        s5: { actions: [['조회 조건 변경', 'receiptPeriod'], ['계약 다시 선택', 'receiptContractLookup']] },
        receiptContractLookup: lookupContract('영수증을 받을 계약번호나 제품명을 입력해 주세요.', 'receiptAuth'),
        receiptAuth: auth('카드 결제 이력 조회를 위해 휴대폰으로 본인을 확인해 주세요.', 'receiptOwner', 's6'),
        receiptOwner: resolved('receiptPeriod', [phoneCase('s6', '0000'), contractCase('s6', '261125-000')]),
        receiptPeriod: form('카드로 결제하신 달을 입력해 주세요.', [
          field('결제 월', 'YYYY-MM', '2026-11')
        ], 'receiptLookupStatus'),
        receiptLookupStatus: resolved('s5', [
          contractCase('s5', '261125-024'),
          { target: '$receiptPicker', fields: ['결제 월'], match: '^(?:2026\\s*[-./년]\\s*)?11\\s*월?$' }
        ])
      }
    },
    24: {
      entry: 'giroIdentity',
      screens: {
        giroIdentity: auth('지로 고지서와 가상계좌 문서는 계약자 본인 확인 후 조회할 수 있어요.', 'giroOwner', 's8'),
        giroOwner: resolved('s1', [phoneCase('s8', '0000')]),
        s1: { actions: [['지로 발송 내역', 'giroHistory'], ['지로 고지서 다시 받기', 'giroEligible'], ['가상계좌확인서 받기', 'fixedAccountState']] },
        s3: { items: [{ title: '발급 수량', detail: '최근 1건' }, { title: '고지서 수령 방법', detail: '우편' },
          { title: '수령 주소', detail: '서울 영등포구 문래동' }], actions: [['고지서 이미지 다시 받기', 'giroRecipient'], ['다른 문의', '$menu']] },
        s4: { delivery: { target: 's5', useRegisteredNumber: false } },
        s5: { message: '지로 고지서 이미지를 [발송 방법]으로 보냈어요. 이미지에 적힌 전자납부번호 또는 가상계좌로 납부할 수 있어요. 이미지 출력물은 종이 고지서처럼 은행 창구나 무인수납기에서 사용할 수 없어요.' },
        s7: { message: '발급된 고정형 가상계좌가 없어요. 미납요금과 가상계좌 발급 안내를 확인할 수 있어요.', actions: [['미납요금 확인', '@5'], ['여기서 마치기', '$finish']] },
        giroHistory: lookupContract('지로 발송 내역을 확인할 계약번호나 제품명을 입력해 주세요.', 'giroHistoryStatus'),
        giroHistoryStatus: resolved('s3', [contractCase('giroNotEligible', '261125-025'), contractCase('s8', '261125-000')]),
        giroEligible: lookupContract('고지서를 받을 계약번호나 제품명을 입력해 주세요.', 'giroEligibleStatus'),
        giroEligibleStatus: resolved('giroRecipient', [contractCase('giroNotEligible', '261125-025'), contractCase('s8', '261125-000')]),
        giroNotEligible: exception('지로 고지서는 지로로 납부하는 계약에 발급돼요. 확인하신 계약에는 지로 고지서가 발급되지 않아요.', [
          ['다른 계약 확인', 'giroEligible'], ['다른 문의', '$menu']
        ]),
        giroRecipient: { ...choice('정기 우편 고지서는 서울 영등포구 문래동으로 보내고 있어요. 이미지만 다시 받으시겠어요?', [
          ['고지서 이미지 다시 받기', 's4'], ['정기 수령지 변경 상담', '$handoff'], ['다른 문의', '$menu']
        ]), items: [{ title: '등록 수령 방식', detail: '우편' }, { title: '등록 수령 주소', detail: '서울 영등포구 문래동' }] },
        fixedAccountState: lookupContract('가상계좌확인서를 받을 계약번호나 제품명을 입력해 주세요.', 'fixedAccountStatus'),
        fixedAccountStatus: resolved('fixedAccountChannel', [contractCase('s8', '261125-000'), contractCase('s7', '261125-058')]),
        fixedAccountChannel: {
          ...choice('기존 고정형 가상계좌확인서를 어떤 방법으로 받으실까요?', senderChannels),
          delivery: { target: 's6', useRegisteredNumber: false }
        }
      }
    },
    25: {
      screens: {
        s1: auth('지로 고지서를 합치거나 나누기 전에 계약자 본인을 확인해 주세요.', 'giroGroupOwner', 'giroGroupDenied'),
        giroGroupOwner: resolved('giroGroupDenied', [matchIdentity('giroGroupContract', { '이름': userMatch, '휴대폰 번호': '^01000001234$' })]),
        giroGroupContract: lookupContract('지로 고지서 설정을 확인할 계약번호나 제품명을 입력해 주세요.', 'giroGroupEligibility'),
        giroGroupEligibility: resolved('giroGroupUnconfirmed', [contractCase('s3', '261125-025'), groupContractCase('s2', contractField.label)]),
        giroGroupDenied: exception('계약자 본인이나 계약 정보를 확인하지 못했어요. 등록하신 정보로 다시 확인해 주세요.', [
          ['다시 확인하기', 's1'], ['다른 문의', '$menu']
        ]),
        giroGroupUnconfirmed: handoff('입력하신 계약의 지로 고지서 변경 권한은 상담사가 확인해야 해요.', [
          ['계약 다시 확인', 'giroGroupContract'], ['상담사 연결', '$handoff'], ...deferred
        ]),
        s2: { actions: [['한 장으로 받기', 'giroGroup'], ['계약별로 나눠 받기', 'giroSplit']] },
        s5: { actions: [['우편', 's6'], ['이메일', 's6']] },
        s6: { message: '고지서 변경 요청과 수령 방법을 확인했어요. 다음 달 적용 여부는 담당자가 확인해야 해요.',
          items: [{ title: '요청한 고지서 수령 방법', detail: '[고지서 수령 방법]' }],
          actions: [['상담 문의하기', '$handoff'], ['증빙 발행 정보도 확인', 'giroEvidence'], ['다른 문의', '$menu']]
        },
        giroGroup: resolved('giroMergeContracts'),
        giroMergeStatus: resolved('giroGroupUnconfirmed', [knownGroupContracts('giroVerifiedMergeStatus')]),
        giroVerifiedMergeStatus: resolved('s5', [contractCase('s4', '261125-027', ['첫 번째 계약', '두 번째 계약']),
          contractCase('giroExistingBundle', '261125-026', ['첫 번째 계약', '두 번째 계약'])]),
        giroExistingBundle: choice('이미 묶여 있는 계약은 기존 묶음을 먼저 풀고 새 대표 계약으로 묶어야 해요. 이 조건으로 상담을 이어가시겠어요?', [
          ['이 조건으로 계속', 's5'], ['계약 다시 선택', 'giroMergeContracts'], ['여기서 마치기', '$finish']
        ]),
        giroEvidence: choice('증빙 발행도 함께 변경하면 대표 계약의 발행 정보를 기준으로 확인해요. 상담에서 어떻게 요청할까요?', [
          ['증빙 발행도 함께 확인', '$handoff'], ['고지서 변경만 확인', '$handoff'], ['뒤로', 's6']
        ]),
        giroMergeContracts: {
          ...form('한 장으로 받을 계약 두 건과 대표 계약을 입력해 주세요.', [
            field('첫 번째 계약', '예: 직수 정수기', '직수 정수기'),
            field('두 번째 계약', '예: 공기청정기', '공기청정기'),
            field('대표 계약', '위 두 계약 중 하나', '직수 정수기')
          ], 'giroMergeStatus'),
          validate: { oneOf: { field: '대표 계약', sources: ['첫 번째 계약', '두 번째 계약'] } }
        },
        giroSplit: choice('기존에 함께 발행되는 지로 고지서를 나누어 받으시겠어요?', [
          ['대표 계약의 묶음 전체 풀기', 'giroSplitAll'], ['일부 계약만 분리', 'giroSplitSome']
        ]),
        giroSplitAll: form('묶음을 풀 대표 계약을 입력해 주세요.', [field('대표 계약', '예: 직수 정수기', '직수 정수기')], 'giroSplitAllCheck'),
        giroSplitSome: form('나누어 받을 계약을 입력해 주세요.', [field('분리할 계약', '예: 공기청정기', '공기청정기')], 'giroSplitSomeCheck'),
        giroSplitAllCheck: resolved('giroGroupUnconfirmed', [groupContractCase('s5', '대표 계약')]),
        giroSplitSomeCheck: resolved('giroGroupUnconfirmed', [groupContractCase('s5', '분리할 계약')])
      }
    },
    26: {
      screens: {
        s1: { actions: [['휴대폰 확인', '$auditSms']], auth: { success: 'mergeIdentity', failure: 's6' } },
        mergeIdentity: resolved('mergeAuthorityReview', [phoneCase('s6', '0000'), matchIdentity('s2', { '이름': userMatch, '휴대폰 번호': '^01000001234$' })]),
        mergeAuthorityReview: handoff('이 연락처만으로는 통합할 계약의 변경 권한을 확인하기 어려워요. 등록 납부자의 처리 가능 여부는 상담사가 확인해 드려요.'),
        s2: { actions: [['계약 선택하기', 'mergeContracts']] },
        s3: { actions: [['계속하기', 'mergePaymentCompatibility'], ['여기서 마치기', '$finish']] },
        s4: { actions: [['결제정보 변경', '@3'], ['계약 다시 선택', 'mergeContracts']] },
        s7: { items: [{ title: '대표 계약', detail: '[대표 계약]' }, { title: '증빙 발행', detail: '[증빙 발행]' }], message: '대표 계약의 납부정보를 기준으로 통합 요청을 확인했어요.' },
        mergeContracts: {
          ...form('합칠 계약 두 건과 그중 대표 계약을 입력해 주세요.', [
          field('첫 번째 계약', '예: 직수 정수기', '직수 정수기'),
          field('두 번째 계약', '예: 공기청정기', '공기청정기'),
          field('대표 계약', '위 두 계약 중 하나', '직수 정수기')
          ], 'mergeState'),
          validate: { oneOf: { field: '대표 계약', sources: ['첫 번째 계약', '두 번째 계약'] } }
        },
        mergeState: resolved('mergeUnknownContracts', [knownGroupContracts('mergeVerifiedState')]),
        mergeUnknownContracts: handoff('입력하신 계약 두 건의 통합 대상과 변경 권한을 확인하지 못했어요.', [
          ['계약 다시 선택', 'mergeContracts'], ['상담사 연결', '$handoff'], ...deferred
        ]),
        mergeVerifiedState: resolved('mergePaymentCompatibility', [
          contractCase('E7', '261125-028', ['첫 번째 계약', '두 번째 계약']),
          contractCase('s3', '261125-026', ['첫 번째 계약', '두 번째 계약'])
        ]),
        mergePaymentCompatibility: resolved('s5', [
          contractCase('s4', '261125-027', ['첫 번째 계약', '두 번째 계약']),
          contractCase('mergeExistingBundle', '261125-029', ['첫 번째 계약', '두 번째 계약'])
        ]),
        mergeExistingBundle: choice('이미 통합된 계약은 기존 묶음을 먼저 풀고 다시 묶어요. 입력한 대상을 기준으로 계속할까요?', [
          ['계속하기', 's5'], ['계약 다시 선택', 'mergeContracts'], ['여기서 마치기', '$finish']
        ])
      }
    },
    27: {
      screens: {
        s1: auth('묶인 결제를 분리하려면 계약자 본인 또는 계약에 등록된 납부자 정보를 확인해 주세요.', 'splitIdentity', 's7'),
        splitIdentity: resolved('splitLookup', [phoneCase('s7', '0000'), phoneCase('splitAuthorityReview', '0002')]),
        splitAuthorityReview: handoff('이 연락처만으로는 계약자나 등록 납부자의 분리 권한을 확인하기 어려워요. 상담사가 계약 정보를 확인해 드려요.'),
        splitLookup: lookupContract('분리할 결제 묶음의 대표 계약번호나 제품명을 입력해 주세요.', 'splitStatus'),
        s2: { actions: [['모든 계약을 나누기', 'splitAllConfirm'], ['일부 계약만 나누기', 's4']] },
        s4: { actions: [['분리할 계약 선택', 'splitSelection']] },
        splitStatus: resolved('s7', [contractCase('s3', '261125-026'), contractCase('E7', '261125-028'),
          { target: 's2', fields: [contractField.label], match: '^(?:직수\\s*정수기(?:\\s*계약)?|정수기|WPU-1000|SK-261125-027)$' }
        ]),
        splitAllConfirm: { ...choice('확인한 대표 계약의 묶음을 모두 분리할까요?', [
          ['전체 분리 신청', 's5'], ['다시 선택', 's2']
        ]), items: [{ title: '대표 계약', detail: '[대표 계약]' }] },
        splitSelection: form('묶음에서 분리할 계약을 입력해 주세요.', [
          { ...field('분리할 계약', '묶음에 속한 계약 선택', '공기청정기'), options: ['공기청정기', '비데'] }
        ], 's6', '분리 요청'),
        s5: { items: [], message: '대표 계약에 묶여 있던 계약을 모두 분리했어요.' },
        s6: { items: [{ title: '분리한 계약', detail: '[분리한 계약]' }], message: '요청하신 계약의 분리 내용을 확인했어요.' }
      }
    },
    28: {
      entry: 'customerIdentity',
      screens: {
        customerIdentity: auth(lookupScope + ' 정보를 변경할 고객을 확인해 주세요.', 'customerLookup', 's3'),
        customerLookup: resolved('s1', [phoneCase('s3', '0000'), phoneCase('s3', '0002')]),
        s1: { actions: [['계약자 휴대폰', 's2'], ['주소·사용자 정보', 'customerAddressUser'], ['계약자 유선전화', 'customerLandline'],
          ['계산서 수신 이메일', 's4'], ['개명·대표자·상호', 'customerEvidence'], ['계약 명의변경', '@10'], ['납부정보 변경', '@3']] },
        s3: { actions: [['다시 확인하기', 'customerIdentity'], ['상담사 연결', '$handoff']] },
        s4: { actions: [['수신 이메일 변경', 'emailSaved']], fields: ['email'] },
        s7: { message: '요청하신 [변경 항목]의 정보를 변경했어요.', items: [], addActions: [['다른 항목 변경', 's1']] },
        s8: { message: '이미 발행된 세금계산서의 재발송은 상담사가 확인해 드려요. 새 수신 주소를 등록한 경우에도 기존 발행 건은 별도로 확인해야 해요.', actions: [['세금계산서 기존 발행 건 상담', '$handoff'], ['여기서 마치기', '$finish']] },
        customerAddressUser: choice('어떤 정보를 변경하실까요?', [
          ['계약자 주소', 'customerContractAddress'], ['제품 사용 주소', 'customerAddress'], ['사용자 이름·연락처', 'customerUser']
        ]),
        customerContractAddress: form('변경할 계약자 주소를 입력해 주세요.', ['address'], 'contractAddressSaved', '주소 변경'),
        contractAddressSaved: result('계약자 주소 변경 내용을 확인했어요.', [['다른 항목 변경', 's1'], ['여기서 마치기', '$finish']]),
        customerAddress: form('바꿀 제품 사용 주소를 입력해 주세요.', ['address'], 'addressSaved', '주소 변경'),
        addressSaved: result('제품 사용 주소를 변경했어요. 제품 이동이 필요하면 재설치 상담을 같이 진행할 수 있어요.', [
          ['제품도 옮겨 설치하기', 's6'], ['안심OK 방문 일정 확인', '@30'], ['다른 항목 변경', 's1'], ['여기서 마치기', '$finish']
        ]),
        customerUser: choice('제품 사용자의 어떤 정보를 변경하실까요?', [
          ['이름만 변경', 'customerUserName'], ['연락처만 변경', 'customerUserPhone'], ['이름과 연락처 변경', 'customerUserBoth']
        ]),
        customerUserName: form('바꿀 사용자 이름을 입력해 주세요.', ['name'], 'userNameSaved', '사용자 이름 변경'),
        customerUserPhone: form('바꿀 사용자 휴대폰 번호를 입력해 주세요.', ['phone'], 'userPhoneSaved', '사용자 연락처 변경'),
        customerUserBoth: form('바꿀 사용자 이름과 휴대폰 번호를 입력해 주세요.', ['name', 'phone'], 'userSaved', '사용자 정보 변경'),
        userNameSaved: result('사용자 이름 변경 내용을 확인했어요.', [['다른 항목 변경', 's1'], ['여기서 마치기', '$finish']]),
        userPhoneSaved: result('사용자 연락처 변경 내용을 확인했어요.', [['다른 항목 변경', 's1'], ['여기서 마치기', '$finish']]),
        userSaved: result('사용자 이름과 연락처 변경 내용을 확인했어요.', [['다른 항목 변경', 's1'], ['여기서 마치기', '$finish']]),
        customerLandline: form('바꿀 계약자 전화번호를 입력해 주세요.', [
          field('유선 전화번호', '예: 02-0000-1234', '02-0000-1234', 'tel')
        ], 's7', '전화번호 변경'),
        customerEvidence: choice('확인이 필요한 변경 유형을 선택해 주세요.', [
          ['계약자 개명', 'renameEvidence'], ['대표자 변경', 'representativeEvidence'], ['상호 변경', 's5']
        ]),
        renameEvidence: handoff('계약자 개명은 신분증 사본 또는 최근 3개월 내 발급된 개명 전후가 기재된 주민등록초본과 본인 확인이 필요해요. 상담사가 제출 경로를 안내할 수 있어요.'),
        representativeEvidence: handoff('개인사업자 대표자 변경에는 본인 확인이 필요해요. 상담사가 확인 절차를 안내할 수 있어요.'),
        emailSaved: result('세금계산서 수신 이메일을 변경했어요.', [
          ['이미 발행한 계산서도 받기', 's8'], ['다른 항목 변경', 's1'], ['여기서 마치기', '$finish']
        ])
      }
    },
    29: {
      screens: {
        s1: { actions: [['제 필터 배송', 'filterIdentity'], ['다른 분의 택배를 받았어요', 's6']] },
        s2: { addActions: [['배송 정보 다시 확인', 'filterIssue']] },
        s3: { actions: [['택배사 확인', '$carrier'], ['이미 택배사에 문의했어요', 'filterUndeliveredReview']] },
        s4: { actions: [['기존 주소로 재발송', 's5'], ['배송지 변경', 'filterChangedAddress']] },
        s5: { message: '필터 재발송 요청 내용을 확인했어요.', items: [{ title: '받으실 주소', detail: '[필터 배송 주소]' }], actions: [['다른 문의', '$menu']] },
        s6: form('다른 분의 필터 택배가 도착한 주소와 회수 연락을 받을 번호를 입력해 주세요.', ['address', 'phone'], 'thirdPartyFilterLookup', '회수 요청 확인'),
        s7: { message: '잘못 받아보신 필터의 회수 요청 내용을 확인했어요. 회수 담당자에게 문의할 수 있어요.', actions: [['회수 담당자 상담', '$handoff'], ['여기서 마치기', '$finish']] },
        s8: { actions: [['다시 확인하기', 'filterIdentity'], ['다른 문의', '$menu']] },
        thirdPartyFilterLookup: resolved('s7', [phoneCase('filterRecoveryUnconfirmed', '0000')]),
        filterRecoveryUnconfirmed: handoff('해당 주소의 필터 발송 건을 바로 확인하기 어려워요. 상담사가 회수 가능 여부를 확인해 드려요.'),
        filterIdentity: auth('필터는 계약자 또는 제품 사용자에게 안내할 수 있어요. 고객 정보를 확인해 주세요.', 'filterOwner', 's8'),
        filterOwner: resolved('filterLookup', [phoneCase('s8', '0000')]),
        filterLookup: form('필터 배송을 확인할 계약번호나 제품명과 제품 사용 주소를 입력해 주세요.', [contractField, 'address'], 'filterLookupStatus', '배송 조회'),
        filterLookupStatus: resolved('s8', [contractCase('s8', '261125-000'),
          { target: 'filterIssue', fields: ['주소'], match: '^서울(?:특별시)?\\s*영등포구\\s*문래동(?:\\s|$)' }
        ]),
        filterIssue: choice('필터 배송에서 무엇을 확인할까요?', [
          ['다음 배송 예정일', 'filterSchedule'], ['배송 완료인데 미수령', 'filterDispatchStatus'],
          ['필터가 파손됐거나 다른 필터가 왔어요', 's4'], ['받은 필터 수량이 달라요', 's4'],
          ['이사 전 주소에 배송됐어요', 'filterChangedAddress'], ['등록 배송 주소 확인', 'filterRegisteredAddress'],
          ['다음 배송 주소만 변경', 'filterAddressOnly']
        ]),
        filterSchedule: resolved('s2', [contractCase('filterUpcoming', '261125-029')]),
        filterDispatchStatus: resolved('s3', [contractCase('filterUpcoming', '261125-029')]),
        filterUpcoming: result('아직 출고되기 전이에요. 필터는 다음 배송 예정월에 순차 발송돼요.', [
          ['현재 등록 배송 주소 확인', 'filterRegisteredAddress'], ['다른 문의', '$menu']
        ], [{ title: '배송 예정', detail: '다음 달' }]),
        filterRegisteredAddress: result('다음 필터는 등록된 주소로 배송돼요.', [
          ['다음 배송 주소만 변경', 'filterAddressOnly'], ['다른 문의', '$menu']
        ], [{ title: '등록 배송 주소', detail: '[필터 배송 주소]' }]),
        filterUndeliveredReview: handoff('택배사에서도 인수 위치가 확인되지 않았다면 담당자가 배송 내역을 다시 확인해 드려요.', [
          ['배송 확인 상담', '$handoff'], ['다른 문의', '$menu']
        ]),
        filterChangedAddress: form('필터를 다시 받을 주소를 입력해 주세요.', ['address'], 's5', '재발송 요청'),
        filterAddressOnly: form('앞으로 필터를 받을 주소를 입력해 주세요.', ['address'], 'filterAddressSaved', '주소 변경'),
        filterAddressSaved: result('다음 필터 배송지 변경 내용을 확인했어요.', deferred, [{ title: '다음 배송 주소', detail: '[필터 배송 주소]' }])
      }
    },
    30: {
      screens: {
        s1: { actions: [['관계 확인', 'careAuthority']] },
        careAuthority: choice('계약자 또는 제품 사용자이신가요?', [
          ['계약자 본인', 'careVerify'], ['제품 사용자', 'careVerify'], ['계약자·사용자 외 타인', 's7']
        ]),
        careVerify: auth('안심OK 방문 정보를 보호하기 위해 휴대폰을 확인해 주세요.', 'careLookup', 's7'),
        careLookup: form('확인할 계약번호나 제품명과 제품을 사용하시는 주소를 차례로 입력해 주세요.', [contractField, 'address'], 'careStatus', '계약 확인'),
        s2: { actions: [
          ['방문 날짜 변경', 'careReschedule'], ['방문일보다 먼저 점검받기', 'careEarlier'],
          ['방문 담당자 연락 요청', 's5'], ['연락처 변경', 's6'], ['주소 변경', 'careAddress'], ['일정만 확인', '$finish']
        ] },
        s3: { actions: [['담당자 연락 요청', 's5'], ['미리 점검 요청', 'careEarlier'], ['여기서 마치기', '$finish']] },
        s4: { message: '공기청정기 계약에 연체 요금이 3회 있어요. 납부가 확인되면 안심OK 방문 일정을 다시 확인할 수 있어요.', items: [
          { title: '제품', detail: '공기청정기 · ACL-1000' }, { title: '미납 요금', detail: '59,700원 · 3회' }
        ], actions: [['요금 납부 안내', 'E7'], ['나중에 확인', '$finish']] },
        s5: { message: '관할 지국이나 방문 담당자의 연락이 필요한 경우예요.', actions: [['관할 지국 연락 요청', 'careCallback'], ['상담사 연결', 'E8']] },
        s6: { actions: [['연락처 변경 절차 확인', '@28']], fields: [], message: '안심OK 안내에 사용할 연락처는 고객정보 변경에서 확인할 수 있어요.' },
        s7: { actions: [['계약자·사용자 다시 확인', 'careAuthority'], ...deferred] },
        careStatus: resolved('s7', [
          matchIdentity('s3', { [contractField.label]: '^SK-261125-030$', '주소': addressMatch }),
          matchIdentity('s4', { [contractField.label]: '^SK-261125-031$', '주소': addressMatch }),
          matchIdentity('s2', { [contractField.label]: '^(?:직수\\s*정수기(?:\\s*계약)?|SK-261125-029)$', '주소': addressMatch })
        ]),
        careAddress: choice('방문 주소가 바뀌면 담당 관할도 달라질 수 있어요. 고객정보 변경에서 주소를 확인해 주세요.', [
          ['주소 변경 절차 확인', '@28'], ['방문 일정으로 돌아가기', 's2']
        ]),
        careReschedule: careRequest('이사, 출장, 여행 등 날짜를 바꾸려는 이유와 희망 일정을 알려 주세요. 관할 지국에서 가능한 날짜를 안내해요.'),
        careEarlier: careRequest('예정일보다 먼저 점검받으려는 이유와 가능한 시간대를 알려 주세요. 관할 지국에서 일정을 확인해요.'),
        careCallback: careRequest('담당자와 확인할 내용이나 연락받기 편한 시간을 알려 주세요.'),
        overduePaid: result('공기청정기 계약의 미납 요금 납부 상태를 확인했어요. 안심OK 방문 일정을 다시 확인할 수 있어요.', [
          ['안심OK 방문 일정 다시 확인', 'carePaidSchedule'], ['담당자 연락 요청', 's5'], ['여기서 마치기', '$finish']
        ], [{ title: '제품', detail: '공기청정기 · ACL-1000' }]),
        carePaidSchedule: result('공기청정기의 이번 달 안심OK 방문 일정은 아직 배정되지 않았어요.', [['담당자 연락 요청', 's5'], ['여기서 마치기', '$finish']],
          [{ title: '제품', detail: '공기청정기 · ACL-1000' }]),
        careRequested: handoff('요청하신 내용을 확인했어요. 방문일 조율과 담당자 연락은 관할 지국에서 확인하는 업무예요.', [['상담 요청 안내', '$handoff'], ...deferred])
      }
    },
    31: {
      screens: {
        s1: { actions: [['신규 가입', 's2'], ['기존 제품 교체', 's3'], ['신청한 가입 상품 재확인', 'subscriptionReview'], ['제품 관리 방법·멤버십', 'subscriptionCare'], ['제휴카드 혜택', '@6']] },
        s2: {
          fields: ['product', { ...field('희망 조건', '희망 기능, 의무사용기간, 방문주기 등', '방문관리, 5년 의무 사용'), required: false }],
          actions: [['희망 제품 확인', 'applicationStatus']]
        },
        s3: { fields: ['product'], actions: [['교체 제품 확인', 'replacementStatus']] },
        s4: { message: '이미 상담을 신청하신 건은 접수한 판매처에서 이어서 확인할 수 있어요.', actions: [['안내받은 판매처에 문의', 'sellerFollowup'], ['여기서 마치기', '$finish']] },
        s5: { message: '제품과 관리 조건에 맞는 구독료는 가입 상담에서 확인할 수 있어요. 가입 상담 안내를 받으시겠어요?' },
        applicationStatus: choice('같은 제품의 가입 상담을 판매처에 신청하신 적이 있나요?', [
          ['판매처에 상담 요청을 했어요', 's4'], ['아직 상담을 신청하지 않았어요', 's5']
        ]),
        subscriptionReview: { ...choice('이미 신청한 가입 상품은 계약자 본인 확인이 필요해요.', [['PASS 본인인증', 's4']]), auth: { failure: 'E6' } },
        subscriptionCare: choice('사용 중인 제품의 관리 방법과 만기 후 멤버십을 구분해 안내해 드릴게요.', [
          ['현재 제품 관리 방법', 'replacementConsultation'], ['만기 후 멤버십 상담', '@32']
        ]),
        replacementStatus: choice('이용 중인 제품의 계약 상태를 알려 주세요.', [
          ['36~41개월 사용', 'replacementBranch'], ['58개월 이상 사용', 'replacementBranch'],
          ['멤버십 이용 중', 'replacementBranch'], ['그 외 또는 잘 모르겠어요', 'replacementConsultation']
        ]),
        replacementBranch: handoff('현재 이용하시는 계약의 제품 교체 조건은 관할 지국에서 확인할 수 있어요.', [['상담 요청 안내', '$handoff'], ...deferred]),
        sellerFollowup: result('구독을 신청한 매장이나 판매처에서 제품, 조건, 접수 상태를 확인하실 수 있어요.', [['이전 연락 확인', '@33'], ...deferred]),
        replacementConsultation: handoff('기존 구독 또는 멤버십 제품 교체는 계약기간과 계약 상태를 확인한 뒤 담당처를 정해요. 상담 요청으로 이어갈 수 있어요.', [
          ['교체 상담 요청', '$handoff'], ['기존 계약·위약금 확인', '@7'], ['여기서 마치기', '$finish']
        ])
      }
    },
    32: {
      screens: {
        s2: { actions: [['제품 제조번호 확인', 'membershipEligibility']], fields: [
          field('제품 제조번호', '예: SKIX-2026-0123', 'SKIX-2026-0123')
        ] },
        s5: { message: '이 제품의 멤버십 비용 항목을 안내해 드릴게요. 실제 금액은 제품별 적용 요금과 계약 상태를 확인한 뒤 안내받을 수 있어요.', items: [
          { title: '월 멤버십료', detail: '제품·계약에 따라 확인' }, { title: '전체 필터 교체비', detail: '제품 모델에 따라 확인' }
        ], actions: [['가입 상담 안내', 's6'], ['계약·관리 조건 확인', 'membershipTerms']] },
        membershipEligibility: resolved('membershipNotFound', [
          { target: 's4', fields: ['제품 제조번호'], match: '^SKIX-2019-0123$' },
          { target: 's3', fields: ['제품 제조번호'], match: '^SKIX-2022-0123$' },
          { target: 'E6', fields: ['제품 제조번호'], match: '^SKIX-2026-0000$' },
          { target: 'membershipContractStage', fields: ['제품 제조번호'], match: '^SKIX-2026-0123$' }
        ]),
        membershipNotFound: exception('제조번호로 제품을 확인하기 어려워요. 제품 표면에 있는 제조번호를 확인해 주세요.', [['제조번호 다시 입력', 's2'], ['가입 상담 안내', 's6']]),
        membershipContractStage: choice('구독 계약이 끝나면 계약 종료 시점에 따라 가입 상담 절차가 달라요.', [
          ['만기 전·만기월', 's3'], ['만료 후 4개월 이내', 's5'], ['만료 후 4개월 경과', 'membershipBranch'], ['만료일을 모르겠어요', 's6']
        ]),
        membershipBranch: handoff('구독 종료 후 시간이 지난 제품은 방문 담당자가 제품 상태와 멤버십 가입 조건을 확인할 수 있어요.', [['가입 상담 안내', 's6'], ...deferred]),
        membershipTerms: result('멤버십은 1년 단위로 자동 갱신되며 설치일 또는 제조일부터 최대 7년까지 연장될 수 있어요. 정기 필터 교체 외 AS, 이동, 분리, 재설치에는 비용이 발생할 수 있어요.', [
          ['가입 상담 안내', 's6'], ['여기서 마치기', '$finish']
        ], [{ title: '이용 중 해지', detail: '계약기간 중 해지 또는 설치 불가 지역으로 이전 시 해약 정산금 발생 가능' }])
      }
    },
    33: {
      screens: {
        s1: { actions: [
          ['구독 가입 상담 후 연락을 기다리고 있어요', 's3'], ['주문 심사·해피콜을 못 받았어요', 's3'],
          ['이전에 통화한 담당자와 연결', 's3'], ['모바일 구독확인서를 전화상담으로 변경', 's2']
        ] },
        s3: { fields: ['phone', 'name'], actions: [['연락한 담당자 확인', 'callbackLookup']] },
        s5: { message: '최근 통화한 담당자를 확인했어요. 같은 번호로 재연락이 필요하신가요?', items: [{ title: '확인한 연락처', detail: '[마스킹된 번호]' }] },
        s6: { message: '안내받을 연락처와 재연락 요청을 확인했어요. 담당자의 재연락 여부는 상담에서 확인할 수 있어요.', items: [{ title: '재연락 번호', detail: '[마스킹된 번호]' }], actions: [['상담 요청 안내', '$handoff'], ...deferred] },
        callbackLookup: resolved('s4', [
          matchIdentity('s5', { '휴대폰 번호': '^01000001234$', '이름': userMatch }),
          matchIdentity('callbackPending', { '휴대폰 번호': '^01000000003$', '이름': userMatch })
        ]),
        callbackPending: choice('기존 상담 뒤 예정된 연락이 있는 상태예요. 예정된 연락을 기다리거나 담당자에게 재연락을 요청할 수 있어요.', [['재연락 요청', 's6'], ['예정된 연락 기다리기', '$finish']])
      }
    },
    34: {
      screens: {
        s1: auth('방문 전 연락을 요청할 서비스 접수를 확인할게요. 먼저 휴대폰을 확인해 주세요.', 'visitLookup', 'visitUnverified'),
        visitLookup: resolved('visitNotFound', [phoneCase('visitUnverified', '0000'), phoneCase('visitMultipleCustomers', '0002'),
          { target: '$visitResults', fields: ['휴대폰 번호'], match: '^010-?0000-?(?:0001|0007|0008|0009|0011|1234)$' }]),
        visitList: choice('확인할 방문 접수를 선택해 주세요.', []),
        visitUnverified: handoff('서비스를 받으실 분의 정보를 확인하지 못했어요.', [
          ['휴대폰 다시 확인', 's1'], ['상담사 연결', '$handoff'], ...deferred
        ]),
        visitMultipleCustomers: handoff('같은 연락처로 확인되는 고객이 여러 분이에요. 접수 내역은 상담사가 확인할 수 있어요.', [
          ['상담사 연결', '$handoff'], ...deferred
        ]),
        s4: result('선택하신 서비스 접수 내역이에요. 담당 매니저가 방문 당일 오전 10시 전에 연락해 방문 시간을 조율해요.', [
          ['계속하기', 's5'], ['다른 접수 선택', '$visitResults'], ['AS 접수 내역 확인', '@13']
        ]),
        s5: { actions: [['사전 연락 요청', 'visitCallbackNote'], ['일정 안내로 충분해요', 's7']] },
        visitCallbackNote: form('방문 전에 연락받기 편한 시간이나 담당 매니저가 알아야 할 사항을 입력해 주세요.', [{ ...field('요청 사항', '연락을 받기 편한 시간', '오전 9시 전에 연락 부탁드려요'), required: false }], 's6', '요청 내용 확인'),
        s6: { message: '방문 전 연락 요청 내용을 확인했어요. 연락 시간은 담당 사업장과 방문 매니저가 확인하는 사항이에요.', actions: [['상담 요청 안내', '$handoff'], ...deferred] },
        visitNotFound: exception('확인할 수 있는 방문 접수가 없어요. 접수 내역 또는 다시 방문 신청을 확인할 수 있어요.', [
          ['휴대폰 다시 확인', 's1'], ['AS 접수 내역 확인', '@13'], ['새 방문 접수', '@12'], ['다른 문의', '$menu']
        ])
      }
    },
    35: {
      screens: {
        s1: { actions: [['이전설치', 's2'], ['필터 교체', 's2'], ['AS 점검', 'serviceAsProduct']] },
        s2: { fields: ['product'], actions: [['제품 확인', 'serviceSaleType']] },
        s3: { message: '가정용 정수기 구독의 기본 작업 비용을 안내해 드릴게요. 실제 비용은 모델과 계약 상태, 설치 환경에 따라 달라져요. 제품 운반은 별도로 준비해 주세요.', items: [
          { title: '기준표 구분', detail: '가정용 정수기 단독 설치 예시' }, { title: '분리 기본비', detail: '28,000원' }, { title: '재설치 기본비', detail: '38,000원' }
        ], addActions: [['서비스 비용 적용 기준 보기', 'servicePricing'], ['조리수 밸브 비용 조건', 'serviceValvePricing']] },
        s5: { message: 'AS 비용은 보증·계약 상태와 고장 원인에 따라 달라요. 부품이 필요한 경우 방문 점검 후 정확한 비용을 안내받을 수 있어요.', addActions: [['서비스 비용 적용 기준 보기', 'servicePricing']] },
        serviceSaleType: choice('제품의 판매 또는 이용 유형을 알려 주세요.', [
          ['구독 제품', 'serviceCostLookup'], ['멤버십·일시불 구매 제품', 'serviceCostUnconfirmed'], ['판매 유형을 모르겠어요', 'serviceCostUnconfirmed']
        ]),
        serviceSingleCriteria: choice('일시불 제품의 비용은 서비스 종류와 제품 보증 상태에 따라 달라요.', [
          ['하자보수기간 내 AS', 'serviceWarranty'], ['하자보수기간 종료 또는 고객 과실', 'servicePaid'],
          ['이전설치·필터 교체 또는 보증을 모르겠어요', 'serviceCostUnconfirmed']
        ]),
        serviceAsProduct: form('점검 비용을 확인할 제품명이나 모델명을 입력해 주세요.', ['product'], 'serviceAsSaleType', '제품 확인'),
        serviceAsSaleType: choice('이 제품을 어떻게 이용하고 계신가요?', [
          ['구독 이용 중', 'serviceActiveCoverage'], ['구독 만료 또는 고객 과실', 'servicePaid'],
          ['일시불 구매', 'serviceSingleCriteria'], ['멤버십·계약 상태를 확인하고 싶어요', 's5']
        ]),
        serviceActiveCoverage: result('구독 기간에 제품 자체의 고장이 발생하면 무상 수리가 적용될 수 있어요. 고객 부주의, 외부 요인과 일부 부품은 현장 확인 후 비용이 발생할 수 있어요.', [
          ['AS 접수 안내', '@12'], ['비용 안내로 마치기', '$finish']
        ]),
        serviceValvePricing: result('조리수 밸브 설치 여부와 비용은 사용하는 정수기 모델과 설치 환경에 따라 달라요. 재설치 접수 중 해당 모델의 설치 옵션을 확인할 수 있어요.', [
          ['재설치 절차 확인', '@9'], ['여기서 마치기', '$finish']
        ], [{ title: '가정용 구독 정수기와 조리수 밸브 재설치 예시', detail: '43,000원' }]),
        serviceWarranty: result('일시불 구매 후 1년 이내에 제품 자체의 고장이 발생하면 무상 수리가 적용될 수 있어요. 단납 제품은 해당 제품의 하자보수기간을 따라요. 고객 부주의나 외부 요인으로 생긴 고장은 유상일 수 있어요.', [
          ['AS 접수 안내', '@12'], ['비용 안내로 마치기', '$finish']
        ]),
        servicePaid: result('보증기간이 끝났거나 고객 과실에 해당하면 방문 점검과 부품·수리 비용이 발생할 수 있어요. 적용 금액은 제품과 증상 확인 뒤 안내해요.', [
          ['AS 접수 안내', '@12'], ['비용 안내로 마치기', '$finish']
        ]),
        serviceCostLookup: resolved('serviceCostUnconfirmed', [
          { target: '$costResult', fields: ['제품명 또는 모델명'], match: '^(직수\\s*정수기|정수기|WPU-1000)$' }
        ]),
        serviceCostUnconfirmed: result('비용은 모델, 판매 유형과 계약 상태에 따라 달라요. 정확한 금액은 해당 제품과 서비스 내역을 확인한 뒤 안내할 수 있어요.', [
          ['상담에서 비용 확인', '$handoff'], ['다른 제품 확인', 's2']
        ]),
        servicePricing: result('이전설치 비용은 제품과 판매유형, 계약 상태에 따라 달라요. AS는 보증 여부와 방문·수리 내용에 따라 달라요. 접수 시 적용 비용을 확인할 수 있어요.', [
          ['서비스 접수 안내', 's7'], ['비용 안내로 마치기', '$finish']
        ]),
        s7: { message: '필요하신 서비스에 맞춰 접수 절차를 안내해 드릴게요.', actions: [['분리·재설치 함께 접수', '@8'], ['분리·재설치 한 건 접수', '@9'], ['필터·안심OK 확인', '@30'], ['고장 방문 접수', '@12']] }
      }
    },
    36: {
      screens: {
        s1: { actions: [['제품 회수', 'returnIdentity'], ['제품 설치', 'installationPurpose']] },
        installationPurpose: choice('제품의 배송·설치 일정을 확인하거나 배송 정보를 변경할 수 있어요.', [
          ['배송·설치 일정 확인', '@16'], ['배송 정보 변경·설치마스터 요청', '@17'], ['뒤로', 's1']
        ]),
        returnIdentity: auth('제품 회수 일정은 계약자 본인 확인 후 안내할 수 있어요.', 'returnOwner', 'returnNotFound'),
        returnOwner: resolved('s2', [phoneCase('returnNotFound', '0000')]),
        s2: { fields: [contractField], actions: [['회수 계약 조회', 'returnContractState']] },
        s3: { actions: [['납부 방법 확인', '@4'], ['해약 정산 내역 확인', '@7'], ['다른 문의', '$menu']] },
        s5: { actions: [['회수일 변경', 'returnDateCheck'], ['방문 담당자에게 전달', 'returnNote'], ['일정만 확인', '$finish']] },
        s6: { ...choice('예약 여유가 있는 날짜 중에서 희망 회수일을 선택해 주세요.', [
          ['회수 가능일 선택', '$date'], ['이 날짜로 요청', 's7'], ['방문 담당자에게 전달', 'returnNote'], ['뒤로', 's5']
        ], []), fields: [] },
        s7: { message: '희망 회수일을 확인했어요. 일정 변경 여부는 설치 담당자에게 확인해 주세요.', items: [{ title: '희망 회수일', detail: '[선택한 날짜]' }], actions: [['상담 요청 안내', '$handoff'], ...deferred] },
        s8: { message: '방문 담당자에게 전달할 요청 내용을 확인했어요. 일정 변경 가능 여부는 방문 담당자가 확인하는 사항이에요.', items: [], actions: [['상담 요청 안내', '$handoff'], ...deferred] },
        returnContractState: resolved('returnNotFound', [
          contractCase('s3', '261125-036'), contractCase('s4', '261125-037'), contractCase('s4', '261125-038'),
          { target: 's4', fields: [contractField.label], match: '^(?:직수\\s*정수기(?:\\s*계약)?|SK-261125-035)$' }
        ]),
        returnNotFound: handoff('제품 회수 계약과 일정은 담당 상담사가 확인할 수 있어요.'),
        returnDateCheck: resolved('s6', [contractCase('returnToday', '261125-037'), contractCase('returnUnavailable', '261125-038')]),
        returnToday: handoff('회수 당일에는 여기서 날짜를 바꾸기 어려워요. 방문 담당자에게 요청을 전달할 수 있어요.', [
          ['방문 담당자에게 전달', 'returnNote'], ['현재 일정 유지', 's5']
        ]),
        returnUnavailable: handoff('선택할 수 있는 회수 일정이 확인되지 않아요. 방문 담당자에게 요청을 전달할 수 있어요.', [
          ['방문 담당자에게 전달', 'returnNote'], ['현재 일정 유지', 's5']
        ]),
        returnNote: form('방문 담당자에게 확인할 내용을 입력해 주세요.', ['description'], 's8', '요청 내용 확인')
      }
    }
  });
})();
