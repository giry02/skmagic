const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const sandbox = vm.createContext({ window: {} });
for (const name of ["scenarios", "audit-01-17", "audit-18-36", "audit-37-50", "engine"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "src", name + ".js"), "utf8"), sandbox, { filename: name });
}

function start(no) {
  const chat = new sandbox.window.SKIXChat(sandbox.window.SKIX_SCENARIOS);
  chat.start(no);
  return chat;
}

function choose(chat, label, fields) {
  const action = chat.getState().actions.find((entry) => entry.label === label);
  assert.ok(action, `Missing ${label} at ${chat.scenario.no}:${chat.screen.id}`);
  return chat.choose(action.id, fields);
}

function phone(chat, name = "김매직", number = "010-0000-1234") {
  if (chat.getState().actions.some(({ label }) => label === "휴대폰 확인")) choose(chat, "휴대폰 확인");
  choose(chat, "동의하고 계속");
  const requested = choose(chat, "인증번호 받기", { 이름: name, "휴대폰 번호": number });
  return choose(chat, "확인", { 인증번호: requested.verification.code });
}

function contract(chat, name) {
  return choose(chat, "계약 확인", { "계약 또는 제품명": name });
}

function row(state, title) {
  return state.messages.at(-1).items?.find((entry) => entry.title === title)?.detail;
}

test("AS and delivery lookup expose records only to modeled identities", () => {
  for (const [no, failure, success] of [
    [13, "S05", "S02"], [14, "missingCustomer", "S01"], [15, "missingCustomer", "S02"],
    [16, "S04", "S02"], [17, "S11", "S02"],
  ]) {
    assert.equal(phone(start(no), "김매직", "010-4444-9999").screen.id, failure);
    assert.equal(phone(start(no), "다른 고객").screen.id, failure);
    assert.equal(phone(start(no)).screen.id, success);
  }
  assert.equal(phone(start(16), "김매직", "010-0000-0005").screen.id, "pending5");
  assert.doesNotMatch(phone(start(16)).messages.at(-1).text, /오전 10시/);
  assert.match(phone(start(13), "김매직", "010-0000-0008").messages.at(-1).text, /오전 10시/);
});

test("wrong-contact lookup checks both the receiving number and the inquiry", () => {
  const chat = start(18);
  choose(chat, "연락 유형 선택");
  choose(chat, "제 것이 아닌 연락");
  const missed = choose(chat, "확인", { "휴대폰 번호": "010-0000-1234", "요청 내용": "일치하지 않음" });
  assert.equal(missed.screen.id, "s6");
  const recognized = start(18);
  choose(recognized, "연락 유형 선택");
  choose(recognized, "제 것이 아닌 연락");
  assert.equal(choose(recognized, "확인", { "휴대폰 번호": "010-0000-0002", "요청 내용": "방문 안내를 받았어요" }).screen.id, "s4");
  assert.equal(choose(recognized, "관계가 없어요").screen.id, "replaceNumber");
});

test("delivery date changes preserve the reason and memo in the selected order preview", () => {
  const chat = start(17);
  phone(chat);
  choose(chat, "직수 정수기 주문 선택");
  choose(chat, "배송일정 수정");
  const looking = choose(chat, "예약 가능일자 확인", {
    "희망 배송일": chat.getState().fields[0].sample,
    "일정 변경 사유": "이사 일정 조정", "배송 변경 메모": "경비실에 먼저 들러 주세요.",
  });
  const date = looking.actions.find(({ label }) => /일\s*\([월화수목금토일]\) 선택$/u.test(label));
  assert.ok(date);
  choose(chat, date.label);
  const result = choose(chat, "확인");
  assert.equal(row(result, "일정 변경 사유"), "이사 일정 조정");
  assert.equal(row(result, "배송 변경 메모"), "경비실에 먼저 들러 주세요.");
});

test("billing document requests retain contract, date and individually selected calculation options", () => {
  assert.equal(phone(start(19), "다른 고객").screen.id, "s5");
  const chat = start(19);
  phone(chat);
  choose(chat, "청구·수납 문서");
  assert.equal(contract(chat, "직수 정수기").screen.id, "billDocuments");
  choose(chat, "수납내역서");
  choose(chat, "일회 발송");
  choose(chat, "확인", { 시작일: "2026-11-01", 종료일: "2026-11-25" });
  choose(chat, "포함");
  choose(chat, "건별");
  choose(chat, "이메일");
  const receipt = choose(chat, "발송 요청", { "이메일 주소": "audit@example.com" });
  assert.equal(row(receipt, "대상 계약"), "직수 정수기");
  assert.equal(row(receipt, "조회 기간"), "2026-11-01 ~ 2026-11-25");
  assert.equal(row(receipt, "선수금"), "포함");
  assert.equal(row(receipt, "부가세 기준"), "건별");
  assert.equal(choose(chat, "요금 납부로 이동").screen.id, "chargeDetails");
});

test("service treatment records require the applicant, product, type and processed date to match", () => {
  function intake(name) {
    const chat = start(22);
    choose(chat, "일반 서비스");
    choose(chat, "확인", { 이름: name, "휴대폰 번호": "010-0000-1234", 주소: "서울 영등포구 문래동" });
    return chat;
  }
  assert.equal(intake("다른 고객").screen.id, "s5");
  const chat = intake("김매직");
  choose(chat, "일반 AS");
  assert.equal(choose(chat, "확인", {
    "제품명 또는 모델명": "직수 정수기", 시작일: "1970-01-01", 종료일: "1970-01-02",
  }).screen.id, "serviceNoPeriodRecord");
  choose(chat, "조회 조건 변경");
  assert.equal(choose(chat, "확인", {
    "제품명 또는 모델명": "WPU-1000", 시작일: "2026-11-01", 종료일: "2026-11-30",
  }).screen.id, "s4");
  choose(chat, "이메일");
  const request = choose(chat, "발송 요청", { "이메일 주소": "audit@example.com" });
  assert.equal(row(request, "대상 제품"), "직수 정수기 · WPU-1000");
  assert.equal(row(request, "서비스 처리일"), "2026-11-25");
});

test("giro lookup distinguishes unknown contracts and verifies masked email delivery history", () => {
  const lookup = (name) => {
    const chat = start(24);
    phone(chat);
    choose(chat, "지로 발송 내역");
    return contract(chat, name);
  };
  assert.equal(lookup("미등록 계약").screen.id, "s8");
  assert.equal(lookup("SK-261125-125").screen.id, "giroNoHistory");
  assert.equal(row(lookup("SK-261125-124"), "수령 이메일"), "m••@example.com");
  assert.equal(row(lookup("직수 정수기"), "고지서 수령 방법"), "우편");
});

test("card receipt Alimtalk accepts a supplied recipient and masks it in the request preview", () => {
  const chat = start(23);
  choose(chat, "카드 결제 이력 확인");
  contract(chat, "직수 정수기");
  phone(chat);
  choose(chat, "확인", { "결제 월": "2026-11" });
  choose(chat, "11월 카드 결제 내역 선택");
  choose(chat, "카드영수증");
  const recipient = choose(chat, "알림톡");
  assert.equal(recipient.fields[0].label, "휴대폰 번호");
  const result = choose(chat, "발송 요청", { "휴대폰 번호": "010-0000-4321" });
  assert.equal(row(result, "수신처"), "010-••••-4321");
  assert.equal(row(result, "납부 금액"), "29,900원");
});

test("giro changes allow three distinct contracts, enforce group membership and preserve evidence intent", () => {
  function entry() {
    const chat = start(25);
    phone(chat);
    contract(chat, "직수 정수기");
    return chat;
  }
  const split = entry();
  choose(split, "계약별로 나눠 받기");
  choose(split, "일부 계약만 분리");
  assert.equal(choose(split, "확인", { "분리할 계약": "비데" }).screen.id, "giroGroupUnconfirmed");
  const chat = entry();
  choose(chat, "한 장으로 받기");
  const selection = choose(chat, "확인", {
    "첫 번째 계약": "직수 정수기", "두 번째 계약": "공기청정기", "추가할 계약": "비데", "대표 계약": "비데",
  });
  assert.equal(selection.screen.id, "s5");
  const requested = choose(chat, "이메일");
  assert.equal(row(requested, "통합 대상 계약"), "직수 정수기 · 공기청정기 · 비데");
  choose(chat, "증빙 발행 정보도 확인");
  const evidence = choose(chat, "증빙 발행도 함께 확인");
  assert.equal(row(evidence, "증빙 발행 요청"), "증빙 발행도 함께 확인");
  assert.equal(row(choose(chat, "상담 문의하기"), "증빙 발행 요청"), "증빙 발행도 함께 확인");
});
