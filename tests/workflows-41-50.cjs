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
});

test("44 checks a move-related site visit from the next business day and carries the appointment into callback", () => {
  const chat = begin(44, "2026-11-26T09:00:00+09:00");
  go(chat, "재설치 방문");
  go(chat, "설치 환경 확인", { "제품명 또는 모델명": "식기세척기" });
  go(chat, "계속하기");
  go(chat, "이사 후 설치 환경 확인");
  go(chat, "이사 예정일 확인", { "이사 예정일": "2026-11-27" });
  const tooSoon = go(chat, "재설치 방문 정보 확인", { "희망 날짜": "2026-11-28" });
  assert.match(tooSoon.fields.find((field) => field.label === "희망 날짜").error, /영업일/);
  assert.equal(value(go(chat, "재설치 방문 정보 확인"), "접수번호"), "ES-261125-044");
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
  go(chat, "선납 진행");
  go(chat, "발행하지 않기");
  go(chat, "선납 결제수단 확인");
  go(chat, "가상계좌");
  const issued = go(chat, "가상계좌 발급");
  assert.equal(value(issued, "입금 금액"), "344,448원");
  assert.ok(!issued.actions.some((action) => action.label.includes("영수증")));
});

test("46 confirms the selected order before displaying the masked refund account", () => {
  const chat = begin(46);
  go(chat, "선납 환불 확인");
  go(chat, "대상 주문 조회");
  assert.equal(go(chat, "직수 정수기 주문 선택").screen.id, "confirmVirtualRefund");
  go(chat, "다른 주문 선택");
  go(chat, "직수 정수기 주문 선택");
  const result = go(chat, "이 주문이 맞아요");
  assert.equal(value(result, "환불 사유"), "계약접수취소");
  assert.equal(value(result, "환불 계좌"), "KB국민은행 · ••••-••••-1234");
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
  assert.equal(go(deposit, "입금 정보 확인").screen.id, "s8");
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
});

test("50 has an operator preview without customer verification or approval controls", () => {
  const state = begin(50).getState();
  assert.equal(state.screen.kind, "internal-only");
  assert.equal(state.inputDisabled, true);
  assert.equal(state.actions.length, 0);
  assert.equal(state.fields.length, 0);
});
