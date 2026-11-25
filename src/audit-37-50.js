(() => {
  "use strict";

  const choice = (message, actions) => ({ kind: "choice", message, actions });
  const input = (message, fields, action, target) => ({ kind: "input", message, fields, actions: [[action, target]] });
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
  const phoneCase = (target, suffix) => ({ target, fields: ["휴대폰 번호"], match: "^010-?0000-?" + suffix + "$" });
  const seoulDay = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", day: "2-digit" }).format(new Date()));
  const recipient = ["name", "phone", "address"];
  const cancellation = [{ label: "취소 사유", placeholder: "취소하는 이유를 짧게 입력해 주세요", type: "text", sample: "일정 변경" }];
  const withdrawal = [{ label: "철회 사유", placeholder: "해약 신청을 철회하는 이유", type: "text", sample: "계약을 계속 이용하고 싶어요" }];
  const bank = { label: "은행", placeholder: "은행명 입력", type: "text", sample: "KB국민은행" };
  const account = { label: "계좌번호", placeholder: "숫자만 입력", type: "password", sample: "000000001234" };
  const confirmOrder = (product, orderNumber, state, next) => ({
    ...choice("조회된 주문이 취소하려는 주문과 일치하는지 확인해 주세요.", [["이 주문이 맞아요", next], ["다른 주문 선택", "orderSelect"]]),
    items: [detail("제품", product), detail("주문번호", orderNumber), detail("배송 상태", state)]
  });

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
        s3: { message: "서류를 받을 계약을 확인해 주세요.", fields: contract, items: [], actions: [["계약 확인", "documentLookup"]] },
        documentLookup: resolved("s5", [contractCase("s4", "000")]),
        documentAuthority: choice("개인과 개인사업자 계약은 계약자 본인이 서류를 요청할 수 있어요.", [
          ["계약자 본인", "s3"], ["계약자 아님", "s4"]
        ]),
        s6: {
          fields: [{
            label: "정기 발송일", placeholder: "12~28일 중 하루 또는 말일", type: "text", sample: "15일",
            options: [...Array.from({ length: 17 }, (_, i) => `${i + 12}일`), "매월 말일"]
          }],
          actions: [["이 날짜로 계속", "s7"]]
        }
      }
    },
    38: {
      screens: {
        s2: input("배송받으실 분의 성함, 연락처, 주소를 차례로 입력해 주세요. 주문을 찾아볼게요.", recipient, "주문 조회", "orderLookup"),
        orderLookup: resolved("orderSelect", [phoneCase("orderNotFound", "0000")]),
        orderSelect: {
          ...choice("취소를 요청할 주문을 선택해 주세요. 출고를 준비 중인 주문은 설치 담당자가 확인해요.", [
            ["직수 정수기 · 구독 · 납품대기", "subscriptionOrder"], ["공기청정기 · 일시불 · 납품대기", "singleOrder"],
            ["비데 · 출고 준비", "dispatchOrder"]
          ]),
          items: [detail("배송지", "서울 영등포구 문래동")]
        },
        subscriptionOrder: confirmOrder("직수 정수기 · 구독", "DL-261125-001", "납품대기", "subscriptionReason"),
        singleOrder: confirmOrder("공기청정기 · 일시불", "DL-261125-002", "납품대기", "singleReason"),
        dispatchOrder: confirmOrder("비데", "DL-261125-003", "출고 준비", "s6"),
        subscriptionReason: input("구독 주문은 묶음 상품 전체가 취소돼요. 취소 사유를 입력해 주세요.", cancellation, "구독 주문 취소 요청", "s4"),
        singleReason: input("공기청정기 일시불 주문의 취소 사유를 입력해 주세요.", cancellation, "일시불 주문 취소 요청", "s5"),
        orderNotFound: handoff("일치하는 주문을 찾지 못했어요. 주문자의 성함과 배송지를 다시 확인해 주세요.", [["주문 다시 확인", "s2"], ["상담 요청", "$handoff"]]),
        s4: { message: "직수 정수기 구독 주문의 묶음 취소가 처리됐어요.", addActions: [["선납 환불 확인", "@46"]] },
        s5: {
          message: "공기청정기 일시불 주문의 취소가 처리됐어요.",
          items: [detail("취소 대상", "공기청정기 일시불 주문"), detail("처리 상태", "취소 완료")],
          addActions: [["선납 환불 확인", "@46"]]
        },
        s6: {
          message: "주문의 출고 준비가 시작됐어요. 설치 담당자가 취소 가능 여부를 확인하도록 요청 내용을 전달할 수 있어요.",
          actions: [["담당자에게 취소 요청", "dispatchReason"], ["주문 다시 선택", "orderSelect"]]
        },
        dispatchReason: input("설치 담당자에게 전달할 취소 사유를 입력해 주세요.", cancellation, "취소 요청 전달", "orderHandoff"),
        orderHandoff: handoff("취소 요청 내용을 확인했어요. 취소 가능 여부는 설치 담당자가 확인해요.", [["다른 문의", "$menu"]])
      }
    },
    39: {
      screens: {
        s2: { fields: contract, actions: [["계약 확인", "paymentContractLookup"]] },
        paymentContractLookup: resolved("reuse006Pass", [contractCase("s3", "000")]),
        s4: { resolve: { rules: [contractCase("beforeDebit", "039"), contractCase("s6", "040"), contractCase("s5", "041"),
          contractCase("contractClosed", "042"), contractCase("schoolWaiver", "043")] } },
        s8: { actions: [["가상계좌 입금 처리 확인", "depositConditions"], ["환불 등록·이력 문의", "@47"], ["상담 요청", "$handoff"]] },
        beforeDebit: result("이 계약의 정기 결제일은 매월 25일이에요. 결제일이 지나면 당월 납부 여부를 확인할 수 있어요.", [
          detail("정기 결제일", "매월 25일")
        ]),
        contractClosed: result("계약이 종료됐어요. 종료 후에는 이 계약의 정기 구독료가 청구되지 않아요."),
        schoolWaiver: result("방학 면제 조건이 적용되는 계약이에요. 이 조건에는 1월과 8월의 구독료 면제가 포함돼요.", [
          detail("확인된 면제 사유", "방학 면제")
        ]),
        depositConditions: resolved("depositTomorrow", [contractCase("depositCarry", "044"), contractCase("depositReturn", "042"), contractCase("@47", "047")]),
        depositTomorrow: result("오늘 추가로 결제한 금액은 다음 날부터 확인할 수 있어요."),
        depositCarry: choice("중복 입금액을 다음 달 구독료에 반영할 수 있어요. 어떤 방식으로 처리하시겠어요?", [
          ["다음 달 구독료에 반영 요청", "depositCarryRequest"], ["환불 문의", "@47"]
        ]),
        depositCarryRequest: handoff("다음 달 구독료에 반영해 달라는 요청을 확인했어요. 상담사가 입금 상태와 적용 가능 여부를 확인해요."),
        depositReturn: result("해약이 진행 중이에요. 제품 회수가 완료된 뒤 하루가 지나면 이중 결제 여부를 확인할 수 있어요.")
      }
    },
    40: {
      screens: {
        s2: { fields: contract, actions: [["계약 확인", "withdrawalLookup"]] },
        withdrawalLookup: resolved("authWithdrawal", [contractCase("s3", "000")]),
        authWithdrawal: byPass("withdrawalCases", "s3"),
        withdrawalCases: resolved("s5", [contractCase("s4", "042"), contractCase("cardWithdrawal", "051"), contractCase("accountWithdrawal", "052")]),
        s5: { actions: [["해약철회 진행", "withdrawalReason"], ["해약 신청 유지", "$finish"]] },
        withdrawalReason: input("해약 신청을 철회하는 이유를 입력해 주세요.", withdrawal, "철회 요청", "s8"),
        cardWithdrawal: choice("해약금을 카드로 납부했어요. 해약 신청을 철회하고 기존 카드 결제도 취소할까요?", [
          ["해약철회 진행", "withdrawalCardReason"], ["해약 신청 유지", "$finish"]
        ]),
        withdrawalCardReason: input("해약 신청을 철회하는 이유를 입력해 주세요.", withdrawal, "철회와 카드 취소 요청", "s6"),
        s6: { message: "해약금 카드 결제를 취소했어요. 카드사 반영 안내는 영업일 기준 3~5일이에요." },
        accountWithdrawal: choice("해약금을 계좌로 납부했어요. 해약 신청을 철회하시겠어요?", [
          ["해약철회 진행", "withdrawalAccountReason"], ["해약 신청 유지", "$finish"]
        ]),
        withdrawalAccountReason: input("해약 신청을 철회하는 이유를 입력해 주세요.", withdrawal, "철회와 환불 조건 확인", "s7"),
        s7: { actions: [["환불 진행", "refundAccount"], ["진행하지 않기", "$finish"]] },
        refundAccount: input("계약자 명의의 환불 계좌를 입력해 주세요.", [bank, account], "환불 요청", "refundRequest"),
        refundRequest: result("해약철회와 환불 요청을 접수했어요. 이 경로에서는 계약자 계좌 확인 후 환불을 진행해요.", [
          detail("환불 유형", "선수금 · 해약철회"), detail("지급 조건", "계약자 명의 계좌 확인")
        ]),
        s8: { message: "계약의 해약 신청이 취소됐어요." }
      }
    },
    41: {
      screens: {
        s1: {
          kind: "choice", fields: [], actions: [["제품 유형으로 찾기", "providerChoices"], ["모델명 입력", "providerModel"]]
        },
        providerModel: input("서비스를 받을 제품의 모델명이나 제품명을 입력해 주세요.", ["product"], "모델명 확인", "providerLookup"),
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
        s2: { message: "영업양도 대상 조리기기는 경동나비엔 고객센터에서 서비스 상담과 접수를 맡아요. 전기오븐레인지 EONB450의 담당 여부는 별도 확인이 필요해요." },
        s4: { message: "연락처 안내를 받으실 정보를 확인했어요." },
        s7: { message: "이 제품은 유형만으로 대행업체를 확인하기 어려워요. 모델명을 확인한 뒤 서비스 상담을 이어갈 수 있어요.", addActions: [["서비스 접수 확인", "@12"]] }
      }
    },
    42: {
      screens: {
        s1: { actions: [["연장 여부 확인", "membershipLookup"], ["자동연장 거부", "extensionLookup"], ["멤버십 해약 문의", "terminationLookup"], ["교체 구독 상담", "replacementLookup"]] },
        membershipLookup: input("확인할 멤버십 계약을 입력해 주세요.", contract, "연장 상태 확인", "renewalAuth"),
        extensionLookup: input("자동연장을 거부할 멤버십 계약을 입력해 주세요.", contract, "대상 계약 확인", "optOutAuth"),
        terminationLookup: input("해약을 문의할 멤버십 계약을 입력해 주세요.", contract, "대상 계약 확인", "terminationAuth"),
        replacementLookup: input("교체 구독을 문의할 멤버십 계약을 입력해 주세요.", contract, "대상 계약 확인", "replacementAuth"),
        renewalAuth: byPass("renewalLookup", "s2"),
        optOutAuth: byPass("extensionEligibility", "s2"),
        terminationAuth: byPass("terminationEligibility", "s2"),
        replacementAuth: byPass("replacementEligibility", "s2"),
        renewalLookup: resolved("s3", [contractCase("s2", "000"), contractCase("membershipExpiry", "042"), contractCase("renewalArrears", "043")]),
        extensionEligibility: resolved("E7", [contractCase("s2", "000"), contractCase("membershipExpiry", "042"), contractCase("renewalArrears", "043")]),
        terminationEligibility: resolved("s6", [contractCase("s2", "000")]),
        replacementEligibility: resolved("s7", [contractCase("s2", "000")]),
        membershipExpiry: result("최초 설치일부터 멤버십 연장이 가능한 7년이 지나면 최종 만료돼요.", [
          detail("갱신 상태", "최종 만료 예정")
        ], [["교체 구독 상담", "s7"]]),
        renewalArrears: result("갱신 시점에 연체가 해소되지 않으면 멤버십이 자동 종료돼요.", [
          detail("갱신 상태", "미납 확인 필요")
        ], [["미납요금 확인", "@5"]]),
        E7: { addActions: [["원복 불가 안내 확인", "s4"]] },
        s3: { addActions: [["자동연장 거부 검토", "E7"], ["교체 구독 상담", "s7"]] },
        s4: { actions: [["자동연장 거부에 동의", "s5"], ["유지하기", "$finish"]] },
        s5: { message: "멤버십의 자동연장 거부를 등록했어요. 이 계약은 안내한 만료 시점까지 유지돼요.", demo: true },
        s6: { addActions: [["상담 요청", "$handoff"]] },
        s7: { addActions: [["교체 구독 상담 요청", "$handoff"]] }
      }
    },
    43: {
      screens: {
        s1: { actions: [
          ["혜택 종류·발송일", "giftLookup"], ["사은품 변경", "giftChangeLookup"],
          ["불량 또는 판매처 문의", "giftSupportLookup"], ["주문하지 않은 택배", "s6"]
        ] },
        giftLookup: input("사은품 혜택을 확인할 계약을 입력해 주세요.", contract, "계약 확인", "giftCases"),
        giftChangeLookup: input("변경하려는 사은품의 계약을 입력해 주세요.", contract, "계약 확인", "giftChangeCases"),
        giftSupportLookup: input("문의하실 사은품의 계약을 입력해 주세요.", contract, "계약 확인", "giftSupportCases"),
        giftCases: resolved("s3", [contractCase("s7", "043"), contractCase("s2", "000"),
          contractCase("naverBenefit", "061"), contractCase("physicalGift", "062")]),
        giftChangeCases: resolved("s4", [contractCase("s2", "000")]),
        giftSupportCases: resolved("giftSupport", [contractCase("s2", "000")]),
        s3: { message: "이 주문에는 구독 포인트 혜택이 있어요. 설치 완료일로부터 15일 후 매직몰 가입 아이디로 적립돼요." },
        naverBenefit: result("이 주문의 네이버페이 혜택은 설치 다음 달 20일경 알림톡이나 문자로 발송돼요."),
        physicalGift: result("이 주문의 사은품은 설치 완료일로부터 15일 이내 별도로 배송돼요."),
        giftSupport: choice("어떤 확인이 필요한가요?", [["사은품 불량", "giftEvidence"], ["판매처 연락 요청", "s7"]]),
        giftEvidence: handoff("사은품 불량을 확인할 수 있도록 사진을 준비해 주세요. 판매 부서가 교환 가능 여부를 확인해요."),
        s4: { actions: [["개봉 또는 사용했어요", "s5"], ["아직 개봉하거나 사용하지 않았어요", "giftReview"]] },
        giftReview: handoff("미개봉 상태인 사은품이에요. 판매처에서 조건을 확인한 뒤 교환 가능 여부를 안내해요."),
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
          actions: [["설치 환경 확인", "$installationResult"]]
        },
        s5: {
          message: "재설치 방문을 접수할까요? 이사로 재설치하시면 이사 예정일도 확인해요.",
          actions: [["재설치 방문 접수", "s6"], ["이사 후 재설치 접수", "@9"], ["안내만 받기", "$finish"]]
        },
        s6: {
          message: "재설치할 주소와 방문 희망일, 당일 연락받을 번호를 입력해 주세요.",
          fields: ["address", "date", "phone"], actions: [["재설치 방문 정보 확인", "installationEquipmentCheck"]]
        },
        installationEquipmentCheck: resolved("s7", [
          { target: "valveChoice", fields: ["제품명 또는 모델명"], match: "정수기|wpu" }
        ]),
        valveChoice: choice("정수기를 재설치할 때 조리수 밸브도 함께 설치할까요?", [
          ["조리수 밸브 설치 함께 요청", "valveBooked"], ["조리수 밸브 필요 없음", "s7"]
        ]),
        s7: {
          message: "재설치 방문 요청을 확인했어요. 방문 시 설치 환경을 확인한 뒤 설치 가능 여부를 안내해요.",
          items: [detail("방문 희망일", "[선택한 날짜]")]
        },
        valveBooked: result("재설치 요청에 조리수 밸브 설치도 포함했어요. 방문 시 설치 환경을 확인해요.", [
          detail("요청 범위", "재설치 · 조리수 밸브"),
          detail("방문 희망일", "[선택한 날짜]"),
          detail("안내", "알림톡으로 접수 정보 확인")
        ], [["계속하기", "s8"]]),
        s8: { actions: [["사전 연락 요청", "E8"], ["추가 요청 없음", "$finish"]] }
      }
    },
    45: {
      screens: {
        s1: { actions: [
          ["선납 금액·할인 확인", "prepaidLookup"], ["선납 견적서·영수증", "prepaidFilesLookup"], ["선납 취소 문의", "s8"]
        ] },
        prepaidLookup: input("선납 조건을 확인할 계약을 입력해 주세요.", contract, "대상 계약 확인", "prepaidCases"),
        prepaidCases: byPass("prepaidEligibility", "s2"),
        prepaidEligibility: resolved("prepaidTerms", [contractCase("specialPrepaid", "045"), contractCase("s2", "000")]),
        prepaidTerms: {
          ...choice("일반 계약의 선납 기간별 할인율이에요. 적용 조건을 확인해 주세요.", [
            ["1년 금액 확인", "s3"], ["2년 금액 확인", "prepaidQuote2"], ["3년 금액 확인", "prepaidQuote3"],
            ["4년 금액 확인", "prepaidQuote4"], ["5년 금액 확인", "prepaidQuote5"], ["선납 기간 조건 문의", "$handoff"]
          ]),
          items: [detail("1년", "4%"), detail("2년", "6%"), detail("3년", "8%"), detail("4년", "10%"), detail("5년 이상", "12%")],
          demo: true
        },
        ...prepaidQuotes,
        specialPrepaid: handoff("프로모션·패키지 등 기존 할인 계약은 추가 할인 조건이 달라요. 자유개월 선납 적용 여부와 기간은 계약별 확인이 필요해요.", [
          ["견적서 요청", "quoteDelivery"], ["선납 조건 확인 요청", "$handoff"]
        ]),
        s3: { addActions: [["다른 기간 보기", "prepaidTerms"]] },
        s4: { actions: [["선납 진행", "s5"], ["견적서 받기", "quoteDelivery"], ["안내만 받기", "$finish"]] },
        s5: { actions: [["세금계산서 발행", "taxPrepaid"], ["발행하지 않기", "ordinaryPrepaid"]] },
        taxPrepaid: choice("세금계산서 발행을 선택했어요. 선납 결제수단을 확인하거나 견적서를 받을 수 있어요.", [
          ["선납 결제수단 확인", "prepaidPaymentMethods"], ["견적서 먼저 받기", "quoteDelivery"]
        ]),
        ordinaryPrepaid: choice("세금계산서를 발행하지 않기로 했어요. 선납 결제수단을 확인하거나 견적서를 받을 수 있어요.", [
          ["선납 결제수단 확인", "prepaidPaymentMethods"], ["견적서 먼저 받기", "quoteDelivery"]
        ]),
        prepaidPaymentMethods: choice("선납에 사용할 결제수단을 선택해 주세요.", [
          ["카드", "prepaidCard"], ["실시간 계좌이체", "prepaidTransfer"], ["가상계좌", "prepaidVirtual"]
        ]),
        prepaidCard: handoff("선납 금액을 확인한 뒤 등록된 카드나 고객이 선택한 카드로 결제를 진행합니다. 상담사가 선납 등록과 결제 절차를 안내해요."),
        prepaidTransfer: handoff("선납 금액과 사용할 은행 계좌를 확인한 뒤 실시간 계좌이체를 진행합니다. 상담사가 선납 등록과 결제 절차를 안내해요."),
        prepaidVirtual: handoff("선납 금액을 확인하고 입금기한과 은행을 선택하면 가상계좌를 발급할 수 있어요. 상담사가 발급과 확인서 수신 절차를 안내해요."),
        prepaidFilesLookup: input("선납 서류를 확인할 계약을 입력해 주세요.", contract, "선납 상태 확인", "prepaidDocumentsAuth"),
        prepaidDocumentsAuth: byPass("prepaidDocumentState", "s2"),
        prepaidDocumentState: resolved("prepaidDocuments", [contractCase("s2", "000")]),
        prepaidDocuments: choice("어떤 선납 서류를 받으실까요?", [
          ["선납 견적서", "quoteDelivery"], ["선납 영수증", "prepaidReceiptCheck"],
          ["세금계산서 재발송 문의", "prepaidTaxInvoice"]
        ]),
        prepaidReceiptCheck: resolved("prepaidReceipt", [contractCase("s6", "059"), contractCase("prepaidReceiptUnavailable", "058")]),
        s6: { actions: [["견적서 받기", "quoteDelivery"]] },
        quoteDelivery: input("견적서를 받으실 이메일 주소를 입력해 주세요.", ["email"], "견적서 발송 요청", "s7"),
        s7: { message: "선납 견적서 발송 요청을 확인했어요.", items: [detail("문서", "선납 견적서"), detail("발송 채널", "이메일")], demo: true },
        prepaidReceipt: {
          ...choice("결제가 완료된 계약의 선납영수증을 어떤 방법으로 받으시겠어요?", [
            ["알림톡", "$delivery"], ["이메일", "$delivery"], ["팩스", "$delivery"]
          ]),
          delivery: { target: "prepaidReceiptSent", useRegisteredNumber: false }
        },
        prepaidReceiptSent: result("결제가 완료된 계약의 선납영수증 발송 요청을 확인했어요.", [detail("발송 방법", "[발송 방법]")]),
        prepaidReceiptUnavailable: result("선납이 취소된 계약은 이 선납영수증을 발송할 수 없어요.", [], [["선납 문의", "$handoff"]]),
        prepaidTaxInvoice: handoff("선납 세금계산서는 수신미승인 상태에서 재발송할 수 있어요. 상담사가 문서와 수신 상태를 확인해요.")
      }
    },
    46: {
      screens: {
        s1: { actions: [["설치 주문 취소", "s3"], ["선납 환불 확인", "s2"]] },
        s2: input("설치받으실 분의 성함, 연락처, 주소를 차례로 입력해 주세요. 주문을 찾아볼게요.", recipient, "대상 주문 조회", "refundOrder"),
        refundOrder: resolved("virtualRefundOrder", [phoneCase("cardRefundOrder", "0004"), phoneCase("s6", "0000")]),
        virtualRefundOrder: {
          ...choice("선납 환불을 확인할 주문을 선택해 주세요.", [["직수 정수기 주문 선택", "s4"], ["다른 주문 확인", "s2"]]),
          items: [detail("직수 정수기 · DL-261125-001", "가상계좌 선납")]
        },
        cardRefundOrder: {
          ...choice("선납 환불을 확인할 주문을 선택해 주세요.", [["공기청정기 주문 선택", "s5"], ["다른 주문 확인", "s2"]]),
          items: [detail("공기청정기 · DL-261125-002", "카드 선납")]
        },
        s4: { message: "가상계좌로 선납한 주문의 환불 정보를 확인했어요. 환불 예정일은 납부·등록 상태에 따라 확인이 필요해요.", items: [detail("환불 계좌", "KB국민은행 · ••••-••••-1234"), detail("환불 예정일", "등록 상태 확인 필요")] },
        s5: { message: "카드로 선납한 주문의 결제 취소를 확인했어요. 영업일 기준 5일 이내 카드사 문자 또는 결제 내역에서 확인할 수 있어요." },
        s6: { addActions: [["환불 등록·이력 문의", "@47"]] }
      }
    },
    47: {
      screens: {
        s1: { actions: [
          ["환불 일정·계좌 확인", "refundHistoryLookup"], ["제휴카드로 다시 결제", "retryPaymentLookup"],
          ["교체·전환·명의변경", "refundReasonLookup"], ["가상계좌 오입금", "wrongDepositLookup"]
        ] },
        refundHistoryLookup: input("환불 이력을 볼 계약을 입력해 주세요.", contract, "계약 확인", "refundHistoryAuth"),
        retryPaymentLookup: input("다시 결제할 계약을 입력해 주세요.", contract, "계약 확인", "retryPaymentAuth"),
        refundReasonLookup: input("환불 사유와 납부를 확인할 계약을 입력해 주세요.", contract, "계약 확인", "refundReasonAuth"),
        wrongDepositLookup: input("오입금 관련 계약을 입력해 주세요.", contract, "계약 확인", "wrongDepositAuth"),
        refundHistoryAuth: byPass("refundHistoryState", "s2"),
        refundHistoryState: resolved("s3", [contractCase("s2", "000"), contractCase("refundRequested", "047"), contractCase("refundComplete", "048")]),
        refundRequested: result("환불을 요청한 상태예요. 승인 여부가 확인되면 지급 일정을 안내할 수 있어요.", [detail("환불 상태", "환불의뢰")]),
        s3: {
          message: "환불이 결정됐고 지급을 기다리고 있어요. 등록 시점에 따라 화요일 또는 금요일에 지급돼요.",
          items: [detail("환불 상태", "환불대기"), detail("환불 계좌", "KB국민은행 · ••••-••••-1234")]
        },
        refundComplete: result("조회한 환불은 지급이 완료됐어요.", [
          detail("환불 상태", "환불승인"), detail("환불 계좌", "KB국민은행 · ••••-••••-1234")
        ]),
        retryPaymentAuth: byPass("retryPaymentStates", "s2"),
        refundReasonAuth: byPass("refundReasonState", "s2"),
        wrongDepositAuth: byPass("wrongDepositState", "s2"),
        refundReasonState: resolved("refundReasons", [contractCase("s2", "000")]),
        wrongDepositState: resolved("s7", [contractCase("s2", "000")]),
        retryPaymentStates: resolved("s5", [contractCase("s2", "000"), contractCase("s4", "046"),
          contractCase("retryAfterPayment", "052")]),
        retryAfterPayment: result("이번 달 요금을 이미 납부한 뒤 결제수단을 바꾸셨다면 다음 달부터 새 결제수단으로 청구돼요.", [
          detail("변경 수단 적용", "다음 달")
        ], [["이번 달 납부 내역 문의", "@39"], ["다른 문의", "$menu"]]),
        refundReasons: choice("어떤 변경 이후 환불을 문의하시나요?", [
          ["교체 구독", "s6"], ["전환 멤버십", "switchRefund"], ["명의변경", "transferRefund"], ["중복 납부", "s6"]
        ]),
        switchRefund: handoff("전환 멤버십의 환불 문의예요. 담당자가 전체 필터 교체와 수납 이력을 확인한 뒤 환불 가능 여부를 안내해요."),
        transferRefund: handoff("명의변경에 따른 환불 문의예요. 담당자가 계약 변경 상태와 환불 대상 회차를 확인해요."),
        s6: input("환불 은행과 계약자 명의 계좌를 입력해 주세요.", [bank, account], "환불 정보 확인", "refundAccountReview"),
        refundAccountReview: handoff("환불 정보를 확인했어요. 계약자와 예금주가 일치하는지 확인한 뒤 접수를 진행해요.", [
          ["상담 요청", "$handoff"], ["다른 문의", "$menu"]
        ]),
        s7: input("입금한 가상계좌번호와 입금자 이름, 입금일, 입금 금액을 입력해 주세요.", [
          { ...account, label: "입금한 가상계좌번호" }, { label: "입금자 이름", type: "text", sample: "김매직" },
          { label: "입금일", type: "date", sample: "2026-11-25" },
          { label: "입금 금액", placeholder: "원 단위 금액 입력", type: "text", sample: "29900", inputMode: "numeric" }
        ], "입금 정보 확인", "s8"),
        s8: { items: [detail("준비할 서류", "입금증, 환불받을 통장 사본, 입금자 신분증 사본"), detail("신분증", "주민등록번호 뒷자리를 가려 주세요.")] }
      }
    },
    48: {
      screens: {
        s1: { actions: [
          ["발행 여부 확인", "receiptLookup"], ["영수증 받기", "receiptLookup"],
          ["새로 발행 신청", "receiptLookup"], ["전월분 소급 발행", "retroactiveLookup"], ["발행번호 안내", "receiptNumberCases"]
        ] },
        receiptLookup: input("현금영수증을 확인할 계약을 입력해 주세요.", contract, "계약 확인", "receiptAuth"),
        retroactiveLookup: input("전월 현금영수증을 확인할 계약을 입력해 주세요.", contract, "계약 확인", "retroactiveAuth"),
        receiptAuth: byPass("receiptCases", "s2"),
        retroactiveAuth: byPass("retroactiveEligibility", "s2"),
        receiptCases: resolved("receiptApproved", [
          contractCase("s2", "000"), contractCase("s7", "048"), contractCase("taxReceiptConflict", "049"),
          contractCase("receiptPendingApproval", "050"), contractCase("s3", "051"),
          { target: "s5", fields: ["$choice"], match: "^영수증 받기$" }
        ]),
        receiptApproved: result("이 계약은 현금영수증을 발행하고 있어요.", [detail("발행 상태", "발행")], [
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
        receiptNumberCases: choice("결제 유형에 따라 현금영수증 발행번호 변경 여부가 달라요.", [
          ["정기결제", "receiptNumberFixed"], ["개인 일회성 계좌이체·가상계좌", "receiptNumberAllowed"],
          ["세금계산서 발행 중", "taxReceiptConflict"], ["결제 유형을 모르겠어요", "receiptLookup"]
        ]),
        receiptNumberFixed: result("정기결제는 개인 계약자의 휴대폰번호 또는 개인사업자의 사업자번호로 현금영수증을 발행해요. 발행번호는 변경할 수 없어요."),
        receiptNumberAllowed: choice("개인의 일회성 실시간 이체 또는 가상계좌 납부에 한해 발행번호 변경 여부를 확인할 수 있어요.", [
          ["요금 납부 절차 확인", "@4"], ["상담 요청", "$handoff"]
        ]),
        retroactiveEligibility: resolved("receiptDates", [
          contractCase("s2", "000"), contractCase("s3", "051"), contractCase("taxReceiptConflict", "049")
        ]),
        receiptDates: resolved(seoulDay <= 10 ? "s8" : "receiptNextMonth"),
        s8: {
          message: "전월분 소급 발행은 매월 10일 이내에 요청할 수 있어요. 발행 가능 여부는 결제와 기존 발행 상태를 확인한 뒤 안내해요.",
          items: [detail("대상", "전월 결제분"), detail("처리 상태", "발행 조건 확인")],
          actions: [["발행 가능 여부 확인 요청", "$handoff"], ["다른 문의", "$menu"]]
        },
        receiptNextMonth: result("전월분 소급 요청 기간이 지났어요. 신규 발행 신청은 신청월부터 적용되는 조건을 확인해 주세요."),
        s6: { message: "현금영수증을 [발송 방법]으로 보냈어요. 필요할 때마다 발송을 요청하실 수 있어요." },
        s7: { actions: [["발행으로 변경", "receiptChangeReview"], ["현재 상태 유지", "$finish"]] },
        receiptChangeReview: choice("신규 발행을 선택하면 신청월부터 적용돼요. 이 조건으로 변경을 요청하시겠어요?", [
          ["발행 변경 요청", "$receiptEnabled"], ["현재 상태 유지", "$finish"]
        ])
      }
    },
    49: {
      screens: {
        s4: {
          resolve: { rules: [phoneCase("s3", "0000")] },
          actions: [["SK매직 항목 확인", "consentItems"], ["현재 상태 유지", "$finish"]]
        },
        consentItems: {
          ...choice("상태를 확인하거나 바꿀 항목을 선택해 주세요.", [
            ["마케팅 활용", "marketingConsent"], ["영리성 정보 수신", "commercialConsent"], ["현재 상태 유지", "$finish"]
          ]),
          items: [detail("회사", "SK매직"), detail("현재 상태", "마케팅 활용 동의 · 영리성 정보 수신 동의")],
          demo: true
        },
        marketingConsent: choice("SK매직의 마케팅 활용 동의를 어떻게 할까요?", [
          ["동의하기", "marketingAccepted"], ["동의 철회", "marketingWithdrawn"], ["현재 상태 유지", "$finish"]
        ]),
        commercialConsent: choice("SK매직의 영리성 정보 수신 동의를 어떻게 할까요?", [
          ["동의하기", "commercialAccepted"], ["동의 철회", "commercialWithdrawn"], ["현재 상태 유지", "$finish"]
        ]),
        marketingAccepted: result("SK매직의 마케팅 활용 동의 변경 요청을 확인했어요.", [detail("마케팅 활용", "동의")]),
        marketingWithdrawn: result("SK매직의 마케팅 활용 동의 철회 요청을 확인했어요.", [detail("마케팅 활용", "미동의")]),
        commercialAccepted: result("SK매직의 영리성 정보 수신 동의 변경 요청을 확인했어요.", [detail("영리성 정보 수신", "동의")]),
        commercialWithdrawn: result("SK매직의 영리성 정보 수신 동의 철회 요청을 확인했어요.", [detail("영리성 정보 수신", "미동의")])
      }
    },
    50: {
      screens: {
        s1: {
          kind: "internal-only", fields: [], actions: [],
          message: "구독 체결 심사는 상담사가 계약자에게 연락해 진행하는 아웃바운드 업무예요. 채팅 적용 범위는 별도 검토 중이에요."
        }
      }
    }
  };

  Object.assign(window.SKIX_FLOW_OVERLAYS ??= {}, overlays);
})();
