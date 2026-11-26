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
  const bank = { label: '은행', placeholder: '은행 선택', sample: 'KB국민은행', options: [
    'KB국민은행', '신한은행', '우리은행', '하나은행', 'NH농협은행', 'IBK기업은행'
  ] };
  const account = { label: '계좌번호', placeholder: '계좌번호 입력', type: 'password', sample: '000000001234' };
  const birthday = { label: '생년월일', placeholder: 'YYMMDD', type: 'password', sample: '900101' };
  const transferFields = [bank, account, birthday];
  const cardFields = [
    { label: '카드번호', placeholder: '숫자 15~16자리', type: 'password', sample: '0000000000001234' },
    { label: '유효기간', placeholder: 'MM / YY', type: 'password', sample: '12 / 30' },
    birthday
  ];
  const paymentMethods = (transfer, virtual) => choice(
    '어떤 방법으로 납부할까요? 카드와 실시간 계좌이체는 본인 명의의 수단만 사용할 수 있어요.',
    [['카드', '$issuerPicker'], ['실시간 계좌이체', transfer], ['가상계좌', virtual], ['뒤로', '$paymentOptions']],
    [item('납부 금액', '[납부 금액]')]
  );
  const invoiceWarning = '출금이 이미 요청된 요금은 등록한 계좌나 카드에서 한 번 더 결제될 수 있어요.';
  const paymentStatus = [
    ['결제정보 변경', '@3'], ['미납요금 조회', '@5'], ['상담사 연결', '$handoff'], ['다른 문의', '$menu']
  ];
  const paymentSchedule = [item('이체·결제 예정일', '매월 25일')];
  const waterPayment = {
    target: '직수 정수기 · WPU-1000', amount: '29,900원', method: '신용카드 자동납부 · 신한카드 · 끝자리 1234'
  };
  const bidetPayment = {
    target: '비데 · BID-1000', amount: '16,900원', method: '네이버페이 정기결제'
  };
  const paidResultItems = ({ target, amount, method }) => [
    item('당월 납부 상태', '납부 완료'), item('납부 대상', target), item('납부 금액', amount), item('납부 방법', method)
  ];
  const currentMonthApplication = '이번 달부터 변경한 결제정보로 결제돼요. 오늘 결제내역은 반영까지 시간이 걸릴 수 있어요. 정확한 납부 결과는 다음 날 확인할 수 있고, 변경 시점에 따라 제휴카드 혜택이 적용되지 않을 수 있어요.';
  const contractedProduct = (name, code, method, masked, start, end, months, monthly, overdue, paid) => [
    item(name, `제품코드 ${code}\n사용자 주소 서울 영등포구 문래동`),
    item('결제정보', `출금유형 ${method}\n${masked}\n이체일·결제일 매월 25일`),
    item('계약기간', `계약일 ${start}\n계약종료일 ${end}\n의무사용기간 36개월\n전체계약기간 60개월\n사용개월수 ${months}개월`),
    item('청구·납부', `구독료 월 ${monthly}\n미납금(당월 미포함) ${overdue}\n당월 요금 납부 여부 ${paid ? '납부 완료' : '납부 미완료'}`)
  ];
  const waterDetails = (overdue = '0원', paid = true) => contractedProduct('직수 정수기', 'WPU-1000', '신용카드 자동납부',
    '신한카드 · ••••-••••-••••-1234', '2025.06.01', '2030.05.31', 17, waterPayment.amount, overdue, paid);
  const airDetails = () => contractedProduct('공기청정기', 'ACL-1000', '계좌 자동이체',
    'KB국민은행 · ••••-••••-4321', '2025.09.01', '2030.08.31', 14, '19,900원', '59,700원', false);
  const dishwasherDetails = () => contractedProduct('식기세척기', 'DWA-1000', '계좌 자동이체',
    'KB국민은행 · ••••-••••-4321', '2025.07.01', '2030.06.30', 16, '24,900원', '24,900원', false);
  const paymentUnavailable = (returnTo) => notice('일치하는 계약을 찾지 못했어요. 설치 전이나 설치 당일에는 계약이 조회되지 않을 수 있어요.', [
    ['다시 조회하기', returnTo], ['상담사 연결', '$handoff'], ['다른 문의', '$menu']
  ]);
  const resolved = (fallback, rules = []) => ({ resolve: { default: fallback, rules } });
  const today = new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul' }).format(new Date());
  const paymentDay = Number(today.slice(-2));
  const penaltyDate = { label: '해약접수 예정일', type: 'date', sample: today, required: false };
  const choosePayment = (registered, oneTime) => [['등록 결제수단', registered], ['일회성 납부수단', oneTime], ['나가기', '$finish']];
  const platformPayment = (list, overdueCycles) => {
    const needsRegistration = overdueCycles >= 3;
    return {
      ...notice(needsRegistration
        ? '네이버를 통해 구독 신청하신 경우 미납금 납부 전 결제정보 등록이 필요해요.'
        : '네이버를 통해 구독 신청하신 경우 네이버에서 납부해 주세요.', [
        ...(needsRegistration ? [['결제정보 등록', '@3']] : []), ['목록으로', list], ['다른 문의', '$menu']
      ]),
      naverRegistrationRequired: needsRegistration
    };
  };
  const individualReceiptNotice = (next) => choice('납부하면 고객님의 등록된 휴대폰 번호로 현금영수증이 자동 발급돼요.', [
    ['납부 진행하기', next], ['뒤로', 'oneTimeMethods']
  ]);

  Object.assign(window.SKIX_FLOW_OVERLAYS ??= {}, {
    1: {
      screens: {
        S01: { actions: [['PASS 본인인증', 'exampleLookup']], auth: { failure: 'S08' } },
        S02: { actions: [['직수 정수기 선택', 'paymentPurpose'], ['공기청정기 선택', 'airPaymentPurpose']] },
        S03: { items: waterDetails('0원', paymentDay >= 25), addActions: [['당월 납부 결과 확인', 'waterPaymentStatus'], ['구독료 입금 내역 확인', '@39'], ['다른 계약 확인', 'S02']] },
        S04: {
          actions: [['구독료 입금 내역 확인', '@39'], ['다른 계약 확인', 'S02'], ['다른 문의', '$menu']],
          items: paidResultItems(waterPayment)
        },
        S05: { actions: [...paymentStatus, ['다른 계약 확인', 'S02']], items: paymentSchedule },
        S06: { actions: [...paymentStatus, ['다른 계약 확인', 'S02']], items: paymentSchedule },
        S07: paymentUnavailable('S01'),
        S08: { actions: [['PASS 본인인증', 'exampleLookup']], auth: { failure: 'S09' } },
        exampleLookup: resolved('S02'),
        noCustomer: notice('일치하는 고객 정보를 확인하지 못했어요.', [['PASS 본인인증 다시 시도', 'exampleLookup'], ['상담사 연결', '$handoff']]),
        payerDenied: handoff('결제 정보는 계약자 본인에게 안내해 드려요. 납부자가 계약자와 다른 경우 상담에서 확인해 주세요.'),
        paymentPurpose: choice('직수 정수기의 어떤 결제 정보를 확인할까요?', [['결제정보 상세 조회', 'S03'], ['당월 납부 결과', 'waterPaymentStatus']]),
        airPaymentPurpose: choice('공기청정기의 어떤 결제 정보를 확인할까요?', [['결제정보 상세 조회', 'airPaymentDetails'], ['당월 납부 결과', 'airPaymentStatus']]),
        airPaymentDetails: result('선택하신 공기청정기 계약의 결제정보예요.', [
          ['결제정보 변경', '@3'], ['위약금 문의', '@7'], ['당월 납부 결과 확인', 'airPaymentStatus'], ['다른 계약 확인', 'S02']
        ], airDetails()),
        airPaymentStatus: resolved('@5'),
        waterPaymentStatus: resolved(paymentDay < 25 ? 'paymentBefore' : 'S04'),
        paymentBefore: result('아직 이번 달 결제일 전이라 당월 요금이 납부되지 않았어요.', [
          ['다른 계약 확인', 'S02'], ['추가 문의', '$menu'], ['상담 종료', '$finish']
        ], paymentSchedule)
      }
    },
    2: {
      screens: {
        S01: { actions: [['PASS 본인인증', 'exampleLookup']], auth: { failure: 'S06' } },
        S02: {
          actions: [['직수 정수기 선택', 'S03'], ['공기청정기 선택', 'S04']],
          items: [item('직수 정수기', 'WPU-1000 · 문래동 · 월 29,900원'), item('공기청정기', 'ACL-1000 · 문래동 · 월 19,900원')]
        },
        S03: {
          addActions: [['다른 계약 확인', 'S02']],
          items: [...waterDetails('0원', paymentDay >= 25), ...(paymentDay >= 25 ? paidResultItems(waterPayment) : [])]
        },
        S04: { message: '선택하신 공기청정기의 구독료와 지난달까지의 미납금이에요.', addActions: [['다른 계약 확인', 'S02']], items: airDetails() },
        S05: paymentUnavailable('S01'),
        S06: { actions: [['PASS 본인인증', 'exampleLookup']], auth: { failure: 'S07' } },
        exampleLookup: resolved('S02'),
      }
    },
    3: {
      screens: {
        S01: { actions: [['PASS 본인인증', 'changeContract']], auth: { failure: 'S07' } },
        S02: {
          message: '결제정보를 변경하면 동일한 묶음 번호의 상품 전체에 적용돼요. 결제정보를 일괄 변경하시겠어요?',
          actions: [['일괄 변경', 'S03'], ['아니오 · 상담사 연결', '$handoff'], ['다른 계약 확인', 'changeContract']]
        },
        S03: { message: '등록할 납부수단을 선택해 주세요. 본인 명의의 결제수단만 등록할 수 있어요.' },
        S04: { fields: cardFields },
        S05: { fields: transferFields },
        S08: {
          message: '신청하신 정보로 결제수단 변경을 처리했어요.',
          actions: [['다른 계약 변경', 'changeContract'], ['다른 문의', '$menu']]
        },
        changeContract: choice('변경할 계약을 선택해 주세요.', [
          ['직수 정수기 선택', 'ordinaryPaymentDetails'], ['공기청정기 선택', 'airPaymentDetails'],
          ['정수기·공기청정기 묶음 선택', 'bundlePaymentDetails'], ['비데 선택', 'naverContract'],
          ['식기세척기 선택', 'dishwasherPaymentDetails']
        ], [
          item('직수 정수기', 'WPU-1000 · 개별 결제 · 신한카드'),
          item('공기청정기', 'ACL-1000 · 개별 결제 · KB국민은행'),
          item('정수기·공기청정기 묶음', '묶음 결제 · 대표 계약 결제일 매월 25일'),
          item('비데', 'BID-1000 · 네이버 구독'),
          item('식기세척기', 'DWA-1000 · 개별 결제 · KB국민은행')
        ]),
        ordinaryPaymentDetails: result('직수 정수기에 등록된 결제정보를 확인해 주세요.', [
          ['결제정보 변경', paymentDay >= 25 ? 'applyNextMonth' : 'applyThisMonthSingle'], ['위약금 조회', '@7'], ['다른 계약 확인', 'changeContract']
        ], waterDetails('0원', paymentDay >= 25)),
        airPaymentDetails: result('선택하신 공기청정기에 등록된 결제정보를 확인해 주세요.', [
          ['결제정보 변경', 'applyThisMonthSingle'], ['위약금 조회', '@7'], ['다른 계약 확인', 'changeContract']
        ], airDetails()),
        dishwasherPaymentDetails: result('선택하신 식기세척기에 등록된 결제정보를 확인해 주세요.', [
          ['결제정보 변경', 'applyThisMonthSingle'], ['다른 계약 확인', 'changeContract']
        ], dishwasherDetails()),
        bundlePaymentDetails: result('묶음 계약에 등록된 결제정보를 확인해 주세요.', [
          ['결제정보 변경', 'applyThisMonth'], ['위약금 조회', '@7'], ['다른 계약 확인', 'changeContract']
        ], [...airDetails(), item('결제 적용 범위', '같은 묶음 번호의 상품 전체')]),
        applyNextMonth: choice('이번 달 요금을 이미 납부하셔서 다음 달부터 변경한 결제정보로 결제돼요.', [
          ['결제정보 변경 진행', 'S03'], ['다른 계약 확인', 'changeContract']
        ]),
        applyThisMonth: choice(currentMonthApplication, [
          ['결제정보 변경 진행', 'S02'], ['다른 계약 확인', 'changeContract']
        ]),
        applyThisMonthSingle: choice(currentMonthApplication, [
          ['결제정보 변경 진행', 'S03'], ['다른 계약 확인', 'changeContract']
        ]),
        naverArrearsApplication: choice(currentMonthApplication, [
          ['결제정보 변경 진행', 'S03'], ['다른 계약 확인', 'changeContract']
        ], [item('대상 계약', '매트리스 · MAT-2000 · 네이버 구독')]),
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
        S04: { fields: cardFields, items: [item('할부 기간', '일시불'), item('납부 금액', '[납부 금액]')] },
        S05: { fields: transferFields, items: [item('납부 금액', '[납부 금액]')] },
        S06: { message: '가상계좌를 발급받을 은행을 선택하고 안내를 받을 휴대폰 번호를 입력해 주세요.', fields: [bank, 'phone'], items: [item('납부 금액', '[납부 금액]')] },
        S07: { message: '[납부 금액]이 납부됐어요. 아래에서 처리 결과를 확인해 주세요.', items: [item('처리 상태', '납부 완료'), item('납부 금액', '[납부 금액]')], actions: [['다른 계약 보기', 'chargeContract'], ['다른 문의', '$menu']] },
        S07V: { actions: [['다른 계약 보기', 'chargeContract'], ['다른 문의', '$menu']] },
        S09: { actions: [['다른 계약 보기', 'chargeContract'], ['상담사 연결', '$handoff'], ['다른 문의', '$menu']] },
        chargeContract: choice('납부할 계약을 선택해 주세요.', [
          ['직수 정수기 선택', 'chargeDetails'], ['공기청정기 선택', 'paymentScope'], ['비데 선택', 'chargePaid'], ['매트리스 선택', 'naverPayment']
        ], [item('직수 정수기', 'WPU-1000 · 문래동 · 월 29,900원'), item('공기청정기', 'ACL-1000 · 문래동 · 월 19,900원'), item('비데', 'BID-1000 · 문래동 · 당월 납부 완료'), item('매트리스', 'MAT-1000 · 문래동 · 네이버 구독')]),
        chargeDetails: result('직수 정수기의 이번 달 요금이 아직 납부되지 않았어요.', [
          ['요금 납부', 'S02'], ['결제정보 변경', '@3'], ['위약금 조회', '@7'], ['다른 계약 확인', 'chargeContract']
        ], waterDetails('0원', false)),
        paymentScope: choice('공기청정기의 지난 미납요금과 이번 달 요금이 남아 있어요. 납부할 범위를 선택해 주세요.', [
          ['미납요금만 납부', 'chargePast'], ['미납요금과 당월 요금 납부', 'chargeCombined'], ['다른 계약 확인', 'chargeContract']
        ], [item('미납요금만 납부', '59,700원'), item('미납요금과 당월 요금 납부', '79,600원')]),
        chargePast: { ...choice('계약의 지난 미납요금 전체를 납부해요. ' + invoiceWarning, choosePayment('$savedPicker', 'receiptPaymentMethods'), [item('납부 금액', '[납부 금액]')]), paymentAmount: 59700, registeredPayment: 'account' },
        chargeCombined: { ...choice('지난 미납요금과 이번 달 요금을 함께 납부해요. ' + invoiceWarning, choosePayment('$savedPicker', 'receiptPaymentMethods'), [item('납부 금액', '[납부 금액]')]), paymentAmount: 79600, registeredPayment: 'account' },
        chargePaid: result('비데의 이번 달 요금은 이미 납부됐어요.', [
          ['결제정보 변경', '@3'], ['위약금 조회', '@7'], ['다른 계약 확인', 'chargeContract']
        ], paidResultItems(bidetPayment)),
        naverPayment: platformPayment('chargeContract', 2),
        chargeNotFound: paymentUnavailable('S01'),
        oneTimeMethods: paymentMethods('personalTransferReceipt', 'personalVirtualReceipt'),
        personalTransferReceipt: individualReceiptNotice('S05'),
        personalVirtualReceipt: individualReceiptNotice('S06')
      }
    },
    5: {
      screens: {
        S01: { actions: [['PASS 본인인증', 'arrearsContract']], auth: { failure: 'S09' } },
        S02: { addActions: [['결제정보 변경', '@3'], ['다른 계약 확인', 'arrearsContract']], items: waterDetails('29,900원', false) },
        S03: {
          addActions: [['결제정보 변경', '@3'], ['다른 계약 확인', 'arrearsContract']],
          items: [item('조회 대상', '비데 · BID-1000'), item('미납금(당월 미포함)', '0원')]
        },
        S04: {
          message: '계약 건별 미납요금 전체를 납부할 수 있어요. ' + invoiceWarning,
          paymentAmount: 29900,
          actions: choosePayment('$savedPicker', 'oneTimeMethods')
        },
        S05: { fields: cardFields, items: [item('할부 기간', '일시불'), item('납부 금액', '[납부 금액]')] },
        S05T: { fields: transferFields, items: [item('납부 금액', '[납부 금액]')] },
        S06: { message: '가상계좌를 발급받을 은행을 선택하고 안내를 받을 휴대폰 번호를 입력해 주세요.', fields: [bank, 'phone'], items: [item('납부 금액', '[납부 금액]')] },
        S07: { message: '미납요금 [납부 금액]이 납부됐어요.', items: [item('처리 상태', '납부 완료'), item('납부 금액', '[납부 금액]')], actions: [['다른 계약 보기', 'arrearsContract'], ['다른 문의', '$menu']] },
        S08: { actions: [['다른 계약 보기', 'arrearsContract'], ['다른 문의', '$menu']] },
        S09: { actions: [['다른 계약 보기', 'arrearsContract'], ['상담사 연결', '$handoff'], ['다른 문의', '$menu']] },
        arrearsContract: choice('미납요금을 조회할 계약을 선택해 주세요.', [
          ['직수 정수기 선택', 'S02'], ['공기청정기 선택', 'airArrears'], ['비데 선택', 'S03'],
          ['매트리스 선택', 'naverPayment'], ['식기세척기 선택', 'dishwasherArrears']
        ], [item('직수 정수기', 'WPU-1000 · 문래동 · 29,900원 (당월 미포함)'),
          item('공기청정기', 'ACL-1000 · 문래동 · 59,700원 (당월 미포함)'), item('비데', 'BID-1000 · 문래동 · 0원 (당월 미포함)'),
          item('매트리스', 'MAT-2000 · 문래동 · 네이버 구독'), item('식기세척기', 'DWA-1000 · 문래동 · 24,900원 (당월 미포함)')]),
        airArrears: result('공기청정기의 지난달까지 미납요금을 확인했어요.', [
          ['미납금 납부', 'highArrearsPayment'], ['결제정보 변경', '@3'], ['다른 계약 확인', 'arrearsContract']
        ], airDetails()),
        dishwasherArrears: result('식기세척기의 지난달까지 미납요금을 확인했어요.', [
          ['미납금 납부', 'registeredAccountArrears'], ['결제정보 변경', '@3'], ['다른 계약 확인', 'arrearsContract']
        ], dishwasherDetails()),
        registeredAccountArrears: {
          ...choice('계약의 지난 미납요금 전체를 납부해요. ' + invoiceWarning,
            choosePayment('$savedPicker', 'oneTimeMethods'), [item('납부 금액', '[납부 금액]')]),
          paymentAmount: 24900, registeredPayment: 'account'
        },
        highArrearsPayment: { ...choice('계약의 지난 미납요금 전체를 납부해요. ' + invoiceWarning, choosePayment('otherPayer', 'receiptPaymentMethods'), [item('납부 금액', '[납부 금액]')]), paymentAmount: 59700 },
        otherPayer: choice('등록된 결제수단은 다른 분 명의예요. 가상계좌로 입금하거나 상담사를 통해 납부 방법을 확인해 주세요.', [['가상계좌', 'receiptVirtual'], ['상담사 연결', '$handoff']]),
        naverPayment: platformPayment('arrearsContract', 3),
        arrearsNotFound: paymentUnavailable('S01'),
        oneTimeMethods: paymentMethods('personalTransferReceipt', 'personalVirtualReceipt'),
        personalTransferReceipt: individualReceiptNotice('S05T'),
        personalVirtualReceipt: individualReceiptNotice('S06')
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
        S02: { items: [item('직수 정수기', 'WPU-1000 · 문래동 · 신한카드')] },
        S03: { items: waterDetails().map((entry) => ({ ...entry, detail: entry.detail.replace('당월 미포함', '당일 미포함') })), addActions: [['결제정보 변경', '@3'], ['다른 문의', '$menu']] },
        S04: {
          actions: [['직수 정수기 선택', 'S05'], ['비데 선택', 'packageEstimate'], ['공기청정기 선택', 'crossPackageEstimate'], ['매트리스 선택', 'S07']],
          items: [item('직수 정수기', 'WPU-1000 · 개별 계약'), item('비데', 'BID-1000 · 패키지 할인'), item('공기청정기', 'ACL-1000 · 크로스 패키지 할인'), item('매트리스', 'MT-1000 · 패키지 유형 중복')]
        },
        S05: {
          message: '해약접수 예정일을 입력해 주세요. 입력하지 않으면 오늘을 기준으로 조회해요. 날짜는 오늘부터 한 달 이내로 선택할 수 있고 실제 해약접수일에 따라 위약금이 달라질 수 있어요.',
          items: [], fields: [penaltyDate], actions: [['위약금 조회', 'S06'], ['뒤로', 'S04']]
        },
        S06: { message: '선택하신 계약의 위약금과 상세 해약금을 확인해 주세요. 실제 해약접수일에 따라 금액이 달라질 수 있어요.',
          items: [item('계약번호', 'CT-250601-001'), item('제품명', '직수 정수기'), item('해약 예정일', '11월 30일'), item('위약금', '99,000원'), item('해약금', '119,000원')],
          actions: [['다른 계약 확인', 'S04'], ['다른 문의', '$menu']]
        },
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
  const cancellableTransferReceipt = [item('접수번호', 'NC-261125-001'), item('대상 제품', '직수 정수기 · WPU-1000')];
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
  const visitPhone = { label: '서비스 당일 연락받으실 휴대폰 번호', placeholder: '휴대폰 번호', type: 'tel', sample: '010-0000-1234' };
  const birthdate = { label: '양수인 생년월일', placeholder: '생년월일', type: 'date', minAge: 19, sample: '1990-01-01' };
  const businessRegistrationNumber = { label: '사업자등록번호', placeholder: '사업자등록번호', type: 'password', sample: '000-00-00000' };
  const changedDates = [['11월 27일(금) 선택', '$date'], ['더보기', '$moreDates']];
  const bookingDetails = (service, number, product, date, address, phone = '[방문 연락처]') => [
    item('서비스 종류', service), item('접수번호', number), item('접수제품', product), item('방문 예정일', date),
    item('담당 매니저', '방문 담당 매니저'), item('이름', '[받으실 분]'), item('연락처', phone), item('주소', address)
  ];
  const visitUnavailable = (retry) => notice('입력하신 주소로는 방문 서비스를 접수하기 어려워요. 주소를 다시 입력하거나 상담사에게 문의해 주세요.', [
    ['주소 다시 입력', retry], ['상담사 연결', '$handoff']
  ]);

  function moveService(isSplit) {
    const service = isSplit ? '분리' : '재설치';
    const scheduled = isSplit ? 'S05' : 'valveOption';
    const addressPrompt = isSplit
      ? '분리할 주소와 방문 당일 연락받으실 번호를 입력해 주세요.'
      : '새로 설치할 주소와 방문 당일에 연락받을 번호를 입력해 주세요.';
    const moveEligibility = [
      { target: 'moveMultipleCustomers', fields: ['휴대폰 번호'], match: '^010-?0000-?0002$' },
      { target: 'S07', fields: ['휴대폰 번호'], match: '^010-?0000-?0003$' }
    ];
    const duplicateVisit = { fields: ['휴대폰 번호'], match: '^010-?0000-?0004$' };
    const alternateOwner = { fields: ['휴대폰 번호'], match: '^010-?0000-?0006$' };
    const consent = (target, confirmed) => choice('접수하신 제품의 사용자와 계약자가 같아요. 계약자 주소도 함께 변경할까요?', [['네', confirmed], ['아니오', target]]);
    const splitAuth = {
      ...choice('분리와 재설치를 함께 접수할 수 있어요. 휴대폰으로 신청자를 확인해 주세요.', [['휴대폰 확인', '$auditSms']]),
      auth: { success: 'pairLookup', failure: 'S08' }
    };
    return {
      screens: {
        S01: { actions: [[service + ' 접수', 'phoneInput'], ['분리·재설치 접수', 'pairAuth']] },
        phoneConfirm: { auth: { success: 'moveLookup', failure: 'S08' } },
        moveLookup: { resolve: { default: 'S02', rules: [
          { target: isSplit ? 'customMoveProduct' : '$usePriorReinstallLookup', fields: ['휴대폰 번호'], match: '^010-?0000-?0000$' },
          ...moveEligibility
        ] } },
        moveMultipleCustomers: handoff('같은 연락처로 여러 고객번호가 확인됐어요. 상담사가 접수할 제품을 확인해 드려요.'),
        S02: {
          actions: [
            ['직수 정수기 선택', 'addressOptions'], ['다른 제품', 'customMoveProduct'], ['이미 신청한 접수 확인', '@13']
          ]
        },
        S03: {
          message: '같은 제품과 주소로 이미 접수한 방문이 있어요. 접수 내역을 보거나 새로 접수할 수 있어요.',
          items: [item('접수번호', 'ES-261125-002'), item('방문 예정일', '11월 30일(월)')],
          actions: [['접수내역 보기', '@13'], ['새로 접수하기', 'moveAddressPass'], ['상담사 연결', '$handoff']]
        },
        S04: {
          message: addressPrompt,
          fields: ['address', visitPhone],
          actions: [['주소 검색', '$address'], ['예약 가능일자 확인', 'moveAddressCheck']]
        },
        moveAddressCheck: { resolve: { default: 'moveAddressPass', rules: [
          { ...unsupportedAddress, target: 'moveAddressUnavailable' }, { ...duplicateVisit, target: 'S03' }
        ] } },
        moveAddressUnavailable: visitUnavailable('S04'),
        moveAddressPass: { ...choice('구독 제품의 새 방문 주소를 확인하려면 PASS 인증이 필요해요.', [
          ['PASS 본인인증', 'moveAddressOwner'], ['주소 다시 입력', 'S04']
        ]), auth: { failure: 'movePassFailed' } },
        moveAddressOwner: { resolve: { default: 'moveAddressConsent', rules: [{ ...alternateOwner, target: scheduled }] } },
        moveAddressConsent: consent(scheduled, 'moveContractAddressConfirmed'),
        moveContractAddressConfirmed: result('새 주소를 계약자 주소에도 반영하도록 선택하셨어요. 방문 일정을 확인해 주세요.', [['계속', scheduled]]),
        movePassFailed: handoff('새 방문 주소를 확인하지 못했어요.', [
          ['PASS 본인인증 다시 시도', 'moveAddressOwner'], ['상담사 연결', '$handoff']
        ]),
        customMoveProduct: field('접수하실 제품명이나 모델명을 입력해 주세요.', ['product'], [['다음', 'customMoveStatus']]),
        ...(!isSplit && {
          priorReinstallProduct: choice('앞서 설치 환경을 확인한 제품으로 재설치를 접수할까요?', [
            ['앞서 확인한 제품 선택', '$selectPriorReinstallProduct'], ['다른 제품', 'customMoveProduct']
          ])
        }),
        customMoveStatus: choice('이사 또는 제품 이동은 어느 단계인가요?', [
          ['이사 예정', 'customMoveDate'], ['이사·이동 완료', 'customMoveAddress'], ['기타 · 공사 등', 'customMoveAddress']
        ]),
        customMoveDate: field('이사 예정일을 입력해 주세요.', [moveDate('이사 예정일', '2026-11-30')], [['다음', 'customMoveAddress'], ['뒤로', 'customMoveStatus']]),
        customMoveAddress: field(addressPrompt, ['address', visitPhone], [['주소 검색', '$address'], ['예약 가능일자 확인', 'customAddressCheck']]),
        customAddressCheck: { resolve: { default: isSplit ? 'S05' : '$checkCustomReinstallEquipment', rules: [
          { ...unsupportedAddress, target: 'customAddressUnavailable' }
        ] } },
        customAddressUnavailable: visitUnavailable('customMoveAddress'),
        S05: {
          message: (isSplit ? '이사 예정일 전날까지 방문할 수 있는 날짜를 선택해 주세요.' : '새 주소에서 재설치할 수 있는 날짜를 선택해 주세요.') +
            ' 실제 비용은 제품과 설치 환경에 따라 달라질 수 있어요.',
          actions: [...changedDates, ['접수 요청', 'S06']]
        },
        S06: { actions: unrestrictedService, items: bookingDetails(service, isSplit ? 'ES-261125-001' : 'ES-261125-002', '[방문 제품]', '11월 27일(금)', '[방문 주소]') },
        addressOptions: isSplit
          ? choice('기존 등록 주소에서 분리할까요, 다른 주소에서 분리할까요?', [
            ['등록 주소 사용', 'registeredAddress'], ['다른 주소 입력', 'S04']
          ], [item('등록 주소', '서울 영등포구 문래동')])
          : choice('재설치할 새 주소와 희망일을 확인해 주세요.', [['주소 입력', 'S04']]),
        ...(isSplit && {
          registeredAddress: field('등록된 주소로 방문할 때 연락받으실 번호를 입력해 주세요.', [visitPhone], [['예약 가능일자 확인', 'registeredMoveCheck']]),
          registeredMoveCheck: { resolve: { default: 'S05', rules: [{ ...duplicateVisit, target: 'registeredMoveDuplicate' }] } },
          registeredMoveDuplicate: choice('같은 제품과 주소로 이미 접수한 방문이 있어요. 접수 내역을 보거나 새로 접수할 수 있어요.', [
            ['접수내역 보기', '@13'], ['새로 접수하기', 'S05'], ['상담사 연결', '$handoff']
          ], [item('접수번호', 'ES-261125-002'), item('방문 예정일', '11월 30일(월)')])
        }),
        pairAuth: splitAuth,
        pairLookup: { resolve: { default: 'pairMoveStatus', rules: moveEligibility } },
        pairMoveStatus: choice('분리와 재설치를 진행할 제품의 이사 상태를 선택해 주세요.', [
          ['이사 예정', 'pairMoveDate'], ['이사·이동 완료', 'pairSplitAddress'], ['기타 · 공사 등', 'pairSplitAddress']
        ]),
        pairMoveDate: field('이사 예정일을 입력해 주세요. 분리는 예정일 전날까지, 재설치는 예정일 다음 날부터 가능해요.', [
          moveDate('이사 예정일', '2026-11-30')
        ], [['다음', 'pairSplitAddress'], ['뒤로', 'pairMoveStatus']]),
        pairSplitAddress: field('먼저 분리할 제품과 방문 주소, 당일 연락받을 번호를 입력해 주세요.', [
          'product', 'address', visitPhone
        ], [['주소 검색', '$address'], ['예약 가능일자 확인', 'pairSplitCheck'], ['뒤로', 'pairMoveStatus']]),
        pairSplitCheck: { resolve: { default: 'pairSplitSchedule', rules: [
          { ...unsupportedAddress, target: 'pairSplitUnavailable' }, { ...duplicateVisit, target: 'pairDuplicate' }
        ] } },
        pairSplitUnavailable: visitUnavailable('pairSplitAddress'),
        pairDuplicate: choice('같은 제품과 주소로 이미 접수한 분리 방문이 있어요. 새로 분리와 재설치를 접수할까요?', [
          ['접수내역 보기', '@13'], ['새로 접수하기', 'pairSplitSchedule'], ['상담사 연결', '$handoff']
        ], [item('접수번호', 'ES-261125-002'), item('방문 예정일', '11월 30일(월)')]),
        pairSplitSchedule: {
          ...choice('분리 방문 가능일 중 원하시는 날짜를 선택해 주세요.', [...changedDates, ['다음', 'pairInstallAddress'], ['뒤로', 'pairSplitAddress']]),
          bookingStage: 'split'
        },
        pairInstallAddress: field('이사 후 재설치할 주소와 방문 정보를 입력해 주세요. 분리 접수 주소와 별도로 확인해요.', [
          'address', visitPhone
        ], [['주소 검색', '$address'], ['예약 가능일자 확인', 'pairInstallCheck'], ['뒤로', 'pairSplitSchedule']]),
        pairInstallCheck: { resolve: { default: 'pairPass', rules: [
          { ...unsupportedAddress, target: 'pairInstallUnavailable' },
          { fields: ['휴대폰 번호'], match: '^010-?0000-?0000$', target: 'pairValveCheck' }
        ] } },
        pairInstallUnavailable: visitUnavailable('pairInstallAddress'),
        pairPass: { ...choice('구독 제품의 새 방문 주소를 확인하려면 PASS 인증이 필요해요.', [
          ['PASS 본인인증', 'pairAddressOwner'], ['주소 다시 입력', 'pairInstallAddress']
        ]), auth: { failure: 'pairPassFailed' } },
        pairPassFailed: handoff('새 방문 주소를 확인하지 못했어요.', [['다시 시도', 'pairPass'], ['상담사 연결', '$handoff']]),
        pairAddressOwner: { resolve: { default: 'pairAddressConsent', rules: [{ ...alternateOwner, target: 'pairValveCheck' }] } },
        pairAddressConsent: consent('pairValveCheck', 'pairContractAddressConfirmed'),
        pairContractAddressConfirmed: result('새 주소를 계약자 주소에도 반영하도록 선택하셨어요.', [['계속', 'pairValveCheck']]),
        pairValveCheck: { resolve: { default: 'pairInstallSchedule', rules: [
          { fields: ['제품명 또는 모델명'], match: '정수기|WPU', target: 'pairValveOption' }
        ] } },
        pairValveOption: choice('재설치할 정수기에 조리수 밸브도 설치할까요?', [
          ['조리수 밸브 포함', 'pairInstallSchedule'], ['기본 재설치만', 'pairInstallSchedule']
        ]),
        pairInstallSchedule: {
          ...choice('재설치 방문일을 선택한 뒤 분리와 재설치를 함께 접수해 주세요.', [...changedDates, ['분리·재설치 접수', 'pairResult'], ['뒤로', 'pairInstallAddress']]),
          bookingStage: 'reinstall'
        },
        pairResult: {
          ...result('분리와 재설치 두 건의 방문 접수가 완료됐어요.', unrestrictedService),
          recordGroups: [
            { title: '분리 서비스 접수', items: bookingDetails('분리', 'ES-261125-003', '[방문 제품]', '[분리 방문일]', '[분리 방문 주소]', '[분리 방문 연락처]') },
            { title: '재설치 서비스 접수', items: bookingDetails('재설치', 'ES-261125-004', '[방문 제품]', '[재설치 방문일]', '[재설치 방문 주소]', '[재설치 방문 연락처]') }
          ]
        }
      }
    };
  }

  Object.assign(window.SKIX_FLOW_OVERLAYS ??= {}, {
    8: moveService(true),
    9: moveService(false),
    10: {
      entry: 'transferPurpose',
      screens: {
        S01: { actions: [['PASS 본인인증', 'S03']], auth: { failure: 'S09' } },
        transferPurpose: choice('어떤 명의변경 업무를 도와드릴까요?', [
          ['명의변경 신청방법 문의', 'S02'], ['명의변경 신청', 'S01'], ['신청 상태 조회', 'transferStatusAuth'], ['신청 취소', 'transferCancelAuth']
        ]),
        S02: {
          message: '명의변경은 현재 계약자가 직접 신청해 주세요. 새 계약자의 성함과 연락처가 필요해요. 개인은 생년월일, 개인사업자는 사업자번호도 준비해 주세요. 구독료가 청구됐거나 미납 요금이 있으면 먼저 요금을 납부해 주세요.',
          actions: [['명의변경 신청 서류', 'transferDocuments'], ['명의변경 신청하기', 'S01'], ['다른 문의', '$menu']]
        },
        S04: { actions: [['미납요금 조회·납부', '@5'], ['당월 요금 납부', '@4'], ['뒤로', 'S03']] },
        S03: {
          actions: [['직수 정수기 선택', 'transferContractDetails'], ['공기청정기 선택', 'S04'], ['정수기·공기청정기 묶음 선택', 'S05'],
            ['비데 선택', 'platformOrder'], ['계약번호로 확인', 'transferContractNumber']],
          items: [item('직수 정수기', 'WPU-1000 · 구독 이용 중'), item('공기청정기', 'ACL-1000 · 미납금 있음'), item('정수기·공기청정기 묶음', '패키지 할인 계약'), item('비데', 'BID-1000 · 네이버 구독')]
        },
        transferContractDetails: result('선택하신 직수 정수기 계약의 상세 정보예요. 확인하신 뒤 명의변경을 신청해 주세요.', [
          ['명의변경 신청', 'S06'], ['다른 계약 선택', 'S03']
        ], [
          item('직수 정수기', '제품코드 WPU-1000 · 서울 영등포구 문래동'),
          item('결제정보', '신용카드 자동납부 · 신한카드\n카드번호 ••••-••••-••••-1234\n결제일 매월 25일'),
          item('계약기간', '계약일 2025년 6월 1일\n계약종료일 2030년 5월 31일\n의무 사용 36개월 · 전체 60개월 · 이용 17개월'),
          item('구독료·납부내역', '월 29,900원\n당월 제외 미납금 0원 · 이번 달 납부 완료')
        ]),
        transferContractNumber: field('명의변경을 확인할 계약번호를 입력해 주세요.', [
          { label: '계약번호', placeholder: '계약번호 입력', sample: 'CT-250601-005' }
        ], [['계약 확인', 'transferContractLookup'], ['뒤로', 'S03']]),
        transferContractLookup: { resolve: { default: 'transferContractUnavailable', rules: [
          { target: 'transferContractDetails', fields: ['계약번호'], match: '^CT-250601-001$' },
          { target: 'S04', fields: ['계약번호'], match: '^CT-250601-002$' },
          { target: 'S05', fields: ['계약번호'], match: '^CT-250601-003$' },
          { target: 'platformOrder', fields: ['계약번호'], match: '^CT-250601-004$' },
          { target: 'transferPrepaid', fields: ['계약번호'], match: '^CT-250601-005$' },
          { target: 'transferCrossPackage', fields: ['계약번호'], match: '^CT-250601-006$' }
        ] } },
        transferContractUnavailable: notice('입력하신 번호와 일치하는 명의변경 대상 계약을 찾지 못했어요.', [
          ['계약번호 다시 입력', 'transferContractNumber'], ['다른 계약 선택', 'S03'], ['상담사 연결', '$handoff']
        ]),
        S05: {
          message: '패키지 할인 계약은 일부 제품만 명의변경하면 할인 반환금이 발생하고 묶음 제품의 구독료가 오를 수 있어요. 명의변경을 원하시면 상담사에게 문의해 주세요.',
          actions: [['상담사 연결', '$handoff'], ['다른 계약 선택', 'S03']]
        },
        transferPrepaid: handoff('선납 할인이 적용 중인 계약은 그대로 명의변경을 신청할 수 없어요. 선납 취소와 할인 반환 조건은 상담사에게 문의해 주세요.', [
          ['상담사 연결', '$handoff'], ['다른 계약 선택', 'S03']
        ]),
        transferCrossPackage: handoff('크로스 패키지 할인 계약을 명의변경하면 할인 반환금이 발생하고 연결된 제품들의 구독료가 오를 수 있어요. 명의변경을 원하시면 상담사에게 문의해 주세요.', [
          ['상담사 연결', '$handoff'], ['다른 계약 선택', 'S03']
        ]),
        S06: { fields: [], kind: 'choice', message: '명의를 넘겨받을 분의 유형을 선택해 주세요.', actions: [
          ['개인', 'transfereePersonal'], ['개인사업자', 'transfereeBusiness'],
          ['귀화', 'transfereePapers'], ['주민등록번호 정정', 'transfereePapers']
        ] },
        S07: { message: '명의변경 신청을 접수했어요. 현재 계약자에게 전달되는 알림톡 안내에서 구비 서류와 제출 방법을 확인할 수 있어요.',
          items: [item('접수번호', 'NC-261125-001')], actions: [['서류 안내', 'transferDocuments'], ['상담사 연결', '$handoff'], ['다른 문의', '$menu']] },
        S08: {
          message: '명의변경 신청 내용을 확인했어요. 새 계약자는 알림톡에서 후속 절차를 확인할 수 있어요.',
          items: [item('접수번호', 'NC-261125-001'), item('진행 상태', '신청 접수')],
          addActions: [['신청 진행·취소 안내', 'transferTracking'], ['추가 문의', '$menu']]
        },
        platformOrder: result('네이버 구독 계약은 이 채팅에서 명의를 변경하기 어려워요. 구독 신청처나 상담사에게 문의해 주세요.', [
          ['상담사 연결', '$handoff'], ['뒤로', 'S03']
        ]),
        transfereePersonal: field('새 계약자의 정보를 입력해 주세요. 만 19세 미만은 명의변경이 제한돼요.',
          ['name', 'phone', birthdate], [['확인', 'transfereeConsent'], ['뒤로', 'S06']], { secure: true }),
        transfereeBusiness: field('새 개인사업자의 정보를 입력해 주세요. 휴업·폐업 상태일 때는 명의변경이 제한돼요.',
          ['name', 'phone', businessRegistrationNumber], [['확인', 'transfereeConsent'], ['뒤로', 'S06']], { secure: true }),
        transfereeConsent: choice('명의변경 신청을 위해 새 계약자 정보의 수집 및 이용 동의가 필요해요.', [
          ['동의하고 신청하기', 'S08'], ['동의하지 않음', 'transfereeDeclined']
        ]),
        transfereeDeclined: notice('동의하지 않으면 명의변경 신청을 계속할 수 없어요.', [['신청 조건 다시 확인', 'S06'], ['다른 문의', '$menu']]),
        transfereePapers: choice('이 유형은 접수 후 현재 계약자에게 필요한 서류와 제출 방법을 안내해요.', [
          ['신청 접수', 'S07'], ['뒤로', 'S06']
        ]),
        transferDocuments: result('신청 유형에 따라 명의변경 신청서, 사업자 확인 서류 등 대상 서류가 달라요. 서류 안내를 먼저 확인해 주세요.', [
          ['명의변경 신청하기', 'S01'], ['서류 상세 문의', '$handoff'], ['뒤로', 'S02']
        ], [
          item('신청 주체', '양도인인 현재 계약자'), item('추가 서류가 필요한 유형', '개인사업자·명의 정정 등')
        ]),
        transferStatusAuth: { ...choice('명의변경 신청 상태를 조회하려면 현재 계약자의 PASS 본인인증이 필요해요.', [['PASS 본인인증', 'transferStatusList']]), auth: { failure: 'S09' } },
        transferCancelAuth: { ...choice('명의변경 신청을 취소하려면 현재 계약자의 PASS 본인인증이 필요해요.', [['PASS 본인인증', 'transferCancelCheck']]), auth: { failure: 'S09' } },
        transferTracking: choice('접수번호를 기준으로 진행 상태를 확인해요. 이미 진행된 신청은 취소할 수 없는 상태일 수 있어요.', [
          ['진행 상태 확인', 'transferStatusList'], ['명의변경 신청 취소', 'transferCancelCheck'], ['상담사 연결', '$handoff']
        ]),
        transferStatusList: choice('진행 중인 신청을 선택해 주세요. 접수번호로도 확인할 수 있어요.', [
          ['직수 정수기 명의변경 신청 선택', 'transferPending'], ['접수번호로 조회', 'transferStatusNumber'], ['뒤로', 'transferPurpose']
        ], [item('직수 정수기 명의변경 신청', 'NC-261125-001 · WPU-1000 · 신청 접수')]),
        transferStatusNumber: field('확인할 명의변경 접수번호를 입력해 주세요.', [
          { label: '명의변경 접수번호', placeholder: '접수번호 입력', sample: 'NC-261125-001' }
        ], [['접수 확인', 'transferStatusLookup'], ['뒤로', 'transferStatusList']]),
        transferStatusLookup: { resolve: { default: 'transferStatusUnavailable', rules: [
          { target: 'transferPending', fields: ['명의변경 접수번호'], match: '^NC-261125-001$' },
          { target: 'transferUnderReview', fields: ['명의변경 접수번호'], match: '^NC-261125-002$' }
        ] } },
        transferStatusUnavailable: notice('진행 중인 신청이 조회되지 않아요. 완료됐거나 홈페이지에서 직접 신청한 내역은 서비스센터에서 확인해 주세요.', [
          ['접수번호 다시 입력', 'transferStatusNumber'], ['상담사 연결', '$handoff'], ['다른 문의', '$menu']
        ]),
        transferUnderReview: result('명의변경 신청을 처리하고 있어요.', [
          ['다른 접수 조회', 'transferStatusList'], ['상담사 연결', '$handoff']
        ], [item('접수번호', 'NC-261125-002'), item('진행 상태', '명의변경 완료 대기')]),
        transferPending: result('명의변경 신청이 접수되어 후속 확인을 기다리고 있어요.', [
          ['취소 가능 여부 확인', 'transferCancelCheck'], ['다른 접수 조회', 'transferStatusList']
        ], [item('접수번호', 'NC-261125-001'), item('대상 계약', '직수 정수기 · WPU-1000'), item('진행 상태', '신청 접수')]),
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
        ], cancellableTransferReceipt),
        transferCancelled: result('선택한 명의변경 신청이 취소됐어요.', close, [
          ...cancellableTransferReceipt, item('진행 상태', '취소 완료')
        ]),
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
        S04: {
          message: '긴급한 증상으로 확인돼요. 빠른 조치를 위해 상담사에게 연결해 드릴까요? 상담 운영시간 외에는 연결이 어려울 수 있어요.',
          actions: [['상담사 연결', '$handoff'], ['서비스 접수', '@12'], ['운영시간 외 전화 상담', 'S07']]
        },
        S05: { addActions: [['서비스 접수', '@12'], ['상담사 연결', '$handoff']] },
        S07: {
          message: '상담 운영시간 외에는 전화 상담을 예약하실 수 있어요.',
          actions: [['상담사 전화 예약', 'callback'], ['다른 문의', '$menu']]
        },
        unlistedProduct: field('제품군과 모델명을 입력해 주세요. 확인이 어려우면 제품을 다시 찾거나 상담에서 확인할 수 있어요.', ['product'], [
          ['제품 확인', '$identifyServiceProduct'], ['뒤로', 'S01']
        ]),
        customSymptom: field('어떤 증상인지 알려 주세요.', ['symptom'], [['증상 확인', '$symptom'], ['뒤로', 'S02']]),
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
        customSymptom: field('접수할 증상을 알려 주세요.', ['symptom'], [['증상 확인', '$symptom'], ['뒤로', 'serviceSymptom']]),
        serviceModel: field('제품 라벨에서 모델명을 확인해 입력해 주세요.', [
          { label: '모델명', placeholder: '제품 모델명 입력', sample: 'WPU-1000' }
        ], [['다음', 'S02'], ['뒤로', 'serviceSymptom']]),
        serviceSafety: handoff('긴급한 증상으로 확인돼요. 빠른 조치를 위해 상담사에게 연결해 드릴까요? 상담 운영시간 외에는 연결이 어려울 수 있어요.', [
          ['상담사 연결', '$handoff'], ['서비스 접수', '$continueServiceRegistration'], ['증상 다시 선택', 'serviceSymptom']
        ]),
        phoneConfirm: { auth: { success: 'serviceLookup', failure: 'S09' } },
        serviceLookup: { resolve: { default: 'S04', rules: [
          { target: 'S09', fields: ['휴대폰 번호'], match: '^010-?0000-?0002$' },
          { target: 'S03', fields: ['휴대폰 번호'], match: '^010-?0000-?0003$' },
          { target: 'S07', fields: ['휴대폰 번호'], match: '^010-?0000-?0007$' },
          { target: 'serviceCases', fields: ['휴대폰 번호'], match: '^010-?0000-?(1234|0006|0008)$' }
        ] } },
        S03: {
          message: '같은 제품과 증상으로 이미 접수한 방문이 있어요. 기존 접수 내역을 확인하거나 새로 접수할 수 있어요.',
          actions: [['접수내역 보기', '@13'], ['새로 접수하기', 'serviceCases'], ['상담사 연결', '$handoff']]
        },
        S04: { fields: ['address', visitPhone], actions: [['주소 검색', '$address'], ['예약 가능일자 확인', 'serviceAddressCheck']] },
        serviceAddressCheck: { resolve: { default: 'serviceAvailability', rules: [{ ...unsupportedAddress, target: 'S08' }] } },
        serviceAvailability: { resolve: { default: 'S05', rules: [
          { target: 'serviceNoAppointments', fields: ['휴대폰 번호'], match: '^010-?0000-?0008$' }
        ] } },
        serviceNoAppointments: handoff('예약 가능한 방문일자가 없어요. 서비스 접수를 계속하시려면 상담사에게 문의해 주세요.', [
          ['상담사 연결', '$handoff'], ['주소 다시 입력', 'serviceCases']
        ]),
        S05: {
          message: '희망 방문일을 선택한 뒤 접수해 주세요. 유상 방문 수리 시 추가 요금이 청구될 수 있어요.',
          items: [item('서비스 비용 미리보기', '유상 점검 시 출장점검비 30,000원에 수리·부품 비용이 추가될 수 있어요.')],
          actions: [...changedDates, ['접수 요청', 'S06']]
        },
        S06: {
          message: 'AS 방문 접수가 완료됐어요.',
          items: bookingDetails('AS', 'AS-261125-001', '[접수 제품]', '11월 27일(금)', '[방문 주소]'),
          actions: [['분리·재설치 추가접수', '@8'], ['고장상담', '@11'], ['접수 내역 확인', '@13'], ['다른 문의', '$menu']]
        },
        regAddrPass: { auth: { failure: 'S09' }, actions: [['PASS 본인인증', 'serviceAddressOwner']] },
        serviceAddressOwner: { resolve: { default: 'serviceContractAddress', rules: [
          { target: 'serviceUserAddressOnly', fields: ['휴대폰 번호'], match: '^010-?0000-?0006$' }
        ] } },
        serviceContractAddress: choice('접수하신 제품의 사용자와 계약자가 같아요. 계약자 주소도 함께 변경할까요?', [
          ['네', 'serviceContractAddressConfirmed'], ['아니오', 'serviceAvailability']
        ]),
        serviceContractAddressConfirmed: result('새 주소를 계약자 주소에도 반영하도록 선택하셨어요. 방문 일정을 확인해 주세요.', [
          ['계속', 'serviceAvailability']
        ]),
        serviceUserAddressOnly: result('입력하신 주소는 제품 사용자의 방문 주소에만 적용해요.', [['계속', 'serviceAvailability']]),
        serviceCases: choice('제품과 신청자 정보를 확인했어요. 방문 주소를 선택해 주세요.', [
          ['등록된 방문 주소', 'registeredServiceAddress'], ['새 주소', 'newServiceAddress']
        ], [item('등록 주소', '서울 영등포구 문래동')]),
        newServiceAddress: {
          resolve: { default: 'subscriptionAddress', rules: [
            { target: 'S04', fields: ['제품명 또는 모델명'], match: '^(일시불 구매 제품|미등록 제품)$' },
            { target: 'servicePackageAddress', fields: ['제품명 또는 모델명'], match: '패키지|묶음' }
          ] }
        },
        servicePackageAddress: handoff('패키지 상품은 제품 하나의 주소만 따로 변경할 수 없어요. 묶음 전체의 주소 변경은 상담에서 확인해 주세요.', [
          ['등록된 방문 주소 사용', 'registeredServiceAddress'], ['상담사 연결', '$handoff'], ['뒤로', 'serviceCases']
        ]),
        registeredServiceAddress: field('등록 주소로 방문할 때 연락받을 전화번호를 입력해 주세요.', [visitPhone], [
          ['예약 가능일자 확인', 'serviceAvailability'], ['뒤로', 'serviceCases']
        ]),
        subscriptionAddress: field('구독 제품이 설치된 새 주소와 방문 당일 연락받을 번호를 입력해 주세요. 새 주소는 PASS 확인이 필요해요.', ['address', visitPhone], [
          ['예약 가능일자 확인', 'subscriptionAddressCheck'], ['뒤로', 'serviceCases']
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
        visitLookup: { resolve: { default: '$visitResults', rules: [
          { target: 'S05', fields: ['휴대폰 번호'], match: '^010-?0000-?0000$' },
          { target: 'S07', fields: ['휴대폰 번호'], match: '^010-?0000-?0002$' },
          { target: 'S06', fields: ['휴대폰 번호'], match: '^010-?0000-?0003$' }
        ] } },
        S03: { message: '선택하신 AS 접수 내역이에요.', addActions: [['방문 전 연락 요청', '@34']] },
        S04: { message: '선택하신 분리·재설치 접수 내역이에요.', addActions: [['방문 전 연락 요청', '@34']] },
        S06: { addActions: [['AS 방문 접수', '@12'], ['다른 문의', '$menu']] },
      }
    },
    14: {
      screens: {
        phoneConfirm: { auth: { success: 'visitLookup', failure: 'S11' } },
        visitLookup: { resolve: { default: '$visitResults', rules: [
          { target: 'missingCustomer', fields: ['휴대폰 번호'], match: '^010-?0000-?0000$' },
          { target: 'S11', fields: ['휴대폰 번호'], match: '^010-?0000-?0002$' },
          { target: 'S09', fields: ['휴대폰 번호'], match: '^010-?0000-?0003$' }
        ] } },
        visitDetails: choice('선택하신 서비스 접수 내역이에요.', [
          ['접수내용 변경', '$visitChange'], ['다른 접수 확인', '$visitResults']
        ]),
        S02: { message: '변경할 항목을 선택해 주세요.', actions: [
          ['방문주소', '$changeVisitAddress'], ['방문예정일', 'moveDateForChange'], ['접수 증상', '$editSymptom'], ['방문 연락처', '$editPhone']
        ] },
        S03: { actions: [['주소 검색', '$address'], ['확인', 'visitAddressCheck'], ['나가기', 'S02']] },
        visitAddressCheck: { resolve: { default: '$visitAddressSchedule', rules: [{ ...unsupportedAddress, target: 'S08' }] } },
        S04: { actions: [...changedDates, ['변경 요청', '$commitVisitChange']] },
        S05: field('서비스 당일에 연락받으실 전화번호를 입력해 주세요.', [
          { label: '연락요청번호', placeholder: '휴대폰 번호 또는 지역번호 포함', type: 'tel', sample: '010-0000-1234' }
        ], [['변경 요청', '$commitVisitChange'], ['뒤로', 'S02']], { secure: true }),
        S09: { addActions: [['AS 방문 접수', '@12'], ['다른 문의', '$menu']] },
        S10: { actions: [['접수취소', '@15'], ['접수내용 변경', '$visitChange'], ['접수 내역 확인', '@13'], ...close] },
        moveDateForChange: field('이사와 관련된 방문이면 이사 예정일을 입력해 주세요.', [
          { label: '이사 예정일', placeholder: 'YYYY-MM-DD', type: 'date', sample: '2026-11-30', required: false }
        ], [['다음', 'S04'], ['뒤로', 'S02']]),
        editSymptomPicker: choice('변경할 접수 증상의 분류를 선택해 주세요.', []),
        customSymptom: field('변경할 증상을 입력해 주세요.', ['symptom'], [['증상 확인', '$symptom'], ['뒤로', '$symptom']]),
        editSymptomConfirm: choice('선택한 증상으로 변경할까요?', [['변경 요청', '$commitVisitChange'], ['다시 선택', '$symptom']]),
        missingCustomer: noMatch('phoneInput')
      }
    },
    15: {
      screens: {
        phoneConfirm: { auth: { success: 'visitLookup', failure: 'S08' } },
        visitLookup: { resolve: { default: '$visitResults', rules: [
          { target: 'missingCustomer', fields: ['휴대폰 번호'], match: '^010-?0000-?0000$' },
          { target: 'S08', fields: ['휴대폰 번호'], match: '^010-?0000-?0002$' },
          { target: 'S06', fields: ['휴대폰 번호'], match: '^010-?0000-?0003$' }
        ] } },
        visitDetails: choice('선택하신 접수 내역이에요.', [['접수취소', '$visitCancel'], ['다른 접수 확인', '@13']]),
        S03: { actions: [
          ['개인 일정으로 다음에 다시 신청', '$selectCancellationReason'], ['정상 작동 또는 직접 처리', '$selectCancellationReason'],
          ['미사용 또는 새 제품 구입 예정', '$selectCancellationReason'], ['비용 부담', '$selectCancellationReason'],
          ['기타', '$selectCancellationReason'], ['나가기', '$menu'], ['취소 요청', '$commitVisitCancellation']
        ] },
        S04: { resolve: { default: 'S03' } },
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
        phoneConfirm: { auth: { success: 'deliveryLookup', failure: 'deliveryPhoneFailed' } },
        deliveryPhoneFailed: handoff('인증번호를 세 번 잘못 입력해 휴대폰 확인을 마치지 못했어요. 배송 정보는 상담사에게 확인해 주세요.'),
        deliveryLookup: { resolve: { default: 'S02', rules: [
          { target: 'S04', fields: ['휴대폰 번호'], match: '^010-?0000-?0000$' },
          { target: 'S05', fields: ['휴대폰 번호'], match: '^010-?0000-?0002$' },
          { target: 'pending5', fields: ['휴대폰 번호'], match: '^010-?0000-?0005$' },
          { target: 'S05', fields: ['휴대폰 번호'], match: '^010-?0000-?0008$' }
        ] } },
        S03: {
          message: '고객님, 제품 배송 정보 안내드립니다.',
          actions: [['계속하기', 'S07']]
        },
        pending5: { ...handoff('배송 주문을 확인하려면 상담사에게 문의해 주세요.'), condition: '배송 주문 상담 확인' }
      }
    },
    17: {
      screens: {
        S01: { message: '배송 주문을 변경하려면 휴대폰 인증이 필요해요.' },
        deliveryBusinessInput: field('개인사업자 주문을 조회할 신청자 정보와 사업자등록번호를 입력해 주세요.', [
          'name', 'phone', businessRegistrationNumber
        ], [['인증번호 받기', '$sendOtp']], { secure: true }),
        S02: { message: '배송 정보를 변경하거나 설치마스터에게 요청을 전달할 주문을 선택해 주세요.' },
        phoneConfirm: { auth: { success: 'deliveryLookup', failure: 'deliveryPhoneFailed' } },
        deliveryPhoneFailed: handoff('인증번호를 세 번 잘못 입력해 휴대폰 확인을 마치지 못했어요. 배송 변경은 상담사에게 문의해 주세요.'),
        deliveryLookup: { resolve: { default: 'S02', rules: [
          { target: 'S11', fields: ['휴대폰 번호'], match: '^010-?0000-?0000$' },
          { target: 'S10', fields: ['휴대폰 번호'], match: '^010-?0000-?0002$' },
          { target: 'createdOrder', fields: ['휴대폰 번호'], match: '^010-?0000-?0004$' },
          { target: 'pending5', fields: ['휴대폰 번호'], match: '^010-?0000-?0005$' },
          { target: 'S10', fields: ['휴대폰 번호'], match: '^010-?0000-?0008$' }
        ] } },
        S03: {
          message: '선택하신 주문의 배송 정보예요. 어떤 정보를 바꾸거나 전달할까요?',
          actions: [['배송주소 수정', '$deliveryEditAddress'], ['배송일정 수정', '$deliveryEditDate'], ['설치마스터 전달 요청', 'S06']]
        },
        packageChange: choice('패키지 주문은 구성 제품 전체의 배송주소 또는 배송일이 함께 변경돼요.', [
          ['확인', '$confirmPackageChange'], ['뒤로', 'S03']
        ]),
        S04: field('새 배송 주소를 입력해 주세요.', [
          { label: '배송 주소', placeholder: '도로명 또는 지번과 상세주소', sample: '서울 영등포구 문래동' }
        ], [['주소 검색', '$address'], ['확인', '$checkDeliveryAddress'], ['나가기', 'S03']]),
        deliveryAddressCheck: { resolve: { default: '$deliveryAddressSchedule', rules: [
          { ...unsupportedAddress, fields: ['배송 주소'], target: 'S09' }
        ] } },
        deliveryAddressSchedule: choice('변경하신 배송지에는 기존 날짜로 배송하기 어려워요. 새 배송일을 선택해 주세요.', [
          ['배송일 선택', 'requestedDeliveryDate'], ['주소 다시 입력', 'S04']
        ]),
        requestedDeliveryDate: field('희망 배송일을 입력해 주세요. 가까운 배송 가능일을 확인할게요.', [
          { label: '희망 배송일', placeholder: 'YYYY-MM-DD', type: 'date', sample: '2026-12-02' }
        ], [['예약 가능일자 확인', '$deliveryDateLookup'], ['뒤로', '$deliveryOrder']]),
        noDeliveryDates: handoff('선택할 수 있는 배송일이 없어요. 상담사에게 배송 일정을 문의해 주세요.'),
        S05: {
          actions: [['배송 가능일 선택', '$date'], ['더보기', '$moreDates'], ['확인', '$commitDeliveryChange']]
        },
        S06: field('설치마스터에게 전달할 내용을 입력해 주세요. 요청한 내용은 설치 예정일에 확인할 수 있어요.', [
          { label: '전달 요청 사항', placeholder: '전달 요청 사항을 입력해 주세요', sample: '방문 전에 연락해 주세요.' }
        ], [['확인', '$commitDeliveryMemo'], ['뒤로', '$deliveryOrder']]),
        S07: { actions: close },
        S08: { message: '요청하신 사항은 설치 예정일 설치마스터가 확인할 수 있습니다. 추가로 문의하실 내용이 있으신가요?', actions: close },
        subscriptionOrder: choice('구독 주문의 배송주소는 구독 주문처에 변경을 요청해 주세요. 배송일 문의나 설치 요청 전달을 계속할 수 있어요.', [
          ['배송주소 변경 안내', 'subscriptionAddress'], ['배송일정 수정 문의', '$deliveryEditDate'], ['설치마스터 전달 요청', 'S06'], ['다른 문의', '$menu']
        ]),
        subscriptionAddress: result('구독 신청처에 배송주소 변경을 요청해 주세요. 주문처에서 변경 가능 여부와 새 설치 일정을 확인해요.', close),
        createdOrder: handoff('주문이 출고됐어요. 배송 변경이나 요청사항 전달은 상담사가 도와드려요.'),
        pending5: { ...handoff('배송 주문 변경 가능 여부는 상담사에게 문의해 주세요.'), condition: '배송 주문 상담 확인' }
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
      actions: [['다른 계약 보기', no === 4 ? 'chargeContract' : 'arrearsContract'], ['다른 문의', '$menu']]
    };
  }
  overlays[6].screens.S04 = {
    message: '추가로 문의하실 내용이 있으신가요?',
    actions: [['추가 문의', '$menu'], ['상담 종료', '$finish']]
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
        : '이사 예정일을 입력해 주세요. 재설치 방문은 이사 예정일 다음 날부터 확인할 수 있어요.',
      fields: [date('이사 예정일', '2026-11-30')], actions: [['다음', 'addressOptions'], ['뒤로', 'moveStatus']]
    };
    if (no === 9) {
      screens.valveOption = {
        kind: 'choice', message: '재설치할 정수기에 조리수 밸브도 설치할까요? 추가 설치 비용은 제품과 현장 환경에 따라 달라질 수 있어요.',
        actions: [['조리수 밸브 포함', 'S05'], ['기본 재설치만', 'S05']]
      };
    }
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
    { from: 'packageEstimate', id: 'packageDate', result: 'packageResult', product: '패키지 묶음', total: '149,000원' },
    { from: 'crossPackageEstimate', id: 'crossPackageDate', result: 'crossPackageResult', product: '크로스 패키지 묶음', total: '169,000원' },
    { from: 'packageSingleNotice', id: 'packageSingleDate', result: 'packageSingleResult', product: '비데', contract: 'CT-250601-002', penalty: '69,000원', total: '84,000원', effects: [
      item('직수 정수기 · WPU-1000 · 서울 영등포구 문래동', '현재 구독료 월 26,900원 → 원복 구독료 월 29,900원')
    ] },
    { from: 'crossSingleNotice', id: 'crossSingleDate', result: 'crossSingleResult', product: '공기청정기', contract: 'CT-250901-001', penalty: '79,000원', total: '98,900원', effects: [
      item('직수 정수기 · WPU-1000 · 서울 영등포구 문래동', '현재 구독료 월 24,900원 → 원복 구독료 월 29,900원'),
      item('비데 · BID-1000 · 서울 영등포구 문래동', '현재 구독료 월 16,900원 → 원복 구독료 월 19,900원')
    ] }
  ];
  for (const { from, id, result, product, total, contract, penalty, effects } of packages) {
    contracts[from].actions[0][1] = id;
    contracts[id] = {
      kind: 'input', message: `${product}의 해약접수 예정일을 입력해 주세요. 입력하지 않으면 오늘을 기준으로 조회해요. 실제 해약접수일에 따라 위약금이 달라질 수 있어요.`,
      fields: contracts.S05.fields, actions: [['위약금 조회', result], ['뒤로', from]]
    };
    contracts[result] = {
      kind: 'result', message: contract ? '선택하신 계약의 위약금과 상세 해약금이에요. 함께 할인받던 다른 제품은 구독료가 조정돼요.' : `선택하신 ${product}의 합산 해약금이에요.`,
      items: contract
        ? [item('계약번호', contract), item('제품명', product), item('해약 예정일', '11월 30일'), item('위약금', penalty), item('해약금', total), ...effects]
        : [item('해약 예정일', '11월 30일'), item('총 해약금', total)],
      actions: [['다른 계약 확인', 'S04'], ['다른 문의', '$menu']]
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
