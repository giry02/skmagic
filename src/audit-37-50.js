(() => {
  "use strict";

  const choice = (message, actions) => ({ kind: "choice", message, actions });
  const input = (message, fields, action, target) => ({ kind: "input", message, fields, actions: [[action, target]] });
  const lookup = (message, fields, action, target) => ({ ...input(message, fields, action, target), lookupOnSubmit: true });
  const result = (message, items = [], actions = []) => ({ kind: "result", message, items, actions, demo: true });
  const handoff = (message, actions = [["상담 요청", "$handoff"]]) => ({ kind: "handoff", message, actions, demo: true });
  const detail = (title, detail) => ({ title, detail });
  const byPass = (target, failure) => ({
    ...choice("계약 정보를 볼 수 있도록 PASS 본인인증을 진행해 주세요.", [["PASS 본인인증", target]]),
    auth: { failure }
  });

  const contract = ["contract"];
  const resolved = (fallback, rules = []) => ({ resolve: { default: fallback, rules } });
  const contractCase = (target, suffix) => ({ target, fields: ["계약 또는 제품명"], match: "^SK-261125-" + suffix + "$" });
  const seoulDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [seoulYear, seoulMonth, seoulDay] = seoulDate.split("-").map(Number);
  const recipient = ["name", "phone", "address"];
  const cancellation = [{ label: "취소 사유", placeholder: "취소하는 이유를 짧게 입력해 주세요", type: "text", sample: "일정 변경" }];
  const cancellationPending = detail("처리 상태", "담당자 확인 필요");
  const withdrawal = [
    { label: "해약취소 사유", placeholder: "해약 신청을 철회하는 이유", type: "text", sample: "계약을 계속 이용하고 싶어요" },
    { label: "취소 상세내용", placeholder: "담당자가 추가로 알아야 할 내용", type: "text", sample: "기존 계약 조건 유지 요청", required: false }
  ];
  const bank = { label: "은행", placeholder: "은행명 입력", type: "text", sample: "KB국민은행" };
  const account = { label: "계좌번호", placeholder: "숫자만 입력", type: "password", sample: "000000001234" };
  const approvedCashReceipt = [
    detail("발행일", "2026년 11월 25일"), detail("거래 상태", "승인"),
    detail("승인번호", "••••1234"), detail("결제액", "29,900원")
  ];
  const confirmOrder = (product, orderNumber, state, next, back = "orderSelect") => ({
    ...choice(back === "orderSelect" ? "조회된 주문이 취소하려는 주문과 일치하는지 확인해 주세요."
      : "조회된 주문이 문의하신 주문과 일치하는지 확인해 주세요.", [["이 주문이 맞아요", next], ["다른 주문 선택", back]]),
    items: [detail("제품", product), detail("주문번호", orderNumber), detail("배송 상태", state)]
  });
  const cancellableOrder = (product, model, orderNumber, state, next) => {
    const screen = confirmOrder(product, orderNumber, state, next);
    screen.items = [detail("받는 분", "김○○"), detail("배송지", "서울 영등포구 문래동"), detail("제품코드", model), ...screen.items];
    return screen;
  };
  const refundConfirmation = (product, orderNumber, method, next, back) => {
    const screen = confirmOrder(product, orderNumber, "취소 완료", next, back);
    const payment = method && detail("납부 방법", method);
    const order = [...screen.items.slice(0, 2), ...(payment ? [payment] : [])];
    return { ...screen, items: [...screen.items, ...(payment ? [payment] : [])], refundOrderDetails: order };
  };
  const orderIdentity = { target: "orderSelect", fields: ["이름", "휴대폰 번호", "주소"], all: true, match: "", patterns: {
    "이름": "^김매직$", "휴대폰 번호": "^01000001234$", "주소": "^(?:서울(?:특별시)?\\s*)?영등포구\\s*문래동(?:\\s*.*)?$"
  } };
  const refundOrderIdentity = (target, suffix) => ({ ...orderIdentity, target, patterns: {
    ...orderIdentity.patterns, "휴대폰 번호": `^0100000${suffix}$`, "주소": "^(?:서울(?:특별시)?\\s*)?영등포구\\s*문래동$"
  } });
  const knownProduct = (target) => ({ target, fields: ["계약 또는 제품명"], match: "^(?:직수\\s*정수기(?:\\s*계약)?|WPU-1000)$" });
  const knownGift = (target) => ({ target, fields: ["계약 또는 제품명"], match: "^(?:직수 정수기(?: 계약)?|정수기(?: 계약)?|SK-261125-060)$" });
  const giftServiceCases = (target) => [contractCase("s2", "000"), contractCase("s7", "043"),
    contractCase(target, "061"), contractCase(target, "062"), knownGift(target)];
  const filterRefunds = [
    { contract: "053", visitPurpose: "전체 필터 교체", partsUsed: true, collectionCycle: 993 },
    { contract: "054", visitPurpose: "필터 점검", partsUsed: false, collectionCycle: null }
  ];
  const filterRefundRules = filterRefunds.filter(({ visitPurpose, partsUsed, collectionCycle }) =>
    visitPurpose === "전체 필터 교체" && partsUsed && collectionCycle === 993)
    .map(({ contract: suffix }) => contractCase("switchRefundVerified", suffix));
  const withdrawalPayment = { month: "2026년 11월", amount: "87,500원" };
  const coveredPeriod = (contractDay) => {
    const lastOfPrevious = new Date(Date.UTC(seoulYear, seoulMonth - 1, 0)).getUTCDate();
    const lastOfCurrent = new Date(Date.UTC(seoulYear, seoulMonth, 0)).getUTCDate();
    const start = new Date(Date.UTC(seoulYear, seoulMonth - 2, Math.min(contractDay, lastOfPrevious)));
    const end = new Date(Date.UTC(seoulYear, seoulMonth - 1, Math.min(contractDay, lastOfCurrent) - 1));
    const formatDay = (date) => `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일`;
    return result(`${seoulMonth}월 납부 대상 사용 기간을 확인했어요.`, [detail("계약 기준일", `매월 ${contractDay}일`), detail("사용 기간", `${formatDay(start)}~${formatDay(end)}`)]);
  };
  const paymentDay = (day, isPaid) => {
    if (seoulDay < day) return result("이번 달 정기 결제일이 아직 오지 않았어요. 결제일이 지나면 납부 여부를 확인할 수 있어요.", [detail("정기 결제일", `매월 ${day}일`)]);
    return result(isPaid ? `${seoulMonth}월 납부가 확인된 상태예요.` : `${seoulMonth}월 납부가 확인되지 않아요.`, [
      detail("정기 결제일", `매월 ${day}일`), detail("당월 납부 여부", isPaid ? "납부" : "미납")
    ], isPaid ? [] : [["미납요금 납부", "@5"], ["결제정보 변경", "@3"]]);
  };

  const prepaidRates = [4, 6, 8, 10, 12];
  const prepaidQuotes = Object.fromEntries(prepaidRates.slice(1).map((rate, index) => {
    const years = index + 2;
    const subtotal = 29_900 * 12 * years;
    const discounted = Math.round(subtotal * (100 - rate) / 100);
    return [`prepaidQuote${years}`, result("일반 계약의 월 구독료 29,900원을 기준으로 계산했어요.", [
      detail("선납 적용 기간", `${years}년 · ${years * 12}개월`),
      detail("할인율", `${rate}%`),
      detail("예상 선납 금액", `${discounted.toLocaleString("ko-KR")}원`)
    ], [["계속하기", "s4"], ["다른 기간 보기", "prepaidTerms"]])];
  }));

  const overlays = {
    37: {
      screens: {
        s1: { actions: [
          ["4대보험 완납증명서", "insurancePeriod"], ["건강·연금 완납증명서", "insurancePeriod"],
          ["국세 완납증명서", "taxPeriod"], ["지방세 완납증명서", "taxPeriod"], ["사업자등록증", "documentAuthority"]
        ] },
        insurancePeriod: choice("당월 완납증명서는 매월 15일 이후에 받을 수 있어요. 받을 서류를 선택해 주세요.", [
          ["당월분", "insuranceAvailability"], ["전월분", "documentAuthority"]
        ]),
        taxPeriod: choice("당월 완납증명서는 매월 5일 이후에 받을 수 있어요. 받을 서류를 선택해 주세요.", [
          ["당월분", "taxAvailability"], ["전월분", "documentAuthority"]
        ]),
        insuranceAvailability: resolved(seoulDay >= 15 ? "documentAuthority" : "s2"),
        taxAvailability: resolved(seoulDay >= 5 ? "documentAuthority" : "s2"),
        s2: {
          message: "당월 증명서 발송을 시작하는 날짜가 아직 오지 않았어요. 전월분을 받으시겠어요?",
          actions: [["전월분 받기", "documentAuthority"], ["다음에 요청하기", "$finish"]]
        },
        s3: { message: "서류를 받을 계약을 확인해 주세요.", fields: contract, items: [], actions: [["계약 확인", "documentLookup"]], lookupOnSubmit: true },
        documentLookup: resolved("s4", [knownProduct("s5"), contractCase("s5", "048")]),
        documentAuthority: choice("개인과 개인사업자 계약은 계약자 본인이 서류를 요청할 수 있어요.", [
          ["계약자 본인", "documentAuth"], ["계약자 아님", "s4"]
        ]),
        documentAuth: byPass("s3", "s4"),
        s4: { actions: [["다시 확인", "documentAuthority"], ["상담 요청 안내", "$handoff"], ["여기서 마치기", "$finish"]] },
        s6: {
          advanceOnSubmit: true,
          fields: [{
            label: "정기 발송일", placeholder: "12~28일 중 하루 또는 말일", type: "text", sample: "15일",
            options: [...Array.from({ length: 17 }, (_, i) => `${i + 12}일`), "매월 말일"]
          }],
          actions: [["이 날짜로 계속", "s7"]]
        },
        s7: { delivery: { target: "s8", useRegisteredNumber: false } },
        s8: { message: "서류 발송 요청 정보를 확인했어요.", items: [], actions: [["상담 요청 안내", "$handoff"], ["다른 서류 확인", "s1"], ["여기서 마치기", "$finish"]] }
      }
    },
    38: {
      screens: {
        s2: lookup("배송받으실 분의 성함, 연락처, 주소를 차례로 입력해 주세요. 주문을 찾아볼게요.", recipient, "주문 조회", "orderLookup"),
        orderLookup: resolved("orderNotFound", [orderIdentity]),
        orderSelect: {
          ...choice("취소를 요청할 주문을 선택해 주세요. 납품이 생성됐거나 출고된 주문은 설치 담당자가 확인해요.", [
            ["직수 정수기 · 구독 · 납품대기", "subscriptionOrder"], ["공기청정기 · 일시불 · 납품대기", "singleOrder"],
            ["비데 · 납품생성", "dispatchOrder"], ["식기세척기 · 출고", "shippedOrder"]
          ]),
          items: [detail("배송지", "서울 영등포구 문래동")]
        },
        subscriptionOrder: cancellableOrder("직수 정수기 · 구독", "WPU-1000", "DL-261125-001", "납품대기", "subscriptionReason"),
        singleOrder: cancellableOrder("공기청정기 · 일시불", "ACL-2000", "DL-261125-002", "납품대기", "singleReason"),
        dispatchOrder: cancellableOrder("비데", "BID-1500", "DL-261125-003", "납품생성", "s6"),
        shippedOrder: cancellableOrder("식기세척기", "DWA-3000", "DL-261125-004", "출고", "s6"),
        subscriptionReason: input("구독 주문의 취소는 묶음 상품 전체에 적용돼요. 취소 사유를 입력해 주세요.", cancellation, "구독 주문 취소 요청", "s4"),
        singleReason: input("공기청정기 일시불 주문의 취소 사유를 입력해 주세요.", cancellation, "일시불 주문 취소 요청", "s5"),
        orderNotFound: handoff("일치하는 주문을 찾지 못했어요. 주문자의 성함과 배송지를 다시 확인해 주세요.", [["주문 다시 확인", "s2"], ["상담 요청", "$handoff"]]),
        s4: { message: "직수 정수기 구독 주문의 묶음 취소 요청 내용을 확인했어요. 실제 취소 여부는 주문을 접수한 곳에서 확인할 수 있어요.",
          items: [detail("취소 요청 범위", "직수 정수기 구독 묶음 전체"), cancellationPending],
          actions: [["취소 상담 안내", "$handoff"], ["선납 환불 확인", "@46"], ["여기서 마치기", "$finish"]] },
        s5: {
          message: "공기청정기 일시불 주문의 취소 요청 내용을 확인했어요. 실제 취소 여부는 주문을 접수한 곳에서 확인할 수 있어요.",
          items: [cancellationPending],
          actions: [["취소 상담 안내", "$handoff"], ["여기서 마치기", "$finish"]]
        },
        s6: {
          message: "납품생성 또는 출고 단계의 주문은 설치 담당자가 취소 가능 여부를 확인해야 해요.",
          items: [],
          actions: [["설치 담당자 확인이 필요한 사유 입력", "dispatchReason"], ["주문 다시 선택", "orderSelect"]]
        },
        dispatchReason: { ...input("설치 담당자가 확인할 취소 사유를 입력해 주세요.", cancellation, "취소 사유 확인", "orderHandoff"), advanceOnSubmit: true },
        orderHandoff: {
          ...handoff("취소 사유를 확인했어요. 설치 담당자에게 취소 가능 여부를 문의해 주세요.", [["취소 상담 안내", "$handoff"], ["주문 다시 선택", "orderSelect"], ["다른 문의", "$menu"]]),
          items: [cancellationPending]
        }
      }
    },
    39: {
      screens: {
        s2: { fields: contract, actions: [["계약 확인", "paymentContractLookup"]], lookupOnSubmit: true },
        paymentContractLookup: resolved("s3", [knownProduct("reuse006Pass"), {
          target: "reuse006Pass", fields: ["계약 또는 제품명"], match: "^SK-261125-(?:039|04[0-57])$"
        }]),
        s4: { resolve: { rules: [contractCase("payment10", "039"), contractCase("payment20", "040"), contractCase("s5", "041"),
          contractCase("contractClosed", "042"), contractCase("schoolWaiver", "043"), {
            target: "monthlyPaymentUnavailable", fields: ["계약 또는 제품명"], match: "^SK-261125-04[457]$"
          }] },
          ...paymentDay(25, true),
          items: seoulDay < 25 ? [detail("정기 결제일", "매월 25일")]
            : [detail("정기 결제일", "매월 25일"), detail("청구 금액", "29,900원"), detail("납부 금액", "29,900원"),
              detail("납부 방법", "카드 자동납부 · 신한카드 · 끝자리 1234")] },
        monthlyPaymentUnavailable: result("선택하신 계약의 당월 납부 내역을 확인하기 어려워요.", [], [
          ["다른 계약 확인", "s2"], ["상담 요청", "$handoff"]
        ]),
        s5: { message: `${seoulMonth}월은 이 계약의 구독료 면제 프로모션이 적용되는 달이에요.`,
          items: [detail("당월 청구 금액", "0원"), detail("확인된 면제 사유", "구독료 면제 프로모션 적용 기간")] },
        s7: { ...coveredPeriod(25), resolve: { rules: [contractCase("paymentPeriod12", "039"), contractCase("paymentPeriod18", "040")] } },
        paymentPeriod12: coveredPeriod(12),
        paymentPeriod18: coveredPeriod(18),
        payment10: { ...paymentDay(10, true), ...(seoulDay >= 10 ? {
          message: `${seoulMonth}월 납부가 확인된 상태예요. 납부 금액과 방법은 상담에서 확인하실 수 있어요.`,
          actions: [["납부 상세 문의", "$handoff"]]
        } : {}) },
        payment20: paymentDay(20, false),
        s8: { actions: [["가상계좌 입금 처리 확인", "depositConditions"], ["환불 등록·이력 문의", "@47"], ["상담 요청", "$handoff"]] },
        contractClosed: result("이 계약은 종료됐어요. 종료일 이후 정기 구독료는 청구되지 않아요.", [
          detail("계약 상태", "종료"), detail("계약 종료일", "2026년 10월 31일"), detail("당월 구독료", "0원")
        ], [["다른 계약 확인", "s2"], ["다른 문의", "$menu"]]),
        schoolWaiver: result("학교특별 계약의 방학 면제는 1월과 8월에만 적용돼요.", [
          detail("확인된 계약 조건", "방학 면제"), detail("당월 면제 여부", [1, 8].includes(seoulMonth) ? "면제 적용 · 청구 금액 0원" : "방학 면제 대상 월 아님")
        ]),
        depositConditions: resolved("depositTomorrow", [contractCase("depositCarry", "044"), contractCase("depositReturn", "042"), contractCase("@47", "047")]),
        depositTomorrow: result("오늘 추가로 결제한 금액은 다음 날부터 확인할 수 있어요."),
        depositCarry: choice("중복 입금액과 납부 귀속 월이 확인되면 다음 달 구독료에 반영을 요청할 수 있어요. 어떤 확인을 원하시나요?", [
          ["다음 달 구독료에 반영 요청", "depositCarryRequest"], ["중복 입금 내역 확인", "duplicateDepositPeriod"], ["환불 문의", "@47"]
        ]),
        depositCarryRequest: handoff("다음 달 구독료에 반영해 달라는 요청을 확인했어요. 상담사가 입금 상태와 적용 가능 여부를 확인해요."),
        duplicateDepositPeriod: choice("조회된 중복 입금 내역 중 확인할 월을 선택해 주세요.", [
          ["2026년 11월 중복 입금 선택", "duplicateDepositReview"], ["다른 납부 월 확인 요청", "$handoff"]
        ]),
        duplicateDepositReview: result("선택한 납부 월에 아래 금액이 중복 입금됐어요. 환불은 계약자 명의 계좌로 받을 수 있어요.", [
          detail("중복 입금 대상 월", "2026년 11월"), detail("중복 입금액", "29,900원"), detail("환불 사유", "이중 납부")
        ], [["환불 상담 요청", "$handoff"], ["다음 달 구독료에 반영 요청", "depositCarryRequest"], ["다른 문의", "$menu"]]),
        depositReturn: result("해약이 진행 중이에요. 제품 회수가 완료된 뒤 하루가 지나면 이중 결제 여부를 확인할 수 있어요.")
      }
    },
    40: {
      screens: {
        s2: { fields: contract, actions: [["계약 확인", "withdrawalLookup"]], lookupOnSubmit: true },
        withdrawalLookup: resolved("s3", [knownProduct("authWithdrawal"), {
          target: "authWithdrawal", fields: ["계약 또는 제품명"], match: "^SK-261125-(?:042|05[1-4])$"
        }]),
        authWithdrawal: byPass("withdrawalCases", "s3"),
        withdrawalCases: resolved("s5", [contractCase("s4", "042"), contractCase("cardWithdrawal", "051"), contractCase("accountWithdrawal", "052"),
          contractCase("paymentPendingWithdrawal", "053"), contractCase("withdrawalAlreadyClosed", "054")]),
        s5: { actions: [["해약철회 진행", "withdrawalReason"], ["해약 신청 유지", "$finish"]] },
        paymentPendingWithdrawal: { ...choice("해약 정산금을 아직 납부하지 않은 상태예요. 해약철회 요청 내용을 입력하시겠어요?", [["해약철회 진행", "withdrawalReason"], ["해약 신청 유지", "$finish"]]),
          items: [detail("해약 상태", "입금대기")] },
        withdrawalAlreadyClosed: result("이 계약은 해약 요청이 이미 취소된 상태예요.", [detail("해약 상태", "해약요청 취소")], [["여기서 마치기", "$finish"]]),
        withdrawalReason: input("해약 신청을 철회하는 이유를 입력해 주세요.", withdrawal, "철회 요청", "s8"),
        cardWithdrawal: choice("해약금을 카드로 납부했어요. 해약 신청을 철회하고 기존 카드 결제도 취소할까요?", [
          ["해약철회 진행", "withdrawalCardReason"], ["해약 신청 유지", "$finish"]
        ]),
        withdrawalCardReason: input("해약 신청을 철회하는 이유를 입력해 주세요.", withdrawal, "철회와 카드 취소 요청", "s6"),
        s6: { message: "해약철회와 카드 결제 취소 요청 내용을 확인했어요. 카드 취소가 처리되면 카드사 반영까지 영업일 기준 3~5일이 걸릴 수 있어요.", items: [cancellationPending],
          actions: [["취소 상담 안내", "$handoff"], ["여기서 마치기", "$finish"]] },
        accountWithdrawal: choice("해약금을 계좌로 납부했어요. 해약 신청을 철회하시겠어요?", [
          ["해약철회 진행", "withdrawalAccountReason"], ["해약 신청 유지", "$finish"]
        ]),
        withdrawalAccountReason: { ...input("해약 신청을 철회하는 이유를 입력해 주세요.", withdrawal, "철회와 환불 조건 확인", "s7"), advanceOnSubmit: true },
        s7: { actions: [["환불 진행", "withdrawalRefundPeriod"], ["진행하지 않기", "$finish"]] },
        withdrawalRefundPeriod: {
          ...choice("철회할 계약에 납부한 해약 정산금이에요. 확인할 납부 월을 선택해 주세요.", [
            [`${withdrawalPayment.month} 납부 건 선택`, "withdrawalRefundAmount"], ["다른 납부 월 확인 요청", "$handoff"]
          ]),
          items: [detail("납부 월", withdrawalPayment.month), detail("납부 항목", "해약 정산금"), detail("납부 금액", withdrawalPayment.amount)]
        },
        withdrawalRefundAmount: result("선택한 월에 납부하신 해약 정산금이에요. 계약자 명의 계좌 확인 후 환불할 수 있어요.", [
          detail("환불 대상 월", withdrawalPayment.month), detail("확인된 납부 금액", withdrawalPayment.amount)
        ], [["환불 계좌 확인", "refundOwnership"], ["납부 월 다시 선택", "withdrawalRefundPeriod"]]),
        refundOwnership: choice("환불은 계약자 본인 명의 계좌로만 받을 수 있어요. 계약자 본인 명의인가요?", [
          ["계약자 본인 명의예요", "refundAccount"], ["계좌 명의를 확인할게요", "s7"], ["상담 요청 안내", "$handoff"]
        ]),
        refundAccount: input("계약자 명의의 환불 계좌를 입력해 주세요.", [bank, account], "환불 요청", "refundRequest"),
        refundRequest: result("해약철회와 환불 요청 내용을 확인했어요. 해약금 수납과 계좌 명의가 확인돼야 환불 일정을 안내받을 수 있어요.", [
          cancellationPending,
          detail("환불 대상 월", withdrawalPayment.month), detail("확인된 납부 금액", withdrawalPayment.amount),
          detail("환불 유형", "선수금 · 해약철회"), detail("지급 조건", "수납 반영 · 계약자 명의 계좌 확인"),
          detail("정기 환불 기준", "목요일 정오~월요일 정오 등록분 화요일 · 월요일 정오~목요일 정오 등록분 금요일")
        ], [["환불 상담 안내", "$handoff"], ["여기서 마치기", "$finish"]]),
        s8: { message: "해약철회 요청 내용을 확인했어요. 실제 철회 상태는 담당 상담사가 확인할 수 있어요.", items: [cancellationPending],
          actions: [["철회 상담 안내", "$handoff"], ["여기서 마치기", "$finish"]] }
      }
    },
    41: {
      screens: {
        s1: {
          kind: "choice", fields: [], actions: [["제품 유형으로 찾기", "providerChoices"], ["모델명 입력", "providerModel"]]
        },
        providerModel: lookup("서비스를 받을 제품의 모델명이나 제품명을 입력해 주세요.", ["product"], "모델명 확인", "providerLookup"),
        providerLookup: resolved("providerChoices", [
          { target: "s7", fields: ["제품명 또는 모델명"], match: "EONB[ -]?450" },
          { target: "s5", fields: ["제품명 또는 모델명"], match: "필립스|philips|에스프레소" },
          { target: "s6", fields: ["제품명 또는 모델명"], match: "삼성전자|삼성|samsung" },
          { target: "s2", fields: ["제품명 또는 모델명"], match: "가스\\s*(?:레인지|렌지)|전기\\s*(?:레인지|렌지|오븐)|인덕션|하이브리드" }
        ]),
        providerChoices: choice("서비스를 요청할 제품을 선택해 주세요.", [
          ["가스·전기·인덕션 레인지 또는 전기오븐레인지", "s2"], ["전기오븐레인지 EONB450", "s7"],
          ["필립스 커피·에스프레소 머신", "s5"], ["삼성전자 제품", "s6"], ["그 외 제품", "s7"]
        ]),
        s2: {
          message: "선택하신 조리기기의 AS 상담과 접수는 경동나비엔 고객센터에서 도와드려요. 고객센터 연락처를 문자로 받으시겠어요?",
          items: [detail("서비스 담당 업체", "경동나비엔"), detail("고객센터", "1588-1144")],
          actions: [["문자로 받기", "$delivery"], ["문자 필요 없음", "$finish"]],
          links: [{ label: "경동나비엔 서비스 안내", href: "https://next.kdnavien.co.kr/ko/service" }]
        },
        s4: {
          message: "경동나비엔 고객센터 연락처를 문자로 받을 번호를 확인했어요.",
          items: [detail("서비스 담당 업체", "경동나비엔"), detail("안내 연락처", "1588-1144"),
            detail("받는 방법", "SMS"), detail("받는 번호", "[마스킹된 수신처]"), detail("처리 상태", "발송 요청 내용 확인")]
        },
        s5: {
          message: "필립스 커피머신과 에스프레소 머신의 AS는 필립스 고객센터에 문의해 주세요.",
          items: [detail("서비스 담당 업체", "필립스"), detail("고객센터", "1661-0083")],
          links: [{ label: "필립스 제품 지원", href: "https://www.home.id/ko-KR/support" }]
        },
        s6: {
          message: "삼성전자 제품의 AS는 삼성전자서비스에 문의해 주세요.",
          items: [detail("서비스 담당 업체", "삼성전자서비스"), detail("고객센터", "1588-3366")],
          links: [{ label: "삼성전자서비스 이용 안내", href: "https://www.samsungsvc.co.kr/utils/guide/11040" }]
        },
        s7: {
          message: "이 모델은 SK매직 서비스 상담에서 담당 업체와 접수 가능 여부를 확인해 드려요.",
          actions: [["서비스 접수 확인", "@12"], ["상담사 연결", "$handoff"]]
        }
      }
    },
    42: {
      screens: {
        s1: { actions: [["연장 여부 확인", "membershipLookup"], ["자동연장 거부", "extensionLookup"], ["멤버십 해약 문의", "terminationLookup"], ["교체 구독 상담", "replacementLookup"]] },
        membershipLookup: lookup("확인할 멤버십 계약을 입력해 주세요.", contract, "연장 상태 확인", "renewalAuth"),
        extensionLookup: lookup("자동연장을 거부할 멤버십 계약을 입력해 주세요.", contract, "대상 계약 확인", "optOutAuth"),
        terminationLookup: lookup("해약을 문의할 멤버십 계약을 입력해 주세요.", contract, "대상 계약 확인", "terminationAuth"),
        replacementLookup: lookup("교체 구독을 문의할 멤버십 계약을 입력해 주세요.", contract, "대상 계약 확인", "replacementAuth"),
        renewalAuth: byPass("renewalLookup", "s2"),
        optOutAuth: byPass("extensionEligibility", "s2"),
        terminationAuth: byPass("terminationEligibility", "s2"),
        replacementAuth: byPass("replacementEligibility", "s2"),
        renewalLookup: resolved("s2", [knownProduct("s3"), contractCase("membershipExpiry", "042"), contractCase("renewalArrears", "043")]),
        extensionEligibility: resolved("s2", [knownProduct("E7"), contractCase("membershipExpiry", "042"), contractCase("renewalArrears", "043")]),
        terminationEligibility: resolved("s2", [knownProduct("s6"), contractCase("membershipExpiry", "042"), contractCase("renewalArrears", "043")]),
        replacementEligibility: resolved("s2", [knownProduct("s7"), contractCase("s7", "042"), contractCase("renewalArrears", "043")]),
        membershipExpiry: result("최초 설치일부터 멤버십 연장이 가능한 7년이 지나면 최종 만료돼요.", [
          detail("갱신 상태", "최종 만료 예정")
        ], [["교체 구독 상담", "s7"]]),
        renewalArrears: result("갱신 시점에 연체가 해소되지 않으면 멤버십이 자동 종료돼요.", [
          detail("갱신 상태", "미납 확인 필요")
        ], [["미납요금 확인", "@5"]]),
        E7: {
          message: "자동연장을 거부하면 현재 만료월까지 이용할 수 있어요. 만료 처리에는 위약금이 없으며 정상 연장 상태로 되돌릴 수 없어요.",
          items: [detail("만료 예정월", "2026년 12월")],
          actions: [["원복 불가 안내 확인", "s4"], ["유지하기", "$finish"]]
        },
        s3: {
          message: "멤버십은 최초 설치일부터 최대 7년까지 연장할 수 있어요. 갱신 시점에 미납이 없으면 자동으로 연장돼요. 만료 2개월 전에 알림톡을 보내드리며, 연장을 원하지 않으시면 만료월 전에 요청해 주세요.",
          addActions: [["자동연장 거부 검토", "E7"], ["교체 구독 상담", "s7"]]
        },
        s4: { actions: [["자동연장 거부에 동의", "optOutReason"], ["유지하기", "$finish"]] },
        optOutReason: input("멤버십 연장을 원하지 않으시는 이유를 입력해 주세요.", [
          { label: "연장 거부 사유", type: "text", placeholder: "연장을 원하지 않는 이유", sample: "만료 후 이용 계획이 없어요" }
        ], "연장 거부 등록", "s5"),
        s5: {
          message: "멤버십의 자동연장 거부를 등록했어요. 이 계약은 안내한 만료 시점까지 유지돼요.",
          actions: [["멤버십 상태 확인", "optOutStatus"], ["상담 종료", "$finish"]], demo: true
        },
        optOutStatus: result("이 멤버십은 자동연장 없이 현재 계약 만료월에 종료돼요.", [
          detail("만료 예정월", "2026년 12월"), detail("자동연장", "제외")
        ]),
        s6: {
          advanceOnSubmit: true,
          ...input("멤버십 해약 희망일과 해약 사유를 입력해 주세요. 해약일에 따라 정산액이 달라질 수 있어요.", [
            { label: "해약 희망일", type: "date", placeholder: "YYYY-MM-DD" },
            { label: "해약 사유", type: "text", placeholder: "해약을 원하시는 이유", sample: "서비스 이용 계획 변경" }
          ], "해약 상담 내용 확인", "membershipTerminationReview")
        },
        membershipTerminationReview: {
          ...handoff("희망일과 해약 사유를 확인했어요. 상담사가 해약 희망일 기준 정산액과 납부가 필요한지 확인해 드려요.", [
            ["상담 요청", "$handoff"], ["희망일·사유 다시 입력", "s6"], ["다른 문의", "$menu"]
          ]),
          items: [detail("해약 희망일", "[선택한 날짜]"), detail("해약 사유", "[멤버십 해약 사유]"), detail("납입 예정금액", "상담 확인 필요")]
        },
        s7: { addActions: [["교체 구독 상담 요청", "$handoff"]] }
      }
    },
    43: {
      screens: {
        s1: { actions: [
          ["혜택 종류·발송일", "giftLookup"], ["사은품 변경", "giftChangeLookup"],
          ["불량 또는 판매처 문의", "giftSupportLookup"], ["주문하지 않은 택배", "s6"]
        ] },
        giftLookup: lookup("사은품 혜택을 확인할 계약을 입력해 주세요.", contract, "계약 확인", "giftAuth"),
        giftChangeLookup: lookup("변경하려는 사은품의 계약을 입력해 주세요.", contract, "계약 확인", "giftChangeAuth"),
        giftSupportLookup: lookup("문의하실 사은품의 계약을 입력해 주세요.", contract, "계약 확인", "giftSupportAuth"),
        giftAuth: byPass("giftCases", "s2"),
        giftChangeAuth: byPass("giftChangeCases", "s2"),
        giftSupportAuth: byPass("giftSupportCases", "s2"),
        giftCases: resolved("giftUnconfirmed", [contractCase("s7", "043"), contractCase("s2", "000"),
          contractCase("naverBenefit", "061"), contractCase("physicalGift", "062"),
          knownGift("s3")]),
        giftUnconfirmed: handoff("입력하신 계약에서 사은품 지급 내역을 확인하기 어려워요. 계약을 다시 확인하거나 판매 부서에 문의해 주세요.", [
          ["계약 다시 확인", "s1"], ["판매 부서 확인 요청", "$handoff"]
        ]),
        giftChangeCases: resolved("giftUnconfirmed", giftServiceCases("s4")),
        giftSupportCases: resolved("giftUnconfirmed", giftServiceCases("giftSupport")),
        s3: {
          message: "이 주문에는 월 구독료 1개월분의 포인트 혜택이 있어요. 설치일로부터 15일 후 매직몰 가입 아이디로 적립돼요.",
          items: [detail("혜택 종류", "구독 포인트"), detail("적립 예정 포인트", "29,900원 상당"),
            detail("설치 완료일", "2026년 11월 20일"), detail("적립 예정일", "2026년 12월 5일")]
        },
        naverBenefit: result("네이버페이 혜택은 설치 다음 달 20일경 기프티엘에서 알림톡이나 문자로 보내드려요.", [
          detail("혜택 종류", "네이버페이"), detail("발신 번호", "1644-4276"), detail("발송 예정", "2026년 12월 20일경")
        ]),
        physicalGift: result("사은품은 설치 완료일부터 15일 이내에 제품과 별도로 배송돼요.", [
          detail("사은품", "휴대용 선풍기"), detail("설치 완료일", "2026년 11월 20일"), detail("별도 발송 예정", "2026년 12월 5일 이내")
        ]),
        giftSupport: choice("어떤 확인이 필요한가요?", [["사은품 불량", "giftEvidence"], ["판매처 연락 요청", "s7"]]),
        giftEvidence: {
          ...handoff("사은품 상태를 확인할 사진을 준비해 주세요. 판매 부서가 주문 내역과 사진을 확인한 뒤 교환 가능 여부를 안내해 드려요."),
          items: [detail("준비할 사진", "사은품 전체와 불량 부분이 보이는 사진"), detail("추가 확인 정보", "수령일 · 배송 박스 또는 송장")]
        },
        s4: { actions: [["개봉 또는 사용했어요", "s5"], ["아직 개봉하거나 사용하지 않았어요", "giftReceivedDate"]] },
        giftReceivedDate: choice("사은품을 받으신 지 7일이 지났나요?", [
          ["받은 지 7일 이내예요", "giftReview"], ["받은 지 7일이 지났어요", "giftLate"]
        ]),
        giftReview: handoff("미개봉 사은품은 판매처에서 증정 조건과 교환 가능 여부를 확인해요."),
        giftLate: handoff("수령 후 7일이 지났어요. 불량이나 배송 오류가 있다면 판매처에서 상황을 확인해 드려요."),
        s6: {
          kind: "choice", fields: [], actions: [
            ["송장과 주문 내역이 일치해요", "s7"], ["받는 분·배송지가 달라요", "unmatchedParcel"]
          ]
        },
        unmatchedParcel: result("송장에 표시된 판매자나 택배사에 상황을 전달하고 반송 방법을 문의해 주세요.")
      }
    },
    44: {
      screens: {
        s1: { actions: [["설치 가능 여부", "s2"], ["타공 크기·호스", "s2"], ["재설치 방문", "s2"]] },
        s2: {
          fields: ["product", { label: "설치 장소", placeholder: "예: 주방 싱크대 옆", type: "text", sample: "주방 싱크대 옆" }],
          actions: [["설치 환경 확인", "$installationResult"]], lookupOnSubmit: true
        },
        s5: {
          message: "서비스매니저가 방문해 설치 가능 여부를 확인해요. 현장에서 설치가 어려워 접수를 취소해도 출장료가 발생할 수 있어요. 계약 주소도 바꾸시려면 ‘보유 제품으로 재설치 접수’를 선택해 주세요.",
          actions: [["재설치 방문 접수", "s6"], ["이사 후 설치 환경 확인", "installationMoveDate"],
            ["보유 제품으로 재설치 접수", "@9"], ["안내만 받기", "$finish"]]
        },
        installationMoveDate: { ...input("이사 예정일을 입력해 주세요. 이사일 다음 영업일부터 현장 방문을 요청할 수 있어요.", [
          { label: "이사 예정일", type: "date", placeholder: "YYYY-MM-DD" }
        ], "이사 예정일 확인", "s6"), advanceOnSubmit: true },
        s3: {
          message: "모델에 따라 급수·배수 호스와 타공 규격이 달라요. 설치 환경을 확인한 뒤 필요한 규격을 안내해 드려요.",
          actions: [["설치 가능 여부 확인", "s4"], ["상담사 연결", "$handoff"]]
        },
        s6: {
          message: "성함과 재설치 주소, 방문 희망일, 당일 연락받을 번호를 차례로 입력해 주세요. 계약에 따라 방문 비용이 달라질 수 있어요.",
          items: [],
          fields: ["name", "address", "date", "phone"], actions: [["재설치 방문 요청", "installationCustomerCheck"], ["뒤로", "s5"]]
        },
        installationCustomerCheck: resolved("installationEquipmentCheck", [{ target: "installationMultipleCustomers",
          fields: ["휴대폰 번호"], match: "^01000000009$" }]),
        installationMultipleCustomers: choice("이 번호로는 대상 계약을 하나로 특정하기 어려워요. 계약 주소도 바꾸거나 보유 제품을 접수하려면 본인 확인 후 대상 제품을 찾아주세요.", [
          ["등록 고객 확인", "installationCustomerAuth"], ["설치 환경만 확인", "installationEquipmentCheck"], ["연락처 다시 입력", "s6"]
        ]),
        installationCustomerAuth: {
          ...choice("서비스받으실 분의 등록 휴대폰을 확인할게요.", [["휴대폰 확인", "$auditSms"]]),
          auth: { success: "installationVerifiedCustomer", failure: "installationCustomerMismatch" }
        },
        installationVerifiedCustomer: resolved("installationCustomerMismatch", [{ target: "installationRegisteredAddress", match: "", all: true,
          fields: ["이름", "휴대폰 번호"], patterns: { "이름": "^김매직$", "휴대폰 번호": "^01000000009$" } }]),
        installationRegisteredAddress: lookup("설치할 새 주소와 별도로, 현재 등록되어 있는 제품 사용 주소를 입력해 주세요.", [
          { label: "등록된 사용 주소", type: "text", placeholder: "제품을 사용하던 주소", sample: "서울 영등포구 문래동" }
        ], "등록 고객 조회", "installationCustomerRecord"),
        installationCustomerRecord: resolved("installationCustomerMismatch", [
          { target: "installationWaterCustomer", fields: ["등록된 사용 주소"], match: "^(?:서울(?:특별시)?\\s*)?영등포구\\s*문래동$" },
          { target: "installationDishwasherCustomer", fields: ["등록된 사용 주소"], match: "^(?:서울(?:특별시)?\\s*)?영등포구\\s*신길동$" }
        ]),
        installationCustomerMismatch: handoff("서비스받으실 분의 인증 정보와 등록 주소가 일치하는 제품을 확인하지 못했어요.", [
          ["설치 환경만 확인", "installationEquipmentCheck"], ["등록 정보 상담", "$handoff"]
        ]),
        installationWaterCustomer: result("주소와 일치하는 보유 제품을 찾았어요. 재설치할 제품을 선택해 주세요.", [
          detail("등록 고객", "김○○"), detail("사용 주소", "서울 영등포구 문래동"), detail("연락처", "010-••••-0009"),
          detail("보유 제품", "직수 정수기 · WPU-1000")
        ], [["직수 정수기 재설치 선택", "@9"], ["다른 주소 확인", "installationRegisteredAddress"]]),
        installationDishwasherCustomer: result("주소와 일치하는 보유 제품을 찾았어요. 재설치할 제품을 선택해 주세요.", [
          detail("등록 고객", "김○○"), detail("사용 주소", "서울 영등포구 신길동"), detail("연락처", "010-••••-0009"),
          detail("보유 제품", "식기세척기 · DWA-2000")
        ], [["식기세척기 재설치 선택", "@9"], ["다른 주소 확인", "installationRegisteredAddress"]]),
        installationEquipmentCheck: resolved("s7", [
          { target: "valveChoice", fields: ["제품명 또는 모델명"], match: "정수기|wpu" }
        ]),
        valveChoice: choice("정수기를 재설치할 때 조리수 밸브도 함께 설치할까요?", [
          ["조리수 밸브 설치 함께 요청", "valveBooked"], ["조리수 밸브 필요 없음", "s7"]
        ]),
        s7: {
          message: "재설치 방문 요청을 확인했어요. 방문 시 설치 환경을 확인한 뒤 설치 가능 여부를 안내해요.",
          items: [detail("접수번호", "ES-261125-044"), detail("방문 희망일", "[선택한 날짜]"), detail("방문 연락처", "[마스킹된 번호]"),
            detail("재설치 비용", "모델과 구독·멤버십·일시불 유형 확인 후 안내"),
            detail("접수 내용", "재설치 및 현장 설치 가능 여부 확인")],
          actions: [["계속하기", "s8"], ["접수 안내 알림톡 받기", "installationNotice"], ["제품별 비용 확인", "@35"]]
        },
        valveBooked: result("재설치 요청에 조리수 밸브 설치도 포함했어요. 방문 시 설치 환경을 확인해요.", [
          detail("접수번호", "ES-261125-044"), detail("요청 범위", "재설치 · 조리수 밸브"),
          detail("방문 희망일", "[선택한 날짜]"), detail("방문 연락처", "[마스킹된 번호]"),
          detail("재설치 비용", "모델·계약 유형별 비용과 조리수 밸브 비용 확인 필요")
        ], [["계속하기", "s8"], ["접수 안내 알림톡 받기", "installationNotice"], ["제품별 비용 확인", "@35"]]),
        installationNotice: result("방문 접수 안내를 받을 연락처를 확인했어요.", [
          detail("접수번호", "ES-261125-044"), detail("받는 방법", "알림톡"), detail("받는 번호", "[마스킹된 번호]"),
          detail("처리 상태", "발송 요청 내용 확인")
        ], [["계속하기", "s8"], ["다른 문의", "$menu"]]),
        s8: { actions: [["사전 연락 요청", "E8"], ["추가 요청 없음", "$finish"]] },
        E8: {
          message: "접수하신 재설치 방문에 대해 담당 매니저에게 연락 요청을 전달할 수 있어요.",
          items: [detail("대상 접수", "ES-261125-044"), detail("방문 희망일", "[선택한 날짜]")],
          actions: [["사전 연락 요청", "@34"], ["추가 요청 없음", "$finish"]]
        }
      }
    },
    45: {
      screens: {
        s1: { actions: [
          ["선납 금액·할인 확인", "prepaidLookup"], ["선납 견적서·영수증", "prepaidFilesLookup"], ["선납 취소 문의", "s8"]
        ] },
        prepaidLookup: lookup("선납 조건을 확인할 계약을 입력해 주세요.", contract, "대상 계약 확인", "prepaidCases"),
        prepaidCases: byPass("prepaidEligibility", "s2"),
        prepaidEligibility: resolved("s2", [contractCase("specialPrepaid", "045"), knownProduct("prepaidTerms")]),
        prepaidTerms: {
          ...choice("일반 계약의 선납 기간별 할인율이에요. 적용 조건을 확인해 주세요.", [
            ["1년 금액 확인", "s3"], ["2년 금액 확인", "prepaidQuote2"], ["3년 금액 확인", "prepaidQuote3"],
            ["4년 금액 확인", "prepaidQuote4"], ["5년 금액 확인", "prepaidQuote5"], ["선납 기간 조건 문의", "$handoff"]
          ]),
          items: [detail("1년", "4%"), detail("2년", "6%"), detail("3년", "8%"), detail("4년", "10%"), detail("5년", "12%")],
          demo: true
        },
        ...prepaidQuotes,
        specialPrepaid: {
          ...lookup("이 계약에는 기존 할인이 적용되어 있어요. 원하는 선납 개월 수를 입력해 주세요. 실제 납부 가능 기간은 남은 계약 회차를 확인해 안내해요.", [
            { label: "선납 개월 수", type: "text", placeholder: "원하는 개월 수", sample: "12" }
          ], "선납 금액 확인", "freeMonthsQuote"),
          items: [detail("월 구독료", "29,900원"), detail("추가 할인율", "0%")]
        },
        freeMonthsQuote: result("입력하신 개월 수를 기준으로 선납 예상 금액을 계산했어요.", [
          detail("선납 적용 기간", "[선납 기간]"), detail("추가 할인율", "0%"), detail("수납 예정금액", "[선납 금액]")
        ], [["납부 가능 회차 확인", "freeMonthsReview"], ["개월 수 다시 입력", "specialPrepaid"], ["안내만 받기", "$finish"]]),
        freeMonthsReview: handoff("남은 계약 회차가 확인되어야 이 기간으로 선납할 수 있어요. 지금 확인할 수 있는 잔여 회차가 없어 상담사가 계약별 납부 가능 기간을 확인해 드려요."),
        s3: { addActions: [["다른 기간 보기", "prepaidTerms"]] },
        s4: {
          actions: [["선납 시작 회차 변경", "prepaidStartChoice"], ["선납 진행", "s5"], ["견적서 받기", "quoteDelivery"], ["안내만 받기", "$finish"]],
          items: [detail("선납 적용 기간", "[선납 기간]"), detail("선납 시작 회차", "[선납 시작 회차]"),
            detail("적용 회차 범위", "[선납 적용 회차]"), detail("수납 예정금액", "[선납 금액]")]
        },
        prepaidStartChoice: choice("선택 가능한 회차 중 선납을 시작할 회차를 골라 주세요.", [
          ["12회차부터 적용", "s4"], ["13회차부터 적용", "s4"], ["이전으로", "s4"]
        ]),
        s5: { items: [detail("적용 회차 범위", "[선납 적용 회차]"), detail("수납 예정금액", "[선납 금액]")],
          actions: [["세금계산서 발행", "taxPrepaid"], ["발행하지 않기", "ordinaryPrepaid"]] },
        taxPrepaid: choice("세금계산서 발행을 선택했어요. 선납 결제수단을 확인하거나 견적서를 받을 수 있어요.", [
          ["선납 결제수단 확인", "prepaidPaymentMethods"], ["견적서 먼저 받기", "quoteDelivery"]
        ]),
        ordinaryPrepaid: choice("세금계산서를 발행하지 않기로 했어요. 선납 결제수단을 확인하거나 견적서를 받을 수 있어요.", [
          ["선납 결제수단 확인", "prepaidPaymentMethods"], ["견적서 먼저 받기", "quoteDelivery"]
        ]),
        prepaidPaymentMethods: choice("선납에 사용할 결제수단을 선택해 주세요.", [
          ["카드", "prepaidCard"], ["실시간 계좌이체", "prepaidTransfer"], ["가상계좌", "prepaidVirtual"]
        ]),
        prepaidCard: {
          ...choice("어떤 카드로 선납하시겠어요?", [
            ["등록 카드로 납부", "prepaidCardConfirm"], ["다른 카드로 납부", "prepaidNewCard"], ["뒤로", "prepaidPaymentMethods"]
          ]),
          items: [detail("등록 카드", "신한카드 · ••••-••••-••••-1234")]
        },
        prepaidNewCard: {
          advanceOnSubmit: true,
          ...input("선납에 사용할 카드번호, 유효기간, 할부기간을 차례로 입력해 주세요.", [
            { label: "카드번호", type: "password", sample: "0000000000001234" },
            { label: "유효기간", type: "password", placeholder: "MM/YY", sample: "12/30" },
            { label: "할부기간", type: "text", sample: "일시불", options: ["일시불", "2개월", "3개월"] }
          ], "카드 정보 확인", "prepaidCardConfirm"),
          secure: true
        },
        prepaidCardConfirm: {
          ...choice("선택한 카드로 선납 금액을 결제할까요?", [["PASS 본인인증", "prepaidPaid"], ["뒤로", "prepaidCard"]]),
          items: [detail("수납 예정금액", "[선납 금액]")]
        },
        prepaidTransfer: {
          ...choice("어떤 계좌에서 선납 금액을 이체할까요?", [
            ["등록 계좌로 이체", "prepaidTransferSign"], ["다른 계좌로 이체", "prepaidNewAccount"], ["뒤로", "prepaidPaymentMethods"]
          ]),
          items: [detail("등록 계좌", "KB국민은행 · ••••-••••-1234")]
        },
        prepaidNewAccount: {
          advanceOnSubmit: true,
          ...input("이체할 은행과 계약자 명의 계좌번호를 입력해 주세요.", [bank, account], "계좌 확인", "prepaidTransferSign"),
          secure: true
        },
        prepaidTransferSign: {
          ...choice("선택하신 계좌와 선납 금액을 확인한 뒤 이체에 동의해 주세요.", [
            ["PASS 전자서명", "prepaidPaid"], ["뒤로", "prepaidTransfer"]
          ]),
          items: [detail("수납 예정금액", "[선납 금액]")]
        },
        prepaidPaid: result("선납 결제 내역을 확인했어요. 결제가 완료되어 선납 영수증을 받을 수 있어요.", [
          detail("선납 상태", "결제 완료"), detail("결제 금액", "[선납 금액]"), detail("세금계산서", "[선납 계산서]")
        ], [["선납 영수증 받기", "prepaidReceipt"], ["견적서 받기", "quoteDelivery"], ["다른 문의", "$menu"]]),
        prepaidVirtual: input("선납 금액을 입금할 은행과 납부 마감일을 선택해 주세요.", [
          bank, { label: "납부 마감일", type: "date", placeholder: "YYYY-MM-DD" }
        ], "가상계좌 발급", "prepaidVirtualIssued"),
        prepaidVirtualIssued: result("선납 가상계좌와 입금기한을 확인해 주세요. 입금이 완료되면 선납 영수증을 받을 수 있어요.", [
          detail("선납 상태", "입금 대기"), detail("납부 은행", "[선납 가상계좌 은행]"), detail("가상계좌", "••••-••••-1234"),
          detail("입금 금액", "[선납 금액]"), detail("납부 마감일", "[선택한 날짜]")
        ], [["가상계좌 확인서 받기", "prepaidVirtualDocument"], ["선납 견적서 받기", "quoteDelivery"], ["다른 문의", "$menu"]]),
        prepaidVirtualDocument: {
          ...choice("가상계좌 확인서를 어떤 방법으로 받으시겠어요?", [
            ["알림톡", "$delivery"], ["이메일", "$delivery"], ["팩스", "$delivery"]
          ]),
          delivery: { target: "prepaidVirtualSent", useRegisteredNumber: false }
        },
        prepaidVirtualSent: result("가상계좌 확인서 발송 요청을 확인했어요.", [
          detail("발송 방법", "[발송 방법]"), detail("수신처", "[마스킹된 수신처]")
        ]),
        prepaidFilesLookup: lookup("선납 서류를 확인할 계약을 입력해 주세요.", contract, "선납 상태 확인", "prepaidDocumentsAuth"),
        prepaidDocumentsAuth: byPass("prepaidDocumentState", "s2"),
        prepaidDocumentState: resolved("s2", [
          ...["058", "059", "063"].map((code) => contractCase("prepaidDocuments", code)), knownProduct("prepaidDocuments")
        ]),
        prepaidDocuments: choice("어떤 선납 서류를 받으실까요?", [
          ["선납 견적서", "quoteDelivery"], ["선납 영수증", "prepaidReceiptCheck"],
          ["세금계산서 재발송 문의", "prepaidTaxInvoiceDate"]
        ]),
        prepaidReceiptCheck: resolved("prepaidReceipt", [contractCase("s6", "059"), contractCase("prepaidReceiptUnavailable", "058")]),
        s6: { actions: [["견적서 받기", "quoteDelivery"]] },
        quoteDelivery: input("견적서를 받으실 이메일 주소를 입력해 주세요.", ["email"], "견적서 발송 요청", "s7"),
        s7: {
          message: "선납 견적서 발송 요청을 확인했어요.",
          items: [detail("문서", "선납 견적서"), detail("발송 채널", "이메일"), detail("수신처", "[마스킹된 수신처]")],
          demo: true
        },
        prepaidReceipt: {
          ...choice("결제가 완료된 계약의 선납영수증을 어떤 방법으로 받으시겠어요?", [
            ["알림톡", "$delivery"], ["이메일", "$delivery"], ["팩스", "$delivery"]
          ]),
          delivery: { target: "prepaidReceiptSent", useRegisteredNumber: false }
        },
        prepaidReceiptSent: result("결제가 완료된 계약의 선납영수증 발송 요청을 확인했어요.", [
          detail("발송 방법", "[발송 방법]"), detail("수신처", "[마스킹된 수신처]")
        ]),
        prepaidReceiptUnavailable: result("선납이 취소된 계약은 이 선납영수증을 발송할 수 없어요.", [], [["선납 문의", "$handoff"]]),
        prepaidTaxInvoiceDate: lookup("세금계산서에 표시된 발행일을 입력해 주세요.", [
          { label: "세금계산서 발행일", type: "date", sample: "2026-11-25" }
        ], "세금계산서 조회", "prepaidTaxInvoiceState"),
        prepaidTaxInvoiceState: resolved("prepaidTaxInvoiceNotFound", [
          { target: "prepaidTaxInvoice", fields: ["계약 또는 제품명", "세금계산서 발행일"], all: true, match: "", patterns: {
            "계약 또는 제품명": "^SK-261125-063$", "세금계산서 발행일": "^2026-11-25$" } },
          { target: "prepaidTaxApproved", fields: ["계약 또는 제품명", "세금계산서 발행일"], all: true, match: "", patterns: {
            "계약 또는 제품명": "^(?:직수\\s*정수기(?:\\s*계약)?|WPU-1000)$", "세금계산서 발행일": "^2026-11-25$" } }
        ]),
        prepaidTaxInvoiceNotFound: { ...choice("선택한 계약에서 입력하신 발행일에 해당하는 세금계산서를 찾지 못했어요.", [
          ["발행일 다시 입력", "prepaidTaxInvoiceDate"], ["다른 서류 확인", "prepaidDocuments"]
        ]), kind: "exception" },
        prepaidTaxInvoice: {
          ...choice("선납 세금계산서가 아직 수신 승인되지 않았어요. 등록된 이메일로 다시 보내드릴까요?", [
            ["등록된 이메일로 재발송", "prepaidTaxSent"], ["다른 문의", "$menu"]
          ]),
          items: [detail("세금계산서 발행일", "2026년 11월 25일"), detail("발행 상태", "수신미승인"), detail("등록 이메일", "m••@example.com")]
        },
        prepaidTaxSent: result("등록된 이메일로 선납 세금계산서를 다시 보내는 요청을 확인했어요.", [
          detail("세금계산서 발행일", "2026년 11월 25일"), detail("등록 이메일", "m••@example.com")
        ]),
        prepaidTaxApproved: result("수신 승인된 선납 세금계산서는 이 화면에서 다시 보낼 수 없어요.", [
          detail("세금계산서 발행일", "2026년 11월 25일"), detail("발행 상태", "수신 승인")
        ])
      }
    },
    46: {
      screens: {
        s1: { actions: [["설치 주문 취소", "s3"], ["선납 환불 확인", "s2"]] },
        s3: {
          message: "설치 전 주문은 주문 상태를 먼저 확인한 뒤 취소를 진행해요. 납품생성·출고 주문은 설치 담당자가 확인해요.",
          items: [],
          actions: [["설치 주문 취소 안내", "@38"], ["선납 환불 확인", "s2"]]
        },
        s2: lookup("설치받으실 분의 성함, 연락처, 주소를 차례로 입력해 주세요. 주문을 찾아볼게요.", recipient, "대상 주문 조회", "refundOrder"),
        refundOrder: resolved("refundOrderNotFound", [
          refundOrderIdentity("virtualRefundOrder", "1234"), refundOrderIdentity("cardRefundOrder", "0004"),
          refundOrderIdentity("refundPendingOrder", "0011"), refundOrderIdentity("refundReasonOrder", "0012")
        ]),
        refundOrderNotFound: { ...choice("성함, 연락처, 주소와 모두 일치하는 주문을 찾지 못했어요.", [
          ["주문 정보 다시 입력", "s2"], ["상담사 연결", "$handoff"]
        ]), kind: "exception" },
        virtualRefundOrder: {
          ...choice("선납 환불을 확인할 주문을 선택해 주세요.", [["직수 정수기 주문 선택", "confirmVirtualRefund"], ["다른 주문 확인", "s2"]]),
          items: [detail("직수 정수기 · DL-261125-001", "가상계좌 선납")]
        },
        cardRefundOrder: {
          ...choice("선납 환불을 확인할 주문을 선택해 주세요.", [["공기청정기 주문 선택", "confirmCardRefund"], ["다른 주문 확인", "s2"]]),
          items: [detail("공기청정기 · DL-261125-002", "카드 선납")]
        },
        refundPendingOrder: choice("선납 환불을 확인할 주문을 선택해 주세요.", [
          ["직수 정수기 주문 선택", "confirmPendingRefund"], ["다른 주문 확인", "s2"]
        ]),
        refundReasonOrder: choice("선납 환불을 확인할 주문을 선택해 주세요.", [
          ["직수 정수기 주문 선택", "confirmRefundReason"], ["다른 주문 확인", "s2"]
        ]),
        confirmVirtualRefund: refundConfirmation("직수 정수기", "DL-261125-001", "가상계좌 선납", "s4", "virtualRefundOrder"),
        confirmCardRefund: refundConfirmation("공기청정기", "DL-261125-002", "카드 선납", "s5", "cardRefundOrder"),
        confirmPendingRefund: refundConfirmation("직수 정수기", "DL-261125-011", "", "s6", "refundPendingOrder"),
        confirmRefundReason: refundConfirmation("직수 정수기", "DL-261125-012", "", "refundReasonMismatch", "refundReasonOrder"),
        refundReasonMismatch: result("이 주문에 연결된 환불 사유는 계약접수취소가 아니에요. 별도 환불 요청 내역에서 확인해 주세요.", [],
          [["환불 이력 확인", "@47"], ["다른 주문 확인", "s2"]]),
        s4: {
          message: "설치 전에 취소한 주문의 선납금은 아래 계좌로 돌려드려요. 지급일은 환불 등록 시점과 처리 상태를 확인해 안내해요.",
          items: [detail("환불 사유", "계약접수취소"), detail("환불 계좌", "KB국민은행 · ••••-••••-1234"), detail("처리 상태", "환불대기")],
          actions: [["환불 이력 확인", "@47"], ["다른 문의", "$menu"]]
        },
        s5: {
          message: "카드로 선납한 주문의 결제 취소를 확인했어요. 영업일 기준 5일 이내 카드사 문자 또는 결제 내역에서 확인할 수 있어요.",
          items: [detail("처리 상태", "카드 결제 취소")]
        },
        s6: { addActions: [["환불 등록·이력 문의", "@47"]] }
      }
    },
    47: {
      screens: {
        s1: { actions: [
          ["환불 일정·계좌 확인", "refundHistoryLookup"], ["제휴카드로 다시 결제", "retryPaymentLookup"],
          ["교체·전환·명의변경", "refundReasonLookup"], ["가상계좌 오입금", "wrongDepositLookup"]
        ] },
        refundHistoryLookup: lookup("환불 이력을 볼 계약을 입력해 주세요.", contract, "계약 확인", "refundHistoryAuth"),
        retryPaymentLookup: lookup("다시 결제할 계약을 입력해 주세요.", contract, "계약 확인", "retryPaymentAuth"),
        refundReasonLookup: lookup("환불 사유와 납부를 확인할 계약을 입력해 주세요.", contract, "계약 확인", "refundReasonAuth"),
        wrongDepositLookup: lookup("오입금 관련 계약을 입력해 주세요.", contract, "계약 확인", "wrongDepositAuth"),
        refundHistoryAuth: byPass("refundHistoryState", "s2"),
        refundHistoryState: resolved("s2", [contractCase("refundRequested", "047"), contractCase("refundComplete", "048"), knownProduct("s3")]),
        refundRequested: result("환불을 요청한 상태예요. 승인 여부가 확인되면 지급 일정을 안내할 수 있어요.", [
          detail("환불 상태", "환불의뢰"), detail("환불 요청 금액", "29,900원")
        ]),
        s3: {
          message: "환불이 결정됐고 지급을 기다리고 있어요. 등록 시점에 따라 화요일 또는 금요일에 지급돼요.",
          items: [detail("환불 상태", "환불대기"), detail("환불 금액", "29,900원"), detail("환불 계좌", "KB국민은행 · ••••-••••-1234")]
        },
        refundComplete: result("조회한 환불은 지급이 완료됐어요.", [
          detail("환불 상태", "환불승인"), detail("환불 금액", "29,900원"), detail("환불 계좌", "KB국민은행 · ••••-••••-1234"),
          detail("입금 완료일", "2026년 11월 24일")
        ]),
        retryPaymentAuth: byPass("retryPaymentStates", "s2"),
        refundReasonAuth: byPass("refundReasonState", "s2"),
        wrongDepositAuth: byPass("wrongDepositState", "s2"),
        refundReasonState: resolved("s2", [
          contractCase("refundReasons", "053"), contractCase("refundReasons", "054"), knownProduct("refundReasons")
        ]),
        wrongDepositState: resolved("s2", [knownProduct("s7")]),
        retryPaymentStates: resolved("s2", [knownProduct("s5"), contractCase("s4", "046"),
          contractCase("retryAfterPayment", "052"), contractCase("retryPriorMonth", "055"),
          contractCase("retryCms", "056")]),
        retryPriorMonth: result("제휴카드 재결제는 당월 납부 건을 확인한 뒤 진행할 수 있어요.", [
          detail("결제 구분", "지난달 납부")
        ], [["당월 납부 내역 확인", "@39"], ["다른 문의", "$menu"]]),
        retryCms: choice("기존 자동이체 건은 계약자 명의 계좌로 환불해야 해요. 환불 계좌를 확인해 주세요.", [
          ["환불 계좌 확인", "s6"], ["다른 문의", "$menu"]
        ]),
        s5: {
          ...choice("이번 달 카드 납부 건을 새 제휴카드로 다시 결제할 수 있어요. 상담사가 제휴카드 등록, 기존 카드 취소, 새 카드 결제 순서로 처리해요.", [
            ["제휴카드 재결제 상담", "retryCardCancellation"], ["다른 문의", "$menu"]
          ]),
          items: [detail("현재 결제수단", "신한카드 · ••••-••••-••••-1234"), detail("다시 결제할 금액", "29,900원")]
        },
        retryCardCancellation: handoff("상담사가 제휴카드 정보를 안전한 입력 절차로 확인해요. 기존 결제를 취소한 뒤 이번 달 요금을 새 카드로 다시 결제하며, 이전 결제 취소는 카드사에서 영업일 기준 5일 이내 확인할 수 있어요."),
        retryAfterPayment: result("이번 달 요금을 이미 납부한 뒤 결제수단을 바꾸셨다면 다음 달부터 새 결제수단으로 청구돼요.", [
          detail("변경 수단 적용", "다음 달")
        ], [["이번 달 납부 내역 문의", "@39"], ["다른 문의", "$menu"]]),
        refundReasons: choice("어떤 변경 이후 환불을 문의하시나요?", [
          ["교체 구독", "refundHistorySelection"], ["전환 멤버십", "switchRefund"], ["명의변경", "transferRefund"], ["중복 납부", "refundHistorySelection"]
        ]),
        switchRefund: resolved("switchRefundReview", filterRefundRules),
        switchRefundVerified: result("방문 기록과 필터 교체비 납부 내역을 확인했어요. 환불을 문의할 납부 건을 선택해 주세요.", [
          detail("방문 목적", "전체 필터 교체"), detail("처리 내역", "부품 사용 확인"),
          detail("필터 교체비 납부", "2026년 11월 · 29,900원")
        ], [["2026년 11월 필터 교체비 선택", "s6"], ["다른 납부 내역 확인 요청", "$handoff"]]),
        switchRefundReview: handoff("전체 필터를 교체한 방문 기록과 필터 교체비 납부가 확인돼야 환불을 검토할 수 있어요. 조회된 내용은 상담사가 확인해 드려요."),
        transferRefund: resolved("transferRefundReview", [contractCase("transferRefundVerified", "054")]),
        transferRefundVerified: result("양수인이 이번 달 요금을 납부한 것을 확인했어요. 환불을 문의할 출금 건을 선택해 주세요.", [
          detail("납부 대상 월", "2026년 11월"), detail("이전 계약자 출금액", "29,900원")
        ], [["2026년 11월 출금 건 선택", "s6"], ["다른 출금 내역 확인 요청", "$handoff"]]),
        transferRefundReview: handoff("명의변경 후 출금된 금액은 양수인이 이번 달 요금을 납부했는지 확인한 뒤 환불을 안내해 드려요."),
        refundHistorySelection: handoff("환불을 문의할 출금 월과 금액을 확인해야 해요. 상담사가 납부 내역을 조회한 뒤 맞는 건으로 도와드려요."),
        s6: { ...input("환불 은행과 계약자 명의 계좌를 입력해 주세요.", [bank, account], "환불 정보 확인", "refundAccountReview"), advanceOnSubmit: true },
        refundAccountReview: {
          ...handoff("환불 정보를 확인했어요. 계약자와 예금주가 일치하는지 확인한 뒤 접수를 진행해요.", [
            ["상담 요청", "$handoff"], ["다른 문의", "$menu"]
          ]),
          items: [detail("처리 상태", "계약자 명의 확인 필요")]
        },
        s7: lookup("입금한 가상계좌번호와 입금자 이름, 입금일, 입금 금액을 입력해 주세요.", [
          { ...account, label: "입금한 가상계좌번호" }, { label: "입금자 이름", type: "text", sample: "김매직" },
          { label: "입금일", type: "date", sample: "2026-11-25" },
          { label: "입금 금액", placeholder: "원 단위 금액 입력", type: "text", sample: "29900", inputMode: "numeric" }
        ], "입금 정보 확인", "$checkRefundDeposit"),
        depositNotFound: {
          ...choice("입금일, 입금자 이름, 금액이 일치하는 입금 내역을 확인하지 못했어요.", [
            ["입금 정보 다시 확인", "s7"], ["상담사 연결", "$handoff"]
          ]),
          kind: "exception"
        },
        s8: { items: [detail("준비할 서류", "입금증, 환불받을 통장 사본, 입금자 신분증 사본"), detail("신분증", "주민등록번호 뒷자리를 가려 주세요.")] }
      }
    },
    48: {
      screens: {
        s1: { actions: [
          ["발행 여부 확인", "receiptLookup"], ["영수증 받기", "receiptLookup"],
          ["새로 발행 신청", "receiptLookup"], ["전월분 소급 발행", "retroactiveLookup"], ["발행번호 안내", "receiptNumberLookup"]
        ] },
        receiptLookup: lookup("현금영수증을 확인할 계약을 입력해 주세요.", contract, "계약 확인", "receiptAuth"),
        retroactiveLookup: lookup("전월 현금영수증을 확인할 계약을 입력해 주세요.", contract, "계약 확인", "retroactiveAuth"),
        receiptAuth: byPass("receiptCases", "s2"),
        retroactiveAuth: byPass("retroactiveEligibility", "s2"),
        receiptCases: resolved("s2", [
          contractCase("s2", "000"), contractCase("s7", "048"), contractCase("taxReceiptConflict", "049"),
          contractCase("receiptPendingApproval", "050"), contractCase("s3", "051"),
          knownProduct("receiptKnown")
        ]),
        receiptKnown: resolved("receiptApproved", [{ target: "s5", fields: ["$choice"], match: "^영수증 받기$" }]),
        receiptApproved: result("이 계약은 현금영수증을 발행하고 있어요. 정기 발송은 제공하지 않아 필요할 때 요청해 주세요. 국세청 홈택스에서도 확인할 수 있어요.", [detail("발행 상태", "발행")], [
          ["영수증 받기", "s5"], ["발행번호 안내", "receiptNumberCases"], ["다른 문의", "$menu"]
        ]),
        receiptPendingApproval: result("현금영수증 거래가 아직 승인되지 않았어요. 승인된 내역은 다시 요청하시면 보내드릴 수 있어요.", [
          detail("거래 상태", "승인 전")
        ]),
        taxReceiptConflict: {
          ...choice("세금계산서가 발행 중인 계약에는 현금영수증을 함께 발행할 수 없어요.", [
            ["세금계산서 발행 상태 확인", "$handoff"], ["현재 상태 유지", "$finish"]
          ]),
          kind: "exception"
        },
        receiptNumberLookup: lookup("현금영수증 발행번호를 확인할 계약을 입력해 주세요.", contract, "계약 확인", "receiptNumberAuth"),
        receiptNumberAuth: byPass("receiptNumberCases", "s2"),
        receiptNumberCases: resolved("s2", [knownProduct("receiptNumberFixed"),
          contractCase("s2", "000"), contractCase("taxReceiptConflict", "049"), contractCase("s3", "051"),
          contractCase("receiptBusinessFixed", "064"), contractCase("receiptNumberAllowed", "065")
        ]),
        receiptNumberFixed: result("이 계약은 정기결제라 계약자 휴대폰 번호로 현금영수증을 발행해요. 정기결제의 발행번호는 변경할 수 없어요.", [
          detail("발행 구분", "개인 · 정기결제"), detail("발행번호", "010-••••-1234")
        ]),
        receiptBusinessFixed: result("이 계약의 현금영수증 발행번호는 등록된 사업자등록번호예요. 정기결제의 발행번호는 변경할 수 없어요.", [
          detail("발행 구분", "개인사업자 · 정기결제"), detail("발행번호", "123-••-•••90")
        ]),
        receiptNumberAllowed: choice("개인의 일회성 실시간 이체 또는 가상계좌 납부에 한해 발행번호 변경 여부를 확인할 수 있어요.", [
          ["요금 납부 절차 확인", "@4"], ["상담 요청", "$handoff"]
        ]),
        retroactiveEligibility: resolved("s2", [
          knownProduct("receiptDates"), contractCase("receiptDates", "048"), contractCase("s3", "051"), contractCase("taxReceiptConflict", "049")
        ]),
        receiptDates: resolved("$receiptRetroactive"),
        s8: {
          message: "전월분 소급 발행은 매월 10일 이내에 요청할 수 있어요. 발행 가능 여부는 결제와 기존 발행 상태를 확인한 뒤 안내해요.",
          items: [detail("대상", "전월 결제분"), detail("처리 상태", "발행 조건 확인")],
          actions: [["발행 가능 여부 확인 요청", "$handoff"], ["다른 문의", "$menu"]]
        },
        receiptNextMonth: result("전월분 소급 요청 기간이 지났어요. 신규 발행 신청은 신청월부터 적용되는 조건을 확인해 주세요."),
        s5: {
          ...choice("보낼 현금영수증을 선택해 주세요. 거래 상태가 승인된 영수증을 발송할 수 있어요.", [
            ["11월 25일 승인 내역", "$selectCashReceipt"], ["발행일·인증값으로 찾기", "receiptTransactionLookup"]
          ]),
          items: approvedCashReceipt,
          demo: true
        },
        receiptTransactionLookup: lookup("현금영수증 발행일과 발행에 사용한 번호의 끝 네 자리를 입력해 주세요.", [
          { label: "현금영수증 발행일", type: "date", sample: "2026-11-25" },
          { label: "발행번호 끝 4자리", type: "password", placeholder: "숫자 4자리", sample: "1234", inputMode: "numeric" }
        ], "발행 내역 조회", "receiptTransactionMatch"),
        receiptTransactionMatch: resolved("receiptTransactionNotFound", [{ target: "receiptTransactionFound", match: "", all: true,
          fields: ["현금영수증 발행일", "발행번호 끝 4자리"], patterns: { "현금영수증 발행일": "^2026-11-25$", "발행번호 끝 4자리": "^1234$" } }]),
        receiptTransactionNotFound: { ...choice("발행일과 발행번호 끝 네 자리가 일치하는 승인 건을 찾지 못했어요.", [
          ["조회 정보 다시 입력", "receiptTransactionLookup"], ["승인 내역 선택으로 돌아가기", "s5"]
        ]), kind: "exception" },
        receiptTransactionFound: {
          ...choice("입력하신 정보에 해당하는 승인 거래를 찾았어요.", [["이 현금영수증 받기", "$selectCashReceipt"]]),
          items: approvedCashReceipt
        },
        approvedReceiptDelivery: {
          ...choice("선택한 현금영수증을 어떤 방법으로 받으시겠어요?", [
            ["알림톡", "$delivery"], ["이메일", "$delivery"], ["팩스", "$delivery"]
          ]),
          delivery: { target: "s6", useRegisteredNumber: false },
          demo: true
        },
        s6: result("현금영수증을 [발송 방법]으로 보낼 요청 내용을 확인했어요. 실제 발송은 운영 환경에서 진행돼요.",
          [detail("발송 방법", "[발송 방법]"), detail("수신처", "[마스킹된 수신처]")],
          [["승인 내역 다시 선택", "s5"], ["다른 문의", "$menu"]]),
        s7: { actions: [["발행으로 변경", "receiptChangeReview"], ["현재 상태 유지", "$finish"]] },
        receiptChangeReview: choice("신규 발행을 선택하면 신청월부터 적용돼요. 이 조건으로 변경을 요청하시겠어요?", [
          ["발행 변경 요청", "receiptEnabled"], ["현재 상태 유지", "$finish"]
        ]),
        receiptEnabled: result("앞으로 현금영수증을 발행하도록 변경했어요. 새 설정은 신청월부터 적용돼요.", [
          detail("발행 상태", "발행"), detail("적용 시점", "신청월부터")
        ], [["전월분 소급 발행 확인", "retroactiveEligibility"], ["다른 문의", "$menu"]])
      }
    },
    49: {
      screens: {
        s2: {
          ...input("동의 상태를 조회할 성함과 휴대폰 번호를 입력해 주세요.", ["name", "phone"], "인증번호 받기", "$sendOtp"),
          secure: true
        },
        consentAuthFailed: handoff("인증번호를 확인하지 못했어요. 휴대폰 인증을 다시 하거나 상담사에게 문의해 주세요.", [
          ["휴대폰 다시 확인", "s2"], ["상담사 연결", "$handoff"]
        ]),
        consentCustomerLookup: resolved("consentCustomerNotFound", [{ target: "s4", match: "", all: true,
          fields: ["이름", "휴대폰 번호"], patterns: { "이름": "^김매직$", "휴대폰 번호": "^01000001234$" } }]),
        consentCustomerNotFound: handoff("인증한 정보로 조회할 수 있는 SK매직 동의 내역을 찾지 못했어요. 상담사가 등록된 고객 정보를 확인해 드려요.", [
          ["상담사 연결", "$handoff"], ["다른 문의", "$menu"]
        ]),
        s4: {
          actions: [["SK매직 항목 확인", "consentItems"], ["현재 상태 유지", "$finish"]]
        },
        consentItems: {
          ...choice("상태를 확인하거나 바꿀 항목을 선택해 주세요.", [
            ["마케팅 활용", "marketingConsent"], ["영리성 정보 수신", "commercialConsent"], ["현재 상태 유지", "$finish"]
          ]),
          items: [detail("회사", "SK매직"), detail("마케팅 활용", "[마케팅 활용 상태]"), detail("영리성 정보 수신", "[영리성 수신 상태]")],
          demo: true
        },
        marketingConsent: choice("SK매직의 마케팅 활용 동의를 어떻게 할까요?", [
          ["동의하기", "marketingAccepted"], ["동의 철회", "marketingWithdrawn"], ["현재 상태 유지", "$finish"]
        ]),
        commercialConsent: choice("SK매직의 영리성 정보 수신 동의를 어떻게 할까요?", [
          ["동의하기", "commercialAccepted"], ["동의 철회", "commercialWithdrawn"], ["현재 상태 유지", "$finish"]
        ]),
        marketingAccepted: result("SK매직의 마케팅 활용 상태를 확인했어요.", [detail("회사", "SK매직"), detail("마케팅 활용", "동의")], [["동의 상태 다시 보기", "consentItems"], ["상담 종료", "$finish"]]),
        marketingWithdrawn: result("SK매직의 마케팅 활용 동의를 철회했어요.", [detail("회사", "SK매직"), detail("마케팅 활용", "미동의")], [["동의 상태 다시 보기", "consentItems"], ["상담 종료", "$finish"]]),
        commercialAccepted: result("SK매직의 영리성 정보 수신 상태를 확인했어요.", [detail("회사", "SK매직"), detail("영리성 정보 수신", "동의")], [["동의 상태 다시 보기", "consentItems"], ["상담 종료", "$finish"]]),
        commercialWithdrawn: result("SK매직의 영리성 정보 수신 동의를 철회했어요.", [detail("회사", "SK매직"), detail("영리성 정보 수신", "미동의")], [["동의 상태 다시 보기", "consentItems"], ["상담 종료", "$finish"]])
      }
    },
    50: {
      screens: {
        s1: {
          kind: "internal-only", fields: [], actions: [],
          message: "구독 체결 심사는 담당 상담사가 계약자에게 연락해 진행하는 업무예요.",
          items: [
            detail("업무 채널", "상담사 발신"),
            detail("업무 흐름", "배정 건 확인 → 계약자 및 동의 확인 → 주문·계약 확인 → 상담 상태 등록"),
            detail("채팅 적용", "별도 검토")
          ]
        }
      }
    }
  };

  Object.assign(window.SKIX_FLOW_OVERLAYS ??= {}, overlays);
})();
