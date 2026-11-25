const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = path.join(__dirname, "..", "src");
const sandbox = vm.createContext({ window: {} });
for (const file of ["scenarios.js", "audit-01-17.js", "audit-18-36.js", "audit-37-50.js", "engine.js"]) {
  vm.runInContext(fs.readFileSync(path.join(source, file), "utf8"), sandbox, { filename: file });
}
const { SKIXChat, SKIX_SCENARIOS } = sandbox.window;

function begin(scenario) {
  const chat = new SKIXChat(SKIX_SCENARIOS);
  chat.start(scenario);
  return chat;
}

function requestOrderCode(chat, phone) {
  chat.choose("동의하고 계속");
  return chat.choose("인증번호 받기", { 이름: "김매직", "휴대폰 번호": phone });
}

test("SMS codes rotate on resend and do not appear in the conversation", () => {
  const chat = begin(16);
  const first = requestOrderCode(chat, "010-0000-1234").verification.code;
  assert.match(first, /^\d{6}$/);
  const second = chat.choose("인증번호 재전송").verification.code;
  assert.notEqual(second, first);
  const failed = chat.choose("확인", { 인증번호: first });
  assert.equal(failed.screen.id, "phoneConfirm");
  assert.match(failed.fields.find((field) => field.label === "인증번호").error, /일치하지/);
  assert.ok(failed.messages.every(({ text }) => !text.includes(first) && !text.includes(second)));
  const ready = chat.choose("확인", { 인증번호: second });
  assert.equal(ready.screen.id, "S02");
  assert.equal(ready.verification, null);
});

test("the masked phone field does not replace the order lookup result", () => {
  for (const [phone, expected] of [
    ["01000000000", "S04"],
    ["010-0000-0002", "S05"],
    ["010-0000-0005", "pending5"],
  ]) {
    const chat = begin(16);
    const code = requestOrderCode(chat, phone).verification.code;
    const result = chat.choose("확인", { 인증번호: code });
    assert.equal(result.screen.id, expected);
    assert.ok(result.actions.every(({ label }) => !label.includes("주문 선택")));
  }
});

test("PASS uses a confirmation step and keeps the selected contract flow", () => {
  const chat = begin(1);
  const auth = chat.choose("PASS 본인인증");
  assert.equal(auth.screen.id, "$auth");
  assert.deepEqual(Array.from(auth.actions, ({ label }) => label), ["본인인증 확인", "취소"]);
  assert.equal(chat.choose("본인인증 확인").screen.id, "S02");
});

test("explicit corporate requests are answered as out of scope before selecting a workflow", () => {
  for (const request of [
    "법인 견적",
    "기업 로그인",
    "법인 사업자번호로 지로 고지서 조회해 주세요",
    "법인 명의로 계약자 변경을 신청하고 싶어요",
  ]) {
    const scopeReply = SKIXChat.corporateReply(request);
    assert.match(scopeReply, /개인과 개인사업자|개인·개인사업자/, request);

    const chat = new SKIXChat(SKIX_SCENARIOS);
    assert.equal(chat.find(request).length, 0, request);
    const result = chat.submit(request);
    assert.equal(result.scenario, null, request);
    assert.equal(result.actions.length, 0, request);
    assert.equal(result.messages.at(-1).text, scopeReply, request);
  }

  const activeChat = begin(31);
  const outOfScope = activeChat.submit("법인 견적");
  assert.equal(outOfScope.scenario, null);
  assert.equal(outOfScope.screen, null);
  assert.equal(outOfScope.actions.length, 0);
  assert.equal(outOfScope.fields.length, 0);
  assert.equal(activeChat.submit("개인사업자 정수기 신규 가입").scenario?.no, 31);
});

test("sole-proprietor and ordinary payment requests retain their workflows", () => {
  for (const [request, expected] of [
    ["개인사업자 지로 고지서 재발송", 24],
    ["개인사업자 지로 고지서 합치기", 25],
    ["개인사업자 정수기 신규 가입", 31],
    ["개인사업자 사업자등록증 받기", 37],
    ["법인이 아니라 개인사업자예요. 지로 고지서 재발송", 24],
    ["기업은행 계좌 변경", 3],
    ["법인카드로 요금 납부", 4],
  ]) {
    assert.equal(SKIXChat.corporateReply(request), "", request);
    const chat = new SKIXChat(SKIX_SCENARIOS);
    assert.equal(chat.submit(request).scenario?.no, expected, request);
  }
});

test("giro documents use contract-holder phone verification without corporate intake", () => {
  const chat = begin(24);
  const entryOptions = Array.from(chat.getState().actions, ({ label }) => label);
  assert.deepEqual(entryOptions, ["휴대폰 확인"]);

  chat.choose("휴대폰 확인");
  const code = requestOrderCode(chat, "010-0000-1234").verification.code;
  const verified = chat.choose("확인", { 인증번호: code });
  assert.equal(verified.screen.id, "s1");
  assert.ok(verified.actions.some(({ label }) => label === "지로 고지서 다시 받기"));
  assert.ok(verified.actions.some(({ label }) => label === "가상계좌확인서 받기"));
});

test("ownership transfer keeps the sole-proprietor registration field", () => {
  const chat = begin(10);
  chat.choose("PASS 본인인증");
  chat.choose("본인인증 확인");
  chat.choose("명의변경 신청");
  const customerTypes = chat.choose("직수 정수기 선택");
  assert.deepEqual(Array.from(customerTypes.actions, ({ label }) => label), ["개인", "개인사업자", "귀화·등록번호 정정 등"]);

  const business = chat.choose("개인사업자");
  assert.equal(business.fields.find(({ label }) => label === "사업자등록번호")?.required, true);
  const result = chat.choose("신청 접수", {
    이름: "김매직",
    "휴대폰 번호": "010-0000-1234",
    생년월일: "900101",
    사업자등록번호: "000-00-00000",
  });
  assert.equal(result.screen.id, "S08");
});

test("a sole proprietor can group giro notices by contract", () => {
  const chat = new SKIXChat(SKIX_SCENARIOS);
  assert.equal(chat.submit("개인사업자 지로 고지서 합치기").scenario?.no, 25);
  chat.choose("계약 확인");
  chat.choose("계약 확인", { "계약 또는 제품명": "직수 정수기" });
  chat.choose("한 장으로 받기");
  const selection = chat.choose("확인", {
    "첫 번째 계약": "직수 정수기",
    "두 번째 계약": "공기청정기",
    "대표 계약": "직수 정수기",
  });
  assert.deepEqual(Array.from(selection.actions, ({ label }) => label), ["우편", "이메일"]);
  assert.equal(chat.choose("이메일").screen.id, "s6");
});

test("subscription consultation retains signup and replacement without corporate estimates", () => {
  const chat = begin(31);
  assert.deepEqual(Array.from(chat.getState().actions, ({ label }) => label), ["신규 가입", "기존 제품 교체"]);
  assert.equal(chat.choose("법인 견적").screen.id, "s1");
  chat.choose("신규 가입");
  const application = chat.choose("희망 제품 확인", { "제품명 또는 모델명": "직수 정수기" });
  assert.equal(application.screen.id, "applicationStatus");
  assert.equal(chat.choose("아직 상담을 신청하지 않았어요").screen.id, "s5");
});

test("a sole proprietor can still request a business registration document", () => {
  const chat = begin(37);
  chat.choose("사업자등록증");
  const authority = chat.choose("계약 확인", { "계약 또는 제품명": "직수 정수기" });
  assert.deepEqual(Array.from(authority.actions, ({ label }) => label), ["계약자 본인", "계약자 아님"]);

  chat.choose("계약자 본인");
  chat.choose("한 번 받기");
  chat.choose("이메일");
  const result = chat.choose("발송 요청", { "이메일 주소": "solo@example.com" });
  assert.equal(result.screen.id, "s8");
  assert.match(result.messages.at(-1).text, /사업자등록증.*발송/);
  assert.ok(result.messages.every(({ text }) => !text.includes("solo@example.com")));
});
