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
          ["국세 완납증명서", "taxPeriod"], ["지방세 완납증명서", "taxPeriod"], ["사업자등록증", "s3"]
        ] },
        insurancePeriod: choice("당월 완납증명서는 매월 15일 이후에 받을 수 있어요. 받을 서류를 선택해 주세요.", [
          ["당월분", "insuranceAvailability"], ["전월분", "s3"]
        ]),
        taxPeriod: choice("당월 완납증명서는 매월 5일 이후에 받을 수 있어요. 받을 서류를 선택해 주세요.", [
          ["당월분", "taxAvailability"], ["전월분", "s3"]
        ]),
        insuranceAvailability: resolved(seoulDay >= 15 ? "s3" : "s2"),
        taxAvailability: resolved(seoulDay >= 5 ? "s3" : "s2"),
        s2: {
          message: "당월 증명서 발송을 시작하는 날짜가 아직 오지 않았어요. 전월분을 받으시겠어요?",
          actions: [["전월분 받기", "s3"], ["다음에 요청하기", "$finish"]]
        },
        s3: { fields: contract, actions: [["계약 확인", "documentLookup"]] },
        documentLookup: resolved("documentAuthority", [contractCase("s4", "000")]),
        documentAuthority: choice("개인·개인사업자 계약은 본인이, 법인 계약은 소속 직원이 요청할 수 있어요.", [
          ["개인·개인사업자 본인", "s5"], ["법인 소속 직원", "s5"], ["그 외 관계", "s4"]
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
            ["직수 정수기 · 구독 · 납품대기", "subscriptionReason"], ["공기청정기 · 일시불 · 납품대기", "singleReason"],
            ["비데 · 출고 준비", "s6"]
          ]),
          items: [detail("배송지", "서울 영등포구 문래동")]
        },
        subscriptionReason: input("구독 주문은 묶음 상품 전체가 취소돼요. 취소 사유를 입력해 주세요.", cancellation, "구독 주문 취소 요청", "s4"),
        singleReason: input("공기청정기 일시불 주문의 취소 사유를 입력해 주세요.", cancellation, "일시불 주문 취소 요청", "s5"),
        orderNotFound: handoff("일치하는 주문을 찾지 못했어요. 주문자의 성함과 배송지를 다시 확인해 주세요.", [["주문 다시 확인", "s2"], ["상담 요청", "$handoff"]]),
        s4: { message: "직수 정수기 구독 주문의 묶음 취소가 처리됐어요.", addActions: [["선납 환불 확인", "@46"]] },
        s5: { message: "공기청정기 일시불 주문의 취소가 처리됐어요.", addActions: [["선납 환불 확인", "@46"]] },
        s6: {
          message: "주문의 출고 준비가 시작됐어요. 설치 담당자가 취소 가능 여부를 확인하도록 요청 내용을 전달할 수 있어요.",
          actions: [["담당자에게 취소 요청", "orderHandoff"], ["주문 다시 선택", "orderSelect"]]
        },
        orderHandoff: handoff("취소 요청 내용을 확인했어요. 취소 가능 여부는 설치 담당자가 확인해요.", [["선납 환불 확인", "@46"], ["다른 문의", "$menu"]])
      }
    },
    39: {
      screens: {
        s2: { fields: contract, actions: [["계약 확인", "paymentContractLookup"]] },
        paymentContractLookup: resolved("reuse006Pass", [contractCase("s3", "000")]),
        s4: { resolve: { rules: [contractCase("beforeDebit", "039"), contractCase("s6", "040"), contractCase("s5", "041"), contractCase("contractClosed", "042")] } },
        s5: { resolve: { rules: [contractCase("schoolWaiver", "043")] } },
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
        depositCarry: handoff("입금액의 다음 달 구독료 반영을 요청할 수 있어요. 상담사가 입금 상태와 고객 동의를 확인해요."),
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
        refundAccount: input("계약자 명의의 환불 계좌를 입력해 주세요.", [bank, account], "환불 계좌 확인", "refundRequest"),
        refundRequest: result("해약철회와 환불 요청을 접수했어요. 이 경로에서는 계약자 계좌 확인 후 환불을 진행해요.", [
          detail("환불 유형", "선수금 · 해약철회"), detail("환불 계좌", "KB국민은행 · ••••-••••-1234")
        ]),
        s8: { message: "계약의 해약 신청이 취소됐어요." }
      }
    },
    41: {
      screens: {
        s1: {
          kind: "choice", fields: [], actions: [["제품 유형으로 찾기", "providerChoices"], ["모델명 입력", "providerModel"]]
        },
        providerModel: input("서비스를 받을 제품의 모델명을 입력한 뒤 제품 유형을 확인해 주세요.", ["product"], "모델명 확인", "providerChoices"),
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
        renewalAuth: byPass("s3", "s2"),
        optOutAuth: byPass("E7", "s2"),
        terminationAuth: byPass("s6", "s2"),
        replacementAuth: byPass("s7", "s2"),
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
        giftChangeLookup: input("변경하려는 사은품의 계약을 입력해 주세요.", contract, "계약 확인", "s4"),
        giftSupportLookup: input("문의하실 사은품의 계약을 입력해 주세요.", contract, "계약 확인", "giftSupport"),
        giftCases: resolved("s3", [contractCase("s7", "043"), contractCase("s2", "000")]),
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
        s2: {
          fields: ["product", { label: "설치 장소", placeholder: "예: 주방 싱크대 옆", type: "text", sample: "주방 싱크대 옆" }],
          actions: [["설치 환경 확인", "$installationResult"]]
        },
        s6: {
          fields: ["address", "date", "phone"], actions: [["재설치 방문 정보 확인", "valveChoice"]]
        },
        valveChoice: choice("정수기를 재설치할 때 조리수 밸브도 함께 설치할까요?", [
          ["조리수 밸브 설치 함께 요청", "valveBooked"], ["조리수 밸브 필요 없음", "s7"]
        ]),
        valveBooked: result("재설치 요청에 조리수 밸브 설치도 포함했어요. 방문 시 설치 환경을 확인해요.", [
          detail("요청 범위", "재설치 · 조리수 밸브"),
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
        prepaidCases: resolved("prepaidTerms", [contractCase("specialPrepaid", "045"), contractCase("s2", "000")]),
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
        taxPrepaid: choice("세금계산서 발행을 선택했어요. 실제 선납 금액은 계약 확인을 거쳐 확정돼요. 요금 납부 화면에서 결제수단을 확인할 수 있어요.", [
          ["납부방법 알아보기", "@4"], ["견적서 먼저 받기", "quoteDelivery"]
        ]),
        ordinaryPrepaid: choice("세금계산서 없이 진행하기를 선택했어요. 실제 선납 금액은 계약 확인을 거쳐 확정돼요. 요금 납부 화면에서 결제수단을 확인할 수 있어요.", [
          ["납부방법 알아보기", "@4"], ["견적서 먼저 받기", "quoteDelivery"]
        ]),
        prepaidFilesLookup: input("선납 서류를 확인할 계약을 입력해 주세요.", contract, "선납 상태 확인", "prepaidDocuments"),
        prepaidDocuments: choice("어떤 선납 서류를 받으실까요?", [
          ["선납 견적서", "quoteDelivery"], ["선납 영수증", "prepaidReceiptCheck"],
          ["세금계산서 재발송 문의", "prepaidTaxInvoice"]
        ]),
        prepaidReceiptCheck: resolved("prepaidReceipt", [contractCase("s6", "059")]),
        s6: { actions: [["견적서 받기", "quoteDelivery"]] },
        quoteDelivery: input("견적서를 받으실 이메일 주소를 입력해 주세요.", ["email"], "견적서 발송 요청", "s7"),
        s7: { message: "선납 견적서 발송 요청을 확인했어요.", items: [detail("문서", "선납 견적서"), detail("발송 채널", "이메일")], demo: true },
        prepaidReceipt: input("선납영수증을 받으실 이메일 주소를 입력해 주세요.", ["email"], "영수증 발송 요청", "prepaidReceiptSent"),
        prepaidReceiptSent: result("결제가 완료된 계약의 선납영수증 발송 요청을 확인했어요.", [detail("발송 채널", "이메일")]),
        prepaidTaxInvoice: handoff("선납 세금계산서는 수신미승인 상태에서 재발송할 수 있어요. 상담사가 문서와 수신 상태를 확인해요.")
      }
    },
    46: {
      screens: {
        s1: { actions: [["설치 주문 취소", "s3"], ["선납 환불 확인", "s2"]] },
        s2: input("설치받으실 분의 성함, 연락처, 주소를 차례로 입력해 주세요. 주문을 찾아볼게요.", recipient, "대상 주문 조회", "refundOrder"),
        refundOrder: resolved("s4", [phoneCase("s5", "0004"), phoneCase("s6", "0000")]),
        s4: { message: "가상계좌로 선납한 주문의 환불 정보를 확인했어요. 환불 예정일은 납부·등록 상태에 따라 확인이 필요해요.", items: [detail("환불 계좌", "KB국민은행 · ••••-••••-1234"), detail("환불 예정일", "등록 상태 확인 필요")] },
        s5: { message: "카드로 선납한 주문의 결제 취소 상태를 확인했어요. 카드 취소 내역은 카드사에서 확인할 수 있어요." },
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
        refundHistoryAuth: byPass("s3", "s2"),
        retryPaymentAuth: byPass("retryPaymentStates", "s2"),
        refundReasonAuth: byPass("refundReasons", "s2"),
        wrongDepositAuth: byPass("s7", "s2"),
        retryPaymentStates: resolved("s5", [contractCase("s4", "046")]),
        refundReasons: choice("어떤 변경 이후 환불을 문의하시나요?", [
          ["교체 구독", "s6"], ["전환 멤버십", "switchRefund"], ["명의변경", "transferRefund"], ["중복 납부", "s6"]
        ]),
        switchRefund: handoff("전환 멤버십의 환불 문의예요. 담당자가 전체 필터 교체와 수납 이력을 확인한 뒤 환불 가능 여부를 안내해요."),
        transferRefund: handoff("명의변경에 따른 환불 문의예요. 담당자가 계약 변경 상태와 환불 대상 회차를 확인해요."),
        s6: input("환불 은행과 계약자 명의 계좌를 입력해 주세요.", [bank, account], "환불 정보 확인", "refundAccountReview"),
        refundAccountReview: handoff("환불 정보를 확인했어요. 계약자와 예금주가 일치하는지 확인한 뒤 접수를 진행해요.", [
          ["상담 요청", "$handoff"], ["다른 문의", "$menu"]
        ]),
        s7: input("오입금 내역을 찾을 수 있도록 입금일과 금액을 입력해 주세요. 증빙은 상담 단계에서 안내받을 수 있어요.", [
          { label: "입금일", placeholder: "예: 2026-11-25", type: "date", sample: "2026-11-25" },
          { label: "입금 금액", placeholder: "예: 29900", type: "text", sample: "29900", inputMode: "numeric" }
        ], "입금 정보 확인", "s8")
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
        retroactiveAuth: byPass("receiptDates", "s2"),
        receiptCases: resolved("s5", [contractCase("s7", "048"), contractCase("s3", "051"), contractCase("taxReceiptConflict", "049"), contractCase("s2", "000"), { target: "s7", fields: ["$choice"], match: "^새로 발행 신청$" }]),
        taxReceiptConflict: {
          ...choice("세금계산서가 발행 중인 계약에는 현금영수증을 함께 발행할 수 없어요.", [
            ["납부방법 변경 안내", "s4"], ["현재 상태 유지", "$finish"]
          ]),
          kind: "exception"
        },
        receiptNumberCases: choice("결제 유형에 따라 현금영수증 발행번호 변경 여부가 달라요.", [
          ["정기결제", "receiptNumberFixed"], ["개인 일회성 계좌이체·가상계좌", "receiptNumberAllowed"],
          ["세금계산서 발행 또는 기타", "taxReceiptConflict"]
        ]),
        receiptNumberFixed: result("정기결제의 발행번호는 개인 계약자의 휴대폰번호 또는 사업자의 사업자번호를 사용해요."),
        receiptNumberAllowed: choice("개인의 일회성 실시간 이체 또는 가상계좌 납부에 한해 발행번호 변경 여부를 확인할 수 있어요.", [
          ["요금 납부 절차 확인", "@4"], ["상담 요청", "$handoff"]
        ]),
        receiptDates: resolved(seoulDay <= 10 ? "s8" : "receiptNextMonth"),
        s8: {
          message: "전월분 소급 발행은 매월 10일 이내에 요청할 수 있어요. 발행 가능 여부는 결제와 기존 발행 상태를 확인한 뒤 안내해요.",
          actions: [["발행 가능 여부 확인 요청", "$handoff"], ["다른 문의", "$menu"]]
        },
        receiptNextMonth: result("전월분 소급 요청 기간이 지났어요. 신규 발행 신청은 신청월부터 적용되는 조건을 확인해 주세요."),
        s7: { actions: [["발행으로 변경", "receiptChangeReview"], ["현재 상태 유지", "$finish"]] },
        receiptChangeReview: choice("신규 발행을 선택하면 신청월부터 적용돼요. 이 조건으로 변경을 요청하시겠어요?", [
          ["발행 변경 요청", "$receiptEnabled"], ["현재 상태 유지", "$finish"]
        ])
      }
    },
    49: {
      screens: {
        s4: { actions: [["SK매직 항목 확인", "consentItems"], ["현재 상태 유지", "$finish"]] },
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
