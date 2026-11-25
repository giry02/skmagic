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
  const contractField = field('계약 또는 제품명', '예: 직수 정수기 계약', '직수 정수기');
  const lookupScope = '계약자 본인이나 확인 권한이 있는 법인 담당자가 조회할 수 있어요.';
  const lookupContract = (message, target) => form(message, [contractField], target, '계약 확인');
  const resolved = (fallback, rules = []) => ({ resolve: { default: fallback, rules } });
  const contractCase = (target, code, fields = [contractField.label]) => ({ target, fields, match: '^SK-' + code + '$' });
  const phoneCase = (target, suffix) => ({ target, fields: ['휴대폰 번호'], match: '^010-?0000-?' + suffix + '$' });
  const deferred = [['다른 문의', '$menu']];

  Object.assign(window.SKIX_FLOW_OVERLAYS ??= {}, {
    18: {
      screens: {
        s4: { actions: [['관계가 있어요', 's5'], ['관계가 없어요', 'alternateNumber']] },
        s5: { actions: [['배송·설치 확인', '@16'], ['계약·위약금 확인', '@7'], ['AS 접수 확인', '@13']] },
        alternateNumber: resolved('s7', [phoneCase('replaceNumber', '0002')]),
        replaceNumber: handoff('대체 연락처 변경은 관련 고객에게 연락해 확인한 뒤 처리해요. 다음 절차를 담당 상담사가 안내할 수 있어요.')
      }
    },
    19: {
      entry: 'documentIdentity',
      screens: {
        documentIdentity: auth(lookupScope + ' 문서 발송에 앞서 고객 정보를 확인해 주세요.', 's1', 's5'),
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
        billMonthlySaved: result('요청하신 문서의 정기 발송 일정을 등록했어요.', deferred, [{ title: '발송 방법', detail: '[발송 방법]' }]),
        billPeriod: form('일회 발송에 필요한 조회 시작일과 종료일을 입력해 주세요.', [dateFrom, dateTo], 'billTax'),
        billTax: choice('부가세 기준을 선택해 주세요.', [['건별', 's4'], ['총액', 's4']]),
        contractDocuments: choice('발급하실 계약 문서를 선택해 주세요.', [['구독계약서', 's3'], ['계약정보확인서', 's4']]),
        virtualDocument: lookupContract('가상계좌확인서를 받을 계약번호나 제품명을 입력해 주세요.', 'virtualDocumentStatus'),
        virtualDocumentStatus: resolved('s4', [contractCase('s6', '261125-058')])
      }
    },
    20: {
      screens: {
        s1: { actions: [['휴대폰 확인', '$auditSms']], auth: { success: 's2', failure: 's5' } },
        s2: { actions: [['계약 선택하기', 'terminationContracts']] },
        s3: { actions: [['해약 사유와 회수일 확인', 'terminationInquiryFormat']], fields: [
          field('해약 사유', '예: 제품 이용 종료', '제품 이용 종료'),
          field('희망 회수일', 'YYYY-MM-DD', '2026-11-30', 'date')
        ] },
        s4: { message: '해약 위약금 산정내역서를 어떤 방법으로 받으실까요?', delivery: { target: 's6', useRegisteredNumber: false } },
        s6: { message: '해약 위약금 산정내역서를 [발송 방법]으로 보냈어요.', items: [{ title: '발송 문서', detail: '해약 위약금 산정내역서' }] },
        terminationContracts: form('조회할 계약 또는 제품을 입력해 주세요. 여러 계약은 쉼표로 나눠 적을 수 있어요.', [
          field('조회할 계약', '예: 직수 정수기, 공기청정기', '직수 정수기')
        ], 'terminationStatus'),
        terminationStatus: resolved('s3', [contractCase('terminationFormat', '261125-021', ['조회할 계약'])]),
        terminationFormat: resolved('s4'),
        terminationInquiryFormat: resolved('terminationInquiryChannel'),
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
        s1: { actions: [['휴대폰 확인', '$auditSms']], auth: { success: 'returnContractLookup', failure: 's5' } },
        s2: { delivery: { target: 's6', useRegisteredNumber: false } },
        s3: { actions: [['확정 상태 재확인 상담', '$handoff']] },
        s4: { addActions: [['회수 일정 확인', '@36']] },
        returnContractLookup: lookupContract('해약확인서를 받을 계약번호나 제품명을 입력해 주세요.', 'returnStatus'),
        returnStatus: resolved('s2', [contractCase('s3', '261125-022'), contractCase('s4', '261125-023')])
      }
    },
    22: {
      screens: {
        s1: { actions: [['계약 제품', 'serviceIdentity'], ['일반 서비스', 's2']] },
        s2: { fields: ['name', 'phone', 'address'] },
        s3: { actions: [['일반 AS', 'servicePeriod'], ['재설치', 'servicePeriod'], ['분리', 'servicePeriod'], ['필터 서비스', 'servicePeriod']] },
        s4: { delivery: { target: 's6', useRegisteredNumber: false } },
        s6: { items: [{ title: '발송 방법', detail: '[발송 방법]' }] },
        serviceIdentity: auth(lookupScope + ' 계약을 확인해 주세요.', 's3', 's5'),
        servicePeriod: form('서비스를 받은 제품과 처리기간을 입력해 주세요.', ['product', dateFrom, dateTo], 's4')
      }
    },
    23: {
      screens: {
        s1: { actions: [['카드 결제 이력 확인', 'receiptContractLookup']] },
        receiptContractLookup: lookupContract('영수증을 받을 계약번호나 제품명을 입력해 주세요.', 'receiptAuth'),
        receiptAuth: auth('카드 결제 이력 조회를 위해 휴대폰으로 본인을 확인해 주세요.', 'receiptLookupStatus', 's6'),
        receiptLookupStatus: resolved('$receiptPicker', [contractCase('s5', '261125-024')])
      }
    },
    24: {
      entry: 'giroIdentity',
      screens: {
        giroIdentity: choice('지로·가상계좌 문서를 확인할 계약 유형을 선택해 주세요.', [
          ['계약자 휴대폰 확인', 'giroPhone'], ['법인 담당자', 'companyLookup'], ['확인 권한 없음', 's8']
        ]),
        giroPhone: auth(lookupScope, 's1', 's8'),
        companyLookup: form('새봄법인과 담당자 정보를 입력해 주세요.', [
          field('회사명', '예: 새봄법인', '새봄법인'),
          field('사업자번호', '예: 000-00-00000', '000-00-00000'),
          field('담당 부서', '예: 고객지원팀', '고객지원팀'),
          field('담당자 성함', '예: 김매직', '김매직')
        ], 'companyLookupResult'),
        companyLookupResult: resolved('s1', [{ target: 's2', fields: ['사업자번호'], match: '^000-?00-?00001$' }]),
        s1: { actions: [['지로 발송 내역', 's3'], ['지로 고지서 다시 받기', 'giroEligible'], ['가상계좌확인서 받기', 'fixedAccountState']] },
        s2: { fields: [field('전자납부번호', '예: 123456', '123456')], actions: [['전자납부번호 확인', 's1']] },
        s4: { delivery: { target: 's5', useRegisteredNumber: false } },
        s7: { actions: [['납부 방법 확인', '@5'], ['여기서 마치기', '$finish']] },
        giroEligible: lookupContract('고지서를 받을 계약번호나 제품명을 입력해 주세요.', 'giroEligibleStatus'),
        giroEligibleStatus: resolved('s4', [contractCase('s8', '261125-025')]),
        fixedAccountState: lookupContract('가상계좌확인서를 받을 계약번호나 제품명을 입력해 주세요.', 'fixedAccountStatus'),
        fixedAccountStatus: resolved('fixedAccountChannel', [contractCase('s7', '261125-058')]),
        fixedAccountChannel: {
          ...choice('기존 고정형 가상계좌확인서를 어떤 방법으로 받으실까요?', senderChannels),
          delivery: { target: 's6', useRegisteredNumber: false }
        }
      }
    },
    25: {
      screens: {
        s1: { actions: [['계약 확인', 'giroGroupContract']] },
        giroGroupContract: lookupContract('지로 고지서 설정을 확인할 계약번호나 제품명을 입력해 주세요.', 'giroGroupEligibility'),
        giroGroupEligibility: resolved('s2', [contractCase('s3', '261125-025')]),
        s2: { actions: [['한 장으로 받기', 'giroGroup'], ['계약별로 나눠 받기', 'giroSplit']] },
        s5: { actions: [['우편', 's6'], ['이메일', 's6']] },
        giroGroup: resolved('giroMergeContracts'),
        giroMergeStatus: resolved('s5', [contractCase('s4', '261125-027', ['첫 번째 계약', '두 번째 계약'])]),
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
        giroSplitAll: form('묶음을 풀 대표 계약을 입력해 주세요.', [field('대표 계약', '예: 직수 정수기', '직수 정수기')], 's5'),
        giroSplitSome: form('나누어 받을 계약을 입력해 주세요.', [field('분리할 계약', '예: 공기청정기', '공기청정기')], 's5')
      }
    },
    26: {
      screens: {
        s1: { actions: [['휴대폰 확인', '$auditSms']], auth: { success: 's2', failure: 's6' } },
        s2: { actions: [['계약 선택하기', 'mergeContracts']] },
        s3: { actions: [['계속하기', 's5'], ['여기서 마치기', '$finish']] },
        s4: { actions: [['결제정보 변경', '@3'], ['계약 다시 선택', 'mergeContracts']] },
        s7: { items: [], message: '대표 계약의 납부정보를 기준으로 통합 내용을 확인했어요.' },
        mergeContracts: {
          ...form('합칠 계약 두 건과 그중 대표 계약을 입력해 주세요.', [
          field('첫 번째 계약', '예: 직수 정수기', '직수 정수기'),
          field('두 번째 계약', '예: 공기청정기', '공기청정기'),
          field('대표 계약', '위 두 계약 중 하나', '직수 정수기')
          ], 'mergeState'),
          validate: { oneOf: { field: '대표 계약', sources: ['첫 번째 계약', '두 번째 계약'] } }
        },
        mergeState: resolved('s5', [
          contractCase('s3', '261125-026', ['첫 번째 계약', '두 번째 계약']),
          contractCase('s4', '261125-027', ['첫 번째 계약', '두 번째 계약']),
          contractCase('E7', '261125-028', ['첫 번째 계약', '두 번째 계약'])
        ])
      }
    },
    27: {
      screens: {
        s1: { actions: [['휴대폰 확인', '$auditSms']], auth: { success: 'splitLookup', failure: 's7' } },
        splitLookup: lookupContract('분리할 결제 묶음의 대표 계약번호나 제품명을 입력해 주세요.', 'splitStatus'),
        s2: { actions: [['모든 계약을 나누기', 'splitRepresentative'], ['일부 계약만 나누기', 's4']] },
        s4: { actions: [['분리할 계약 선택', 'splitSelection']] },
        splitStatus: resolved('s2', [contractCase('s3', '261125-026'), contractCase('E7', '261125-028'), contractCase('s7', '261125-000')]),
        splitRepresentative: form('전체 묶음을 풀려면 대표 계약을 확인해 주세요.', [
          field('대표 계약', '예: 직수 정수기', '직수 정수기')
        ], 'splitAllConfirm'),
        splitAllConfirm: choice('확인한 대표 계약의 묶음을 모두 분리할까요?', [
          ['전체 분리 신청', 's5'], ['다시 선택', 's2']
        ]),
        splitSelection: form('묶음에서 분리할 계약을 입력해 주세요.', [
          field('분리할 계약', '예: 공기청정기', '공기청정기')
        ], 's6', '분리 요청'),
        s5: { items: [], message: '대표 계약에 묶여 있던 계약을 모두 분리했어요.' },
        s6: { items: [], message: '요청하신 계약을 묶음에서 분리했어요.' }
      }
    },
    28: {
      entry: 'customerIdentity',
      screens: {
        customerIdentity: auth(lookupScope + ' 정보를 변경할 고객을 확인해 주세요.', 's1', 's3'),
        s1: { actions: [['계약자 휴대폰', 's2'], ['주소·사용자 정보', 'customerAddressUser'], ['계약자 유선전화', 'customerLandline'],
          ['계산서 수신 이메일', 's4'], ['개명·대표자·상호', 'customerEvidence']] },
        s4: { actions: [['수신 이메일 변경', 'emailSaved']], fields: ['email'] },
        s7: { message: '요청하신 [변경 항목]의 정보를 변경했어요.', items: [], addActions: [['다른 항목 변경', 's1']] },
        s8: { actions: [['재발송 상담', '$resendUnavailable'], ['여기서 마치기', '$finish']] },
        customerAddressUser: choice('어떤 정보를 변경하실까요?', [['계약자·사용 주소', 'customerAddress'], ['사용자 이름·연락처', 'customerUser']]),
        customerAddress: form('바꿀 제품 사용 주소를 입력해 주세요.', ['address'], 'addressSaved', '주소 변경'),
        addressSaved: result('제품 사용 주소를 변경했어요. 제품 이동이 필요하면 재설치 상담을 같이 진행할 수 있어요.', [
          ['제품도 옮겨 설치하기', 's6'], ['다른 항목 변경', 's1'], ['여기서 마치기', '$finish']
        ]),
        customerUser: form('바꿀 사용자 이름과 휴대폰 번호를 입력해 주세요.', ['name', 'phone'], 'userSaved', '사용자 정보 변경'),
        userSaved: result('사용자 이름과 연락처를 변경했어요.', [['다른 항목 변경', 's1'], ['여기서 마치기', '$finish']]),
        customerLandline: form('바꿀 계약자 전화번호를 입력해 주세요.', [
          field('유선 전화번호', '예: 02-0000-1234', '02-0000-1234', 'tel')
        ], 's7', '전화번호 변경'),
        customerEvidence: choice('확인이 필요한 변경 유형을 선택해 주세요.', [
          ['계약자 개명', 'renameEvidence'], ['대표자 변경', 'representativeEvidence'], ['상호 변경', 's5']
        ]),
        renameEvidence: handoff('계약자 개명은 신분증 사본 또는 최근 3개월 내 발급된 개명 전후가 기재된 주민등록초본과 본인 확인이 필요해요. 상담사가 제출 경로를 안내할 수 있어요.'),
        representativeEvidence: handoff('개인사업자는 본인 확인을 진행해요. 법인 대표자 변경은 사업자등록증을 확인한 뒤 처리할 수 있어요.'),
        emailSaved: result('세금계산서 수신 이메일을 변경했어요.', [
          ['이미 발행한 계산서도 받기', 's8'], ['다른 항목 변경', 's1'], ['여기서 마치기', '$finish']
        ])
      }
    },
    29: {
      screens: {
        s1: { actions: [['제 필터 배송', 'filterIdentity'], ['다른 분의 택배를 받았어요', 's6']] },
        s4: { actions: [['기존 주소로 재발송', 's5'], ['배송지 변경', 'filterChangedAddress']] },
        s7: { message: '잘못 받아보신 필터의 회수 요청 내용을 확인했어요. 회수 담당자에게 문의할 수 있어요.', actions: [['회수 담당자 상담', '$handoff'], ['여기서 마치기', '$finish']] },
        filterIdentity: auth('필터는 계약자 또는 제품 사용자에게 안내할 수 있어요. 고객 정보를 확인해 주세요.', 'filterIssue', 's8'),
        filterIssue: choice('필터 배송에서 무엇을 확인할까요?', [
          ['다음 배송 예정일', 's2'], ['배송 완료인데 미수령', 's3'], ['필터가 파손됐거나 다른 필터가 왔어요', 's4'],
          ['다음 배송 주소만 변경', 'filterAddressOnly']
        ]),
        filterChangedAddress: form('필터를 다시 받을 주소를 입력해 주세요.', ['address'], 's5', '재발송 요청'),
        filterAddressOnly: form('앞으로 필터를 받을 주소를 입력해 주세요.', ['address'], 'filterAddressSaved', '주소 변경'),
        filterAddressSaved: result('필터 배송 주소를 변경했어요.', deferred)
      }
    },
    30: {
      screens: {
        s1: { actions: [['휴대폰 확인', '$auditSms']], auth: { success: 'careLookup', failure: 's7' } },
        careLookup: lookupContract('방문 일정을 확인할 계약번호나 제품명을 입력해 주세요.', 'careStatus'),
        s2: { actions: [['방문 날짜 변경·미리 점검', 's5'], ['방문 담당자 연락 요청', 's5'], ['연락처 변경', 's6'], ['주소 변경', 'careAddress']] },
        s4: { actions: [['요금 납부 안내', 'E7'], ['나중에 확인', '$finish']] },
        s5: { actions: [['관할 지국 연락 요청', 'careRequested'], ['상담사 연결', 'E8']] },
        careStatus: resolved('s2', [contractCase('s3', '261125-030'), contractCase('s4', '261125-031')]),
        careAddress: form('바꿀 케어 서비스 주소를 입력해 주세요.', ['address'], 'careAddressSaved', '주소 변경'),
        careAddressSaved: result('케어 서비스 주소를 변경했어요.', [['다음 방문 일정 확인', 's2'], ['여기서 마치기', '$finish']]),
        careRequested: result('방문 및 연락 요청 내용을 확인했어요. 관할 지국에서 조율하는 업무예요.', deferred)
      }
    },
    31: {
      screens: {
        s2: { fields: ['product'], actions: [['희망 제품 확인', 'applicationStatus']] },
        s3: { fields: ['product'], actions: [['교체 제품 확인', 'replacementConsultation']] },
        s4: { message: '판매처에 사전 접수된 상담이 있어요. 판매처에 추가 상담을 요청할 수 있어요.' },
        s6: { message: '법인 견적은 담당 부서에서 확인해요. 법인과 필요한 제품을 상담 담당자에게 안내하시면 견적 상담을 이어갈 수 있어요.' },
        applicationStatus: choice('같은 제품의 가입 상담을 판매처에 신청하신 적이 있나요?', [
          ['판매처에 상담 요청을 했어요', 's4'], ['아직 상담을 신청하지 않았어요', 's5']
        ]),
        replacementConsultation: handoff('기존 구독 또는 멤버십 제품 교체는 계약기간과 계약 상태를 확인한 뒤 담당처를 정해요. 상담 요청으로 이어갈 수 있어요.', [
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
        membershipEligibility: resolved('s5', [
          { target: 's4', fields: ['제품 제조번호'], match: '^SKIX-2019-0123$' },
          { target: 's3', fields: ['제품 제조번호'], match: '^SKIX-2022-0123$' },
          { target: 'E6', fields: ['제품 제조번호'], match: '^SKIX-2026-0000$' }
        ]),
        membershipTerms: result('멤버십은 1년 단위로 갱신되며 설치일이나 제조일부터 최대 7년까지 연장돼요. 정기 필터교체 외 AS, 이동, 분리, 재설치에는 비용이 발생할 수 있어요.', [
          ['가입 상담 안내', 's6'], ['여기서 마치기', '$finish']
        ])
      }
    },
    33: {
      screens: {
        s3: { fields: ['phone', 'name'], actions: [['연락한 담당자 확인', 'callbackLookup']] },
        s6: { message: '담당자에게 다시 연락을 요청할 내용을 확인했어요. 안내받을 번호는 [마스킹된 번호]예요.' },
        callbackLookup: resolved('s5', [phoneCase('s4', '0000')])
      }
    },
    34: {
      screens: {
        s2: { fields: ['phone', 'name', 'address'], actions: [['접수 조회', 'visitLookup']] },
        s3: { fields: ['name', 'address'], actions: [['맞는 접수 확인', 's4']] },
        s6: { message: '방문 전 별도 연락 요청 내용을 확인했어요. 연락 시간은 담당 매니저가 확인해요.' },
        visitLookup: resolved('s4', [phoneCase('s3', '0002'), phoneCase('visitNotFound', '0000')]),
        visitNotFound: exception('확인할 수 있는 방문 접수가 없어요. 접수 내역 또는 다시 방문 신청을 확인할 수 있어요.', [
          ['AS 접수 내역 확인', '@13'], ['새 방문 접수', '@12'], ['다른 문의', '$menu']
        ])
      }
    },
    35: {
      screens: {
        s2: { fields: ['product'], actions: [['제품 확인', 'serviceSaleType']] },
        s3: { message: '직수 정수기 기준 기본 비용이에요. 적용 비용은 해당 제품과 판매유형, 계약 상태에 따라 달라요.', addActions: [['서비스 비용 적용 기준 보기', 'servicePricing']] },
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
        s8: { message: '방문 담당자에게 전달할 요청 내용을 확인했어요. 일정 변경 가능 여부는 방문 담당자가 확인해요.' },
        returnContractState: resolved('s4', [contractCase('s3', '261125-036'), contractCase('returnNotFound', '261125-000')]),
        returnNotFound: handoff('제품 회수 계약과 일정은 담당 상담사가 확인할 수 있어요.'),
        returnDateCheck: resolved('s6', [contractCase('returnNote', '261125-037'), contractCase('returnNote', '261125-038')]),
        returnNote: form('방문 담당자에게 전달할 요청을 입력해 주세요.', ['description'], 's8', '전달 요청'),
        returnLaterSaved: result('회수 요청일을 12월 3일(목)로 변경했어요.', deferred, [{ title: '회수 요청일', detail: '12월 3일(목)' }])
      }
    }
  });
})();
