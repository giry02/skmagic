(() => {
  'use strict';

  const choice = (message, actions) => ({ kind: 'choice', message, actions });
  const field = (label, placeholder, sample, type = 'text') => ({ label, placeholder, sample, type });
  const form = (message, fields, target, label = '확인') => ({ kind: 'input', message, fields, actions: [[label, target]] });
  const auth = (message, success, failure) => ({
    ...choice(message, [['휴대폰 확인', '$auditSms'], ['계약을 확인할 수 없어요', failure]]),
    auth: { success, failure }
  });
  const handoff = (message, actions = [['상담사 연결', '$handoff']]) => ({ kind: 'handoff', message, actions });
  const result = (message, actions = [], items = []) => ({ kind: 'result', message, actions, items, demo: true });
  const exception = (message, actions) => ({ kind: 'exception', message, actions });
  const senderChannels = [['알림톡', '$delivery'], ['이메일', '$delivery'], ['팩스', '$delivery']];
  const dateFrom = field('시작일', 'YYYY-MM-DD', '2026-11-01', 'date');
  const dateTo = field('종료일', 'YYYY-MM-DD', '2026-11-25', 'date');
  const contractField = field('계약 또는 제품명', '예: 직수 정수기 계약', '직수 정수기');
  const lookupScope = '계약자 본인이나 확인 권한이 있는 법인 담당자는 예시 조회를 진행할 수 있어요.';
  const deferred = [['다른 문의', '$menu']];

  Object.assign(window.SKIX_FLOW_OVERLAYS ??= {}, {
    18: {
      screens: {
        s4: { actions: [['관계가 있어요', 's5'], ['관계가 없어요', 'alternateNumber']] },
        s5: { actions: [['배송·설치 확인', '@16'], ['계약·위약금 확인', '@7'], ['AS 접수 확인', '@13']] },
        alternateNumber: choice('잘못 전달된 연락을 확인했어요. 관련 고객에게 확인할 수 있는 대체 연락처가 있나요?', [
          ['대체 연락처가 있어요', 'replaceNumber'], ['대체 연락처가 없어요', 's7']
        ]),
        replaceNumber: handoff('대체 연락처 변경은 관련 고객에게 연락해 확인한 뒤 처리해요. 다음 절차를 담당 상담사가 안내할 수 있어요.')
      }
    },
    19: {
      entry: 'documentIdentity',
      screens: {
        documentIdentity: auth(lookupScope + ' 문서 발송에 앞서 예시 고객 정보를 확인해 주세요.', 's1', 's5'),
        s1: { actions: [['청구·수납 문서', 'billDocuments'], ['계약서·계약정보확인서', 'contractDocuments'], ['가상계좌확인서', 'virtualDocument']] },
        s2: { actions: [['일회 발송', 'billPeriod'], ['정기 발송일 선택', 'billMonthly']] },
        s4: { actions: senderChannels, delivery: { target: 's7', useRegisteredNumber: false } },
        s7: { items: [{ title: '발송 방법', detail: '[발송 방법]' }] },
        billDocuments: choice('어떤 청구·수납 문서가 필요하신가요?', [
          ['청구서', 's2'], ['상세 청구서', 'billPeriod'], ['완납증명서', 'billPeriod'],
          ['수납내역서', 'billAdvance'], ['미납내역서', 'billProvisional'], ['구독계획표', 'billPeriod'],
          ['부채증명서', 'billProvisional']
        ]),
        billAdvance: choice('수납내역서에 선수금을 포함할까요?', [['포함', 's2'], ['제외', 's2']]),
        billProvisional: choice('문서에 가해약 계약을 포함할까요?', [['포함', 'billPeriod'], ['제외', 'billPeriod']]),
        billMonthly: choice('정기 발송일을 선택해 주세요.', [3, 10, 20, 25].map((day) => ['매월 ' + day + '일', 'billMonthlyTax'])),
        billMonthlyTax: choice('정기 발송 문서의 부가세 기준을 선택해 주세요.', [['건별', 'billMonthlyChannel'], ['총액', 'billMonthlyChannel']]),
        billMonthlyChannel: {
          ...choice('정기 발송 문서를 어떤 방법으로 받으실까요?', senderChannels),
          delivery: { target: 'billMonthlySaved', useRegisteredNumber: false }
        },
        billMonthlySaved: result('요청하신 예시 문서의 정기 발송 일정을 등록했어요.', deferred, [{ title: '발송 방법', detail: '[발송 방법]' }]),
        billPeriod: form('일회 발송에 필요한 조회 시작일과 종료일을 입력해 주세요.', [dateFrom, dateTo], 'billTax'),
        billTax: choice('부가세 기준을 선택해 주세요.', [['건별', 's4'], ['총액', 's4']]),
        contractDocuments: choice('발급하실 계약 문서를 선택해 주세요.', [['구독계약서', 's3'], ['계약정보확인서', 's4']]),
        virtualDocument: choice('가상계좌확인서는 발급 이력이 있는 계약에서 받을 수 있어요. 예시 계약의 조건을 선택해 주세요.', [
          ['가상계좌 발급 이력 있음', 's4'], ['발급 이력 없음', 's6']
        ])
      }
    },
    20: {
      screens: {
        s1: { actions: [['휴대폰 확인', '$auditSms'], ['계약을 확인할 수 없어요', 's5']], auth: { success: 's2', failure: 's5' } },
        s2: { actions: [['계약 선택하기', 'terminationContracts']] },
        s3: { actions: [['해약 사유와 회수일 확인', 'terminationInquiryFormat']], fields: [
          field('해약 사유', '예: 제품 이용 종료', '제품 이용 종료'),
          field('희망 회수일', 'YYYY-MM-DD', '2026-11-30', 'date')
        ] },
        s4: { message: '해약 위약금 산정내역서를 어떤 방법으로 받으실까요?', delivery: { target: 's6', useRegisteredNumber: false } },
        s6: { message: '해약 위약금 산정내역서를 [발송 방법]으로 보냈어요.', items: [{ title: '발송 문서', detail: '해약 위약금 산정내역서' }] },
        terminationContracts: form('조회할 예시 계약 또는 제품을 입력해 주세요. 여러 계약은 쉼표로 나눠 적을 수 있어요.', [
          field('조회할 계약', '예: 직수 정수기, 공기청정기', '직수 정수기')
        ], 'terminationStatus'),
        terminationStatus: choice('해약 신청 여부에 따라 문서가 달라요. 예시 계약의 확인 상태를 선택해 주세요.', [
          ['해약 신청 전 · 위약금 문의내역서', 's3'], ['해약 신청 완료 · 위약금 산정내역서', 'terminationFormat']
        ]),
        terminationFormat: choice('선택한 계약 수에 맞는 출력방식을 선택해 주세요.', [
          ['1건 · 개별출력', 's4'], ['2건 이상 · 통합출력', 's4']
        ]),
        terminationInquiryFormat: choice('선택한 계약 수에 맞는 출력방식을 선택해 주세요.', [
          ['1건 · 개별출력', 'terminationInquiryChannel'], ['2건 이상 · 통합출력', 'terminationInquiryChannel']
        ]),
        terminationInquiryChannel: {
          ...choice('해약 위약금 문의내역서를 어떤 방법으로 받으실까요?', senderChannels),
          delivery: { target: 'terminationInquirySent', useRegisteredNumber: false }
        },
        terminationInquirySent: result('해약 위약금 문의내역서를 [발송 방법]으로 보냈어요.', deferred, [
          { title: '발송 문서', detail: '해약 위약금 문의내역서' }
        ])
      }
    },
    21: {
      screens: {
        s1: { actions: [['휴대폰 확인', '$auditSms'], ['계약을 확인할 수 없어요', 's5']], auth: { success: 'returnStatus', failure: 's5' } },
        s2: { delivery: { target: 's6', useRegisteredNumber: false } },
        s3: { actions: [['확정 상태 재확인 상담', '$handoff']] },
        s4: { addActions: [['회수 일정 확인', '@36']] },
        returnStatus: choice('제품 회수와 해약 확정 여부에 따라 발급 가능 시점이 달라요. 예시 조회 상태를 선택해 주세요.', [
          ['해약 확정', 's2'], ['제품 회수 완료 · 해약 확정 전', 's3'], ['제품 회수 전', 's4']
        ])
      }
    },
    22: {
      screens: {
        s1: { actions: [['계약 제품', 'serviceIdentity'], ['일반 서비스', 's2']] },
        s2: { fields: ['name', 'phone', 'address'] },
        s3: { actions: [['일반 AS', 'servicePeriod'], ['재설치', 'servicePeriod'], ['분리', 'servicePeriod'], ['필터 서비스', 'servicePeriod']] },
        s4: { delivery: { target: 's6', useRegisteredNumber: false } },
        s6: { items: [{ title: '발송 방법', detail: '[발송 방법]' }] },
        serviceIdentity: auth(lookupScope + ' 예시 계약을 확인해 주세요.', 's3', 's5'),
        servicePeriod: form('서비스를 받은 제품과 처리기간을 입력해 주세요.', ['product', dateFrom, dateTo], 's4')
      }
    },
    23: {
      screens: {
        s1: { addActions: [['결제내역이 조회되지 않아요', 's5'], ['계약을 확인할 수 없어요', 's6']] }
      }
    },
    24: {
      entry: 'giroIdentity',
      screens: {
        giroIdentity: choice('지로·가상계좌 문서를 확인할 예시 계약 유형을 선택해 주세요.', [
          ['계약자 휴대폰 확인', 'giroPhone'], ['법인 담당자', 'companyLookup'], ['확인 권한 없음', 's8']
        ]),
        giroPhone: auth(lookupScope, 's1', 's8'),
        companyLookup: form('예시 법인과 담당자 정보를 입력해 주세요.', [
          field('회사명', '예: 예시 법인', '예시 법인'),
          field('사업자번호', '예: 000-00-00000', '000-00-00000'),
          field('담당 부서', '예: 고객지원팀', '고객지원팀'),
          field('담당자 성함', '예: 김매직', '김매직')
        ], 'companyLookupResult'),
        companyLookupResult: choice('법인 사업자번호로 예시 지로 계약을 확인했어요. 검색 결과 조건을 선택해 주세요.', [
          ['계약 확인됨', 's1'], ['사업자번호로 조회 불가', 's2']
        ]),
        s1: { actions: [['지로 발송 내역', 's3'], ['지로 고지서 다시 받기', 'giroEligible'], ['가상계좌확인서 받기', 'fixedAccountState']] },
        s2: { fields: [field('전자납부번호', '예: 123456', '123456')], actions: [['전자납부번호 확인', 's1']] },
        s4: { delivery: { target: 's5', useRegisteredNumber: false } },
        s7: { actions: [['납부 방법 확인', '@5'], ['여기서 마치기', '$finish']] },
        giroEligible: choice('이미지 고지서는 지로로 납부 중인 예시 계약에서 한 번 다시 받을 수 있어요.', [
          ['지로 납부 계약', 's4'], ['다른 납부수단을 사용 중이에요', 's8']
        ]),
        fixedAccountState: choice('고정형 가상계좌가 발급된 예시 계약을 선택해 주세요.', [
          ['기존 가상계좌 있음', 'fixedAccountChannel'], ['기존 가상계좌 없음', 's7']
        ]),
        fixedAccountChannel: {
          ...choice('기존 고정형 가상계좌확인서를 어떤 방법으로 받으실까요?', senderChannels),
          delivery: { target: 's6', useRegisteredNumber: false }
        }
      }
    },
    25: {
      screens: {
        s1: { actions: [['법인 지로 납부 계약', 's2'], ['지로 납부 계약이 아니에요', 's3']] },
        s2: { actions: [['한 장으로 받기', 'giroGroup'], ['계약별로 나눠 받기', 'giroSplit']] },
        s5: { actions: [['우편', 's6'], ['이메일', 's6']] },
        giroGroup: choice('한 장으로 받으려면 선택한 계약의 납부정보가 같아야 해요. 예시 계약 상태를 선택해 주세요.', [
          ['납부정보가 같은 계약', 'giroMergeContracts'], ['납부정보가 다른 계약', 's4']
        ]),
        giroMergeContracts: {
          ...form('한 장으로 받을 예시 계약 두 건과 대표 계약을 입력해 주세요.', [
            field('첫 번째 계약', '예: 직수 정수기', '직수 정수기'),
            field('두 번째 계약', '예: 공기청정기', '공기청정기'),
            field('대표 계약', '위 두 계약 중 하나', '직수 정수기')
          ], 's5'),
          validate: { oneOf: { field: '대표 계약', sources: ['첫 번째 계약', '두 번째 계약'] } }
        },
        giroSplit: choice('기존에 함께 발행되는 지로 고지서를 나누어 받으시겠어요?', [
          ['대표 계약의 묶음 전체 풀기', 'giroSplitAll'], ['일부 계약만 분리', 'giroSplitSome']
        ]),
        giroSplitAll: form('묶음을 풀 예시 대표 계약을 입력해 주세요.', [field('대표 계약', '예: 직수 정수기', '직수 정수기')], 's5'),
        giroSplitSome: form('나누어 받을 예시 계약을 입력해 주세요.', [field('분리할 계약', '예: 공기청정기', '공기청정기')], 's5')
      }
    },
    26: {
      screens: {
        s1: { actions: [['휴대폰 확인', '$auditSms'], ['지로 납부 계약', 'E7'], ['계약을 확인할 수 없어요', 's6']], auth: { success: 's2', failure: 's6' } },
        s2: { actions: [['계약 선택하기', 'mergeContracts']] },
        s3: { actions: [['계속하기', 's5'], ['여기서 마치기', '$finish']] },
        s4: { actions: [['결제정보 변경', '@3'], ['계약 다시 선택', 'mergeContracts']] },
        s7: { items: [], message: '선택하신 계약을 대표 계약의 예시 납부정보로 묶었어요.' },
        mergeContracts: {
          ...form('합칠 계약 두 건과 그중 대표 계약을 입력해 주세요.', [
          field('첫 번째 계약', '예: 직수 정수기', '직수 정수기'),
          field('두 번째 계약', '예: 공기청정기', '공기청정기'),
          field('대표 계약', '위 두 계약 중 하나', '직수 정수기')
          ], 'mergeState'),
          validate: { oneOf: { field: '대표 계약', sources: ['첫 번째 계약', '두 번째 계약'] } }
        },
        mergeState: choice('카드나 계좌 등 등록된 납부정보가 동일한 계약을 통합할 수 있어요. 예시 계약의 확인 상태를 선택해 주세요.', [
          ['납부정보가 같아요', 's5'], ['오늘 결제 시도일이에요', 's3'],
          ['납부정보가 달라요', 's4'], ['지로 납부 계약', 'E7']
        ])
      }
    },
    27: {
      screens: {
        s1: { actions: [['휴대폰 확인', '$auditSms'], ['지로 납부 계약', 'E7'], ['계약을 확인할 수 없어요', 's7']], auth: { success: 'splitStatus', failure: 's7' } },
        s2: { actions: [['모든 계약을 나누기', 'splitRepresentative'], ['일부 계약만 나누기', 's4']] },
        s4: { actions: [['분리할 계약 선택', 'splitSelection']] },
        splitStatus: choice('분리 가능한 예시 계약 묶음을 확인했어요. 오늘 납부가 시도되는 계약인가요?', [
          ['일반 분리 가능 계약', 's2'], ['오늘 결제 시도일', 's3']
        ]),
        splitRepresentative: form('전체 묶음을 풀려면 대표 계약을 확인해 주세요.', [
          field('대표 계약', '예: 직수 정수기', '직수 정수기')
        ], 'splitAllConfirm'),
        splitAllConfirm: choice('확인한 대표 계약의 예시 묶음을 모두 분리할까요?', [
          ['전체 분리 신청', 's5'], ['다시 선택', 's2']
        ]),
        splitSelection: form('묶음에서 분리할 예시 계약을 입력해 주세요.', [
          field('분리할 계약', '예: 공기청정기', '공기청정기')
        ], 's6', '분리 요청'),
        s5: { items: [], message: '대표 계약에 묶여 있던 예시 계약을 모두 분리했어요.' },
        s6: { items: [], message: '요청하신 예시 계약을 묶음에서 분리했어요.' }
      }
    },
    28: {
      entry: 'customerIdentity',
      screens: {
        customerIdentity: auth(lookupScope + ' 정보를 변경할 예시 고객을 확인해 주세요.', 's1', 's3'),
        s1: { actions: [['계약자 휴대폰', 's2'], ['주소·사용자 정보', 'customerAddressUser'], ['계약자 유선전화', 'customerLandline'],
          ['계산서 수신 이메일', 's4'], ['개명·대표자·상호', 'customerEvidence'], ['권한을 확인할 수 없어요', 's3']] },
        s4: { actions: [['수신 이메일 변경', 'emailSaved']], fields: ['email'] },
        s7: { message: '요청하신 [변경 항목]의 예시 정보를 변경했어요.', items: [], addActions: [['다른 항목 변경', 's1']] },
        s8: { actions: [['재발송 상담', '$resendUnavailable'], ['여기서 마치기', '$finish']] },
        customerAddressUser: choice('어떤 정보를 변경하실까요?', [['계약자·사용 주소', 'customerAddress'], ['사용자 이름·연락처', 'customerUser']]),
        customerAddress: form('바꿀 예시 제품 사용 주소를 입력해 주세요.', ['address'], 'addressSaved', '주소 변경'),
        addressSaved: result('예시 제품 사용 주소를 변경했어요. 제품 이동이 필요하면 재설치 상담을 같이 진행할 수 있어요.', [
          ['제품도 옮겨 설치하기', 's6'], ['다른 항목 변경', 's1'], ['여기서 마치기', '$finish']
        ]),
        customerUser: form('바꿀 예시 사용자 이름과 휴대폰 번호를 입력해 주세요.', ['name', 'phone'], 'userSaved', '사용자 정보 변경'),
        userSaved: result('예시 사용자 이름과 연락처를 변경했어요.', [['다른 항목 변경', 's1'], ['여기서 마치기', '$finish']]),
        customerLandline: form('바꿀 예시 계약자 전화번호를 입력해 주세요.', [
          field('유선 전화번호', '예: 02-0000-1234', '02-0000-1234', 'tel')
        ], 's7', '전화번호 변경'),
        customerEvidence: choice('확인이 필요한 변경 유형을 선택해 주세요.', [
          ['계약자 개명', 'renameEvidence'], ['대표자 변경', 'representativeEvidence'], ['상호 변경', 's5']
        ]),
        renameEvidence: handoff('계약자 개명은 신분증 사본 또는 최근 3개월 내 발급된 개명 전후가 기재된 주민등록초본과 본인 확인이 필요해요. 상담사가 제출 경로를 안내할 수 있어요.'),
        representativeEvidence: handoff('개인사업자는 본인 확인을 진행해요. 법인 대표자 변경은 사업자등록증을 확인한 뒤 처리할 수 있어요.'),
        emailSaved: result('예시 세금계산서 수신 이메일을 변경했어요.', [
          ['이미 발행한 계산서도 받기', 's8'], ['다른 항목 변경', 's1'], ['여기서 마치기', '$finish']
        ])
      }
    },
    29: {
      screens: {
        s1: { actions: [['제 필터 배송', 'filterIdentity'], ['다른 분의 택배를 받았어요', 's6']] },
        s4: { actions: [['기존 주소로 재발송', 's5'], ['배송지 변경', 'filterChangedAddress']] },
        s7: { message: '잘못 받아보신 필터의 회수 요청을 담당자에게 전달하는 예시 단계예요.', actions: [['회수 담당자 상담', '$handoff'], ['여기서 마치기', '$finish']] },
        filterIdentity: auth('필터는 계약자 또는 제품 사용자에게 안내할 수 있어요. 예시 고객 정보를 확인해 주세요.', 'filterIssue', 's8'),
        filterIssue: choice('필터 배송에서 무엇을 확인할까요?', [
          ['다음 배송 예정일', 's2'], ['배송 완료인데 미수령', 's3'], ['필터가 파손됐거나 다른 필터가 왔어요', 's4'],
          ['다음 배송 주소만 변경', 'filterAddressOnly']
        ]),
        filterChangedAddress: form('필터를 다시 받을 예시 주소를 입력해 주세요.', ['address'], 's5', '재발송 요청'),
        filterAddressOnly: form('앞으로 필터를 받을 예시 주소를 입력해 주세요.', ['address'], 'filterAddressSaved', '주소 변경'),
        filterAddressSaved: result('예시 필터 배송 주소를 변경했어요.', deferred)
      }
    },
    30: {
      screens: {
        s1: { actions: [['휴대폰 확인', '$auditSms'], ['계약을 확인할 수 없어요', 's7']], auth: { success: 'careStatus', failure: 's7' } },
        s2: { actions: [['방문 날짜 변경·미리 점검', 's5'], ['방문 담당자 연락 요청', 's5'], ['연락처 변경', 's6'], ['주소 변경', 'careAddress']] },
        s4: { actions: [['요금 납부 안내', 'E7'], ['나중에 확인', '$finish']] },
        s5: { actions: [['관할 지국 연락 요청', 'careRequested'], ['상담사 연결', 'E8']] },
        careStatus: choice('예시 케어 계약의 방문 상태를 선택해 주세요.', [
          ['이번 달 방문이 있어요', 's2'], ['방문이 아직 배정되지 않았어요', 's3'], ['미납으로 방문 요청이 제한됐어요', 's4']
        ]),
        careAddress: form('바꿀 예시 케어 서비스 주소를 입력해 주세요.', ['address'], 'careAddressSaved', '주소 변경'),
        careAddressSaved: result('예시 케어 서비스 주소를 변경했어요.', [['다음 방문 일정 확인', 's2'], ['여기서 마치기', '$finish']]),
        careRequested: result('예시 연락 요청을 관할 지국에 전달하는 단계가 완료됐어요.', deferred)
      }
    },
    31: {
      screens: {
        s2: { fields: ['product'], actions: [['희망 제품 확인', 'applicationStatus']] },
        s3: { fields: ['product'], actions: [['교체 제품 확인', 'replacementConsultation']] },
        s4: { message: '판매처에 사전 접수된 예시 상담이 있어요. 판매처에 추가 상담을 요청할 수 있어요.' },
        s6: { message: '법인 견적은 담당 부서에서 확인해요. 법인과 필요한 제품을 상담 담당자에게 안내하시면 견적 상담을 이어갈 수 있어요.' },
        applicationStatus: choice('가입 상담은 접수 이력에 따라 담당처가 달라요. 예시 접수 상태를 선택해 주세요.', [
          ['판매처에 접수한 적 있어요', 's4'], ['판매처 접수 이력이 없어요', 's5'], ['가입 조건 확인이 더 필요해요', 'E6']
        ]),
        replacementConsultation: handoff('기존 구독 또는 멤버십 제품 교체는 계약기간과 계약 상태를 확인한 뒤 담당처를 정해요. 예시 상담 요청으로 이어갈 수 있어요.', [
          ['교체 상담 요청', '$handoff'], ['여기서 마치기', '$finish']
        ])
      }
    },
    32: {
      screens: {
        s2: { actions: [['제품 제조번호 확인', 'membershipEligibility']], fields: [
          field('제품 제조번호', '예: SKIX-2026-0123', 'SKIX-2026-0123')
        ] },
        s5: { addActions: [['계약·관리 조건 확인', 'membershipTerms']] },
        membershipEligibility: choice('설치·제조 시점과 기존 구독 상태에 따라 가입 조건이 달라요. 예시 조회 결과를 선택해 주세요.', [
          ['제조 후 6년 이내 · 가입 검토 가능', 's5'], ['제조 후 6년이 지났어요', 's4'],
          ['만기월 방문 담당자 안내 대상', 's3'], ['본인 확인 또는 동의가 어려워요', 'E6']
        ]),
        membershipTerms: result('멤버십은 1년 단위로 갱신되며 설치일이나 제조일부터 최대 7년까지 연장돼요. 정기 필터교체 외 AS, 이동, 분리, 재설치에는 비용이 발생할 수 있어요.', [
          ['가입 상담 안내', 's6'], ['여기서 마치기', '$finish']
        ])
      }
    },
    33: {
      screens: {
        s3: { fields: ['phone', 'name'], actions: [['연락한 담당자 확인', 'callbackLookup']] },
        s6: { message: '담당자에게 다시 연락해 달라고 전달하는 예시 절차가 완료됐어요. 안내받을 번호는 [마스킹된 번호]예요.' },
        callbackLookup: choice('이전 연락 이력에서 담당자를 찾은 예시 결과를 선택해 주세요.', [
          ['이전에 연락한 담당자가 있어요', 's5'], ['이전 담당자를 확인할 수 없어요', 's4']
        ])
      }
    },
    34: {
      screens: {
        s2: { fields: ['phone', 'name', 'address'], actions: [['접수 조회', 'visitLookup']] },
        s3: { fields: ['name', 'address'], actions: [['맞는 접수 확인', 's4']] },
        s6: { message: '방문 전 별도 연락 요청을 담당 사업장에 전달하는 예시 단계가 완료됐어요. 연락 시간은 담당 매니저가 확인해요.' },
        visitLookup: choice('요청하신 AS 접수의 예시 조회 결과를 선택해 주세요.', [
          ['방문 예정 접수가 있어요', 's4'], ['같은 전화번호로 조회 결과가 여러 건이에요', 's3'], ['예정된 접수가 없어요', 'visitNotFound']
        ]),
        visitNotFound: exception('확인할 수 있는 예시 방문 접수가 없어요. 접수 내역 또는 다시 방문 신청을 확인할 수 있어요.', [
          ['AS 접수 내역 확인', '@13'], ['새 방문 접수', '@12'], ['다른 문의', '$menu']
        ])
      }
    },
    35: {
      screens: {
        s2: { fields: ['product'], actions: [['제품 확인', 'serviceSaleType']] },
        s3: { message: '직수 정수기 예시로 기본 비용을 보여드려요. 적용 비용은 해당 제품과 판매유형, 계약 상태에 따라 달라요.', addActions: [['서비스 비용 적용 기준 보기', 'servicePricing']] },
        s5: { message: 'AS 비용은 보증·계약 상태와 고장 원인에 따라 달라요. 부품이 필요한 경우 방문 점검 후 정확한 비용을 안내받을 수 있어요.', addActions: [['서비스 비용 적용 기준 보기', 'servicePricing']] },
        serviceSaleType: choice('제품의 판매 또는 이용 유형을 알려 주세요.', [
          ['구독·멤버십 제품', '$costResult'], ['일시불 구매 제품', '$costResult'], ['판매 유형을 모르겠어요', '$costResult']
        ]),
        servicePricing: result('이전설치 비용은 제품과 판매유형, 계약 상태에 따라 달라요. AS는 보증 여부와 방문·수리 내용에 따라 달라요. 접수 시 적용 비용을 확인할 수 있어요.', [
          ['서비스 접수 안내', 's7'], ['비용 안내로 마치기', '$finish']
        ])
      }
    },
    36: {
      screens: {
        s2: { fields: [contractField], actions: [['회수 계약 조회', 'returnContractState']] },
        s3: { addActions: [['납부 방법 확인', '@4'], ['다른 문의', '$menu']] },
        s5: { actions: [['회수일 변경', 'returnDateCheck'], ['방문 담당자에게 전달', 'returnNote'], ['일정만 확인', '$finish']] },
        s6: { kind: 'choice', fields: [], actions: [['12월 2일(수)', 's7'], ['12월 3일(목)', 'returnLaterSaved']] },
        s8: { message: '방문 담당자에게 요청을 전달하는 예시 절차가 완료됐어요. 일정 변경 가능 여부는 방문 담당자가 확인해요.' },
        returnContractState: choice('정산금 반영 여부에 따라 회수일을 확인할 수 있어요. 예시 회수 계약의 상태를 선택해 주세요.', [
          ['정산금 입금 대기', 's3'], ['해약 접수됨 · 회수 일정 확인', 's4'], ['회수 계약을 확인할 수 없어요', 'returnNotFound']
        ]),
        returnNotFound: handoff('제품 회수 계약과 일정은 담당 상담사가 확인할 수 있어요.'),
        returnDateCheck: choice('당일 회수 건은 물류 담당자에게 전달하고, 예정일이 남아 있으면 예약 가능한 날짜를 확인할 수 있어요.', [
          ['회수가 오늘 예정이에요', 'returnNote'], ['회수가 이후 예정이에요', 's6'], ['예약 가능일이 없어요', 'returnNote']
        ]),
        returnNote: form('방문 담당자에게 전달할 예시 요청을 입력해 주세요.', ['description'], 's8', '전달 요청'),
        returnLaterSaved: result('예시 회수 요청일을 12월 3일(목)로 변경했어요.', deferred, [{ title: '회수 요청일', detail: '12월 3일(목)' }])
      }
    }
  });
})();
