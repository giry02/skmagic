const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const sandbox = vm.createContext({ window: {} });
for (const file of ["scenarios.js", "audit-01-17.js", "audit-18-36.js", "audit-37-50.js", "engine.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "src", file), "utf8"), sandbox, { filename: file });
}

function open(no) {
  const chat = new sandbox.window.SKIXChat(sandbox.window.SKIX_SCENARIOS);
  chat.start(no);
  return chat;
}

function choose(chat, label, values) {
  const start = chat.getState();
  const action = start.actions.find((entry) => entry.label === label);
  assert.ok(action, `Missing ${label} at ${start.scenario.no}:${start.screen.id}`);
  return chat.choose(action.id, values);
}

function authenticate(chat) {
  choose(chat, "휴대폰 확인");
  choose(chat, "동의하고 계속");
  const challenge = choose(chat, "인증번호 받기", { 이름: "김매직", "휴대폰 번호": "010-0000-1234" });
  return choose(chat, "확인", { 인증번호: challenge.verification.code });
}

function row(state, title) {
  return state.messages.at(-1).items?.find((entry) => entry.title === title)?.detail;
}

const water = "직수 정수기";
const air = "공기청정기";
const registered = "서울 영등포구 문래동";

test("giro changes show the verified existing group and the request before selecting a receipt method", () => {
  const chat = open(25);
  authenticate(chat);
  choose(chat, "계약 확인", { "계약 또는 제품명": water });
  const merge = choose(chat, "한 장으로 받기");
  assert.equal(row(merge, "확인한 지로 계약"), water);
  const receipt = choose(chat, "확인", { "첫 번째 계약": water, "두 번째 계약": air, "대표 계약": water });
  assert.equal(receipt.screen.id, "s5");
  assert.equal(row(receipt, "대표 계약"), water);
  assert.equal(row(receipt, "통합 대상 계약"), water + " · " + air);
  assert.ok(receipt.actions.some(({ label }) => label === "우편"));

  const split = open(25);
  authenticate(split);
  choose(split, "계약 확인", { "계약 또는 제품명": air });
  choose(split, "계약별로 나눠 받기");
  const form = choose(split, "일부 계약만 분리");
  assert.equal(row(form, "현재 대표 계약"), water);
  assert.equal(row(form, "현재 함께 발행되는 계약"), air);
  const splitReview = choose(split, "확인", { "분리할 계약": air });
  assert.equal(row(splitReview, "현재 대표 계약"), water);
  assert.equal(row(splitReview, "분리할 계약"), air);
});

test("payment grouping displays the selected representative and contracts before evidence selection", () => {
  const chat = open(26);
  authenticate(chat);
  choose(chat, "계약 선택하기");
  const review = choose(chat, "확인", { "첫 번째 계약": water, "두 번째 계약": air, "대표 계약": air });
  assert.equal(review.screen.id, "s5");
  assert.equal(row(review, "대표 계약"), air);
  assert.equal(row(review, "통합 대상 계약"), water + " · " + air);
  assert.ok(review.actions.some(({ label }) => label === "증빙 정보도 변경"));
});

test("payment split shows the verified representative and members on both request forms", () => {
  const chat = open(27);
  authenticate(chat);
  choose(chat, "계약 확인", { "계약 또는 제품명": water });
  const all = choose(chat, "모든 계약을 나누기");
  assert.equal(row(all, "대표 계약"), water);
  assert.equal(row(all, "현재 묶인 계약"), air + " · 비데");
  choose(chat, "다시 선택");
  choose(chat, "일부 계약만 나누기");
  const selected = choose(chat, "분리할 계약 선택");
  assert.equal(row(selected, "대표 계약"), water);
  assert.equal(row(selected, "현재 묶인 계약"), air + " · 비데");
  assert.ok(selected.actions.some(({ label }) => label === "분리 요청"));
});

test("filter address requests distinguish the confirmed old address from the newly entered one", () => {
  for (const reship of [false, true]) {
    const chat = open(29);
    choose(chat, "제 필터 배송");
    authenticate(chat);
    choose(chat, "배송 조회", { "계약 또는 제품명": water, 주소: registered + " 200호" });
    let edit;
    if (reship) {
      choose(chat, "필터가 파손됐거나 다른 필터가 왔어요");
      edit = choose(chat, "배송지 변경");
    } else {
      choose(chat, "다음 배송 주소만 변경");
      edit = choose(chat, "제품 사용·필터 배송 주소만 변경");
    }
    assert.equal(row(edit, "대상 계약"), water);
    assert.equal(row(edit, "등록 배송 주소"), registered);
    assert.doesNotMatch(JSON.stringify(edit.messages.at(-1)), /200호/);
    const receipt = choose(chat, reship ? "재발송 요청" : "주소 변경", { 주소: "서울 영등포구 양평동 300호" });
    assert.equal(row(receipt, "등록 배송 주소"), registered);
    assert.equal(row(receipt, reship ? "받으실 주소" : "다음 배송 주소"), "서울 영등포구 양평동");
    assert.doesNotMatch(JSON.stringify(receipt.messages.at(-1)), /300호/);
  }
});

function care(contract) {
  const chat = open(30);
  choose(chat, "관계 확인");
  choose(chat, "계약자 본인");
  authenticate(chat);
  const record = choose(chat, "계약 확인", { "계약 또는 제품명": contract, 주소: registered });
  return { chat, record };
}

test("care requests show the known contract and only a genuinely assigned date", () => {
  const scheduled = care(water);
  const edit = choose(scheduled.chat, "방문 날짜 변경");
  assert.equal(row(edit, "대상 계약"), water);
  assert.equal(row(edit, "현재 방문 예정일"), row(scheduled.record, "방문 예정일"));
  const pending = care("SK-261125-030");
  const before = choose(pending.chat, "미리 점검 요청");
  assert.ok(row(before, "대상 계약"));
  assert.equal(row(before, "현재 방문 예정일"), undefined);
});

test("advance contact note shows the selected appointment number, date and masked phone", () => {
  const chat = open(34);
  authenticate(chat);
  const appointment = choose(chat, "직수 정수기 접수 선택");
  choose(chat, "계속하기");
  const note = choose(chat, "사전 연락 요청");
  assert.equal(note.screen.id, "visitCallbackNote");
  for (const key of ["접수번호", "접수제품", "방문 예정일", "방문 연락처"]) {
    assert.equal(row(note, key), row(appointment, key));
    assert.ok(row(note, key));
  }
  assert.match(row(note, "방문 연락처"), /••••/);
});

test("pickup fields distinguish the current request date from the user's proposed date", () => {
  const chat = open(36);
  choose(chat, "제품 회수");
  authenticate(chat);
  const record = choose(chat, "회수 계약 조회", { "계약 또는 제품명": "SK-261125-035" });
  choose(chat, "계속하기");
  const scheduling = choose(chat, "회수일 변경");
  assert.equal(row(scheduling, "대상 계약"), row(record, "대상 계약"));
  assert.equal(row(scheduling, "현재 회수 요청일"), row(record, "회수 요청일"));
  assert.ok(row(scheduling, "현재 회수 요청일"));
  const proposed = scheduling.actions.find(({ label }) => /월 \d+일\([월화수목금토일]\) 선택$/u.test(label));
  assert.ok(proposed);
  const selection = choose(chat, proposed.label);
  const note = choose(chat, "방문 담당자에게 전달");
  assert.equal(row(note, "현재 회수 요청일"), row(record, "회수 요청일"));
  assert.equal(row(note, "선택한 희망 회수일"), selection.selectedDate);
});
