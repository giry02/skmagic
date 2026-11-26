const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function begin(no, now) {
  const sandbox = vm.createContext({ window: {} });
  if (now) {
    sandbox.Date = class extends Date {
      constructor(...args) {
        super(...(args.length ? args : [now]));
      }
      static now() {
        return Date.parse(now);
      }
    };
  }
  for (const file of ["scenarios.js", "audit-01-17.js", "audit-18-36.js", "audit-37-50.js", "engine.js"]) {
    const source = fs.readFileSync(path.join(__dirname, "..", "src", file), "utf8");
    vm.runInContext(source, sandbox, { filename: file });
  }
  const { SKIXChat, SKIX_SCENARIOS } = sandbox.window;
  const chat = new SKIXChat(SKIX_SCENARIOS);
  chat.start(no);
  return chat;
}

function go(chat, label, inputs = {}) {
  const { actions, fields, screen } = chat.getState();
  const action = actions.find((item) => item.label === label);
  assert.ok(action, `Missing ${label} at ${screen?.id}`);
  const values = Object.fromEntries(fields.filter((field) => !field.readonly)
    .map((field) => [field.label, inputs[field.label] ?? field.sample ?? ""]));
  return chat.choose(action.id, values);
}

function approve(chat) {
  go(chat, "PASS 본인인증");
  return go(chat, "본인인증 확인");
}

function value(state, title) {
  return state.messages.at(-1).items.find((item) => item.title === title)?.detail;
}

test("41 routes the excluded oven away from Kyungdong and masks the contact SMS recipient", () => {
  const excluded = begin(41);
  go(excluded, "모델명 입력");
  assert.equal(go(excluded, "모델명 확인", { "제품명 또는 모델명": "전기오븐레인지 EONB450" }).screen.id, "s7");
  const chat = begin(41);
  go(chat, "제품 유형으로 찾기");
  const partner = go(chat, "가스·전기·인덕션 레인지 또는 전기오븐레인지");
  assert.equal(value(partner, "고객센터"), "1588-1144");
  go(chat, "문자로 받기");
  const confirmation = go(chat, "발송 요청", { "휴대폰 번호": "010-0000-5678" });
  assert.equal(value(confirmation, "받는 번호"), "010-••••-5678");
});

test("42 collects a reason after the irreversible opt-out confirmation", () => {
  const chat = begin(42);
  go(chat, "자동연장 거부");
  go(chat, "대상 계약 확인");
  assert.match(approve(chat).messages.at(-1).text, /되돌릴 수 없어요/);
  go(chat, "원복 불가 안내 확인");
  assert.equal(go(chat, "자동연장 거부에 동의").screen.id, "optOutReason");
  assert.equal(go(chat, "연장 거부 등록", { "연장 거부 사유": "" }).screen.id, "optOutReason");
  go(chat, "연장 거부 등록");
  assert.equal(value(go(chat, "멤버십 상태 확인"), "자동연장"), "제외");
  chat.start(42);
  go(chat, "연장 여부 확인");
  assert.equal(go(chat, "연장 상태 확인").screen.id, "optOutStatus");
});

test("42 blocks unknown membership and keeps the selected termination request", () => {
  const unknown = begin(42);
  go(unknown, "자동연장 거부");
  go(unknown, "대상 계약 확인", { "계약 또는 제품명": "UNKNOWN-777" });
  assert.equal(approve(unknown).screen.id, "s2");
  const chat = begin(42);
  go(chat, "멤버십 해약 문의");
  go(chat, "대상 계약 확인");
  approve(chat);
  const review = go(chat, "해약 상담 내용 확인", { "해약 희망일": "2026-12-10", "해약 사유": "이사 예정" });
  assert.equal(value(review, "해약 희망일"), "2026년 12월 10일(목)");
  assert.equal(value(review, "해약 사유"), "이사 예정");
  assert.equal(value(review, "납입 예정금액"), "상담 확인 필요");
});

test("43 verifies the contract before giving an order-specific benefit or an exchange review", () => {
  const chat = begin(43);
  go(chat, "혜택 종류·발송일");
  assert.equal(go(chat, "계약 확인", { "계약 또는 제품명": "SK-261125-061" }).screen.id, "giftAuth");
  assert.equal(value(approve(chat), "혜택 종류"), "네이버페이");
  const exchange = begin(43);
  go(exchange, "사은품 변경");
  go(exchange, "계약 확인");
  approve(exchange);
  go(exchange, "아직 개봉하거나 사용하지 않았어요");
  assert.equal(go(exchange, "받은 지 7일이 지났어요").screen.id, "giftLate");
  for (const label of ["사은품 변경", "불량 또는 판매처 문의"]) {
    const unknown = begin(43);
    go(unknown, label);
    go(unknown, "계약 확인", { "계약 또는 제품명": "UNKNOWN-777" });
    assert.equal(approve(unknown).screen.id, "giftUnconfirmed");
    assert.ok(unknown.getState().actions.every(({ label: action }) => !/개봉|불량/.test(action)));
  }
});

test("44 checks a move-related site visit from the next business day and carries the appointment into callback", () => {
  const chat = begin(44, "2026-11-26T09:00:00+09:00");
  go(chat, "재설치 방문");
  go(chat, "설치 환경 확인", { "제품명 또는 모델명": "식기세척기" });
  go(chat, "계속하기");
  go(chat, "이사 후 설치 환경 확인");
  go(chat, "이사 예정일 확인", { "이사 예정일": "2026-11-27" });
  const tooSoon = go(chat, "재설치 방문 요청", { "희망 날짜": "2026-11-28" });
  assert.match(tooSoon.fields.find((field) => field.label === "희망 날짜").error, /영업일/);
  assert.equal(value(go(chat, "재설치 방문 요청"), "접수번호"), "ES-261125-044");
  go(chat, "계속하기");
  go(chat, "사전 연락 요청");
  const callback = go(chat, "사전 연락 요청");
  assert.equal(callback.scenario.no, 34);
  assert.equal(callback.screen.id, "visitCallbackNote");
  assert.equal(value(callback, "대상 접수"), "ES-261125-044");
});

test("44 carries the checked model into 09 without skipping phone verification", () => {
  for (const phone of ["010-0000-1234", "010-0000-0000"]) {
    const chat = begin(44, "2026-11-26T09:00:00+09:00");
    go(chat, "재설치 방문");
    go(chat, "설치 환경 확인", { "제품명 또는 모델명": "DWA-2000 식기세척기" });
    go(chat, "계속하기");
    const entry = go(chat, "보유 제품으로 재설치 접수");
    assert.equal(entry.scenario.no, 9);
    assert.equal(entry.screen.id, "$nativeSmsConsent");
    assert.ok(!entry.actions.some(({ label }) => label === "앞서 확인한 제품 선택"));
    go(chat, "동의하고 계속");
    const { verification } = go(chat, "인증번호 받기", { "휴대폰 번호": phone });
    const lookup = go(chat, "확인", { 인증번호: verification.code });
    const previous = lookup.actions.find(({ label }) => label === "앞서 확인한 제품 선택");
    assert.equal(previous.card.title, "DWA-2000 식기세척기");
    assert.equal(go(chat, "앞서 확인한 제품 선택").screen.id, "customMoveStatus");
    go(chat, "이사 예정");
    go(chat, "다음", { "이사 예정일": "2026-11-27" });
    const dates = go(chat, "예약 가능일자 확인");
    assert.equal(dates.screen.id, "S05");
    assert.equal(dates.actions[0].label, "11월 28일(토) 선택");
    go(chat, dates.actions[0].label);
    assert.equal(value(go(chat, "접수 요청"), "접수제품"), "DWA-2000 식기세척기");
  }
});

test("44 separates uncertain standalone cost, contact reuse and masked notice", () => {
  const chat = begin(44, "2026-11-26T09:00:00+09:00");
  go(chat, "재설치 방문");
  go(chat, "설치 환경 확인", { "제품명 또는 모델명": "직수 정수기" });
  go(chat, "계속하기");
  go(chat, "재설치 방문 접수");
  assert.equal(go(chat, "재설치 방문 요청", { "휴대폰 번호": "010-0000-0009" }).screen.id, "installationMultipleCustomers");
  go(chat, "설치 환경만 확인");
  const booked = go(chat, "조리수 밸브 필요 없음");
  assert.equal(value(booked, "재설치 예상 비용"), undefined);
  assert.match(value(booked, "재설치 비용"), /구독·멤버십·일시불/);
  const notice = go(chat, "접수 안내 알림톡 받기");
  assert.equal(value(notice, "받는 방법"), "알림톡");
  assert.equal(value(notice, "받는 번호"), "010-••••-0009");
});

test("44 resolves a shared verified number by registered address and carries the chosen product into 09", () => {
  const chat = begin(44, "2026-11-26T09:00:00+09:00");
  go(chat, "재설치 방문");
  go(chat, "설치 환경 확인", { "제품명 또는 모델명": "식기세척기" });
  go(chat, "계속하기");
  go(chat, "재설치 방문 접수");
  go(chat, "재설치 방문 요청", { "휴대폰 번호": "010-0000-0009" });
  go(chat, "등록 고객 확인");
  go(chat, "휴대폰 확인");
  go(chat, "동의하고 계속");
  const { verification } = go(chat, "인증번호 받기", { "휴대폰 번호": "010-0000-0009" });
  go(chat, "확인", { 인증번호: verification.code });
  const match = go(chat, "등록 고객 조회");
  assert.equal(value(match, "보유 제품"), "직수 정수기 · WPU-1000");
  assert.equal(value(match, "연락처"), "010-••••-0009");
  go(chat, "다른 주소 확인");
  const second = go(chat, "등록 고객 조회", { "등록된 사용 주소": "서울 영등포구 신길동" });
  assert.equal(value(second, "보유 제품"), "식기세척기 · DWA-2000");
  const reinstall = go(chat, "식기세척기 재설치 선택");
  assert.equal(reinstall.scenario.no, 9);
  assert.ok(reinstall.actions.every(({ label }) => !/휴대폰 확인|인증번호 받기/.test(label)));
  assert.equal(reinstall.actions.find(({ label }) => label === "앞서 확인한 제품 선택")?.card?.title, "식기세척기 DWA-2000");
});

test("45 calculates a nonstandard estimate but requires verified remaining months before payment", () => {
  const chat = begin(45, "2026-11-26T09:00:00+09:00");
  go(chat, "선납 금액·할인 확인");
  go(chat, "대상 계약 확인", { "계약 또는 제품명": "SK-261125-045" });
  approve(chat);
  assert.equal(go(chat, "선납 금액 확인", { "선납 개월 수": "0" }).screen.id, "specialPrepaid");
  assert.equal(value(go(chat, "선납 금액 확인"), "수납 예정금액"), "358,800원");
  go(chat, "개월 수 다시 입력");
  const estimate = go(chat, "선납 금액 확인", { "선납 개월 수": "9999" });
  assert.ok(estimate.actions.every(({ label }) => !/선납 진행|결제수단|가상계좌/.test(label)));
  const review = go(chat, "납부 가능 회차 확인");
  assert.equal(review.screen.id, "freeMonthsReview");
  assert.equal(review.screen.kind, "handoff");
  assert.ok(review.actions.every(({ label }) => !/선납 진행|결제수단|가상계좌/.test(label)));
});

test("45 regular contracts can issue an unpaid virtual account without a receipt", () => {
  const chat = begin(45, "2026-11-26T09:00:00+09:00");
  go(chat, "선납 금액·할인 확인");
  go(chat, "대상 계약 확인", { "계약 또는 제품명": "직수 정수기" });
  approve(chat);
  go(chat, "1년 금액 확인");
  go(chat, "계속하기");
  go(chat, "선납 시작 회차 변경");
  assert.equal(value(go(chat, "13회차부터 적용"), "적용 회차 범위"), "13~24회차");
  go(chat, "선납 진행");
  go(chat, "발행하지 않기");
  go(chat, "선납 결제수단 확인");
  go(chat, "가상계좌");
  const issued = go(chat, "가상계좌 발급");
  assert.equal(value(issued, "입금 금액"), "344,448원");
  assert.equal(value(issued, "적용 회차 범위"), "13~24회차");
  assert.equal(value(issued, "선납 상태"), "입금 대기");
  assert.equal(value(issued, "선납 적용 기간"), "12개월");
  assert.ok(!issued.actions.some((action) => action.label.includes("영수증")));
});

test("45 tax invoice lookup checks contract and issue date before resend", () => {
  for (const [contract, expected] of [["SK-261125-063", "prepaidTaxInvoice"], ["직수 정수기", "prepaidTaxApproved"]]) {
    const chat = begin(45);
    go(chat, "선납 견적서·영수증");
    go(chat, "선납 상태 확인", { "계약 또는 제품명": contract });
    approve(chat);
    go(chat, "세금계산서 재발송 문의");
    assert.equal(go(chat, "세금계산서 조회", { "세금계산서 발행일": "2026-11-24" }).screen.id, "prepaidTaxInvoiceNotFound");
    go(chat, "발행일 다시 입력");
    const matched = go(chat, "세금계산서 조회");
    assert.equal(matched.screen.id, expected);
    assert.equal(value(matched, "세금계산서 발행일"), "2026년 11월 25일");
    assert.equal(matched.actions.some(({ label }) => label === "등록된 이메일로 재발송"), expected === "prepaidTaxInvoice");
  }
});

test("45 retains the settled tender, selected term, and known payment date on its result and receipt", () => {
  for (const method of ["카드", "실시간 계좌이체"]) {
    const chat = begin(45, "2026-11-26T09:00:00+09:00");
    for (const label of ["선납 금액·할인 확인", "대상 계약 확인"]) go(chat, label);
    approve(chat);
    for (const label of ["2년 금액 확인", "계속하기", "선납 진행", "발행하지 않기", "선납 결제수단 확인"]) go(chat, label);
    go(chat, method);
    let settled;
    if (method === "카드") {
      go(chat, "다른 카드로 납부");
      go(chat, "카드 정보 확인", { 카드번호: "0000000000007788", 할부기간: "2개월" });
      settled = approve(chat);
      assert.equal(value(settled, "결제수단"), "카드 · 끝자리 7788");
      assert.equal(value(settled, "할부 기간"), "2개월");
    } else {
      go(chat, "다른 계좌로 이체");
      go(chat, "계좌 확인", { 은행: "신한은행", 계좌번호: "000000007788" });
      go(chat, "PASS 전자서명");
      settled = go(chat, "전자서명 확인");
      assert.equal(value(settled, "결제수단"), "실시간 계좌이체 · 신한은행 · 끝자리 7788");
    }
    assert.equal(value(settled, "대상 계약"), "직수 정수기 · WPU-1000");
    assert.equal(value(settled, "선납 적용 기간"), "24개월");
    assert.equal(value(settled, "결제일"), "2026년 11월 26일(목)");
    assert.equal(value(settled, "결제 금액"), "674,544원");
    go(chat, "선납 영수증 받기");
    go(chat, "이메일");
    assert.equal(value(go(chat, "발송 요청"), "결제 금액"), "674,544원");
  }
  const priorReceipt = begin(45);
  go(priorReceipt, "선납 견적서·영수증");
  go(priorReceipt, "선납 상태 확인");
  approve(priorReceipt);
  go(priorReceipt, "선납 영수증");
  go(priorReceipt, "이메일");
  const sent = go(priorReceipt, "발송 요청");
  assert.equal(value(sent, "대상 계약"), "직수 정수기 · WPU-1000");
  assert.equal(value(sent, "결제 금액"), undefined);
  assert.equal(value(sent, "결제일"), undefined);
});

test("46 confirms the selected order before displaying the masked refund account", () => {
  const chat = begin(46);
  go(chat, "선납 환불 확인");
  go(chat, "대상 주문 조회");
  assert.equal(go(chat, "직수 정수기 주문 선택").screen.id, "confirmVirtualRefund");
  go(chat, "다른 주문 선택");
  go(chat, "직수 정수기 주문 선택");
  const result = go(chat, "이 주문이 맞아요");
  assert.equal(value(result, "주문번호"), "DL-261125-001");
  assert.equal(value(result, "납부 방법"), "가상계좌 선납");
  assert.equal(value(result, "환불 사유"), "계약접수취소");
  assert.equal(value(result, "환불 계좌"), "KB국민은행 · ••••-••••-1234");
  const card = begin(46);
  go(card, "선납 환불 확인");
  go(card, "대상 주문 조회", { "휴대폰 번호": "010-0000-0004" });
  go(card, "공기청정기 주문 선택");
  const cancelled = go(card, "이 주문이 맞아요");
  assert.equal(value(cancelled, "주문번호"), "DL-261125-002");
  assert.equal(value(cancelled, "납부 방법"), "카드 선납");
  assert.equal(value(cancelled, "처리 상태"), "카드 결제 취소");
  assert.equal(value(cancelled, "환불 예정일"), undefined);
});

test("46 will not offer any order or refund account unless all three identity fields match", () => {
  for (const inputs of [{ 이름: "임가람" }, { "휴대폰 번호": "010-0000-4321" }, { 주소: "서울 영등포구 문래동 777" }]) {
    const chat = begin(46);
    go(chat, "선납 환불 확인");
    const unknown = go(chat, "대상 주문 조회", inputs);
    assert.equal(unknown.screen.id, "refundOrderNotFound");
    assert.equal(value(unknown, "환불 계좌"), undefined);
    assert.ok(unknown.actions.every(({ label }) => !/주문 선택/.test(label)));
  }
});

test("47 separates same-day re-payment and matches all virtual deposit fields before evidence review", () => {
  const card = begin(47);
  go(card, "제휴카드로 다시 결제");
  go(card, "계약 확인", { "계약 또는 제품명": "SK-261125-046" });
  assert.equal(approve(card).screen.id, "s4");
  const deposit = begin(47);
  go(deposit, "가상계좌 오입금");
  go(deposit, "계약 확인");
  approve(deposit);
  assert.equal(go(deposit, "입금 정보 확인", { "입금 금액": "30,000원" }).screen.id, "depositNotFound");
  go(deposit, "입금 정보 다시 확인");
  const verified = go(deposit, "입금 정보 확인");
  assert.equal(verified.screen.id, "s8");
  assert.equal(value(verified, "대상 계약"), "직수 정수기 · WPU-1000");
  assert.equal(value(verified, "확인된 입금 계좌"), "••••-••••-1234");
  assert.equal(value(verified, "입금 금액"), "29,900원");
});

test("47 keeps unknown contracts away from refunds or card re-payment details", () => {
  for (const action of ["환불 일정·계좌 확인", "제휴카드로 다시 결제"]) {
    const unknown = begin(47);
    go(unknown, action);
    go(unknown, "계약 확인", { "계약 또는 제품명": "조회되지 않는 계약" });
    const denied = approve(unknown);
    assert.equal(denied.screen.id, "s2");
    assert.equal(value(denied, "환불 금액"), undefined);
    assert.equal(value(denied, "현재 결제수단"), undefined);
  }
  const complete = begin(47);
  go(complete, "환불 일정·계좌 확인");
  go(complete, "계약 확인", { "계약 또는 제품명": "SK-261125-048" });
  const refund = approve(complete);
  assert.equal(value(refund, "대상 계약"), "SK-••••-5048");
  assert.equal(value(refund, "입금 완료일"), "2026년 11월 24일");
});

test("47 requires the completed filter service and matched collection record before account review", () => {
  for (const [suffix, expected] of [["053", "switchRefundVerified"], ["054", "switchRefundReview"]]) {
    const chat = begin(47);
    go(chat, "교체·전환·명의변경");
    go(chat, "계약 확인", { "계약 또는 제품명": `SK-261125-${suffix}` });
    approve(chat);
    const result = go(chat, "전환 멤버십");
    assert.equal(result.screen.id, expected);
    if (suffix === "054") continue;
    assert.equal(value(result, "처리 내역"), "부품 사용 확인");
    go(chat, "2026년 11월 필터 교체비 선택");
    const review = go(chat, "환불 정보 확인");
    assert.equal(value(review, "환불 사유"), "전환 멤버십");
    assert.equal(value(review, "처리 상태"), "계약자 명의 확인 필요");
  }
});

test("48 approved transaction delivery masks the recipient and applies the 10th inclusive deadline", () => {
  const chat = begin(48);
  go(chat, "영수증 받기");
  go(chat, "계약 확인");
  approve(chat);
  go(chat, "11월 25일 승인 내역");
  go(chat, "팩스");
  assert.equal(value(go(chat, "발송 요청"), "수신처"), "••-••••-1234");
  for (const [day, target] of [["10", "s8"], ["11", "receiptNextMonth"]]) {
    const retroactive = begin(48, `2026-12-${day}T09:00:00+09:00`);
    go(retroactive, "전월분 소급 발행");
    go(retroactive, "계약 확인");
    assert.equal(approve(retroactive).screen.id, target);
  }
});

test("48 protects receipt-number and retroactive lookup and checks approval date and suffix", () => {
  for (const label of ["발행번호 안내", "전월분 소급 발행"]) {
    const unknown = begin(48, "2026-12-08T09:00:00+09:00");
    go(unknown, label);
    go(unknown, "계약 확인", { "계약 또는 제품명": "UNKNOWN-777" });
    assert.equal(approve(unknown).screen.id, "s2");
  }
  const verified = begin(48);
  go(verified, "영수증 받기");
  go(verified, "계약 확인");
  approve(verified);
  go(verified, "발행일·인증값으로 찾기");
  assert.equal(go(verified, "발행 내역 조회", { "발행번호 끝 4자리": "9999" }).screen.id, "receiptTransactionNotFound");
  go(verified, "조회 정보 다시 입력");
  assert.equal(value(go(verified, "발행 내역 조회"), "거래 상태"), "승인");
  assert.equal(go(verified, "이 현금영수증 받기").screen.id, "approvedReceiptDelivery");
});

test("49 changes one consent item and retains the other in the same conversation", () => {
  const chat = begin(49);
  go(chat, "휴대폰으로 확인");
  go(chat, "동의하고 계속");
  const { verification } = go(chat, "인증번호 받기");
  go(chat, "확인", { 인증번호: verification.code });
  go(chat, "SK매직 항목 확인");
  go(chat, "마케팅 활용");
  assert.equal(value(go(chat, "동의 철회"), "회사"), "SK매직");
  const settings = go(chat, "동의 상태 다시 보기");
  assert.equal(value(settings, "마케팅 활용"), "미동의");
  assert.equal(value(settings, "영리성 정보 수신"), "동의");
  chat.start(49);
  go(chat, "휴대폰으로 확인");
  assert.equal(value(go(chat, "SK매직 항목 확인"), "마케팅 활용"), "미동의");
  chat.reset();
  chat.start(49);
  go(chat, "휴대폰으로 확인");
  go(chat, "동의하고 계속");
  const second = go(chat, "인증번호 받기");
  go(chat, "확인", { 인증번호: second.verification.code });
  assert.equal(value(go(chat, "SK매직 항목 확인"), "마케팅 활용"), "동의");
});

test("49 SMS verification does not authorize unrelated customer consent data", () => {
  for (const inputs of [{ 이름: "임가람" }, { "휴대폰 번호": "010-0000-5678" }]) {
    const chat = begin(49);
    go(chat, "휴대폰으로 확인");
    go(chat, "동의하고 계속");
    const { verification } = go(chat, "인증번호 받기", inputs);
    const unknown = go(chat, "확인", { 인증번호: verification.code });
    assert.equal(unknown.screen.id, "consentCustomerNotFound");
    assert.ok(unknown.actions.every(({ label }) => !/동의|항목 확인/.test(label)));
  }
});

test("50 has an operator preview without customer verification or approval controls", () => {
  const state = begin(50).getState();
  assert.equal(state.screen.kind, "internal-only");
  assert.equal(state.inputDisabled, true);
  assert.equal(state.actions.length, 0);
  assert.equal(state.fields.length, 0);
});
