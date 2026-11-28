const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "..", "phase-1.html"), "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(([, script]) => script);
const runtime = vm.createContext({ window: {} });
for (const script of scripts) {
  vm.runInContext(script, runtime);
  if (runtime.window.SKIXChat) break;
}

const { SKIXChat, SKIX_SCENARIOS } = runtime.window;
const publicScenarios = SKIX_SCENARIOS.filter(({ phase }) => phase === "1차");
const edition = () => new SKIXChat(SKIX_SCENARIOS, { publicScenarios });

test("first-phase build exposes exactly 17 workflows and scopes natural language", () => {
  assert.match(html, /id="app" data-phase-one/);
  assert.deepEqual(Array.from(publicScenarios, ({ no }) => no), Array.from({ length: 17 }, (_, i) => i + 1));
  assert.deepEqual(Array.from(SKIX_SCENARIOS.filter(({ phase }) => phase !== "1차"), ({ no }) => no).sort(), [34, 39, 41]);

  const chat = edition();
  for (const query of ["18", "34", "39", "41", "현금영수증 발행 신청", "구독 체결 심사"]) {
    assert.ok(chat.find(query).every(({ no }) => no <= 17));
    const state = chat.submit(query);
    assert.ok(!state.scenario || state.scenario.no <= 17);
  }
  chat.reset();
  assert.equal(chat.start(41).scenario, null);
  assert.equal(chat.submit("제품 고장 상담").scenario.no, 11);
});

test("first-phase contextual deposit and service-provider routes remain connected", () => {
  const chat = edition();
  chat.start(1);
  chat.choose("PASS 본인인증");
  chat.choose("본인인증 확인");
  chat.choose("직수 정수기 선택");
  chat.choose("결제정보 상세 조회");
  const deposit = chat.choose("구독료 입금 내역 확인");
  assert.equal(deposit.scenario.no, 39);
  assert.equal(deposit.screen.id, "s4");
  assert.ok(!deposit.actions.some(({ label }) => label === "PASS 본인인증"));

  chat.reset();
  chat.start(11);
  const vendor = chat.choose("서비스 대행업체 확인");
  assert.equal(vendor.scenario.no, 41);
  assert.ok(vendor.actions.length);
});
