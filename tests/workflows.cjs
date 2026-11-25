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
