(() => {
  'use strict';
  const choice = (message, actions, items) => ({ kind: 'choice', message, actions, ...(items && { items }) });
  const result = (message, actions, items) => ({ ...choice(message, actions, items), kind: 'result' });
  const notice = (message, actions) => ({ ...choice(message, actions), kind: 'exception' });
  const field = (message, fields, actions, extra = {}) => ({ kind: 'input', message, fields, actions, ...extra });
  const handoff = (message, actions = [['상담사 연결', '$handoff'], ['다른 문의', '$menu']]) =>
    ({ ...choice(message, actions), kind: 'handoff' });
  const item = (title, detail) => ({ title, detail });
  const close = [['다른 문의', '$menu'], ['상담 종료', '$finish']];
  const paymentMethods = (card, transfer) => choice(
    '어떤 방법으로 납부할까요? 카드와 실시간 계좌이체는 본인 명의의 수단만 사용할 수 있어요.',
    [['카드', card], ['실시간 계좌이체', transfer], ['가상계좌', 'S06']],
    [item('납부 금액', '[납부 금액]')]
  );
  const invoiceWarning = '출금이 이미 요청된 요금은 등록한 계좌나 카드에서 한 번 더 결제될 수 있어요.';
  const paymentStatus = [
    ['결제정보 변경', '@3'], ['미납요금 조회', '@5'], ['상담사 연결', '$handoff'], ['다른 문의', '$menu']
  ];
  const paymentUnavailable = (returnTo) => notice('일치하는 계약을 찾지 못했어요. 설치 전이나 설치 당일에는 계약이 조회되지 않을 수 있어요.', [
    ['다시 조회하기', returnTo], ['상담사 연결', '$handoff'], ['다른 문의', '$menu']
  ]);
  const resolved = (fallback, rules = []) => ({ resolve: { default: fallback, rules } });
  const paymentDay = new Date().getDate();
  const choosePayment = (registered, oneTime) => [['등록 결제수단', registered], ['일회성 납부수단', oneTime], ['나가기', '$finish']];
  const platformPayment = () => notice('네이버 구독 계약은 미납금 납부 전에 결제정보 등록이 필요해요. 네이버에서 등록 방법을 확인해 주세요.', [
    ['결제정보 변경 안내', '@3'], ['다른 문의', '$menu']
  ]);

  Object.assign(window.SKIX_FLOW_OVERLAYS ??= {}, {
    1: {
      screens: {
        S01: { actions: [['PASS 본인인증', 'exampleLookup']], auth: { failure: 'S08' } },
        S02: { actions: [['직수 정수기 선택', 'paymentPurpose'], ['공기청정기 선택', 'airPaymentPurpose']] },
        S03: { addActions: [['당월 납부 결과 확인', 'S04'], ['다른 계약 확인', 'S02']] },
        S04: { actions: [...paymentStatus, ['다른 계약 확인', 'S02']] },
        S05: { actions: [...paymentStatus, ['다른 계약 확인', 'S02']], items: [item('이체·결제 예정일', '매월 25일')] },
        S06: { actions: [...paymentStatus, ['다른 계약 확인', 'S02']] },
        S07: paymentUnavailable('S01'),
        S08: { actions: [['PASS 본인인증', 'exampleLookup']], auth: { failure: 'S09' } },
        exampleLookup: resolved('S02'),
        noCustomer: notice('일치하는 고객 정보를 확인하지 못했어요.', [['PASS 본인인증 다시 시도', 'exampleLookup'], ['상담사 연결', '$handoff']]),
        payerDenied: handoff('결제 정보는 계약자 본인에게 안내해 드려요. 납부자가 계약자와 다른 경우 상담에서 확인해 주세요.'),
        paymentPurpose: choice('직수 정수기의 어떤 결제 정보를 확인할까요?', [['결제정보 상세 조회', 'S03'], ['당월 납부 결과', 'S04']]),
        airPaymentPurpose: choice('공기청정기의 어떤 결제 정보를 확인할까요?', [['결제정보 상세 조회', 'airPaymentDetails'], ['당월 납부 결과', 'airPaymentStatus']]),
        airPaymentDetails: result('선택하신 공기청정기 계약의 결제정보예요.', [
          ['결제정보 변경', '@3'], ['위약금 문의', '@7'], ['당월 납부 결과 확인', 'airPaymentStatus'], ['다른 계약 확인', 'S02']
        ], [
          item('공기청정기', '제품코드 ACL-1000\n사용 주소 서울 영등포구 문래동'),
          item('결제정보', '출금 유형 계좌 자동이체\n은행 KB국민은행\n계좌번호 ••••-••••-4321\n이체일 매월 25일'),
          item('계약', '계약일 2025.09.01\n의무 사용 36개월 · 전체 계약 60개월'),
          item('청구·납부', '구독료 월 19,900원\n미납금(당월 제외) 59,700원\n당월 납부 미완료')
        ]),
        airPaymentStatus: resolved(paymentDay < 25 ? 'airPaymentBefore' : paymentDay === 25 ? 'S06' : 'S05'),
        airPaymentBefore: result('아직 이번 달 결제일 전이라 당월 요금이 납부되지 않았어요.', [
          ...paymentStatus, ['다른 계약 확인', 'S02']
        ], [item('이체·결제 예정일', '매월 25일'), item('미납금(당월 제외)', '59,700원')])
      }
    },
    2: {
      screens: {
        S01: { actions: [['PASS 본인인증', 'exampleLookup']], auth: { failure: 'S06' } },
        S02: {
          actions: [['직수 정수기 선택', 'S03'], ['공기청정기 선택', 'S04']],
          items: [item('직수 정수기', '월 29,900원 · 문래동'), item('공기청정기', '월 19,900원 · 문래동')]
        },
        S03: { addActions: [['다른 계약 확인', 'S02']], items: [
          item('월 이용료', '29,900원'), item('결제정보', '신한카드 · ••••-••••-••••-1234 · 매월 25일'),
          item('계약일', '2025.06.01'), item('당월 납부 상태', '납부 완료')
        ] },
        S04: { message: '선택하신 공기청정기의 월 이용료와 지난달까지의 미납금이에요.', addActions: [['다른 계약 확인', 'S02']], items: [
          item('월 이용료', '19,900원'), item('결제정보', 'KB국민은행 · ••••-••••-4321 · 매월 25일'),
          item('계약일', '2025.09.01'), item('미납금(당월 제외)', '59,700원')
        ] },
        S05: paymentUnavailable('S01'),
        S06: { actions: [['PASS 본인인증', 'exampleLookup']], auth: { failure: 'S07' } },
        exampleLookup: resolved('S02'),
      }
    },
    3: {
      screens: {
        S01: { actions: [['PASS 본인인증', 'changeContract']], auth: { failure: 'S07' } },
        S02: { actions: [['일괄 변경', 'S03'], ['상담사 연결', '$handoff'], ['다른 계약 확인', 'changeContract']] },
        S08: {
          message: '결제수단 변경 내용을 확인했어요. 이번 달 요금을 이미 납부했다면 다음 달부터 변경한 수단이 적용돼요. 미납 상태라면 이번 달부터 적용되며, 당일 처리 결과는 반영까지 시간이 걸릴 수 있어요. 변경 시점에 따라 제휴 할인 적용 여부가 달라질 수 있어요.',
          actions: [['다른 계약 변경', 'changeContract'], ['다른 문의', '$menu']]
        },
        changeContract: choice('변경할 계약을 선택해 주세요.', [
          ['직수 정수기 선택', 'ordinaryPaymentDetails'], ['정수기·공기청정기 묶음 선택', 'S02'], ['비데 선택', 'naverContract']
        ], [
          item('직수 정수기', 'WPU-1000 · 개별 결제 · 신한카드'),
          item('정수기·공기청정기 묶음', '묶음 결제 · 대표 계약 결제일 매월 25일'),
          item('비데', 'BID-1000 · 네이버 구독')
        ]),
        ordinaryPaymentDetails: result('직수 정수기에 등록된 결제정보를 확인해 주세요.', [
          ['결제정보 변경', 'S03'], ['위약금 조회', '@7'], ['다른 계약 확인', 'changeContract']
        ], [item('결제 정보', '신한카드 · ••••-••••-••••-1234 · 매월 25일'), item('결제 범위', '선택한 개별 계약')]),
        naverContract: result('네이버에서 구독한 계약의 결제정보는 네이버에서 변경하실 수 있어요.', [['다른 계약 확인', 'changeContract'], ...close])
      }
    },
    4: {
      screens: {
        S01: { actions: [['PASS 본인인증', 'chargeContract']], auth: { failure: 'S09' } },
        S02: {
          message: '납부할 금액을 확인해 주세요. ' + invoiceWarning,
          paymentAmount: 29900,
          actions: choosePayment('$savedPicker', 'oneTimeMethods')
        },
        S03: { actions: [['가상계좌', 'receiptVirtual'], ['상담사 연결', '$handoff']] },
        S04: { fields: [
          { label: '카드번호', placeholder: '숫자 16자리', type: 'password', sample: '0000000000001234' },
          { label: '유효기간', placeholder: 'MM / YY', type: 'password', sample: '12 / 30' },
          { label: '생년월일', placeholder: 'YYMMDD', type: 'password', sample: '900101' }
        ], items: [item('할부 기간', '일시불 · 5만원 미만'), item('납부 금액', '[납부 금액]')] },
        S05: { items: [item('납부 금액', '[납부 금액]')] },
        S06: { message: '가상계좌를 발급받을 은행과 안내받을 휴대폰 번호를 입력해 주세요.', items: [item('납부 금액', '[납부 금액]')] },
        S07: { message: '[납부 금액]이 납부됐어요. 아래에서 처리 결과를 확인해 주세요.', items: [item('처리 상태', '납부 완료'), item('납부 금액', '[납부 금액]')] },
        S07V: { addActions: [['입금 확인 안내', '@39'], ['다른 계약 확인', 'chargeContract']] },
        chargeContract: choice('납부할 계약을 선택해 주세요.', [
          ['직수 정수기 선택', 'chargeDetails'], ['공기청정기 선택', 'paymentScope'], ['비데 선택', 'chargePaid'], ['매트리스 선택', 'naverPayment']
        ], [item('직수 정수기', '당월 29,900원 · 이전 미납금 0원'), item('공기청정기', '당월 19,900원 · 이전 미납금 59,700원'), item('비데', '당월 납부 완료'), item('매트리스', '네이버 구독')]),
        chargeDetails: result('직수 정수기의 이번 달 요금이 아직 납부되지 않았어요.', [
          ['요금 납부', 'S02'], ['결제정보 변경', '@3'], ['위약금 조회', '@7'], ['다른 계약 확인', 'chargeContract']
        ], [item('당월 요금', '29,900원'), item('미납금(당월 제외)', '0원'), item('등록 결제정보', '신한카드 · ••••-••••-••••-1234 · 매월 25일')]),
        paymentScope: choice('공기청정기의 지난 미납요금과 이번 달 요금이 남아 있어요. 납부할 범위를 선택해 주세요.', [
          ['미납요금만 납부', 'chargePast'], ['미납요금과 당월 요금 납부', 'chargeCombined'], ['다른 계약 확인', 'chargeContract']
        ], [item('미납요금만 납부', '59,700원'), item('미납요금과 당월 요금 납부', '79,600원')]),
        chargePast: { ...choice('계약의 지난 미납요금 전체를 납부해요. ' + invoiceWarning, choosePayment('S03', 'receiptPaymentMethods'), [item('납부 금액', '[납부 금액]')]), paymentAmount: 59700 },
        chargeCombined: { ...choice('지난 미납요금과 이번 달 요금을 함께 납부해요. ' + invoiceWarning, choosePayment('S03', 'receiptPaymentMethods'), [item('납부 금액', '[납부 금액]')]), paymentAmount: 79600 },
        chargePaid: result('비데의 이번 달 요금은 이미 납부됐어요.', [['결제정보 변경', '@3'], ['위약금 조회', '@7'], ['다른 계약 확인', 'chargeContract']], [item('당월 납부 상태', '납부 완료')]),
        naverPayment: platformPayment(),
        chargeNotFound: paymentUnavailable('S01'),
        oneTimeMethods: paymentMethods('$issuerPicker', 'S05')
      }
    },
    5: {
      screens: {
        S01: { actions: [['PASS 본인인증', 'arrearsContract']], auth: { failure: 'S09' } },
        S02: { addActions: [['결제정보 변경', '@3'], ['다른 계약 확인', 'arrearsContract']], items: [
          item('미납금(당월 제외)', '29,900원'), item('월 이용료', '29,900원'), item('등록 결제정보', '신한카드 · ••••-••••-••••-1234 · 매월 25일')
        ] },
        S03: { addActions: [['결제정보 변경', '@3'], ['다른 계약 확인', 'arrearsContract']] },
        S04: {
          message: '계약 건별 미납요금 전체를 납부할 수 있어요. ' + invoiceWarning,
          paymentAmount: 29900,
          actions: choosePayment('$savedPicker', 'oneTimeMethods')
        },
        S05: { fields: [
          { label: '카드번호', placeholder: '숫자 16자리', type: 'password', sample: '0000000000001234' },
          { label: '유효기간', placeholder: 'MM / YY', type: 'password', sample: '12 / 30' },
          { label: '생년월일', placeholder: 'YYMMDD', type: 'password', sample: '900101' }
        ], items: [item('할부 기간', '일시불 · 5만원 미만'), item('납부 금액', '[납부 금액]')] },
        S05T: { items: [item('납부 금액', '[납부 금액]')] },
        S06: { message: '가상계좌를 발급받을 은행과 안내받을 휴대폰 번호를 입력해 주세요.', items: [item('납부 금액', '[납부 금액]')] },
        S07: { message: '미납요금 [납부 금액]이 납부됐어요.', items: [item('처리 상태', '납부 완료'), item('납부 금액', '[납부 금액]')] },
        S08: { addActions: [['입금 확인 안내', '@39'], ['다른 계약 확인', 'arrearsContract']] },
        arrearsContract: choice('미납요금을 조회할 계약을 선택해 주세요.', [
          ['직수 정수기 선택', 'S02'], ['공기청정기 선택', 'airArrears'], ['비데 선택', 'S03'], ['매트리스 선택', 'naverPayment']
        ], [item('직수 정수기', '미납요금 29,900원'), item('공기청정기', '미납요금 59,700원'), item('비데', '미납요금 0원'), item('매트리스', '네이버 구독')]),
        airArrears: result('공기청정기의 지난달까지 미납요금을 확인했어요.', [
          ['미납금 납부', 'highArrearsPayment'], ['결제정보 변경', '@3'], ['다른 계약 확인', 'arrearsContract']
        ], [item('미납금(당월 제외)', '59,700원'), item('월 이용료', '19,900원'), item('결제정보', 'KB국민은행 · ••••-••••-4321 · 매월 25일')]),
        highArrearsPayment: { ...choice('계약의 지난 미납요금 전체를 납부해요. ' + invoiceWarning, choosePayment('otherPayer', 'receiptPaymentMethods'), [item('납부 금액', '[납부 금액]')]), paymentAmount: 59700 },
        otherPayer: choice('등록된 결제수단은 다른 분 명의예요. 가상계좌로 입금하거나 상담사를 통해 납부 방법을 확인해 주세요.', [['가상계좌', 'receiptVirtual'], ['상담사 연결', '$handoff']]),
        naverPayment: platformPayment(),
        arrearsNotFound: paymentUnavailable('S01'),
        oneTimeMethods: paymentMethods('$issuerPicker', 'S05T')
      }
    },
    6: {
      screens: {
        S01: { message: '제휴카드를 넘겨 보며 카드별 혜택을 비교할 수 있어요. 혜택을 받으려면 발급받은 카드를 구독료 자동납부 수단으로 등록하고 카드사 이용 조건을 충족해야 해요.' }
      }
    },
    7: {
      screens: {
        S01: { actions: [['PASS 본인인증', 'S02']], auth: { failure: 'S08' } },
        S03: { addActions: [['결제정보 변경', '@3'], ['다른 문의', '$menu']] },
        S04: {
          actions: [['직수 정수기 선택', 'S05'], ['비데 선택', 'packageEstimate'], ['공기청정기 선택', 'crossPackageEstimate'], ['매트리스 선택', 'S07']],
          items: [item('직수 정수기', 'WPU-1000 · 개별 계약'), item('비데', 'BID-1000 · 패키지 할인'), item('공기청정기', 'ACL-1000 · 크로스 패키지 할인'), item('매트리스', 'MT-1000 · 패키지 유형 중복')]
        },
        S06: { addActions: [['위약금 내역서 안내', '@20'], ['다른 계약 확인', 'S04']] },
        S07: { addActions: [['다른 계약 확인', 'S04']] },
        packageEstimate: choice('패키지 상품의 위약금을 함께 조회할까요, 선택한 제품만 조회할까요?', [
          ['패키지 묶음 조회', 'S05'], ['선택한 계약만 조회', 'packageSingleNotice']
        ]),
        crossPackageEstimate: choice('크로스 패키지로 묶인 상품의 위약금을 조회할 범위를 선택해 주세요.', [
          ['크로스 패키지 묶음 조회', 'S05'], ['선택한 계약만 조회', 'crossSingleNotice']
        ]),
        packageSingleNotice: notice('한 상품만 해약하면 묶음 할인 조건이 바뀌어 다른 상품의 구독료가 달라질 수 있어요.', [
          ['기준일 선택', 'packageSingleDate'], ['뒤로', 'S04']
        ]),
        crossSingleNotice: notice('공기청정기만 해약하면 함께 할인받는 상품의 구독료가 달라질 수 있어요.', [
          ['기준일 선택', 'crossSingleDate'], ['뒤로', 'S04']
        ])
      }
    }
  });
})();


(() => {
  'use strict';
  const item = (title, detail) => ({ title, detail });
  const choice = (message, actions, items) => ({ kind: 'choice', message, actions, ...(items && { items }) });
  const result = (message, actions, items) => ({ ...choice(message, actions, items), kind: 'result' });
  const notice = (message, actions) => ({ ...choice(message, actions), kind: 'exception' });
  const field = (message, fields, actions, extra = {}) => ({ kind: 'input', message, fields, actions, ...extra });
  const handoff = (message, actions = [['상담사 연결', '$handoff'], ['다른 문의', '$menu']]) =>
    ({ ...choice(message, actions), kind: 'handoff' });
  const noMatch = (target) => notice('일치하는 고객 정보가 없어 이 접수 내역을 확인할 수 없어요.', [
    ['다시 확인하기', target], ['상담사 연결', '$handoff'], ['다른 문의', '$menu']
  ]);
  const unsupportedAddress = { fields: ['주소'], match: '^해외(?:\\s*(?:배송|주소))?$' };
  const close = [['다른 문의', '$menu'], ['상담 종료', '$finish']];
  const unrestrictedService = [['다른 분리·재설치 접수', '@8'], ['고장 상담', '@11'], ['추가 문의', '$menu']];
  const moveDate = (label, sample) => ({ label, placeholder: '방문 날짜 선택', type: 'date', sample });
  const birthdate = { label: '생년월일', placeholder: 'YYMMDD', type: 'password', sample: '900101' };
  const businessRegistrationNumber = { label: '사업자등록번호', placeholder: '사업자등록번호', type: 'password', sample: '000-00-00000' };
  const changedDates = [['11월 27일(금) 선택', '$date'], ['더보기', '$moreDates']];

  function moveService(isSplit) {
    const service = isSplit ? '분리' : '재설치';
    const scheduled = isSplit ? 'S05' : 'valveOption';
    const addressPrompt = isSplit
      ? '분리할 주소와 방문 당일 연락받으실 번호를 입력해 주세요.'
      : '새로 설치할 주소와 방문 당일에 연락받을 번호를 입력해 주세요.';
    const splitAuth = {
      ...choice('분리와 재설치를 함께 접수할 수 있어요. 휴대폰으로 신청자를 확인해 주세요.', [['휴대폰 확인', '$auditSms']]),
      auth: { success: 'pairSplitAddress', failure: 'S08' }
    };
    return {
      screens: {
        S01: { actions: [[service + ' 접수', 'phoneInput'], ['분리·재설치 접수', 'pairAuth']] },
        phoneConfirm: { auth: { success: 'moveLookup', failure: 'S08' } },
        moveLookup: { resolve: { default: 'S02', rules: [
          { target: 'customMoveProduct', fields: ['휴대폰 번호'], match: '^010-?0000-?0000$' },
          { target: 'moveMultipleCustomers', fields: ['휴대폰 번호'], match: '^010-?0000-?0002$' },
          { target: 'S07', fields: ['휴대폰 번호'], match: '^010-?0000-?0003$' },
          { target: 'S03', fields: ['휴대폰 번호'], match: '^010-?0000-?0004$' }
        ] } },
        moveMultipleCustomers: handoff('같은 연락처로 여러 고객번호가 확인됐어요. 상담사가 접수할 제품을 확인해 드려요.'),
        S02: {
          actions: [
            ['직수 정수기 선택', 'addressOptions'], ['다른 제품', 'customMoveProduct'], ['이미 신청한 접수 확인', '@13']
          ]
        },
        S03: { actions: [['기존 접수 확인', '@13'], ['다른 주소 또는 접수로 계속하기', 'addressOptions'], ['상담사 연결', '$handoff']] },
        S04: {
          message: addressPrompt,
          actions: [['주소 검색', '$address'], ['다음', 'moveAddressPass']]
        },
        moveAddressPass: { ...choice('구독 제품의 새 방문 주소를 확인하려면 PASS 인증이 필요해요.', [
          ['PASS 본인인증', scheduled], ['주소 다시 입력', 'S04']
        ]), auth: { failure: 'movePassFailed' } },
        movePassFailed: handoff('새 방문 주소를 확인하지 못했어요.', [
          ['PASS 본인인증 다시 시도', scheduled], ['상담사 연결', '$handoff']
        ]),
        customMoveProduct: field('접수하실 제품명이나 모델명을 입력해 주세요.', ['product'], [['다음', 'customMoveStatus']]),
        customMoveStatus: choice('이사 또는 제품 이동은 어느 단계인가요?', [
          ['이사 예정', 'customMoveDate'], ['이사·이동 완료', 'customMoveAddress'], ['기타 · 공사 등', 'customMoveAddress']
        ]),
        customMoveDate: field('이사 예정일을 입력해 주세요.', [moveDate('이사 예정일', '2026-11-30')], [['다음', 'customMoveAddress'], ['뒤로', 'customMoveStatus']]),
        customMoveAddress: field(addressPrompt, ['address', 'phone'], [['주소 검색', '$address'], ['다음', 'S05']]),
        S05: {
          message: (isSplit ? '이사 예정일 전날까지 방문할 수 있는 날짜를 선택해 주세요.' : '새 주소에서 재설치할 수 있는 날짜를 선택해 주세요.') +
            ' 실제 비용은 제품과 설치 환경에 따라 달라질 수 있어요.',
          actions: [...changedDates, ['접수 요청', 'S06']]
        },
        S06: { addActions: unrestrictedService, items: [item('접수번호', 'AS-261125-001'), item('제품', '[방문 제품]'), item('방문 예정일', '11월 27일(금)')] },
        addressOptions: isSplit
          ? choice('기존 등록 주소에서 분리할까요, 다른 주소에서 분리할까요?', [
            ['등록 주소 사용', 'registeredAddress'], ['다른 주소 입력', 'S04']
          ], [item('등록 주소', '서울 영등포구 문래동')])
          : choice('재설치할 새 주소와 희망일을 확인해 주세요.', [['주소 입력', 'S04']]),
        ...(isSplit && { registeredAddress: field('방문 당일 연락받으실 전화번호를 입력해 주세요.', ['phone'], [['다음', 'S05']]) }),
        pairAuth: splitAuth,
        pairSplitAddress: field('제품명, 분리할 주소와 방문에 필요한 정보를 차례로 입력해 주세요. 이사 예정일 전날까지 분리할 수 있어요.', [
          'product', 'address', 'phone', moveDate('이사 예정일', '2026-11-30'), moveDate('분리 방문 희망일', '2026-11-27')
        ], [['재설치 주소 입력', 'pairInstallAddress']]),
        pairInstallAddress: field('이사 후 재설치할 주소와 방문 정보를 입력해 주세요. 분리 접수 주소와 별도로 확인해요.', [
          'address', 'phone', moveDate('재설치 방문 희망일', '2026-12-02')
        ], [['입력 확인', 'pairReview']]),
        pairReview: choice('두 방문을 함께 신청할까요? 분리·재설치 환경에 따라 비용이 추가될 수 있어요.', [
          ['분리·재설치 접수 요청', 'pairResult'], ['뒤로', 'pairSplitAddress']
        ]),
        pairResult: result('분리와 재설치 두 건의 방문 접수를 확인했어요.', unrestrictedService, [
          item('접수 유형', '분리 방문과 재설치 방문'), item('처리 상태', '접수 완료')
        ])
      }
    };
  }

  Object.assign(window.SKIX_FLOW_OVERLAYS ??= {}, {
    8: moveService(true),
    9: moveService(false),
    10: {
      screens: {
        S01: { actions: [['PASS 본인인증', 'transferPurpose']], auth: { failure: 'S09' } },
        transferPurpose: choice('어떤 명의변경 업무를 도와드릴까요?', [
          ['신청 방법 문의', 'S02'], ['명의변경 신청', 'S03'], ['신청 상태 조회', 'transferPending'], ['신청 취소', 'transferCancelCheck']
        ]),
        S02: {
          message: '명의변경은 현재 계약자가 직접 신청해 주세요. 새 계약자의 성함, 연락처와 생년월일을 준비해 주세요. 개인사업자는 사업자번호도 필요해요.',
          addActions: [['필요한 서류 보기', 'transferDocuments'], ['명의변경 신청', 'S03']]
        },
        S04: { actions: [['미납요금 조회·납부', '@5'], ['당월 요금 납부', '@4'], ['뒤로', 'S03']] },
        S03: {
          actions: [['직수 정수기 선택', 'S06'], ['공기청정기 선택', 'S04'], ['정수기·공기청정기 묶음 선택', 'S05'], ['비데 선택', 'platformOrder']],
          items: [item('직수 정수기', 'WPU-1000 · 구독 이용 중'), item('공기청정기', 'ACL-1000 · 미납금 있음'), item('정수기·공기청정기 묶음', '패키지 할인 계약'), item('비데', 'BID-1000 · 네이버 구독')]
        },
        S05: {
          message: '선납 할인을 받고 있거나 묶음·크로스 패키지로 할인받는 계약은 명의변경 조건을 먼저 확인해 주세요. 묶음 중 일부만 변경하면 할인 반환금이나 구독료 조정이 발생할 수 있어요.'
        },
        S06: { fields: [], kind: 'choice', actions: [
          ['개인', 'transfereePersonal'], ['개인사업자', 'transfereeBusiness'],
          ['귀화·등록번호 정정 등', 'transfereePapers']
        ] },
        S07: { addActions: [['서류 안내', 'transferDocuments'], ['상담사 연결', '$handoff']] },
        S08: {
          message: '명의변경 신청 내용을 확인했어요. 새 계약자는 알림톡에서 후속 절차를 확인할 수 있어요.',
          items: [item('접수번호', 'NC-261125-001'), item('진행 상태', '신청 접수')],
          addActions: [['신청 진행·취소 안내', 'transferTracking'], ['추가 문의', '$menu']]
        },
        platformOrder: result('네이버 구독 계약은 이 채팅에서 명의를 변경하기 어려워요. 구독 신청처나 상담사에게 문의해 주세요.', [
          ['상담사 연결', '$handoff'], ['뒤로', 'S03']
        ]),
        transfereePersonal: field('새 계약자의 정보를 입력해 주세요. 만 19세 미만은 명의변경이 제한돼요.',
          ['name', 'phone', birthdate], [['신청 접수', 'S08'], ['뒤로', 'S06']], { secure: true }),
        transfereeBusiness: field('새 개인사업자의 정보를 입력해 주세요. 휴업·폐업 상태일 때는 명의변경이 제한돼요.',
          ['name', 'phone', birthdate, businessRegistrationNumber], [['신청 접수', 'S08'], ['뒤로', 'S06']], { secure: true }),
        transfereePapers: field('서류 안내를 받을 연락처를 입력해 주세요. 접수 후 준비할 서류와 제출 경로를 안내해요.',
          ['phone'], [['서류 안내 확인', 'S07'], ['뒤로', 'S06']], { secure: true }),
        transferDocuments: result('신청 유형에 따라 명의변경 신청서, 사업자 확인 서류 등 대상 서류가 달라요. 서류 안내를 먼저 확인해 주세요.', [
          ['명의변경 신청', 'S03'], ['서류 상세 문의', '$handoff'], ['뒤로', 'S02']
        ], [
          item('신청 주체', '양도인인 현재 계약자'), item('추가 서류가 필요한 유형', '개인사업자·명의 정정 등')
        ]),
        transferTracking: choice('접수번호를 기준으로 진행 상태를 확인해요. 이미 진행된 신청은 취소할 수 없는 상태일 수 있어요.', [
          ['진행 상태 확인', 'transferPending'], ['명의변경 신청 취소', 'transferCancelCheck'], ['상담사 연결', '$handoff']
        ]),
        transferPending: result('신청이 접수되어 후속 확인을 기다리고 있어요.', [
          ['취소 가능 여부 확인', 'transferCancelCheck'], ['뒤로', 'transferTracking']
        ], [item('접수번호', 'NC-261125-001'), item('대상 계약', '직수 정수기 · WPU-1000')]),
        transferCancelCheck: choice('취소하려는 신청을 선택해 주세요. 완료되거나 이미 취소된 신청은 목록에 표시되지 않아요.', [
          ['직수 정수기 명의변경 신청 선택', 'transferCancelConfirm'], ['다른 접수번호 입력', 'transferCancelNumber'], ['뒤로', 'transferPurpose']
        ], [item('직수 정수기 명의변경 신청', 'NC-261125-001 · WPU-1000 · 신청 접수')]),
        transferCancelNumber: field('확인할 명의변경 접수번호를 입력해 주세요.', [
          { label: '명의변경 접수번호', placeholder: '접수번호 입력', sample: 'NC-261125-099' }
        ], [['접수 확인', 'transferCancelLookup'], ['뒤로', 'transferCancelCheck']]),
        transferCancelLookup: {
          resolve: { default: 'transferNoRequest', rules: [
            { target: 'transferCancelConfirm', fields: ['명의변경 접수번호'], match: '^NC-261125-001$' },
            { target: 'transferCancelUnavailable', fields: ['명의변경 접수번호'], match: '^NC-261125-002$' }
          ] }
        },
        transferCancelConfirm: choice('선택한 명의변경 신청을 취소할까요?', [
          ['취소 요청', 'transferCancelled'], ['나가기', 'transferTracking']
        ], [item('접수번호', 'NC-261125-001'), item('대상 제품', '직수 정수기 · WPU-1000')]),
        transferCancelled: result('선택한 명의변경 신청이 취소됐어요.', close),
        transferNoRequest: notice('입력하신 접수번호의 진행 중인 신청을 찾지 못했어요. 완료된 신청이나 홈페이지에서 신청한 내역은 서비스센터에서 확인해 주세요.', [
          ['접수번호 다시 입력', 'transferCancelNumber'], ['상담사 연결', '$handoff'], ['다른 문의', '$menu']
        ]),
        transferCancelUnavailable: handoff('이미 완료·취소된 신청이나 입력·수납·완료 대기, 신용조회 예외 상태에서는 챗봇으로 취소하기 어려워요. 상담에서 진행 상태를 확인해 주세요.')
      }
    },
    11: {
      screens: {
        S01: { addActions: [
          ['서비스 대행업체 확인', '@41'], ['목록에 없는 제품', 'unlistedProduct']
        ] },
        S02: { items: [] },
        S04: { actions: [['상담사 연결', '$handoff'], ['운영시간 외 전화 상담', 'S07']] },
        S07: {
          message: '상담 운영시간 외에는 전화 상담을 예약하실 수 있어요.',
          actions: [['상담사 전화 예약', 'callback'], ['다른 문의', '$menu']]
        },
        unlistedProduct: field('제품군과 모델명을 입력해 주세요. 확인이 어려우면 제품을 다시 찾거나 상담에서 확인할 수 있어요.', ['product'], [
          ['제품 확인', '$identifyServiceProduct'], ['뒤로', 'S01']
        ]),
        customSymptom: field('어떤 증상인지 알려 주세요.', ['symptom'], [['증상 확인', '$symptom'], ['뒤로', '$symptom']]),
        callback: field('전화 상담을 받을 연락처를 입력해 주세요.', ['phone'], [
          ['예약 요청', 'callbackResult'], ['뒤로', 'S07']
        ]),
        callbackResult: result('전화 상담 예약 요청을 확인했어요.', close)
      }
    },
    12: {
      screens: {
        S01: { kind: 'choice', fields: [], items: [], message: '방문 서비스를 신청할 제품을 선택해 주세요.', actions: [
          ['정수기 선택', 'serviceSymptom'], ['목록에 없는 제품', 'unlistedProduct']
        ] },
        serviceSymptom: choice('제품에서 어떤 증상이 나타나는지 선택해 주세요.', []),
        unlistedProduct: field('서비스를 받을 제품명이나 모델명을 입력해 주세요.', ['product'], [
          ['제품 확인', '$identifyServiceProduct'], ['뒤로', 'S01']
        ]),
        customSymptom: field('접수할 증상을 알려 주세요.', ['symptom'], [['증상 확인', '$symptom'], ['뒤로', '$symptom']]),
        serviceModel: field('제품 라벨에서 모델명을 확인해 입력해 주세요.', [
          { label: '모델명', placeholder: '제품 모델명 입력', sample: 'WPU-1000' }
        ], [['다음', 'S02'], ['뒤로', 'serviceSymptom']]),
        serviceSafety: handoff('안전을 확인할 수 있도록 먼저 상담사에게 연결해 드릴까요?', [
          ['상담사 연결', '$handoff'], ['증상 다시 선택', '$symptom']
        ]),
        phoneConfirm: { auth: { success: 'serviceLookup', failure: 'S09' } },
        serviceLookup: { resolve: { default: 'S04', rules: [
          { target: 'S09', fields: ['휴대폰 번호'], match: '^010-?0000-?0002$' },
          { target: 'S03', fields: ['휴대폰 번호'], match: '^010-?0000-?0003$' },
          { target: 'S07', fields: ['휴대폰 번호'], match: '^010-?0000-?0007$' },
          { target: 'serviceCases', fields: ['휴대폰 번호'], match: '^010-?0000-?(1234|0006)$' }
        ] } },
        S03: { actions: [['기존 접수 확인', '@13'], ['새로 접수', 'serviceCases'], ['상담사 연결', '$handoff']] },
        S04: { actions: [['주소 검색', '$address'], ['다음', 'serviceAddressCheck']] },
        serviceAddressCheck: { resolve: { default: 'S05', rules: [{ ...unsupportedAddress, target: 'S08' }] } },
        S05: {
          items: [item('방문 비용', '유상 점검 시 출장점검비 30,000원에 수리·부품 비용이 추가될 수 있어요.')],
          actions: [...changedDates, ['접수 요청', 'S06']]
        },
        S06: { addActions: [['접수 내역 확인', '@13'], ['다른 문의', '$menu']] },
        regAddrPass: { auth: { failure: 'S09' }, actions: [['PASS 본인인증', 'serviceAddressOwner']] },
        serviceAddressOwner: { resolve: { default: 'S05', rules: [
          { target: 'serviceAddressMismatch', fields: ['휴대폰 번호'], match: '^010-?0000-?0006$' }
        ] } },
        serviceAddressMismatch: handoff('계약자와 제품 사용자가 다른 구독 제품의 새 주소는 상담사가 확인해요.'),
        serviceCases: choice('제품과 신청자 정보를 확인했어요. 방문 주소를 선택해 주세요.', [
          ['등록된 방문 주소', 'registeredServiceAddress'], ['새 주소', 'newServiceAddress']
        ], [item('등록 주소', '서울 영등포구 문래동')]),
        newServiceAddress: {
          resolve: { default: 'subscriptionAddress', rules: [
            { target: 'S04', fields: ['제품명 또는 모델명'], match: '^(일시불 구매 제품|미등록 제품)$' }
          ] }
        },
        registeredServiceAddress: field('등록 주소로 방문할 때 연락받을 전화번호를 입력해 주세요.', ['phone'], [
          ['가능한 날짜 확인', 'S05'], ['뒤로', 'serviceCases']
        ]),
        subscriptionAddress: field('구독 제품이 설치된 새 주소와 방문 당일 연락받을 번호를 입력해 주세요. 새 주소는 PASS 확인이 필요해요.', ['address', 'phone'], [
          ['다음', 'subscriptionAddressCheck'], ['뒤로', 'serviceCases']
        ]),
        subscriptionAddressCheck: { resolve: { default: 'regAddrPass', rules: [{ ...unsupportedAddress, target: 'subscriptionAddressUnavailable' }] } },
        subscriptionAddressUnavailable: notice('입력하신 주소로는 서비스를 접수하기 어려워요.', [
          ['주소 다시 입력', 'subscriptionAddress'], ['상담사 연결', '$handoff']
        ])
      }
    },
    13: {
      screens: {
        phoneConfirm: { auth: { success: 'visitLookup', failure: 'S07' } },
        visitLookup: { resolve: { default: 'S02', rules: [
          { target: 'S05', fields: ['휴대폰 번호'], match: '^010-?0000-?0000$' },
          { target: 'S07', fields: ['휴대폰 번호'], match: '^010-?0000-?0002$' },
          { target: 'S06', fields: ['휴대폰 번호'], match: '^010-?0000-?0003$' }
        ] } },
        S02: {
          message: '방문일이 가까운 접수부터 최대 5건을 확인할 수 있어요. 상세 정보를 볼 접수를 선택해 주세요.',
          actions: [
            ['직수 정수기 접수 선택', 'S03'], ['비데 재설치 접수 선택', 'S04']
          ],
          items: [
            item('직수 정수기 · AS', '출수 안 됨 · 11월 27일(금)'),
            item('비데 · 재설치', '재설치 접수 · 12월 2일(수)')
          ]
        },
        S03: { items: [
          item('접수번호', 'AS-261125-001'), item('접수 증상', '정수 출수 안 됨'), item('방문 예정일', '2026년 11월 27일(금)'),
          item('담당 매니저', '방문 담당 매니저'), item('방문 연락처', '010-••••-1234'), item('방문 주소', '서울 영등포구 문래동')
        ] },
        S04: { items: [
          item('접수번호', 'ES-261125-002'), item('서비스 종류', '비데 재설치'), item('방문 예정일', '2026년 12월 2일(수)'), item('담당 매니저', '방문 담당 매니저'),
          item('방문 연락처', '010-••••-1234'), item('방문 주소', '서울 영등포구 문래동')
        ] },
        S06: { addActions: [['AS 방문 접수', '@12'], ['다른 문의', '$menu']] },
      }
    },
    14: {
      screens: {
        phoneConfirm: { auth: { success: 'visitLookup', failure: 'S11' } },
        visitLookup: { resolve: { default: 'S01', rules: [
          { target: 'missingCustomer', fields: ['휴대폰 번호'], match: '^010-?0000-?0000$' },
          { target: 'S11', fields: ['휴대폰 번호'], match: '^010-?0000-?0002$' },
          { target: 'S09', fields: ['휴대폰 번호'], match: '^010-?0000-?0003$' }
        ] } },
        S01: {
          message: '방문일이 가까운 미처리 접수를 최대 5건까지 보여드려요. 수정할 접수를 선택해 주세요.',
          actions: [['직수 정수기 접수 선택', '$visitChange'], ['비데 재설치 접수 선택', '$visitChange']]
        },
        S02: { actions: [
          ['방문주소', '$changeVisitAddress'], ['방문예정일', 'moveDateForChange'], ['접수 증상', '$editSymptom'], ['방문 연락처', '$editPhone']
        ] },
        S03: { actions: [['주소 검색', '$address'], ['변경 요청', 'visitAddressCheck'],
          ['예약일을 변경해 계속하기', 'visitAddressDateCheck'], ['나가기', 'S02']] },
        visitAddressCheck: { resolve: { default: 'S10', rules: [{ ...unsupportedAddress, target: 'S08' }] } },
        visitAddressDateCheck: { resolve: { default: 'moveDateForChange', rules: [{ ...unsupportedAddress, target: 'S08' }] } },
        S04: { actions: [...changedDates, ['변경 요청', 'S10']] },
        S09: { addActions: [['AS 방문 접수', '@12'], ['다른 문의', '$menu']] },
        moveDateForChange: field('이사와 관련된 방문이면 이사 예정일을 입력해 주세요.', [
          { label: '이사 예정일', placeholder: 'YYYY-MM-DD', type: 'date', sample: '2026-11-30', required: false }
        ], [['다음', 'S04'], ['뒤로', 'S02']]),
        editSymptomPicker: choice('변경할 접수 증상의 분류를 선택해 주세요.', []),
        customSymptom: field('변경할 증상을 입력해 주세요.', ['symptom'], [['증상 확인', '$symptom'], ['뒤로', '$symptom']]),
        editSymptomConfirm: choice('선택한 증상으로 변경할까요?', [['변경 요청', 'S10'], ['다시 선택', '$symptom']]),
        missingCustomer: noMatch('phoneInput')
      }
    },
    15: {
      screens: {
        phoneConfirm: { auth: { success: 'visitLookup', failure: 'S08' } },
        visitLookup: { resolve: { default: 'S02', rules: [
          { target: 'missingCustomer', fields: ['휴대폰 번호'], match: '^010-?0000-?0000$' },
          { target: 'S08', fields: ['휴대폰 번호'], match: '^010-?0000-?0002$' },
          { target: 'S06', fields: ['휴대폰 번호'], match: '^010-?0000-?0003$' }
        ] } },
        S02: {
          message: '방문일이 가까운 미처리 접수를 최대 5건까지 보여드려요. 취소할 접수를 선택해 주세요.',
          actions: [['직수 정수기 접수 선택', '$visitCancel'], ['비데 재설치 접수 선택', '$visitCancel']]
        },
        S05: { addActions: [['접수 내역 확인', '@13'], ['상담 종료', '$finish']] },
        missingCustomer: noMatch('S01')
      }
    },
    16: {
      screens: {
        S01: { message: '배송·설치 주문을 확인하려면 휴대폰 인증이 필요해요.' },
        deliveryBusinessInput: field('개인사업자 주문을 조회할 신청자 정보와 사업자등록번호를 입력해 주세요.', [
          'name', 'phone', businessRegistrationNumber
        ], [['인증번호 받기', '$sendOtp']], { secure: true }),
        phoneConfirm: { auth: { success: 'deliveryLookup', failure: 'S06' } },
        deliveryLookup: { resolve: { default: 'S02', rules: [
          { target: 'S04', fields: ['휴대폰 번호'], match: '^010-?0000-?0000$' },
          { target: 'S05', fields: ['휴대폰 번호'], match: '^010-?0000-?0002$' },
          { target: 'pending5', fields: ['휴대폰 번호'], match: '^010-?0000-?0005$' }
        ] } },
        S03: {
          message: '선택하신 주문의 배송·설치 정보예요. 방문 시간은 설치마스터가 방문 당일 오전 10시 전에 연락해 조율해요.',
          items: [
            item('제품명·주문번호', '직수 정수기 · DL-261125-001'),
            item('수령인·연락처', '김○○ · 010-••••-1234'),
            item('배송 예정일', '2026년 11월 30일(월)'),
            item('배송지', '서울 영등포구 문래동'),
            item('주문 상태·판매 유형', '납품대기 · 일시불')
          ],
          addActions: [['배송 주소·일정 변경 문의', '@17']]
        },
      }
    },
    17: {
      screens: {
        S01: { message: '배송 주문을 변경하려면 휴대폰 인증이 필요해요.' },
        deliveryBusinessInput: field('개인사업자 주문을 조회할 신청자 정보와 사업자등록번호를 입력해 주세요.', [
          'name', 'phone', businessRegistrationNumber
        ], [['인증번호 받기', '$sendOtp']], { secure: true }),
        S02: {
          message: '변경할 주문을 선택해 주세요. 주문의 판매 유형과 진행 상태에 따라 처리 방법이 달라요.',
          actions: [
            ['직수 정수기 주문 선택', '$deliveryOrder']
          ],
          items: [item('직수 정수기 · DL-261125-001', '일시불 · 납품대기 · 11월 30일(월)')]
        },
        phoneConfirm: { auth: { success: 'deliveryLookup', failure: 'S10' } },
        deliveryLookup: { resolve: { default: 'S02', rules: [
          { target: 'S11', fields: ['휴대폰 번호'], match: '^010-?0000-?0000$' },
          { target: 'S10', fields: ['휴대폰 번호'], match: '^010-?0000-?0002$' },
          { target: 'pending5', fields: ['휴대폰 번호'], match: '^010-?0000-?0005$' }
        ] } },
        S03: { actions: [['배송주소 수정', 'S04'], ['배송일정 수정', 'requestedDeliveryDate'], ['설치마스터 전달', 'S06']] },
        S04: { actions: [['주소 검색', '$address'], ['주소 확인', 'deliveryAddressCheck'], ['나가기', 'S03']] },
        deliveryAddressCheck: { resolve: { default: 'deliveryAddressSchedule', rules: [
          { ...unsupportedAddress, target: 'S09' }
        ] } },
        deliveryAddressSchedule: choice('변경한 주소에 기존 배송일을 유지할까요?', [
          ['기존 배송일 유지', 'S07'], ['배송일도 변경', 'requestedDeliveryDate']
        ]),
        requestedDeliveryDate: field('희망 배송일을 입력해 주세요. 가까운 배송 가능일을 확인할게요.', [
          { label: '희망 배송일', placeholder: 'YYYY-MM-DD', type: 'date', sample: '2026-12-02' }
        ], [['배송 가능일 확인', 'S05'], ['뒤로', 'S03']]),
        S05: {
          actions: [
            ['12월 2일(수) 선택', '$date'], ['더보기', '$moreDates'], ['변경 요청', 'S07']
          ]
        },
        S06: {
          message: '설치마스터에게 전달할 내용을 입력해 주세요. 납품대기 주문이면 배송 메모에 요청 내용을 기록해요.'
        },
        S08: {
          message: '배송 요청 내용을 확인했어요. 주문의 진행 상태에 따라 배송 메모에 기록하거나 설치마스터가 확인하는 요청이에요.'
        },
        subscriptionOrder: choice('구독 주문의 배송주소는 구독 주문처에 변경을 요청해 주세요. 배송일 문의나 설치 요청 전달을 계속할 수 있어요.', [
          ['배송주소 변경 안내', 'subscriptionAddress'], ['배송일정 수정 문의', 'requestedDeliveryDate'], ['설치마스터 전달', 'S06'], ['다른 문의', '$menu']
        ]),
        subscriptionAddress: result('구독 신청처에 배송주소 변경을 요청해 주세요. 주문처에서 변경 가능 여부와 새 설치 일정을 확인해요.', [
          ['뒤로', 'subscriptionOrder'], ['다른 문의', '$menu']
        ]),
        createdOrder: choice('납품생성 또는 출고 상태의 주문은 설치마스터를 통해 변경 가능 여부와 일정을 확인해요.', [
          ['배송주소 수정 요청', 'dispatchAddress'], ['배송일정 변경 요청', 'dispatchDate'], ['설치마스터 전달', 'dispatchRequest'],
          ['뒤로', 'S02']
        ]),
        dispatchAddress: field('설치마스터에게 전달할 새 배송 주소를 입력해 주세요.', ['address'], [
          ['주소 변경 요청 전달', 'dispatchResult'], ['뒤로', 'createdOrder']
        ]),
        dispatchDate: field('설치마스터에게 전달할 희망 배송일을 입력해 주세요.', [
          { label: '희망 배송일', placeholder: 'YYYY-MM-DD', type: 'date', sample: '2026-12-02' }
        ], [['일정 변경 요청 전달', 'dispatchResult'], ['뒤로', 'createdOrder']]),
        dispatchRequest: field('설치마스터에게 전달할 요청 내용을 입력해 주세요.', ['description'], [
          ['전달 요청 확인', 'dispatchResult'], ['뒤로', 'createdOrder']
        ]),
        dispatchResult: result('전달 요청을 확인했어요. 납품생성·출고 주문의 변경 결과는 설치마스터가 안내해요.', [
          ['다른 주문 선택', 'S02'], ['상담 종료', '$finish']
        ], [item('주문 상태', '납품생성·출고'), item('처리 경로', '설치마스터 확인')])
      }
    }
  });
})();



(() => {
  'use strict';
  const overlays = window.SKIX_FLOW_OVERLAYS;
  const item = (title, detail) => ({ title, detail });
  const date = (label, sample) => ({ label, placeholder: '날짜 선택', type: 'date', sample });
  for (const no of [4, 5]) {
    const screens = overlays[no].screens;
    screens.eligibleInstallments = {
      kind: 'choice',
      message: '5만원 이상 카드 납부는 할부를 선택할 수 있어요. 원하는 할부 기간을 선택해 주세요. 실제 선택 가능한 개월 수와 수수료는 카드사에 따라 달라요.',
      items: [item('납부 금액', '[납부 금액]')],
      actions: [['일시불', '$installmentIssuerPicker'], ['2개월 할부', '$installmentIssuerPicker'], ['3개월 할부', '$installmentIssuerPicker'], ['뒤로', 'receiptPaymentMethods']]
    };
    screens.installmentCard = {
      kind: 'input', message: '카드의 정보를 입력한 뒤 PASS에서 본인 확인을 진행해 주세요.', secure: true,
      fields: (no === 4 ? screens.S04 : screens.S05).fields,
      items: [item('할부 기간', '[할부 기간]'), item('납부 금액', '[납부 금액]')],
      actions: [['PASS 본인인증', 'installmentResult'], ['뒤로', 'eligibleInstallments']],
      auth: { failure: 'S09' }
    };
    screens.installmentResult = {
      kind: 'result', message: '카드 납부 내역을 확인해 주세요.',
      items: [item('처리 상태', '납부 완료'), item('할부 기간', '[할부 기간]'), item('납부 금액', '[납부 금액]')],
      actions: [['다른 문의', '$menu'], ['상담 종료', '$finish']]
    };
  }
  overlays[6].screens.S04 = { addActions: [['제휴카드 이용 안내', 'S01'], ['알림톡으로 안내 받기', 'partnerNotification']] };
  overlays[6].screens.partnerNotification = {
    kind: 'input', message: '제휴카드 안내를 받으실 휴대폰 번호를 입력해 주세요.',
    fields: ['phone'], actions: [['수신 확인', 'partnerNotificationResult'], ['뒤로', 'S04']]
  };
  overlays[6].screens.partnerNotificationResult = {
    kind: 'result', message: '제휴카드 안내를 받을 번호를 확인했어요.',
    actions: [['공식 제휴카드 보기', 'S02'], ['다른 문의', '$menu']]
  };
  for (const no of [8, 9]) {
    const screens = overlays[no].screens;
    screens.S02.actions[0][1] = 'moveStatus';
    screens.S03.actions[1][1] = 'moveStatus';
    screens.moveStatus = {
      kind: 'choice', message: '이사 또는 제품 이동은 어느 단계인가요?',
      actions: [['이사 예정', 'moveDateInput'], ['이사·이동 완료', 'addressOptions'], ['기타 · 공사 등', 'addressOptions']]
    };
    screens.moveDateInput = {
      kind: 'input',
      message: no === 8 ? '이사 예정일을 입력해 주세요. 그 전날까지 분리 방문이 가능해요.'
        : '이사 예정일을 입력해 주세요. 재설치 방문은 이사 예정일의 다음 영업일부터 확인할 수 있어요.',
      fields: [date('이사 예정일', '2026-11-30')], actions: [['다음', 'addressOptions'], ['뒤로', 'moveStatus']]
    };
    if (no === 9) {
      screens.valveOption = {
        kind: 'choice', message: '재설치할 정수기에 조리수 밸브도 설치할까요? 추가 설치 비용은 제품과 현장 환경에 따라 달라질 수 있어요.',
        actions: [['조리수 밸브 포함', 'S05'], ['기본 재설치만', 'S05']]
      };
    }
    screens.pairSplitAddress.validate = { dateOrder: [['분리 방문 희망일', '이사 예정일']] };
  }
  overlays[12].screens.S01.addActions = [['긴급 증상 안내', 'urgentCase']];
  overlays[12].screens.urgentCase = {
    kind: 'handoff', message: '빠른 확인이 필요한 증상은 상담사 안내를 이용해 주세요. 상담 운영시간 외에는 연결이 어려울 수 있어요.',
    actions: [['상담사 연결', '$handoff'], ['전화 상담 예약 안내', '@11'], ['뒤로', 'S01']]
  };
})();




(() => {
  'use strict';
  const overlays = window.SKIX_FLOW_OVERLAYS;
  const item = (title, detail) => ({ title, detail });
  const contracts = overlays[7].screens;
  const packages = [
    { from: 'packageEstimate', id: 'packageDate', result: 'packageResult', label: '패키지 묶음', total: '149,000원', scope: '묶음에 포함된 계약 2건' },
    { from: 'crossPackageEstimate', id: 'crossPackageDate', result: 'crossPackageResult', label: '크로스 패키지 묶음', total: '169,000원', scope: '묶음에 포함된 계약 2건' },
    { from: 'packageSingleNotice', id: 'packageSingleDate', result: 'packageSingleResult', label: '비데', total: '69,000원', scope: '선택한 계약 1건', effect: '연결된 직수 정수기 구독료 월 26,900원 → 29,900원' },
    { from: 'crossSingleNotice', id: 'crossSingleDate', result: 'crossSingleResult', label: '공기청정기', total: '79,000원', scope: '선택한 계약 1건', effect: '연결된 직수 정수기 구독료 월 24,900원 → 29,900원' }
  ];
  for (const { from, id, result, label, total, scope, effect } of packages) {
    contracts[from].actions[0][1] = id;
    contracts[id] = {
      kind: 'input', message: label + '의 해약 예정일을 선택해 주세요. 신청일에 따라 실제 위약금이 달라질 수 있어요.',
      fields: ['date'], actions: [[effect ? '예상 위약금 확인' : '합산 위약금 확인', result], ['뒤로', from]]
    };
    contracts[result] = {
      kind: 'result', message: '선택한 해약 예정일을 기준으로 계산한 ' + label + '의 예상 위약금이에요.',
      items: [item('조회 기준일', '11월 30일'), item(effect ? '예상 위약금' : '예상 위약금 합계', total), item('계산 범위', scope),
        ...(effect ? [item('다른 계약 구독료 변경', effect)] : [])],
      actions: [['다른 계약 확인', 'S04'], ['위약금 내역서 안내', '@20'], ['다른 문의', '$menu']]
    };
  }
  for (const no of [4, 5]) {
    const screens = overlays[no].screens;
    const transfer = no === 4 ? 'S05' : 'S05T';
    screens.receiptPaymentMethods = {
      kind: 'choice',
      message: '납부 방법을 선택해 주세요. 이 개인사업자 계약은 실시간 계좌이체 또는 가상계좌를 이용할 때 현금영수증을 신청할 수 있어요.',
      actions: [['카드', '$issuerPicker'], ['실시간 계좌이체', 'receiptTransfer'], ['가상계좌', 'receiptVirtual'], ['뒤로', '$paymentOptions']]
    };
    const receiptChoice = (yes, no) => [['현금영수증 신청', yes], ['신청 안 함', no], ['뒤로', 'receiptPaymentMethods']];
    screens.receiptTransfer = { kind: 'choice', message: '실시간 계좌이체 납부에 현금영수증을 발행할까요?', actions: receiptChoice('receiptTransferSummary', transfer) };
    screens.receiptVirtual = { kind: 'choice', message: '가상계좌 납부에 현금영수증을 발행할까요?', actions: receiptChoice('receiptVirtualSummary', 'S06') };
    screens.receiptTransferSummary = {
      kind: 'result', message: '계약자 명의로 현금영수증을 신청할 수 있어요. 계좌 정보를 입력해 계속 진행해 주세요.',
      actions: [['실시간 계좌이체 진행', transfer], ['뒤로', 'receiptTransfer']]
    };
    screens.receiptVirtualSummary = {
      kind: 'result', message: '계약자 명의로 현금영수증을 신청할 수 있어요. 가상계좌 발급 단계를 계속 진행해 주세요.',
      actions: [['가상계좌 발급 안내', 'S06'], ['뒤로', 'receiptVirtual']]
    };
  }
})();
