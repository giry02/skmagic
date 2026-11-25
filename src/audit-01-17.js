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
    [item('예시 납부 금액', '29,900원')]
  );
  const invoiceWarning = '출금이 이미 요청된 요금은 등록한 계좌나 카드에서 한 번 더 결제될 수 있어요.';
  const paymentStatus = [
    ['결제정보 변경', '@3'], ['미납요금 조회', '@5'], ['상담사 연결', '$handoff'], ['다른 문의', '$menu']
  ];
  const paymentUnavailable = (returnTo) => notice('일치하는 계약을 찾지 못했어요. 설치 전이나 설치 당일에는 계약이 조회되지 않을 수 있어요.', [
    ['다시 조회하기', returnTo], ['상담사 연결', '$handoff'], ['다른 문의', '$menu']
  ]);
  const lookupChoices = (message, successful, cases) => choice(message, [
    ['조회 결과 보기', successful], ['예시 조회 결과 바꾸기', cases]
  ]);

  Object.assign(window.SKIX_FLOW_OVERLAYS ??= {}, {
    1: {
      screens: {
        S01: { actions: [['PASS 본인인증', 'exampleLookup']], auth: { failure: 'S08' } },
        S02: { actions: [['직수 정수기 선택', 'paymentPurpose'], ['공기청정기 선택', 'paymentPurpose']] },
        S03: { addActions: [['당월 납부 결과 확인', 'monthlyPayment']] },
        S04: { actions: paymentStatus },
        S05: { actions: paymentStatus },
        S06: { actions: paymentStatus },
        S07: paymentUnavailable('S01'),
        S08: { actions: [['PASS 본인인증', 'exampleLookup']], auth: { failure: 'S09' } },
        exampleLookup: lookupChoices('본인 확인이 끝났어요. 확인할 납부 계약을 조회해 주세요.', 'S02', 'exampleLookupCases'),
        exampleLookupCases: choice('예시 환경에서 확인할 계약 조회 결과를 선택해 주세요.', [
          ['계약 1~4건', 'S02'], ['계약 없음', 'S07'], ['계약 5건 이상', 'S09'],
          ['통합고객과 일치하지 않음', 'noCustomer'], ['계약자가 아닌 납부자', 'payerDenied']
        ]),
        noCustomer: notice('일치하는 고객 정보를 확인하지 못했어요.', [['PASS 본인인증 다시 시도', 'exampleLookup'], ['상담사 연결', '$handoff']]),
        payerDenied: handoff('결제 정보는 계약자 본인에게 안내해 드려요. 납부자가 계약자와 다른 경우 상담에서 확인해 주세요.'),
        paymentPurpose: choice('어떤 결제 정보를 확인할까요?', [['결제정보 상세 조회', 'S03'], ['당월 납부 결과', 'monthlyPayment']]),
        monthlyPayment: choice('선택한 계약의 이번 달 납부 예시를 확인할 수 있어요.', [
          ['당월 납부 완료', 'S04'], ['당월 납부 미완료', 'S05'], ['결제일 당일 미반영', 'S06']
        ])
      }
    },
    2: {
      screens: {
        S01: { actions: [['PASS 본인인증', 'exampleLookup']], auth: { failure: 'S06' } },
        S02: { addActions: [['미납금이 있는 계약 예시', 'S04']] },
        S05: paymentUnavailable('S01'),
        S06: { actions: [['PASS 본인인증', 'exampleLookup']], auth: { failure: 'S07' } },
        exampleLookup: lookupChoices('월 이용료를 확인할 계약을 조회할 수 있어요.', 'S02', 'exampleLookupCases'),
        exampleLookupCases: choice('예시 환경에서 확인할 계약 조회 결과를 선택해 주세요.', [
          ['계약 1~4건', 'S02'], ['계약 없음', 'S05'], ['계약 5건 이상', 'S07'], ['당월을 제외한 미납금이 있음', 'S04']
        ])
      }
    },
    3: {
      screens: {
        S01: { actions: [['PASS 본인인증', 'changeContract']], auth: { failure: 'S07' } },
        S08: {
          message: '예시 결제수단 변경을 완료했어요. 이번 달 요금을 이미 납부했다면 다음 달부터 변경한 수단이 적용돼요. 미납 상태라면 이번 달부터 적용되며, 당일 처리 결과는 반영까지 시간이 걸릴 수 있어요. 변경 시점에 따라 제휴 할인 적용 여부가 달라질 수 있어요.'
        },
        changeContract: choice('변경할 계약을 선택해 주세요.', [
          ['직수 정수기 선택', 'S03'], ['묶음 결제 계약 예시', 'S02'],
          ['네이버 구독 계약 예시', 'naverContract'], ['변경 대상 계약이 없는 예시', 'S06']
        ]),
        naverContract: result('네이버에서 구독한 계약의 결제정보는 네이버에서 변경하실 수 있어요.', close)
      }
    },
    4: {
      screens: {
        S01: { actions: [['PASS 본인인증', 'chargeContract']], auth: { failure: 'S09' } },
        S02: {
          message: '납부할 금액을 확인해 주세요. ' + invoiceWarning,
          actions: [['등록 결제수단', '$savedPicker'], ['일회성 납부수단', 'oneTimeMethods'], ['나가기', '$finish']]
        },
        S03: { actions: [['가상계좌', 'S06'], ['상담사 연결', '$handoff']] },
        S04: { fields: [
          { label: '카드번호', placeholder: '숫자 16자리', type: 'password', sample: '0000000000001234' },
          { label: '유효기간', placeholder: 'MM / YY', type: 'password', sample: '12 / 30' },
          { label: '생년월일', placeholder: 'YYMMDD', type: 'password', sample: '900101' }
        ], items: [item('할부 기간', '일시불 · 5만원 미만'), item('예시 납부 금액', '29,900원')] },
        S06: { message: '가상계좌 발급 경로를 예시로 진행할 수 있어요. 은행과 연락처를 입력해 주세요. 실제 발급 가능 여부는 서비스 연결 후 확인합니다.' },
        S07V: { addActions: [['입금 확인 안내', '@39']] },
        chargeContract: choice('납부할 계약을 선택해 주세요.', [
          ['직수 정수기 선택', 'S02'], ['네이버 등 챗봇 납부 제한 예시', 'S08'], ['조회할 계약 없음', 'chargeNotFound']
        ]),
        chargeNotFound: paymentUnavailable('S01'),
        oneTimeMethods: paymentMethods('$issuerPicker', 'S05')
      }
    },
    5: {
      screens: {
        S01: { actions: [['PASS 본인인증', 'arrearsContract']], auth: { failure: 'S09' } },
        S04: {
          message: '계약 건별 미납요금 전체를 납부할 수 있어요. ' + invoiceWarning,
          actions: [['등록 결제수단', '$savedPicker'], ['일회성 납부수단', 'oneTimeMethods'], ['나가기', '$finish']]
        },
        S05: { fields: [
          { label: '카드번호', placeholder: '숫자 16자리', type: 'password', sample: '0000000000001234' },
          { label: '유효기간', placeholder: 'MM / YY', type: 'password', sample: '12 / 30' },
          { label: '생년월일', placeholder: 'YYMMDD', type: 'password', sample: '900101' }
        ], items: [item('할부 기간', '일시불 · 5만원 미만'), item('예시 납부 금액', '29,900원')] },
        S06: { message: '가상계좌 발급 경로를 예시로 진행할 수 있어요. 은행과 연락처를 입력해 주세요. 실제 발급 가능 여부는 서비스 연결 후 확인합니다.' },
        S08: { addActions: [['입금 확인 안내', '@39']] },
        arrearsContract: choice('미납요금을 조회할 계약을 선택해 주세요.', [
          ['직수 정수기 선택', 'S02'], ['미납금 없는 계약 예시', 'S03'], ['조회할 계약 없음', 'arrearsNotFound'],
          ['챗봇 납부 제한 계약 예시', 'S09']
        ]),
        arrearsNotFound: paymentUnavailable('S01'),
        oneTimeMethods: paymentMethods('$issuerPicker', 'S05T')
      }
    },
    6: {
      screens: {
        S01: { message: '제휴카드를 넘겨 보며 카드별 혜택을 비교할 수 있어요. 카드 이미지를 선택하면 SK매직몰에서 상세 조건과 신청 방법을 확인할 수 있어요.' }
      }
    },
    7: {
      screens: {
        S01: { actions: [['PASS 본인인증', 'S02']], auth: { failure: 'S08' } },
        S04: { addActions: [['패키지 계약 예시', 'packageEstimate'], ['크로스 패키지 계약 예시', 'crossPackageEstimate'], ['패키지·크로스 동시 계약 예시', 'S07']] },
        S06: { addActions: [['위약금 내역서 안내', '@20'], ['다른 계약 확인', 'S04']] },
        packageEstimate: choice('패키지 상품의 위약금을 함께 조회할까요, 선택한 제품만 조회할까요?', [
          ['패키지 묶음 조회', 'S05'], ['선택한 계약만 조회', 'packageSingleNotice']
        ]),
        crossPackageEstimate: choice('크로스 패키지로 묶인 상품의 위약금을 조회할 범위를 선택해 주세요.', [
          ['크로스 패키지 묶음 조회', 'S05'], ['선택한 계약만 조회', 'packageSingleNotice']
        ]),
        packageSingleNotice: notice('한 상품만 해약하면 묶음 할인 조건이 바뀌어 다른 상품의 구독료가 달라질 수 있어요.', [
          ['기준일 선택', 'S05'], ['뒤로', 'S04']
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
  const close = [['다른 문의', '$menu'], ['상담 종료', '$finish']];
  const unrestrictedService = [['다른 분리·재설치 접수', '@8'], ['고장 상담', '@11'], ['추가 문의', '$menu']];
  const moveDate = (label, sample) => ({ label, placeholder: '방문 날짜 선택', type: 'date', sample });
  const birthdate = { label: '생년월일', placeholder: 'YYMMDD', type: 'password', sample: '900101' };
  const companyNumber = { label: '사업자등록번호', placeholder: '예시 사업자등록번호', type: 'password', sample: '000-00-00000' };
  const changedDates = [['11월 27일(금) 선택', '$date'], ['더보기', '$moreDates']];

  function moveService(isSplit) {
    const service = isSplit ? '분리' : '재설치';
    const splitAuth = {
      ...choice('분리와 재설치를 함께 접수할 수 있어요. 휴대폰으로 신청자를 확인해 주세요.', [['휴대폰 확인', '$auditSms']]),
      auth: { success: 'pairSplitAddress', failure: 'S08' }
    };
    return {
      screens: {
        S01: { actions: [[service + ' 접수', 'phoneInput'], ['분리·재설치 접수', 'pairAuth']] },
        S02: {
          actions: [
            ['직수 정수기 선택', 'addressOptions'], ['다른 제품', '$otherProduct'], ['진행 중 접수가 있는 예시', 'S03'],
            ['연체 3회 이상 예시', 'S07'], ['조회·접수 불가 예시', 'S08']
          ]
        },
        S03: { actions: [['기존 접수 확인', '@13'], ['다른 주소 또는 접수로 계속하기', 'addressOptions']] },
        S04: {
          message: isSplit
            ? '분리할 주소와 방문 당일 연락받으실 번호를 입력해 주세요. 분리 접수는 이사 예정일 전날까지 가능해요.'
            : '새로 설치할 주소와 방문 당일에 연락받을 번호를 입력해 주세요. 재설치 접수에는 이전 주소를 표시하지 않아요.',
          actions: [['주소 검색', '$address'], ['다음', 'S05']]
        },
        S05: {
          message: (isSplit ? '이사 예정일 전날까지 방문할 수 있는 날짜를 선택해 주세요.' : '새 주소에서 재설치할 수 있는 날짜를 선택해 주세요.') +
            ' 실제 비용은 제품과 설치 환경에 따라 달라질 수 있어요.',
          actions: [...changedDates, ['접수 요청', 'S06'], ['예약 가능일 없음 예시', 'S08']]
        },
        S06: { addActions: unrestrictedService },
        addressOptions: isSplit
          ? choice('기존 등록 주소에서 분리할까요, 다른 주소에서 분리할까요?', [
            ['등록 주소 사용', 'registeredAddress'], ['다른 주소 입력', 'S04']
          ], [item('등록 주소 예시', '서울 영등포구 문래동')])
          : choice('재설치할 새 주소와 희망일을 확인해 주세요.', [['주소 입력', 'S04'], ['설치 불가 지역 예시', 'S08']]),
        ...(isSplit && { registeredAddress: field('방문 당일 연락받으실 전화번호를 입력해 주세요.', ['phone'], [['다음', 'S05']]) }),
        pairAuth: splitAuth,
        pairSplitAddress: field('먼저 제품을 분리할 주소와 방문 당일 연락받을 번호를 입력해 주세요. 이사 예정일 전날까지 분리할 수 있어요.', [
          'address', 'phone', moveDate('이사 예정일', '2026-11-30'), moveDate('분리 방문 희망일', '2026-11-27')
        ], [['재설치 주소 입력', 'pairInstallAddress']]),
        pairInstallAddress: field('이사 후 재설치할 주소와 방문 정보를 입력해 주세요. 분리 접수 주소와 별도로 확인해요.', [
          'address', 'phone', moveDate('재설치 방문 희망일', '2026-12-02')
        ], [['입력 확인', 'pairReview']]),
        pairReview: choice('두 방문을 함께 신청할까요? 분리·재설치 환경에 따라 비용이 추가될 수 있어요.', [
          ['분리·재설치 접수 요청', 'pairResult'], ['뒤로', 'pairSplitAddress'], ['예약 가능일 없음 예시', 'S08']
        ]),
        pairResult: result('분리와 재설치 두 건의 예시 방문 접수를 확인했어요.', unrestrictedService, [
          item('접수 유형', '분리 방문과 재설치 방문'), item('처리 상태', '예시 접수 완료')
        ])
      }
    };
  }

  Object.assign(window.SKIX_FLOW_OVERLAYS ??= {}, {
    8: moveService(true),
    9: moveService(false),
    10: {
      screens: {
        S01: { auth: { failure: 'S09' } },
        S02: {
          message: '명의변경은 현재 계약자가 직접 신청해 주세요. 새 계약자의 성함, 연락처와 생년월일을 준비해 주세요. 개인사업자는 사업자번호도 필요해요.',
          addActions: [['필요한 서류 보기', 'transferDocuments'], ['명의변경 신청', 'S03']]
        },
        S03: { addActions: [
          ['당월 요금 또는 미납금이 있는 예시', 'S04'], ['선납 할인 또는 묶음 계약 예시', 'S05'],
          ['네이버 구독 계약 예시', 'platformOrder']
        ] },
        S04: { actions: [['미납요금 조회·납부', '@5'], ['당월 요금 납부', '@4'], ['뒤로', 'S03']] },
        S05: {
          message: '선납 할인을 받고 있거나 묶음·크로스 패키지로 할인받는 계약은 명의변경 조건을 먼저 확인해 주세요. 묶음 중 일부만 변경하면 할인 반환금이나 구독료 조정이 발생할 수 있어요.'
        },
        S06: { fields: [], kind: 'choice', actions: [
          ['개인', 'transfereePersonal'], ['개인사업자', 'transfereeBusiness'], ['법인·비영리', 'transfereePapers'],
          ['귀화·등록번호 정정 등', 'transfereePapers']
        ] },
        S07: { addActions: [['서류 안내', 'transferDocuments'], ['상담사 연결', '$handoff']] },
        S08: {
          message: '예시 명의변경 신청을 접수했어요. 실제 신청에서는 알림톡으로 이어서 필요한 절차를 안내해요.',
          addActions: [['신청 진행·취소 안내', 'transferTracking'], ['추가 문의', '$menu']]
        },
        platformOrder: result('네이버 구독 계약은 이 채팅에서 명의를 변경하기 어려워요. 구독 신청처나 상담사에게 문의해 주세요.', [
          ['상담사 연결', '$handoff'], ['뒤로', 'S03']
        ]),
        transfereePersonal: field('새 계약자의 예시 정보를 입력해 주세요. 만 19세 미만은 명의변경이 제한돼요.',
          ['name', 'phone', birthdate], [['신청 접수', 'S08'], ['뒤로', 'S06']], { secure: true }),
        transfereeBusiness: field('새 개인사업자의 예시 정보를 입력해 주세요. 휴업·폐업 상태일 때는 명의변경이 제한돼요.',
          ['name', 'phone', birthdate, companyNumber], [['신청 접수', 'S08'], ['뒤로', 'S06']], { secure: true }),
        transfereePapers: field('서류 안내를 받을 예시 연락처를 입력해 주세요. 접수 후 준비할 서류와 제출 경로를 안내해요.',
          ['phone'], [['서류 안내 확인', 'S07'], ['뒤로', 'S06']], { secure: true }),
        transferDocuments: result('신청 유형에 따라 명의변경 신청서, 사업자 확인 서류 등 대상 서류가 달라요. 서류 안내를 먼저 확인해 주세요.', [
          ['명의변경 신청', 'S03'], ['서류 상세 문의', '$handoff'], ['뒤로', 'S02']
        ], [
          item('신청 주체', '양도인인 현재 계약자'), item('추가 서류가 필요한 유형', '개인사업자·법인·비영리·명의 정정 등')
        ]),
        transferTracking: choice('접수번호를 기준으로 진행 상태를 확인해요. 이미 진행된 신청은 취소할 수 없는 상태일 수 있어요.', [
          ['진행 상태 확인', 'transferPending'], ['명의변경 신청 취소', 'transferCancelCheck'], ['상담사 연결', '$handoff']
        ]),
        transferPending: result('예시 신청이 접수되어 후속 확인을 기다리고 있어요.', [
          ['취소 가능 여부 확인', 'transferCancelCheck'], ['뒤로', 'transferTracking']
        ], [item('예시 접수번호', 'AS-261125-001')]),
        transferCancelCheck: choice('예시 접수 상태를 선택해 취소가 가능한 경우를 확인할 수 있어요.', [
          ['취소 가능한 접수 상태', 'transferCancelConfirm'], ['입력·수납·완료 대기 또는 신용조회 예외', 'transferCancelUnavailable'],
          ['완료·취소 상태로 조회할 수 없음', 'transferCancelUnavailable']
        ]),
        transferCancelConfirm: choice('선택한 예시 명의변경 신청을 취소할까요?', [
          ['취소 요청', 'transferCancelled'], ['나가기', 'transferTracking']
        ]),
        transferCancelled: result('선택한 예시 명의변경 신청이 취소됐어요.', close),
        transferCancelUnavailable: handoff('이미 완료·취소된 신청이나 입력·수납·완료 대기, 신용조회 예외 상태에서는 챗봇으로 취소하기 어려워요. 상담에서 진행 상태를 확인해 주세요.')
      }
    },
    11: {
      screens: {
        S01: { addActions: [
          ['대행업체 담당 제품 예시', 'S03'], ['목록에 없는 제품', 'unlistedProduct']
        ] },
        S02: { addActions: [['증상 직접 입력', 'customSymptom']] },
        S04: { actions: [['상담사 연결', '$handoff'], ['운영시간 외 전화 상담', 'S07']] },
        S07: {
          message: '상담 운영시간 외에는 전화 상담 예약 절차를 이용할 수 있어요. 데모에서 실제 전화는 신청되지 않아요.',
          actions: [['상담사 전화 예약', 'callback'], ['다른 문의', '$menu']]
        },
        unlistedProduct: field('제품군과 모델명을 입력해 주세요. 확인이 어려우면 제품을 다시 찾거나 상담에서 확인할 수 있어요.', ['product'], [
          ['제품 확인', 'S02'], ['뒤로', 'S01']
        ]),
        customSymptom: field('어떤 증상인지 알려 주세요.', ['symptom'], [['증상 확인', '$symptom'], ['뒤로', 'S01']]),
        callback: field('전화 상담을 받을 예시 연락처를 입력해 주세요.', ['phone'], [
          ['예시 예약 확인', 'callbackResult'], ['뒤로', 'S07']
        ]),
        callbackResult: result('예시 전화 상담 예약 절차를 마쳤어요.', close)
      }
    },
    12: {
      screens: {
        phoneConfirm: { auth: { success: 'serviceCases', failure: 'S09' } },
        S04: { actions: [['주소 검색', '$address'], ['다음', 'S05']] },
        S05: { actions: [...changedDates, ['접수 요청', 'S06'], ['예약 가능일 없음 예시', 'S09']] },
        S06: { addActions: [['접수 내역 확인', '@13'], ['다른 문의', '$menu']] },
        regAddrPass: { auth: { failure: 'S09' }, actions: [['PASS 본인인증', 'S05']] },
        serviceCases: choice('제품과 신청자 정보를 확인했어요. 방문 주소를 선택해 주세요.', [
          ['등록된 방문 주소', 'registeredServiceAddress'], ['새 주소 · 구독 제품', 'subscriptionAddress'],
          ['새 주소 · 일시불 또는 미등록 제품', 'S04'], ['예시 조회 결과 바꾸기', 'serviceExceptions']
        ], [item('등록 주소 예시', '서울 영등포구 문래동')]),
        registeredServiceAddress: field('등록 주소로 방문할 때 연락받을 전화번호를 입력해 주세요.', ['phone'], [
          ['가능한 날짜 확인', 'S05'], ['뒤로', 'serviceCases']
        ]),
        subscriptionAddress: field('구독 제품이 설치된 새 주소와 방문 당일 연락받을 번호를 입력해 주세요. 새 주소는 PASS 확인이 필요해요.', ['address', 'phone'], [
          ['다음', 'regAddrPass'], ['뒤로', 'serviceCases']
        ]),
        serviceExceptions: choice('확인할 예시 조회 결과를 선택해 주세요.', [
          ['동일 제품·증상의 진행 중 접수 있음', 'S03'], ['연체 3회 이상', 'S07'], ['서비스 불가 주소', 'S08'], ['예약 가능일 없음', 'S09'],
          ['뒤로', 'serviceCases']
        ])
      }
    },
    13: {
      screens: {
        S02: {
          message: '방문일이 가까운 접수부터 최대 5건을 확인할 수 있어요. 상세 정보를 볼 접수를 선택해 주세요.',
          actions: [
            ['직수 정수기 접수 선택', 'S03'], ['비데 재설치 접수 선택', 'S04'],
            ['예시 조회 결과 바꾸기', 'lookupCases']
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
          item('서비스 종류', '비데 재설치'), item('방문 예정일', '2026년 12월 2일(수)'), item('담당 매니저', '방문 담당 매니저'),
          item('방문 연락처', '010-••••-1234'), item('방문 주소', '서울 영등포구 문래동')
        ] },
        S06: { addActions: [['AS 방문 접수', '@12'], ['다른 문의', '$menu']] },
        lookupCases: choice('확인할 예시 고객·접수 조회 결과를 선택해 주세요.', [
          ['조회 완료 · 접수 있음', 'S02'], ['고객 정보 불일치', 'S05'], ['고객 확인 · 미처리 접수 없음', 'S06'],
          ['다계정·법인·조회 실패', 'S07']
        ])
      }
    },
    14: {
      screens: {
        S01: {
          message: '방문일이 가까운 미처리 접수를 최대 5건까지 보여드려요. 수정할 접수를 선택해 주세요.',
          addActions: [['방문일 당일 접수 예시', 'S06'], ['미처리 접수 없음 예시', 'S09'], ['고객 정보 불일치 예시', 'missingCustomer']]
        },
        S02: { actions: [
          ['방문주소', 'serviceContractType'], ['방문예정일', 'S04'], ['접수 증상', '$editSymptom'], ['방문 연락처', '$editPhone']
        ] },
        S03: { addActions: [['나가기', 'S02']] },
        S04: { actions: [...changedDates, ['변경 요청', 'S10'], ['예약 가능일 없음 예시', 'S11']] },
        S09: { addActions: [['AS 방문 접수', '@12'], ['다른 문의', '$menu']] },
        serviceContractType: choice('선택한 접수에서 제품 계약 유형에 따라 주소 변경이 달라요.', [
          ['일시불 계약 예시', 'S03'], ['구독·멤버십 계약 예시', 'S07'], ['새 주소 방문 불가 예시', 'S08'], ['뒤로', 'S02']
        ]),
        missingCustomer: noMatch('phoneInput')
      }
    },
    15: {
      screens: {
        S02: {
          message: '방문일이 가까운 미처리 접수를 최대 5건까지 보여드려요. 취소할 접수를 선택해 주세요.',
          addActions: [['방문일 당일 접수 예시', 'S07'], ['취소 대상 접수 없음 예시', 'S06'], ['고객 정보 불일치 예시', 'missingCustomer']]
        },
        S04: { addActions: [['취소 처리 실패 예시', 'S08']] },
        S05: { addActions: [['접수 내역 확인', '@13'], ['상담 종료', '$finish']] },
        missingCustomer: noMatch('S01')
      }
    },
    16: {
      screens: {
        S02: { addActions: [['예시 조회 결과 바꾸기', 'orderLookupExamples']] },
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
        orderLookupExamples: choice('확인할 예시 주문 조회 결과를 선택해 주세요.', [
          ['배송 주문 1~4건', 'S02'], ['배송 주문 없음', 'S04'],
          ['법인·다계정 또는 주문 5건 초과', 'S05'], ['인증·조회 실패', 'S06']
        ])
      }
    },
    17: {
      screens: {
        S02: {
          message: '변경할 주문을 선택해 주세요. 주문의 판매 유형과 진행 상태에 따라 처리 방법이 달라요.',
          actions: [
            ['직수 정수기 주문 선택', 'S03'], ['구독 주문 예시', 'subscriptionOrder'], ['납품생성·출고 주문 예시', 'createdOrder'],
            ['변경 가능한 주문 없음 예시', 'S11'], ['조회·변경 어려움 예시', 'S10']
          ],
          items: [item('직수 정수기 · DL-261125-001', '일시불 · 납품대기 · 11월 30일(월)')]
        },
        S04: { actions: [['주소 검색', '$address'], ['주소 확인 후 배송일 선택', 'S05'], ['나가기', 'S03']] },
        S05: {
          actions: [
            ['12월 2일(수) 선택', '$date'], ['더보기', '$moreDates'], ['변경 요청', 'deliveryReason'],
            ['배송 가능일 없음 예시', 'S10']
          ]
        },
        S06: {
          message: '설치마스터에게 전달할 내용을 입력해 주세요. 납품대기 주문이면 배송 메모에 요청 내용을 기록해요.'
        },
        S08: {
          message: '예시 배송 요청을 접수했어요. 실제 주문에서는 상태에 따라 배송 메모에 기록하거나 설치마스터에게 전달해요.'
        },
        deliveryReason: field('변경 사유를 입력해 주세요. 패키지 주문은 구성 상품 전체 주소와 날짜에 적용될 수 있어요.', [
          { label: '변경 사유', placeholder: '예: 이사 일정 변경', sample: '이사 일정 변경' }
        ], [['예시 변경 확인', 'S07'], ['뒤로', 'S05']]),
        subscriptionOrder: choice('구독 주문의 배송주소는 구독 주문처에 변경을 요청해 주세요. 배송일 문의나 설치 요청 전달을 계속할 수 있어요.', [
          ['배송주소 변경 안내', 'subscriptionAddress'], ['배송일정 수정 문의', 'S05'], ['설치마스터 전달', 'S06'], ['다른 문의', '$menu']
        ]),
        subscriptionAddress: result('구독 신청처에 배송주소 변경을 요청해 주세요. 주문처에서 변경 가능 여부와 새 설치 일정을 확인해요.', [
          ['뒤로', 'subscriptionOrder'], ['다른 문의', '$menu']
        ]),
        createdOrder: choice('납품생성 또는 출고 상태의 주문은 설치마스터를 통해 변경 가능 여부와 일정을 확인해요.', [
          ['배송주소 수정 요청', 'dispatchRequest'], ['배송일정 변경 요청', 'dispatchRequest'], ['설치마스터 전달', 'dispatchRequest'],
          ['뒤로', 'S02']
        ]),
        dispatchRequest: field('설치마스터에게 전달할 예시 요청 내용을 입력해 주세요.', ['description'], [
          ['전달 요청 확인', 'dispatchResult'], ['뒤로', 'createdOrder']
        ]),
        dispatchResult: result('예시 전달 요청을 확인했어요. 납품생성·출고 주문의 변경 결과는 설치마스터가 안내해요.', [
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
    screens.oneTimeMethods.actions.push(['할부 가능 금액 예시', 'eligibleInstallments']);
    screens.eligibleInstallments = {
      kind: 'choice',
      message: '5만원 이상 카드 납부 예시예요. 원하는 할부 기간을 선택해 주세요. 실제 선택 가능한 개월 수와 수수료는 카드사에 따라 달라요.',
      items: [item('예시 납부 금액', '59,800원')],
      actions: [['일시불', 'installmentCard'], ['2개월 할부 예시', 'installmentCard'], ['3개월 할부 예시', 'installmentCard'], ['뒤로', 'oneTimeMethods']]
    };
    screens.installmentCard = {
      kind: 'input', message: '예시 카드의 정보를 입력한 뒤 PASS에서 본인 확인을 진행해 주세요.', secure: true,
      fields: (no === 4 ? screens.S04 : screens.S05).fields,
      actions: [['PASS 본인인증', 'installmentResult'], ['뒤로', 'eligibleInstallments']],
      auth: { failure: 'S09' }
    };
    screens.installmentResult = {
      kind: 'result', message: '선택하신 기간으로 59,800원 예시 카드 납부를 완료했어요.',
      items: [item('예시 처리 상태', '납부 완료'), item('예시 납부 금액', '59,800원')],
      actions: [['다른 문의', '$menu'], ['상담 종료', '$finish']]
    };
  }
  overlays[6].screens.S04 = { addActions: [['제휴카드 이용 안내', 'S01'], ['알림톡 안내 예시', 'partnerNotification']] };
  overlays[6].screens.partnerNotification = {
    kind: 'input', message: '제휴카드 안내를 받을 예시 휴대폰 번호를 입력해 주세요. 실제 알림톡은 발송되지 않아요.',
    fields: ['phone'], actions: [['수신 확인', 'partnerNotificationResult'], ['뒤로', 'S04']]
  };
  overlays[6].screens.partnerNotificationResult = {
    kind: 'result', message: '제휴카드 안내를 받을 예시 번호를 확인했어요.',
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
        : '이사 예정일을 입력해 주세요. 재설치 방문은 이사 예정일 다음 날부터 확인할 수 있어요.',
      fields: [date('이사 예정일', '2026-11-30')], actions: [['다음', 'addressOptions'], ['뒤로', 'moveStatus']]
    };
    if (no === 9) {
      screens.S04.actions[1][1] = 'valveOption';
      screens.valveOption = {
        kind: 'choice', message: '재설치할 정수기에 조리수 밸브도 설치할까요? 추가 설치 비용은 제품과 현장 환경에 따라 달라질 수 있어요.',
        actions: [['조리수 밸브 포함', 'S05'], ['기본 재설치만', 'S05']]
      };
    }
    screens.pairSplitAddress.validate = { dateOrder: [['분리 방문 희망일', '이사 예정일']] };
  }
  overlays[12].screens.S01 = { addActions: [['긴급 증상 안내', 'urgentCase']] };
  overlays[12].screens.urgentCase = {
    kind: 'handoff', message: '빠른 확인이 필요한 증상은 상담사 안내를 이용해 주세요. 상담 운영시간 외에는 연결이 어려울 수 있어요.',
    actions: [['상담사 연결', '$handoff'], ['전화 상담 예약 안내', '@11'], ['뒤로', 'S01']]
  };
  overlays[17].screens.S03 = { addActions: [['배송 불가 주소 예시', 'S09']] };
})();




(() => {
  'use strict';
  const overlays = window.SKIX_FLOW_OVERLAYS;
  const item = (title, detail) => ({ title, detail });
  const contracts = overlays[7].screens;
  const packages = [
    { from: 'packageEstimate', id: 'packageDate', result: 'packageResult', label: '패키지 묶음', total: '149,000원' },
    { from: 'crossPackageEstimate', id: 'crossPackageDate', result: 'crossPackageResult', label: '크로스 패키지 묶음', total: '169,000원' }
  ];
  for (const { from, id, result, label, total } of packages) {
    contracts[from].actions[0][1] = id;
    contracts[id] = {
      kind: 'input', message: label + '의 해약 예정일을 선택해 주세요. 신청일에 따라 실제 위약금이 달라질 수 있어요.',
      fields: ['date'], actions: [['합산 위약금 확인', result], ['뒤로', from]]
    };
    contracts[result] = {
      kind: 'result', message: '선택한 해약 예정일을 기준으로 계산한 ' + label + '의 위약금 예시예요.',
      items: [item('예상 위약금 합계', total), item('계산 범위', '묶음에 포함된 예시 계약 2건')],
      actions: [['다른 계약 확인', 'S04'], ['위약금 내역서 안내', '@20'], ['다른 문의', '$menu']]
    };
  }
  overlays[14].screens.S03.addActions.unshift(['예약일을 변경해 계속하기', 'S04']);
  for (const no of [4, 5]) {
    const screens = overlays[no].screens;
    const transfer = no === 4 ? 'S05' : 'S05T';
    screens.oneTimeMethods.actions.push(['사업자 현금영수증 예시', 'receiptPaymentMethods']);
    screens.receiptPaymentMethods = {
      kind: 'choice',
      message: '세금계산서가 발행되지 않은 사업자 계약의 예시예요. 실시간 계좌이체 또는 가상계좌 납부에서 현금영수증을 선택할 수 있어요.',
      actions: [['실시간 계좌이체', 'receiptTransfer'], ['가상계좌', 'receiptVirtual'], ['뒤로', 'oneTimeMethods']]
    };
    const receiptChoice = (yes, no) => [['현금영수증 신청', yes], ['신청 안 함', no], ['뒤로', 'receiptPaymentMethods']];
    screens.receiptTransfer = { kind: 'choice', message: '실시간 계좌이체 납부에 현금영수증을 발행할까요?', actions: receiptChoice('receiptTransferSummary', transfer) };
    screens.receiptVirtual = { kind: 'choice', message: '가상계좌 납부에 현금영수증을 발행할까요?', actions: receiptChoice('receiptVirtualSummary', 'S06') };
    screens.receiptTransferSummary = {
      kind: 'result', message: '계약자 명의로 현금영수증을 신청하는 예시예요. 계좌 정보를 입력해 계속 진행해 주세요.',
      actions: [['실시간 계좌이체 진행', transfer], ['뒤로', 'receiptTransfer']]
    };
    screens.receiptVirtualSummary = {
      kind: 'result', message: '계약자 명의로 현금영수증을 신청하는 예시예요. 가상계좌 발급 단계를 계속 진행해 주세요.',
      actions: [['가상계좌 발급 안내', 'S06'], ['뒤로', 'receiptVirtual']]
    };
  }
})();
