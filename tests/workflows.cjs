const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = path.join(__dirname, "..", "src");
const workflowFiles = ["scenarios.js", "audit-01-17.js", "audit-18-36.js", "audit-37-50.js", "engine.js"];
const sandbox = vm.createContext({ window: {} });
for (const file of workflowFiles) {
  vm.runInContext(fs.readFileSync(path.join(source, file), "utf8"), sandbox, { filename: file });
}
const { SKIXChat, SKIX_SCENARIOS } = sandbox.window;

function begin(scenario) {
  const chat = new SKIXChat(SKIX_SCENARIOS);
  chat.start(scenario);
  return chat;
}

test("chat skips approved intermediate buttons and waits for sending, payments and changes", () => {
  const quote = begin(7).showDemoScreen("S05");
  assert.equal(quote.inputSubmitActionId, quote.actions.find(({ label }) => label === "위약금 조회").id);

  const availability = begin(8).showDemoScreen("S04");
  const addressSearch = availability.actions.find(({ label }) => label === "주소 검색");
  assert.ok(addressSearch.requiresFields);
  assert.equal(availability.inputSubmitActionId, availability.actions.find(({ label }) => label === "예약 가능일자 확인").id);

  const addressDraft = begin(8).showDemoScreen("customMoveDate");
  assert.equal(addressDraft.inputSubmitActionId, addressDraft.actions.find(({ label }) => label === "다음").id);

  const codeEntry = begin(17).showDemoScreen("phoneConfirm");
  assert.equal(codeEntry.inputSubmitActionId, codeEntry.actions.find(({ label }) => label === "확인").id);

  const deliveryDay = begin(37).showDemoScreen("s6");
  assert.equal(deliveryDay.inputSubmitActionId, deliveryDay.actions.find(({ label }) => label === "이 날짜로 계속").id);

  for (const [no, screen, label] of [
    [3, "S05", "PASS 전자서명"], [14, "S03", "주소 확인"], [17, "S04", "주소 확인"], [28, "s2", "PASS 본인인증"]
  ]) {
    const state = begin(no).showDemoScreen(screen);
    assert.equal(state.inputSubmitActionId, state.actions.find((action) => action.label === label).id);
  }

  for (const state of [
    begin(17).showDemoScreen("S06"),
    begin(28).showDemoScreen("s4"),
    begin(44).showDemoScreen("s6"),
    begin(45).showDemoScreen("prepaidVirtual")
  ]) {
    assert.ok(state.actions.some(({ requiresFields }) => requiresFields));
    assert.equal(state.inputSubmitActionId, null);
  }
});

function requestPhoneCode(chat, phone) {
  chat.choose("동의하고 계속");
  return chat.choose("인증번호 받기", { 이름: "김매직", "휴대폰 번호": phone });
}

function approvePass(chat) {
  chat.choose("PASS 본인인증");
  return chat.choose("본인인증 확인");
}

function chooseAvailable(chat, label, inputs) {
  const state = chat.getState();
  const action = state.actions.find((item) => item.label === label);
  assert.ok(action, `Missing ${label} at ${state.scenario?.no}:${state.screen?.id}`);
  return chat.choose(action.id, inputs);
}

function verifyPhone(chat, phone = "010-0000-1234") {
  const code = requestPhoneCode(chat, phone).verification.code;
  return chooseAvailable(chat, "확인", { 인증번호: code });
}

test("first-phase plan identifies consultation codes and chat-and-callbot scenarios", () => {
  const firstPhase = Array.from(SKIX_SCENARIOS).filter(({ phase }) => phase === "1차");
  assert.equal(firstPhase.length, 17);
  assert.deepEqual(firstPhase.filter(({ firstPhaseScenario }) => firstPhaseScenario.includes("[챗봇/콜봇]"))
    .map(({ no }) => no), [6, 13, 15, 16]);
  const chat = new SKIXChat(SKIX_SCENARIOS);
  assert.equal(chat.find("상담코드 1")[0]?.no, 13);
  assert.equal(chat.find("상담코드 109")[0]?.no, 10);
  assert.equal(chat.find("02-8_017")[0]?.no, 17);
  assert.equal(chat.find("1")[0]?.no, 1);
});

test("later phases use the plan's consultation codes without changing scenario number search", () => {
  const chat = new SKIXChat(SKIX_SCENARIOS);
  const numbers = (query) => Array.from(chat.find(query), ({ no }) => no);
  assert.equal(Array.from(SKIX_SCENARIOS).filter(({ consultationCode }) => consultationCode).length, 50);
  assert.deepEqual(numbers("상담코드 51"), [24, 25, 26, 27]);
  assert.deepEqual(numbers("상담코드 43"), [21, 22]);
  assert.deepEqual(numbers("상담코드 93"), [45, 46]);
  assert.deepEqual(numbers("43"), [43]);
  assert.equal(SKIX_SCENARIOS.find(({ no }) => no === 38).consultationCode, "(미부여)");
});

test("inbound questions never open the outbound-only review", () => {
  const chat = new SKIXChat(SKIX_SCENARIOS);
  for (const text of ["구독 체결 심사를 받고 싶어요", "렌탈 심사 기준", "계약 체결 심사"]) {
    const result = chat.submit(text);
    assert.equal(result.scenario, null);
    assert.equal(result.inputDisabled, false);
    assert.match(result.messages.at(-1).text, /판매처 또는 상담사/);
    assert.doesNotMatch(result.messages.at(-1).text, /RM|아웃바운드/);
  }
  assert.equal(chat.submit("50").scenario, null);
  assert.equal(chat.find("50")[0]?.no, 50);
  const review = chat.start(50);
  assert.equal(review.screen.kind, "internal-only");
  assert.equal(review.actions.length, 0);
  assert.equal(review.fields.length, 0);
});

test("first-phase sole-proprietor phone confirmation requires a business registration number", () => {
  const chat = begin(13);
  const intake = chat.choose("개인사업자로 동의하고 계속");
  assert.equal(intake.fields.find(({ label }) => label === "사업자등록번호")?.required, true);
  const rejected = chat.choose("인증번호 받기", { 이름: "김매직", "휴대폰 번호": "010-0000-1234" });
  assert.equal(rejected.verification, null);
  const requested = chat.choose("인증번호 받기", {
    이름: "김매직", "휴대폰 번호": "010-0000-1234", 사업자등록번호: "000-00-00000",
  });
  assert.ok(requested.verification?.code);
  assert.ok(requested.messages.every(({ text }) => !text.includes("000-00-00000")));
});

test("common counselor routing follows Seoul hours and uses a local callback preview", () => {
  const OriginalDate = vm.runInContext("Date", sandbox);
  let now = "2026-11-23T00:00:00.000Z";
  sandbox.Date = class extends OriginalDate {
    constructor(...args) {
      super(...(args.length ? args : [now]));
    }
  };
  try {
    for (const no of [6, 18, 23, 31, 48]) {
      const chat = begin(no);
      const open = chat.submit("상담사 연결");
      assert.ok(open.actions.some(({ label }) => label === "채팅 상담 연결 요청"));
      const response = chooseAvailable(chat, "채팅 상담 연결 요청");
      assert.match(response.messages.at(-1).text, /실제 상담사 연결은 운영 환경/);
      const closed = chooseAvailable(chat, "상담 종료");
      assert.equal(closed.screen.kind, "closed");
      assert.equal(closed.inputDisabled, true);
    }
    now = "2026-11-23T09:00:00.000Z";
    for (const no of [6, 23, 48]) {
      const chat = begin(no);
      const closed = chat.submit("상담사 연결");
      assert.ok(closed.actions.some(({ label }) => label === "상담사 전화 예약"));
      const callback = chat.choose("상담사 전화 예약");
      assert.equal(callback.fields[0].label, "휴대폰 번호");
      const result = chat.choose("전화 예약 요청", { "휴대폰 번호": "010-0000-1234" });
      assert.match(result.messages.at(-1).text, /운영 환경/);
    }
  } finally {
    delete sandbox.Date;
  }
});

test("SMS expires at three minutes and a resend starts a new validity period", () => {
  const appDate = vm.runInContext("Date", sandbox);
  const originalNow = appDate.now;
  let time = originalNow();
  appDate.now = () => time;
  try {
    const chat = begin(16);
    const code = requestPhoneCode(chat, "010-0000-1234").verification.code;
    time += 180_000;
    const expired = chat.choose("확인", { 인증번호: code });
    assert.match(expired.fields.find(({ label }) => label === "인증번호")?.error, /유효 시간/);
    const replacement = chat.choose("인증번호 재전송").verification.code;
    assert.notEqual(replacement, code);
    assert.equal(chat.choose("확인", { 인증번호: replacement }).screen.id, "S02");
  } finally {
    appDate.now = originalNow;
  }
});

test("SMS codes rotate on resend and do not appear in the conversation", () => {
  const chat = begin(16);
  const first = requestPhoneCode(chat, "010-0000-1234").verification.code;
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

test("delivery uses three phone verification attempts and AS keeps five", () => {
  for (const [scenario, attempts, failureScreen] of [
    [13, 5, "$phoneConfirmationFailed"], [16, 3, "deliveryPhoneFailed"], [17, 3, "deliveryPhoneFailed"],
  ]) {
    const chat = begin(scenario);
    const code = requestPhoneCode(chat, "010-0000-1234").verification.code;
    const wrong = code === "100000" ? "100001" : "100000";
    for (let attempt = 1; attempt < attempts; attempt++) {
      const inProgress = chooseAvailable(chat, "확인", { 인증번호: wrong });
      assert.equal(inProgress.screen.id, "phoneConfirm");
      assert.match(inProgress.fields.find(({ label }) => label === "인증번호")?.error, new RegExp(`${attempts - attempt}번`));
    }
    const failed = chooseAvailable(chat, "확인", { 인증번호: wrong });
    assert.equal(failed.screen.id, failureScreen);
    assert.ok(failed.actions.some(({ label }) => label === "상담사 연결"));
    assert.equal(failed.verification, null);
  }
});

test("the masked phone field does not replace the order lookup result", () => {
  for (const [phone, expected] of [
    ["01000000000", "S04"],
    ["010-0000-0002", "S05"],
    ["010-0000-0005", "pending5"],
  ]) {
    const chat = begin(16);
    const code = requestPhoneCode(chat, phone).verification.code;
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

test("a verified identity follows the conversation across menu workflows until reset", () => {
  const chat = begin(1);
  approvePass(chat);
  const charges = chat.start(2);
  assert.equal(charges.screen.id, "S02");
  assert.ok(charges.actions.some(({ label }) => label === "직수 정수기 선택"));

  chat.reset({ preserveIdentity: true });
  const service = chat.start(13);
  assert.equal(service.screen.id, "S02");
  assert.equal(service.verification, null);
  assert.ok(service.actions.some(({ label }) => label === "직수 정수기 접수 선택"));

  const home = chat.reset();
  assert.equal(home.scenario, null);
  assert.equal(home.messages.length, 1);
  assert.ok(chat.start(1).actions.some(({ label }) => label === "PASS 본인인증"));
});

test("verified phone identity skips repeated prompts but keeps destination lookup rules", () => {
  const owner = begin(13);
  verifyPhone(owner);
  const billing = owner.start(1);
  assert.equal(billing.screen.id, "S02");
  assert.equal(billing.verification, null);
  const documents = owner.start(21);
  assert.equal(documents.screen.id, "returnContractLookup");
  assert.ok(documents.actions.some(({ label }) => label === "계약 확인"));

  const alternate = begin(13);
  const rejected = verifyPhone(alternate, "010-0000-0002");
  assert.equal(rejected.screen.id, "S07");
  const delivery = alternate.start(16);
  assert.equal(delivery.screen.id, "S05");
  assert.ok(delivery.actions.every(({ label }) => !label.includes("주문 선택")));
  assert.notEqual(alternate.start(1).screen.id, "S02");
});

test("billing links keep the authenticated contract and require separate authorization for a new bank account", () => {
  const openDetails = () => {
    const chat = begin(1);
    approvePass(chat);
    chat.choose("직수 정수기 선택");
    chat.choose("결제정보 상세 조회");
    return chat;
  };

  const change = openDetails();
  assert.equal(change.choose("결제정보 변경").screen.id, "ordinaryPaymentDetails");
  change.choose("결제정보 변경");
  change.choose("결제정보 변경 진행");
  const edit = change.choose("은행 계좌");
  const items = (state) => Object.fromEntries(state.messages.at(-1).items.map(({ title, detail }) => [title, detail]));
  assert.equal(items(edit)["대상 계약"], "직수 정수기");
  assert.match(items(edit)["현재 결제수단"], /신한카드.*1234/);
  const signature = change.choose("PASS 전자서명", { 은행: "신한은행", 계좌번호: "000000006789", 생년월일: "900101" });
  assert.equal(signature.screen.id, "$auth");
  assert.ok(signature.actions.some(({ label }) => label === "전자서명 확인"));
  assert.match(items(signature)["등록할 결제수단"], /신한은행.*6789/);
  const saved = chooseAvailable(change, "전자서명 확인");
  assert.match(items(saved)["변경 전 결제수단"], /신한카드.*1234/);
  assert.match(items(saved)["계좌번호"], /6789$/);
  chooseAvailable(change, "다른 계약 변경");
  assert.match(items(chooseAvailable(change, "공기청정기 선택"))["결제정보"], /KB국민은행.*4321/);
  chooseAvailable(change, "다른 계약 확인");
  assert.match(items(chooseAvailable(change, "직수 정수기 선택"))["결제정보"], /신한은행.*6789/);

  const penalty = openDetails();
  assert.equal(penalty.choose("위약금 문의").fields[0].label, "해약접수 예정일");
  assert.equal(penalty.choose("위약금 조회", { "해약접수 예정일": "" }).screen.id, "S06");
});

test("air purifier billing reuses the selected contract and prioritizes older arrears", () => {
  function selectAir() {
    const chat = begin(1);
    approvePass(chat);
    chooseAvailable(chat, "공기청정기 선택");
    return chat;
  }
  const change = selectAir();
  chooseAvailable(change, "결제정보 상세 조회");
  const detail = chooseAvailable(change, "결제정보 변경");
  assert.equal(detail.scenario.no, 3);
  assert.equal(detail.screen.id, "airPaymentDetails");
  assert.match(detail.messages.at(-1).items.find(({ title }) => title === "공기청정기")?.detail, /ACL-1000/);
  assert.ok(detail.actions.every(({ label }) => label !== "PASS 본인인증"));
  assert.equal(chooseAvailable(change, "결제정보 변경").screen.id, "applyThisMonthSingle");
  assert.equal(chooseAvailable(change, "결제정보 변경 진행").screen.id, "S03");

  const pay = selectAir();
  const previous = chooseAvailable(pay, "당월 납부 결과");
  assert.equal(previous.scenario.no, 5);
  assert.equal(previous.screen.id, "airArrears");
  assert.match(previous.messages.at(-1).items.find(({ title }) => title === "청구·납부")?.detail, /미납금\(당월 미포함\) 59,700원/);
  assert.ok(previous.actions.some(({ label }) => label === "미납금 납부"));
});

test("billing result cards distinguish settled amounts from charges that are still due", () => {
  const items = (state) => Object.fromEntries(state.messages.at(-1).items.map(({ title, detail }) => [title, detail]));
  for (const day of [24, 26]) {
    const clock = class extends Date {
      constructor(...args) { super(...(args.length ? args : [`2026-11-${day}T02:00:00.000Z`])); }
    };
    const context = vm.createContext({ window: {}, Date: clock });
    for (const file of workflowFiles) {
      vm.runInContext(fs.readFileSync(path.join(source, file), "utf8"), context, { filename: file });
    }
    const chat = new context.window.SKIXChat(context.window.SKIX_SCENARIOS);
    chat.start(1);
    approvePass(chat);
    chooseAvailable(chat, "직수 정수기 선택");
    const status = chooseAvailable(chat, "당월 납부 결과");
    if (day < 25) {
      assert.equal(status.screen.id, "paymentBefore");
      assert.equal(items(status)["납부 금액"], undefined);
      assert.equal(items(status)["납부 방법"], undefined);
    } else {
      assert.deepEqual(items(status), {
        "당월 납부 상태": "납부 완료", "납부 대상": "직수 정수기 · WPU-1000", "납부 금액": "29,900원",
        "납부 방법": "신용카드 자동납부 · 신한카드 · 끝자리 1234",
      });
      const deposit = chooseAvailable(chat, "구독료 입금 내역 확인");
      assert.equal(items(deposit)["납부 금액"], "29,900원");
      assert.match(items(deposit)["납부 방법"], /신한카드.*1234/);
    }
    const fees = new context.window.SKIXChat(context.window.SKIX_SCENARIOS);
    fees.start(2);
    approvePass(fees);
    const feeDetails = chooseAvailable(fees, "직수 정수기 선택");
    assert.equal(items(feeDetails)["납부 금액"], day >= 25 ? "29,900원" : undefined);
  }

  const charges = begin(4);
  approvePass(charges);
  const bidet = items(chooseAvailable(charges, "비데 선택"));
  assert.equal(bidet["납부 금액"], "16,900원");
  assert.match(bidet["납부 방법"], /네이버페이/);

  const arrears = begin(5);
  approvePass(arrears);
  const zero = items(chooseAvailable(arrears, "비데 선택"));
  assert.equal(zero["미납금(당월 미포함)"], "0원");
  assert.equal(zero["납부 방법"], undefined);
});

test("an installment receipt shows the amount and the selected masked card", () => {
  const chat = begin(4);
  approvePass(chat);
  chooseAvailable(chat, "공기청정기 선택");
  chooseAvailable(chat, "미납요금과 당월 요금 납부");
  chooseAvailable(chat, "일회성 납부수단");
  chooseAvailable(chat, "카드");
  chooseAvailable(chat, "2개월 할부");
  chooseAvailable(chat, "KB국민카드");
  chooseAvailable(chat, "PASS 본인인증", { 카드번호: "0000000000006789", 유효기간: "12/30", 생년월일: "900101" });
  const receipt = chooseAvailable(chat, "본인인증 확인");
  assert.equal(receipt.screen.id, "installmentResult");
  const value = (label) => receipt.messages.at(-1).items.find(({ title }) => title === label)?.detail;
  assert.equal(value("납부 대상"), "공기청정기");
  assert.equal(value("납부 금액"), "79,600원");
  assert.equal(value("할부 기간"), "2개월 할부");
  assert.match(value("납부 방법"), /KB국민카드 · ••••-••••-••••-6789$/);
  assert.doesNotMatch(JSON.stringify(receipt.messages), /0000000000006789/);
});

test("deposit inquiry reuses the verified matching contract from billing details", () => {
  const chat = begin(1);
  approvePass(chat);
  chooseAvailable(chat, "직수 정수기 선택");
  chooseAvailable(chat, "결제정보 상세 조회");
  const deposit = chooseAvailable(chat, "구독료 입금 내역 확인");
  assert.equal(deposit.scenario.no, 39);
  assert.equal(deposit.screen.id, "s4");
  assert.ok(deposit.actions.every(({ label }) => label !== "PASS 본인인증"));
  assert.equal(chat.context.product, "직수 정수기");

  const fresh = begin(39);
  chooseAvailable(fresh, "이번 달 납부 결과");
  const lookup = chooseAvailable(fresh, "계약 확인", { "계약 또는 제품명": "직수 정수기" });
  assert.equal(lookup.screen.id, "reuse006Pass");
});

test("first-phase chat closing is distinct from asking another question", () => {
  const chat = begin(6);
  chat.choose("제휴카드 보기");
  const followup = chat.choose(chat.getState().actions.find(({ card }) => card?.kind === "partner").id);
  assert.equal(followup.screen.id, "S04");
  assert.ok(followup.actions.some(({ label }) => label === "추가 문의"));
  const finished = chat.choose("상담 종료");
  assert.equal(finished.screen.kind, "closed");
  assert.equal(finished.actions.length, 0);
  assert.equal(finished.inputDisabled, true);
});

test("registered card payment keeps the initial lookup PASS separate from transaction PASS", () => {
  for (const [entry, pay] of [[4, "요금 납부"], [5, "미납금 납부"]]) {
    const chat = begin(entry);
    approvePass(chat);
    chooseAvailable(chat, "직수 정수기 선택");
    chooseAvailable(chat, pay);
    chooseAvailable(chat, "등록 결제수단");
    chooseAvailable(chat, "신한카드 선택");
    const confirmation = chooseAvailable(chat, "PASS 본인인증");
    assert.equal(confirmation.screen.id, "$auth");
    assert.equal(confirmation.screen.condition, "PASS 본인인증");
    const cancelled = chooseAvailable(chat, "취소");
    assert.notEqual(cancelled.screen.id, "S07");
    chooseAvailable(chat, "PASS 본인인증");
    assert.equal(chooseAvailable(chat, "본인인증 확인").screen.id, "S07");
  }
});

test("registered bank payment requires a transaction e-signature", () => {
  for (const [no, contract, pay] of [
    [4, "공기청정기 선택", "미납요금과 당월 요금 납부"], [5, "식기세척기 선택", "미납금 납부"],
  ]) {
    const chat = begin(no === 5 ? 8 : no);
    if (no === 5) {
      chooseAvailable(chat, "분리 접수");
      verifyPhone(chat, "010-0000-0012");
      chat.start(no);
    } else {
      approvePass(chat);
    }
    chooseAvailable(chat, contract);
    chooseAvailable(chat, pay);
    chooseAvailable(chat, "등록 결제수단");
    chooseAvailable(chat, "KB국민은행 선택");
    const confirmation = chooseAvailable(chat, "PASS 전자서명");
    assert.equal(confirmation.screen.condition, "PASS 전자서명");
    assert.equal(chooseAvailable(chat, "전자서명 확인").screen.id, "S07");
  }

  const thirdParty = begin(5);
  approvePass(thirdParty);
  chooseAvailable(thirdParty, "공기청정기 선택");
  chooseAvailable(thirdParty, "미납금 납부");
  const blocked = chooseAvailable(thirdParty, "등록 결제수단");
  assert.deepEqual(Array.from(blocked.actions, ({ label }) => label), ["가상계좌", "상담사 연결"]);
});

test("Naver separates two and three past-due cycles and keeps the registration contract", () => {
  const current = begin(4);
  approvePass(current);
  const direct = chooseAvailable(current, "매트리스 선택");
  assert.match(direct.messages.at(-1).text, /네이버에서 납부/);
  assert.ok(direct.actions.every(({ label }) => label !== "결제정보 등록"));

  const arrears = begin(5);
  approvePass(arrears);
  chooseAvailable(arrears, "매트리스 선택");
  const registration = chooseAvailable(arrears, "결제정보 등록");
  assert.equal(registration.scenario.no, 3);
  assert.equal(registration.screen.id, "naverArrearsApplication");
  assert.match(registration.messages.at(-1).items[0].detail, /MAT-2000/);
  assert.equal(chooseAvailable(arrears, "결제정보 변경 진행").screen.id, "S03");
});

test("paying arrears with or without this month's charge shows the selected amount", () => {
  for (const [option, expected] of [["미납요금만 납부", /59,700원/], ["미납요금과 당월 요금 납부", /79,600원/]]) {
    const chat = begin(4);
    approvePass(chat);
    chat.choose("공기청정기 선택");
    const payment = chat.choose(option);
    assert.match(payment.messages.at(-1).items.find(({ title }) => title === "납부 금액")?.detail, expected);
  }
});

test("paired move services keep independent contact data, dates, and receipt cards", () => {
  function pickDate(chat) {
    const state = chat.getState();
    const date = state.actions.find(({ label }) => /^\d+월\s*\d+일\s*\([월화수목금토일]\) 선택$/u.test(label));
    assert.ok(date, `No date choices at ${state.screen.id}`);
    chat.choose(date.id);
    return date.label.replace(/ 선택$/, "");
  }
  const contact = "서비스 당일 연락받으실 휴대폰 번호";
  for (const no of [8, 9]) {
    const chat = begin(no);
    chooseAvailable(chat, "분리·재설치 접수");
    chooseAvailable(chat, "휴대폰 확인");
    verifyPhone(chat);
    chooseAvailable(chat, "이사·이동 완료");
    const split = chooseAvailable(chat, "예약 가능일자 확인", {
      "제품명 또는 모델명": "직수 정수기", 주소: "서울 영등포구 문래동 102호", [contact]: "010-0000-9876",
    });
    assert.equal(split.screen.id, "pairSplitSchedule");
    assert.ok(!split.actions.some(({ label }) => label === "다음"));
    const splitDate = pickDate(chat);
    assert.equal(chat.getState().screen.id, "pairInstallAddress");

    chooseAvailable(chat, "예약 가능일자 확인", { 주소: "서울 강서구 마곡동 909호", [contact]: "010-0000-6543" });
    if (chat.getState().actions.some(({ label }) => label === "PASS 본인인증")) approvePass(chat);
    for (const label of ["아니오", "기본 재설치만"]) {
      if (chat.getState().actions.some((action) => action.label === label)) chooseAvailable(chat, label);
    }
    const install = chat.getState();
    assert.equal(install.screen.id, "pairInstallSchedule");
    assert.equal(install.actions.find(({ label }) => label === "분리·재설치 접수")?.disabled, true);
    const installDate = pickDate(chat);
    assert.notEqual(installDate, splitDate);
    const receipt = chooseAvailable(chat, "분리·재설치 접수");
    assert.equal(receipt.screen.id, "pairResult");
    const groups = receipt.messages.at(-1).recordGroups;
    assert.deepEqual(Array.from(groups, ({ title }) => title), ["분리 서비스 접수", "재설치 서비스 접수"]);
    const field = (index, title) => groups[index].items.find((item) => item.title === title)?.detail;
    assert.match(field(0, "주소"), /문래동/);
    assert.match(field(1, "주소"), /마곡동/);
    assert.equal(field(0, "연락처"), "010-••••-9876");
    assert.equal(field(1, "연락처"), "010-••••-6543");
    assert.equal(field(0, "방문 예정일"), splitDate);
    assert.equal(field(1, "방문 예정일"), installDate);
    assert.doesNotMatch(JSON.stringify(receipt.messages), /102호|909호|010-0000-9876|010-0000-6543/);
  }
});

test("standalone service date selection points to the visible booking request", () => {
  for (const no of [8, 9, 12]) {
    const chat = begin(no);
    const schedule = chat.showDemoScreen("S05");
    const date = schedule.actions.find(({ label }) => /일\s*\([월화수목금토일]\) 선택$/u.test(label));
    assert.ok(date);
    const selected = chat.choose(date.id);
    assert.equal(selected.screen.id, "S05");
    assert.match(selected.messages.at(-1).text, /‘접수 요청’을 눌러/);
    assert.ok(selected.actions.some(({ label, disabled }) => label === "접수 요청" && !disabled));
  }
});

test("fault diagnosis opens symptom choices after product selection and continues to visit intake", () => {
  const chat = begin(11);
  const products = chat.getState();
  assert.equal(products.selection?.kind, "service-product");
  const product = products.actions.find(({ label }) => label === "정수기 선택");
  assert.match(product?.card?.title, /정수기/);

  const categories = chat.choose(product.id);
  assert.equal(categories.screen.id, "S02");
  assert.equal(categories.selection?.kind, "service-symptom");
  assert.equal(categories.selection.step, 0);
  assert.equal(categories.fields.length, 0);
  assert.ok(categories.actions.some(({ label }) => label === "물·급수"));
  assert.ok(categories.actions.every(({ label }) => label !== "증상 선택" && label !== "물이 나오지 않아요"));

  const subcategories = chat.choose("물·급수");
  assert.equal(subcategories.screen.id, "$symptomGroup");
  assert.equal(subcategories.selection.step, 1);
  assert.deepEqual(Array.from(subcategories.selection.path), ["물·급수"]);
  assert.ok(subcategories.actions.some(({ label }) => label === "출수"));
  assert.ok(subcategories.actions.every(({ label }) => label !== "물이 나오지 않아요"));

  const issues = chat.choose("출수");
  assert.equal(issues.screen.id, "$symptomIssue");
  assert.equal(issues.selection.step, 2);
  assert.deepEqual(Array.from(issues.selection.path), ["물·급수", "출수"]);
  assert.ok(issues.actions.some(({ label }) => label === "물이 나오지 않아요"));
  assert.equal(chat.goBack().screen.id, "$symptomGroup");

  chat.choose("출수");
  assert.equal(chat.choose("물이 나오지 않아요").screen.id, "S05");
  chat.choose("자가조치 보기");
  assert.equal(chat.choose("문제가 계속돼요").screen.id, "S06");
  const intake = chat.choose("AS 서비스 접수");
  assert.equal(intake.scenario.no, 12);
  assert.ok(intake.actions.some(({ label }) => label === "동의하고 계속"));

  const code = requestPhoneCode(chat, "010-0000-1234").verification.code;
  chat.choose("확인", { 인증번호: code });
  chat.choose("등록된 방문 주소");
  const address = chat.getState().fields.find(({ label }) => /휴대폰 번호/.test(label));
  assert.ok(address);
  const dates = chat.choose("예약 가능일자 확인", { [address.label]: "010-0000-1234" });
  const candidate = dates.actions.find(({ label }) => /\d+월\s*\d+일\s*\([월화수목금토일]\) 선택/u.test(label));
  assert.ok(candidate, "expected an available visit date");
  assert.equal(dates.bookingReview.length, 0);
  const selected = chat.choose(candidate.id);
  const review = Object.fromEntries(selected.bookingReview.map(({ title, detail }) => [title, detail]));
  assert.match(review.제품, /직수 정수기/);
  assert.equal(review.증상, "물이 나오지 않아요");
  assert.match(review.연락처, /010-••••-1234/);
  assert.equal(review["방문 일정"], candidate.label.replace(/ 선택$/, ""));
  assert.match(review["방문 주소"], /문래동/);
  const booking = chat.choose("접수 요청");
  assert.equal(booking.screen.id, "S06");
  const details = booking.messages.at(-1).items;
  const bookedProducts = details.filter(({ title }) => /^접수\s*제품$/u.test(title));
  assert.equal(bookedProducts.length, 1);
  assert.match(bookedProducts[0].detail, /직수 정수기/);
  assert.equal(details.find(({ title }) => title === "접수 증상")?.detail, "물이 나오지 않아요");
});

test("visit intake routes a staged leak symptom to assistance before asking for contact details", () => {
  const chat = begin(12);
  assert.equal(chat.getState().fields.length, 0);
  const categories = chat.choose("정수기 선택");
  assert.equal(categories.screen.id, "serviceSymptom");
  assert.ok(categories.actions.some(({ label }) => label === "누수·안전"));
  chat.choose("누수·안전");
  chat.choose("물샘(누수)");
  const urgent = chat.choose("물이 새요");
  assert.equal(urgent.fields.length, 0);
  assert.equal(urgent.verification, null);
  assert.ok(urgent.actions.some(({ label }) => label === "상담사 연결"));
});

test("an authenticated AS lookup carries the selected appointment into editing", () => {
  const chat = begin(13);
  const code = requestPhoneCode(chat, "010-0000-1234").verification.code;
  chat.choose("확인", { 인증번호: code });
  chat.choose("비데 재설치 접수 선택");
  const edit = chat.choose("접수내용 변경");
  assert.equal(edit.scenario.no, 14);
  assert.equal(edit.screen.id, "S02");
  assert.equal(edit.verification, null);
  assert.equal(chat.choose("방문주소").screen.id, "S07");
});

test("AS editing retains the verified appointment and shows the current and previous contact", () => {
  const chat = begin(14);
  verifyPhone(chat);
  const detail = chooseAvailable(chat, "직수 정수기 접수 선택");
  const pick = (state, title) => state.messages.at(-1).items.find((item) => item.title === title)?.detail;
  const reference = pick(detail, "접수번호");
  chooseAvailable(chat, "접수내용 변경");
  const edit = chooseAvailable(chat, "방문 연락처");
  assert.equal(pick(edit, "접수번호"), reference);
  assert.equal(pick(edit, "현재 방문 연락처"), "010-••••-1234");
  const saved = chooseAvailable(chat, "변경 요청", { 연락요청번호: "010-0000-9876" });
  assert.equal(pick(saved, "변경 전 방문 연락처"), "010-••••-1234");
  assert.equal(pick(saved, "방문 연락처"), "010-••••-9876");
  chooseAvailable(chat, "접수내용 변경");
  assert.equal(pick(chooseAvailable(chat, "방문 연락처"), "현재 방문 연락처"), "010-••••-9876");
});

test("advance AS contact links keep the verified AS or move appointment", () => {
  const chat = begin(13);
  verifyPhone(chat);
  const detail = chooseAvailable(chat, "비데 재설치 접수 선택");
  const number = detail.messages.at(-1).items.find(({ title }) => title === "접수번호")?.detail;
  const contact = chooseAvailable(chat, "방문 전 연락 요청");
  assert.equal(contact.scenario.no, 34);
  assert.equal(contact.screen.id, "s4");
  assert.equal(contact.messages.at(-1).items.find(({ title }) => title === "접수번호")?.detail, number);
  assert.equal(contact.verification, null);
  const back = chooseAvailable(chat, "AS 접수 내역 확인");
  assert.equal(back.scenario.no, 13);
  assert.equal(back.screen.id, "S04");
  assert.equal(back.messages.at(-1).items.find(({ title }) => title === "접수번호")?.detail, number);
  chooseAvailable(chat, "방문 전 연락 요청");
  chooseAvailable(chat, "계속하기");
  chooseAvailable(chat, "사전 연락 요청");
  const callback = chooseAvailable(chat, "요청 내용 확인", { "요청 사항": "오전 9시에 연락 부탁드려요" });
  const callbackItems = callback.messages.at(-1).items;
  assert.equal(callbackItems.find(({ title }) => title === "접수번호")?.detail, number);
  assert.ok(callbackItems.some(({ title }) => title === "방문 예정일"));
  assert.equal(callbackItems.find(({ title }) => title === "연락 상태")?.detail, "담당 사업장 확인 필요");

  const open = (phone) => {
    const direct = begin(34);
    chooseAvailable(direct, "휴대폰 확인");
    return verifyPhone(direct, `010-0000-${phone}`);
  };
  assert.equal(open("0008").screen.id, "s4");
  assert.equal(open("0002").screen.id, "visitMultipleCustomers");
  assert.equal(open("0003").screen.id, "visitNotFound");
  const many = open("0009");
  assert.equal(many.screen.id, "visitList");
  assert.equal(many.actions.filter(({ id }) => id.startsWith("visit:") && id !== "visit:handoff").length, 5);
});

test("care scheduling resumes on the same contract only after completed payment", () => {
  const chat = begin(30);
  chooseAvailable(chat, "관계 확인");
  chooseAvailable(chat, "계약자 본인");
  chooseAvailable(chat, "휴대폰 확인");
  verifyPhone(chat);
  chooseAvailable(chat, "계약 확인", { "계약 또는 제품명": "SK-261125-031", 주소: "서울 영등포구 문래동" });
  chooseAvailable(chat, "요금 납부 안내");
  const entry = chat.getState();
  const link = entry.actions.find(({ label }) => /납부/.test(label));
  assert.ok(link);
  const payment = chat.choose(link.id);
  assert.equal(payment.scenario.no, 4);
  assert.equal(payment.screen.id, "paymentScope");
  assert.ok(payment.actions.every(({ label }) => label !== "PASS 본인인증"));
  chooseAvailable(chat, "미납요금만 납부");
  chooseAvailable(chat, "등록 결제수단");
  chooseAvailable(chat, "KB국민은행 선택");
  assert.ok(chat.getState().actions.every(({ label }) => label !== "안심OK 방문 일정 다시 확인"));
  chooseAvailable(chat, "PASS 전자서명");
  assert.equal(chooseAvailable(chat, "전자서명 확인").screen.id, "S07");
  const resumed = chooseAvailable(chat, "안심OK 방문 일정 다시 확인");
  assert.equal(resumed.scenario.no, 30);
  assert.equal(resumed.screen.id, "overduePaid");
  assert.equal(resumed.verification, null);
});

test("pickup date changes require an offered date and route same-day requests to staff", () => {
  function enter(contract) {
    const chat = begin(36);
    chooseAvailable(chat, "제품 회수");
    chooseAvailable(chat, "휴대폰 확인");
    verifyPhone(chat);
    chooseAvailable(chat, "회수 계약 조회", { "계약 또는 제품명": contract });
    chooseAvailable(chat, "계속하기");
    chooseAvailable(chat, "회수일 변경");
    return chat;
  }
  const available = enter("SK-261125-035");
  const before = available.getState();
  assert.equal(before.screen.id, "s6");
  assert.equal(before.actions.find(({ label }) => label === "이 날짜로 요청")?.disabled, true);
  const dates = before.actions.filter(({ label }) => /월\s*\d+일\s*\([월화수목금토일]\) 선택$/u.test(label));
  assert.equal(dates.length, 2);
  const selected = chooseAvailable(available, dates[0].label).selectedDate;
  const result = chooseAvailable(available, "이 날짜로 요청");
  assert.equal(result.messages.at(-1).items.find(({ title }) => title === "희망 회수일")?.detail, selected);
  assert.equal(enter("SK-261125-037").getState().screen.id, "returnToday");
  assert.equal(enter("SK-261125-038").getState().screen.id, "returnUnavailable");
});

test("direct AS editing shows a record before changing it and routes today's visit to a counselor", () => {
  const single = begin(14);
  const detail = verifyPhone(single, "010-0000-0008");
  assert.equal(detail.screen.id, "visitDetails");
  assert.ok(detail.messages.at(-1).items.some(({ title }) => title === "접수번호"));
  assert.equal(chooseAvailable(single, "접수내용 변경").screen.id, "S02");

  const today = begin(14);
  verifyPhone(today, "010-0000-0001");
  assert.equal(chooseAvailable(today, "직수 정수기 접수 선택").screen.id, "visitDetails");
  const handoff = chooseAvailable(today, "접수내용 변경");
  assert.equal(handoff.screen.id, "S06");
  assert.ok(handoff.actions.some(({ label }) => label === "상담사 연결"));
});

test("AS cancellation selects a reason and submits on the same screen", () => {
  const chat = begin(15);
  verifyPhone(chat);
  chooseAvailable(chat, "직수 정수기 접수 선택");
  const reasons = chooseAvailable(chat, "접수취소");
  assert.equal(reasons.screen.id, "S03");
  assert.equal(reasons.actions.find(({ label }) => label === "취소 요청")?.disabled, true);
  assert.ok(reasons.actions.some(({ label }) => label === "나가기"));
  assert.equal(chooseAvailable(chat, "취소 요청").screen.id, "S03");

  const selected = chooseAvailable(chat, "비용 부담");
  assert.equal(selected.screen.id, "S03");
  assert.equal(selected.actions.find(({ label }) => label === "비용 부담")?.variant, "selected");
  assert.ok(!selected.actions.find(({ label }) => label === "취소 요청")?.disabled);
  assert.equal(chooseAvailable(chat, "취소 요청").screen.id, "S05");
});

test("delivery inquiry details continue to additional questions without an edit shortcut", () => {
  const chat = begin(16);
  verifyPhone(chat);
  const detail = chooseAvailable(chat, "직수 정수기 주문 선택");
  assert.equal(detail.screen.id, "S03");
  assert.equal(detail.messages.at(-1).text, "제품 배송 정보를 확인해 드릴게요.");
  assert.deepEqual(Array.from(detail.actions, ({ label }) => label), ["계속하기"]);
  assert.equal(chooseAvailable(chat, "계속하기").screen.id, "S07");
});

test("delivery changes follow the original address, order update, and installer connectors", () => {
  const created = begin(17);
  verifyPhone(created, "010-0000-0006");
  const selectedOrder = chooseAvailable(created, "직수 정수기 주문 선택");
  const pick = (state, title) => state.messages.at(-1).items.find((item) => item.title === title)?.detail;
  const editAddress = chooseAvailable(created, "배송주소 수정");
  assert.equal(pick(editAddress, "주문번호"), pick(selectedOrder, "주문번호"));
  assert.equal(pick(editAddress, "현재 배송지"), pick(selectedOrder, "배송지"));
  const review = chooseAvailable(created, "주소 확인", { "배송 주소": " 서울  종로구   청계천로 85 " });
  assert.equal(review.screen.id, "deliveryAddressConfirm");
  assert.deepEqual(Array.from(created.context.deliveryEvents), ["IF_AICC_R040", "IF_AICC_R037"]);
  const updated = chooseAvailable(created, "배송주소 변경 요청");
  assert.equal(updated.screen.id, "S07");
  assert.equal(pick(updated, "변경 전 배송지"), pick(selectedOrder, "배송지"));
  assert.equal(pick(updated, "배송지"), "서울 종로구 •••");
  assert.deepEqual(Array.from(created.context.deliveryEvents), [
    "IF_AICC_R040", "IF_AICC_R037", "IF_AICC_P004", "IF_AICC_P021", "S07", "IF_AICC_P014",
  ]);
  assert.doesNotMatch(JSON.stringify(updated.messages), /IF_AICC_/);
  assert.doesNotMatch(JSON.stringify(updated.messages), /청계천로\s+85/);

  const dateChange = begin(17);
  verifyPhone(dateChange);
  chooseAvailable(dateChange, "직수 정수기 주문 선택");
  chooseAvailable(dateChange, "배송일정 수정");
  const dates = chooseAvailable(dateChange, "예약 가능일자 확인", { "희망 배송일": dateChange.getState().fields[0].sample });
  assert.equal(dates.actions.find(({ label }) => label === "확인")?.disabled, true);
  const date = dates.actions.find(({ label }) => /일\s*\([월화수목금토일]\) 선택$/u.test(label));
  assert.ok(date);
  const selected = chooseAvailable(dateChange, date.label);
  assert.match(selected.messages.at(-1).text, /‘확인’을 눌러/);
  assert.equal(chooseAvailable(dateChange, "확인").screen.id, "S07");

  const installer = begin(17);
  verifyPhone(installer);
  chooseAvailable(installer, "직수 정수기 주문 선택");
  chooseAvailable(installer, "설치마스터 전달 요청");
  const noted = chooseAvailable(installer, "전달 요청", { "전달 요청 사항": "방문 전에 연락해 주세요" });
  assert.equal(noted.screen.id, "S08");
  assert.match(noted.messages.at(-1).text, /설치마스터가 설치 예정일에 요청 사항을 확인할 수 있어요\./);
  assert.equal(noted.messages.at(-1).items.find(({ title }) => title === "요청사항")?.detail, "방문 전에 연락해 주세요");
  assert.deepEqual(Array.from(installer.context.deliveryEvents), ["IF_AICC_P005", "IF_AICC_P021", "S08"]);

  for (const [suffix, screen] of [["0004", "createdOrder"], ["0005", "pending5"]]) {
    const handoff = verifyPhone(begin(17), `010-0000-${suffix}`);
    assert.equal(handoff.screen.id, screen);
    assert.equal(handoff.screen.kind, "handoff");
  }
});

test("an unlisted bidet uses the documented nozzle symptom stages", () => {
  const chat = begin(11);
  const product = chat.choose("목록에 없는 제품");
  assert.ok(product.fields.some(({ label }) => label === "제품명 또는 모델명"));
  const categories = chat.choose("제품 확인", { "제품명 또는 모델명": "비데" });
  assert.ok(categories.actions.some(({ label }) => label === "교체/파손"));
  assert.ok(categories.actions.every(({ label }) => label !== "물·급수"));
  chat.choose("교체/파손");
  chat.choose("노즐");
  assert.equal(chat.choose("노즐팁 빠짐").screen.id, "S06");
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
  const code = requestPhoneCode(chat, "010-0000-1234").verification.code;
  const verified = chat.choose("확인", { 인증번호: code });
  assert.equal(verified.screen.id, "s1");
  assert.ok(verified.actions.some(({ label }) => label === "지로 고지서 다시 받기"));
  assert.ok(verified.actions.some(({ label }) => label === "가상계좌확인서 받기"));
});

test("ownership transfer keeps the sole-proprietor registration field", () => {
  const chat = begin(10);
  chat.choose("명의변경 신청");
  approvePass(chat);
  const details = chooseAvailable(chat, "직수 정수기 선택");
  assert.equal(details.screen.id, "transferContractDetails");
  assert.deepEqual(Array.from(details.messages.at(-1).items, ({ title }) => title), [
    "직수 정수기", "결제정보", "계약기간", "구독료·납부내역",
  ]);
  const customerTypes = chooseAvailable(chat, "명의변경 신청");
  assert.deepEqual(Array.from(customerTypes.actions, ({ label }) => label), ["개인", "개인사업자", "귀화", "주민등록번호 정정"]);

  const business = chat.choose("개인사업자");
  assert.equal(business.fields.find(({ label }) => label === "사업자등록번호")?.required, true);
  const item = (state, title) => state.messages.at(-1).items.find((entry) => entry.title === title)?.detail;
  assert.equal(item(business, "대상 계약"), "직수 정수기 · WPU-1000");
  assert.equal(item(business, "현재 계약자"), "김○○");
  const pending = chat.choose("확인", {
    이름: "김매직",
    "휴대폰 번호": "010-0000-1234",
    사업자등록번호: "000-00-00000",
  });
  assert.equal(pending.screen.id, "transfereeConsent");
  assert.equal(item(pending, "새 계약자 연락처"), "010-••••-1234");
  assert.doesNotMatch(JSON.stringify(pending.messages), /000-00-00000/);
  assert.equal(chat.choose("동의하고 신청하기").screen.id, "S08");
});

test("ownership transfer separates package, prepaid and cross package restrictions", () => {
  function lookup() {
    const chat = begin(10);
    chooseAvailable(chat, "명의변경 신청");
    approvePass(chat);
    return chat;
  }
  const packageDetails = chooseAvailable(lookup(), "정수기·공기청정기 묶음 선택");
  assert.equal(packageDetails.screen.id, "S05");
  assert.match(packageDetails.messages.at(-1).text, /패키지 할인/);

  for (const [number, screen, message] of [
    ["CT-250601-005", "transferPrepaid", /선납 할인/],
    ["CT-250601-006", "transferCrossPackage", /크로스 패키지/],
  ]) {
    const chat = lookup();
    chooseAvailable(chat, "계약번호로 확인");
    const result = chooseAvailable(chat, "계약 확인", { 계약번호: number });
    assert.equal(result.screen.id, screen);
    assert.match(result.messages.at(-1).text, message);
    assert.ok(result.actions.some(({ label }) => label === "상담사 연결"));
    assert.ok(result.actions.every(({ label }) => label !== "명의변경 신청"));
  }
});

test("a sole proprietor can group giro notices by contract", () => {
  const chat = new SKIXChat(SKIX_SCENARIOS);
  assert.equal(chat.submit("개인사업자 지로 고지서 합치기").scenario?.no, 25);
  chat.choose("휴대폰 확인");
  const code = requestPhoneCode(chat, "010-0000-1234").verification.code;
  chat.choose("확인", { 인증번호: code });
  chat.choose("계약 확인");
  chat.choose("계약 확인", { "계약 또는 제품명": "직수 정수기" });
  chat.choose("한 장으로 받기");
  const selection = chat.choose("확인", {
    "첫 번째 계약": "직수 정수기",
    "두 번째 계약": "공기청정기",
    "대표 계약": "직수 정수기",
  });
  assert.deepEqual(Array.from(selection.actions, ({ label }) => label), ["우편", "이메일"]);
  const result = chat.choose("이메일");
  assert.equal(result.screen.id, "s6");
  const value = (title) => result.messages.at(-1).items.find((entry) => entry.title === title)?.detail;
  assert.equal(value("대표 계약"), "직수 정수기");
  assert.equal(value("통합 대상 계약"), "직수 정수기 · 공기청정기");
  assert.equal(value("요청한 고지서 수령 방법"), "이메일");
  assert.equal(value("처리 상태"), "담당자 확인 필요");
});

test("termination documents require a verified contract owner and every selected contract to match", () => {
  function authenticated(no) {
    const chat = begin(no);
    chooseAvailable(chat, "휴대폰 확인");
    verifyPhone(chat);
    if (no === 20) chooseAvailable(chat, "계약 선택하기");
    return chat;
  }
  function lookup(chat, no, selection) {
    return no === 20
      ? chooseAvailable(chat, "확인", { "조회할 계약": selection })
      : chooseAvailable(chat, "계약 확인", { "계약 또는 제품명": selection });
  }
  function cannotSend(state) {
    assert.ok(state.actions.every(({ label }) => !/알림톡|이메일|팩스|발송/.test(label)));
  }

  for (const [no, error] of [[20, "terminationContractUnknown"], [21, "returnContractUnknown"]]) {
    for (const [name, phone] of [["김매직", "010-0000-5678"], ["박매직", "010-0000-1234"]]) {
      const otherOwner = begin(no);
      chooseAvailable(otherOwner, "휴대폰 확인");
      chooseAvailable(otherOwner, "동의하고 계속");
      const challenge = chooseAvailable(otherOwner, "인증번호 받기", { 이름: name, "휴대폰 번호": phone });
      const state = chooseAvailable(otherOwner, "확인", { 인증번호: challenge.verification.code });
      assert.equal(state.screen.id, "s5");
      cannotSend(state);
    }

    const invalid = authenticated(no);
    const denied = lookup(invalid, no, "알수없는계약");
    assert.equal(denied.screen.id, error);
    cannotSend(denied);
    chooseAvailable(invalid, "계약 다시 입력");
    const partlyUnknown = lookup(invalid, no, "직수 정수기, 알수없는계약");
    assert.equal(partlyUnknown.screen.id, error);
    cannotSend(partlyUnknown);
    chooseAvailable(invalid, "계약 다시 입력");
    assert.equal(lookup(invalid, no, "CT-250601-001").screen.id, no === 20 ? "s3" : "s2");
  }

  const mixed = lookup(authenticated(20), 20, "직수 정수기, SK-261125-021");
  assert.equal(mixed.screen.id, "terminationMixedStatus");
  cannotSend(mixed);
  assert.equal(lookup(authenticated(20), 20, "SK-261125-020, SK-261125-021").screen.id, "terminationCombinedChannel");
  const beforeTermination = authenticated(20);
  assert.equal(lookup(beforeTermination, 20, "WPU-1000, 공기청정기").screen.id, "s3");
  assert.equal(chooseAvailable(beforeTermination, "해약 사유와 회수일 확인", {
    "해약 유형": "구독 해약", "해약 사유": "이용 종료", "희망 회수일": "2026-11-30",
  }).screen.id, "terminationInquiryCombinedChannel");
  assert.equal(lookup(authenticated(21), 21, "직수 정수기, ACL-1000").screen.id, "returnCombinedChannel");
  assert.equal(lookup(authenticated(21), 21, "직수 정수기, WPU-1000").screen.id, "s2");
  const unconfirmed = lookup(authenticated(21), 21, "직수 정수기, SK-261125-022");
  assert.equal(unconfirmed.screen.id, "s3");
  cannotSend(unconfirmed);
});

test("giro and payment grouping require known contracts and verified authority", () => {
  function authorize(no, phone = "010-0000-1234") {
    const chat = begin(no);
    chooseAvailable(chat, "휴대폰 확인");
    verifyPhone(chat, phone);
    return chat;
  }
  const giro = authorize(25);
  const unknownGiro = chooseAvailable(giro, "계약 확인", { "계약 또는 제품명": "알수없는계약" });
  assert.equal(unknownGiro.screen.id, "giroGroupUnconfirmed");
  assert.ok(unknownGiro.actions.some(({ label }) => label === "상담사 연결"));
  chooseAvailable(giro, "계약 다시 확인");
  chooseAvailable(giro, "계약 확인", { "계약 또는 제품명": "직수 정수기" });
  chooseAvailable(giro, "한 장으로 받기");
  assert.equal(chooseAvailable(giro, "확인", {
    "첫 번째 계약": "직수 정수기", "두 번째 계약": "미확인 계약", "대표 계약": "직수 정수기",
  }).screen.id, "giroGroupUnconfirmed");

  const merge = authorize(26);
  chooseAvailable(merge, "계약 선택하기");
  const unknownMerge = chooseAvailable(merge, "확인", {
    "첫 번째 계약": "No-such-contract", "두 번째 계약": "Unknown-contract", "대표 계약": "No-such-contract",
  });
  assert.equal(unknownMerge.screen.id, "mergeUnknownContracts");
  assert.ok(unknownMerge.actions.every(({ label }) => !/증빙|통합 요청/.test(label)));
  chooseAvailable(merge, "계약 다시 선택");
  assert.equal(chooseAvailable(merge, "확인", {
    "첫 번째 계약": "직수 정수기", "두 번째 계약": "공기청정기", "대표 계약": "직수 정수기",
  }).screen.id, "s5");
  const grouped = chooseAvailable(merge, "증빙 정보도 변경");
  assert.equal(grouped.messages.at(-1).items.find(({ title }) => title === "통합 대상 계약")?.detail, "직수 정수기 · 공기청정기");

  const split = authorize(27);
  chooseAvailable(split, "계약 확인", { "계약 또는 제품명": "직수 정수기" });
  chooseAvailable(split, "모든 계약을 나누기");
  const separated = chooseAvailable(split, "전체 분리 신청");
  assert.equal(separated.messages.at(-1).items.find(({ title }) => title === "대표 계약")?.detail, "직수 정수기");
  assert.equal(separated.messages.at(-1).items.find(({ title }) => title === "분리 범위")?.detail, "묶음 전체");
  assert.equal(authorize(26, "010-0000-5678").getState().screen.id, "mergeAuthorityReview");
  const misnamed = begin(26);
  chooseAvailable(misnamed, "휴대폰 확인");
  chooseAvailable(misnamed, "동의하고 계속");
  const code = chooseAvailable(misnamed, "인증번호 받기", { 이름: "이매직", "휴대폰 번호": "010-0000-1234" }).verification.code;
  assert.equal(chooseAvailable(misnamed, "확인", { 인증번호: code }).screen.id, "mergeAuthorityReview");
});

test("subscription consultation retains signup and replacement without corporate estimates", () => {
  const chat = begin(31);
  assert.deepEqual(Array.from(chat.getState().actions, ({ label }) => label), [
    "신규 가입", "기존 제품 교체", "신청한 가입 상품 재확인", "제품 관리 방법·멤버십", "제휴카드 혜택",
  ]);
  assert.equal(chat.choose("법인 견적").screen.id, "s1");
  chat.choose("신규 가입");
  const application = chat.choose("희망 제품 확인", { "제품명 또는 모델명": "직수 정수기" });
  assert.equal(application.screen.id, "applicationStatus");
  assert.equal(chat.choose("아직 상담을 신청하지 않았어요").screen.id, "s5");

  const replacement = begin(31);
  chooseAvailable(replacement, "기존 제품 교체");
  chooseAvailable(replacement, "교체 제품 확인", { "제품명 또는 모델명": "직수 정수기" });
  assert.equal(chooseAvailable(replacement, "36~41개월 사용").screen.id, "replacementBranch");
});

test("contract-related membership and callback inquiries reject unmatched records", () => {
  const membership = begin(32);
  chooseAvailable(membership, "보유 제품 확인");
  assert.equal(chooseAvailable(membership, "제품 제조번호 확인", { "제품 제조번호": "SKIX-1234-0000" }).screen.id, "membershipNotFound");
  chooseAvailable(membership, "제조번호 다시 입력");
  assert.equal(chooseAvailable(membership, "제품 제조번호 확인", { "제품 제조번호": "SKIX-2019-0123" }).screen.id, "s4");

  const callback = begin(33);
  chooseAvailable(callback, "주문 심사·해피콜을 못 받았어요");
  assert.equal(chooseAvailable(callback, "연락한 담당자 확인", { "휴대폰 번호": "010-0000-1234", 이름: "다른사람" }).screen.id, "s4");
  chooseAvailable(callback, "다시 확인하기");
  assert.equal(chooseAvailable(callback, "연락한 담당자 확인", { "휴대폰 번호": "010-0000-1234", 이름: "김매직" }).screen.id, "s5");
});

test("service cost guidance separates subscription and single-purchase warranty conditions", () => {
  const route = (selection) => {
    const chat = begin(35);
    chooseAvailable(chat, "AS 점검");
    chooseAvailable(chat, "제품 확인", { "제품명 또는 모델명": "직수 정수기" });
    return { chat, state: chooseAvailable(chat, selection) };
  };
  assert.equal(route("구독 이용 중").state.screen.id, "serviceActiveCoverage");
  assert.equal(route("구독 만료 또는 고객 과실").state.screen.id, "servicePaid");
  const warranty = route("일시불 구매").chat;
  assert.equal(chooseAvailable(warranty, "하자보수기간 내 AS").screen.id, "serviceWarranty");

  const move = begin(35);
  chooseAvailable(move, "이전설치");
  chooseAvailable(move, "제품 확인", { "제품명 또는 모델명": "직수 정수기" });
  const price = chooseAvailable(move, "구독 제품");
  assert.equal(price.messages.at(-1).items.find(({ title }) => title === "분리 기본비")?.detail, "28,000원");
  assert.equal(price.messages.at(-1).items.find(({ title }) => title === "재설치 기본비")?.detail, "38,000원");
  assert.equal(chooseAvailable(move, "조리수 밸브 비용 조건").messages.at(-1).items.at(0).detail, "43,000원");
});

test("a sole proprietor can still request a business registration document", () => {
  const denied = begin(37);
  denied.choose("사업자등록증");
  assert.equal(denied.choose("계약자 아님").screen.id, "s4");
  assert.equal(denied.getState().fields.length, 0);

  const chat = begin(37);
  const authority = chat.choose("사업자등록증");
  assert.deepEqual(Array.from(authority.actions, ({ label }) => label), ["계약자 본인", "계약자 아님"]);

  chat.choose("계약자 본인");
  assert.equal(approvePass(chat).screen.id, "s3");
  chat.choose("계약 확인", { "계약 또는 제품명": "직수 정수기" });
  chat.choose("한 번 받기");
  chat.choose("이메일");
  const result = chat.choose("발송 요청", { "이메일 주소": "solo@example.com" });
  assert.equal(result.screen.id, "s8");
  assert.match(result.messages.at(-1).text, /사업자등록증.*발송/);
  assert.equal(result.messages.at(-1).items.find(({ title }) => title === "수신 이메일")?.detail, "s••@example.com");
  assert.ok(result.messages.every(({ text }) => !text.includes("solo@example.com")));
});

test("installation cancellation verifies the selected order and keeps a dispatch handoff pending", () => {
  const chat = begin(38);
  chat.choose("주문 확인");
  const orders = chat.choose("주문 조회", { 이름: "김매직", "휴대폰 번호": "010-0000-1234", 주소: "서울 영등포구 문래동" });
  assert.equal(orders.screen.id, "orderSelect");

  const dispatched = chat.choose("비데 · 납품생성");
  assert.equal(dispatched.screen.id, "dispatchOrder");
  assert.match(dispatched.messages.at(-1).items.find(({ title }) => title === "주문번호")?.detail, /003$/);
  assert.equal(dispatched.messages.at(-1).items.find(({ title }) => title === "배송 상태")?.detail, "납품생성");
  chooseAvailable(chat, "다른 주문 선택");
  const shipped = chooseAvailable(chat, "식기세척기 · 출고");
  assert.equal(shipped.messages.at(-1).items.find(({ title }) => title === "배송 상태")?.detail, "출고");
  const confirmed = chooseAvailable(chat, "이 주문이 맞아요");
  assert.match(confirmed.messages.at(-1).items.find(({ title }) => title === "주문번호")?.detail, /004$/);
  const reason = chooseAvailable(chat, "설치 담당자 확인이 필요한 사유 입력");
  assert.equal(reason.messages.at(-1).items.find(({ title }) => title === "배송 상태")?.detail, "출고");
  assert.match(reason.messages.at(-1).items.find(({ title }) => title === "주문번호")?.detail, /004$/);
  const requested = chooseAvailable(chat, "취소 사유 확인", { "취소 사유": "일정 변경" });
  assert.equal(requested.screen.id, "orderHandoff");
  assert.ok(requested.actions.every(({ label }) => !label.includes("환불")));
  assert.doesNotMatch(requested.messages.at(-1).text, /취소 완료|처리됐어요/);
});

test("school-fee exemption and deposit carry-over follow the contract and customer agreement", () => {
  const chat = begin(39);
  chat.choose("이번 달 납부 결과");
  chat.choose("계약 확인", { "계약 또는 제품명": "SK-261125-043" });
  assert.equal(approvePass(chat).screen.id, "schoolWaiver");

  const deposit = begin(39);
  deposit.choose("이중 결제·가상계좌 입금");
  deposit.choose("계약 확인", { "계약 또는 제품명": "SK-261125-044" });
  approvePass(deposit);
  const carry = deposit.choose("가상계좌 입금 처리 확인");
  assert.equal(carry.screen.id, "depositCarry");
  assert.equal(deposit.choose("환불 문의").scenario.no, 47);
  const duplicate = begin(39);
  duplicate.choose("이중 결제·가상계좌 입금");
  chooseAvailable(duplicate, "계약 확인", { "계약 또는 제품명": "SK-261125-044" });
  approvePass(duplicate);
  duplicate.choose("가상계좌 입금 처리 확인");
  duplicate.choose("중복 입금 내역 확인");
  const selected = duplicate.choose("2026년 11월 중복 입금 선택");
  assert.ok(selected.messages.at(-1).items.some(({ title, detail }) => title === "중복 입금액" && detail === "29,900원"));
});

test("deposit usage period follows contract day and ordinary billing never implies a waiver", () => {
  const period = begin(39);
  chooseAvailable(period, "사용 기간");
  chooseAvailable(period, "계약 확인", { "계약 또는 제품명": "SK-261125-039" });
  const span = approvePass(period);
  assert.equal(span.screen.id, "paymentPeriod12");
  assert.match(span.messages.at(-1).items.find(({ title }) => title === "사용 기간")?.detail, /12일~.+11일/);
  const billing = begin(39);
  chooseAvailable(billing, "면제·청구 금액 확인");
  chooseAvailable(billing, "계약 확인", { "계약 또는 제품명": "직수 정수기" });
  assert.equal(approvePass(billing).screen.id, "s4");
  const closed = begin(39);
  chooseAvailable(closed, "이번 달 납부 결과");
  chooseAvailable(closed, "계약 확인", { "계약 또는 제품명": "SK-261125-042" });
  assert.ok(approvePass(closed).messages.at(-1).items.some(({ title, detail }) => title === "계약 종료일" && detail === "2026년 10월 31일"));
});

test("contract withdrawal distinguishes closed, unpaid, card and account routes", () => {
  const enter = (suffix) => {
    const chat = begin(40);
    chooseAvailable(chat, "해약 신청 확인");
    chooseAvailable(chat, "계약 확인", { "계약 또는 제품명": `SK-261125-${suffix}` });
    return { chat, state: approvePass(chat) };
  };
  assert.equal(enter("042").state.screen.id, "s4");
  assert.equal(enter("053").state.screen.id, "paymentPendingWithdrawal");
  assert.equal(enter("054").state.screen.id, "withdrawalAlreadyClosed");
  const card = enter("051").chat;
  const reason = chooseAvailable(card, "해약철회 진행");
  assert.deepEqual(Array.from(reason.fields, ({ label }) => label), ["해약취소 사유", "취소 상세내용"]);
  assert.equal(reason.messages.at(-1).items.find(({ title }) => title === "대상 계약")?.detail, "SK-••••-5051");
  assert.equal(reason.messages.at(-1).items.find(({ title }) => title === "해약 정산금 납부 방법")?.detail, "카드");
  const cardRequest = chooseAvailable(card, "철회와 카드 취소 요청", { "해약취소 사유": "계속 이용", "취소 상세내용": "기존 조건 유지" });
  assert.match(cardRequest.messages.at(-1).text, /3~5일/);
  assert.doesNotMatch(cardRequest.messages.at(-1).text, /결제를 취소했어요/);
  assert.equal(cardRequest.messages.at(-1).items.find(({ title }) => title === "철회 상세 내용")?.detail, "기존 조건 유지");
  const account = enter("052").chat;
  chooseAvailable(account, "해약철회 진행");
  const offered = chooseAvailable(account, "철회와 환불 조건 확인", { "해약취소 사유": "계속 이용" });
  assert.equal(offered.messages.at(-1).items.find(({ title }) => title === "납부 금액")?.detail, "87,500원");
  assert.doesNotMatch(JSON.stringify(offered.messages.at(-1)), /29,900원/);
  assert.equal(chooseAvailable(account, "환불 진행").screen.id, "withdrawalRefundPeriod");
  const refund = chooseAvailable(account, "2026년 11월 납부 건 선택");
  assert.ok(refund.messages.at(-1).items.some(({ title, detail }) => title === "확인된 납부 금액" && detail === "87,500원"));
  assert.equal(chooseAvailable(account, "환불 계좌 확인").screen.id, "refundOwnership");
  const accountForm = chooseAvailable(account, "계약자 본인 명의예요");
  assert.equal(accountForm.screen.id, "refundAccount");
  assert.equal(accountForm.messages.at(-1).items.find(({ title }) => title === "확인된 납부 금액")?.detail, "87,500원");
});

test("a typed appliance determines whether a cooking-water valve is offered", () => {
  for (const [product, expected] of [["식기세척기", "s7"], ["직수 정수기", "valveChoice"]]) {
    const chat = begin(44);
    chat.choose("재설치 방문");
    chat.choose("설치 환경 확인", { "제품명 또는 모델명": product, "설치 장소": "싱크대 옆" });
    chat.choose("계속하기");
    chat.choose("재설치 방문 접수");
    const state = chat.choose("재설치 방문 요청", {
      이름: "김매직", 주소: "서울 영등포구 문래동", "희망 날짜": "2026-12-03", "휴대폰 번호": "010-0000-1234",
    });
    assert.equal(state.screen.id, expected, product);
  }
});

test("prepayment documents check contract and payment status before offering a receipt", () => {
  for (const [contract, expected] of [["SK-261125-000", "s2"], ["SK-261125-059", "s6"], ["직수 정수기", "prepaidReceipt"]]) {
    const chat = begin(45);
    chat.choose("선납 견적서·영수증");
    chat.choose("선납 상태 확인", { "계약 또는 제품명": contract });
    const verified = approvePass(chat);
    const outcome = verified.screen.id === "prepaidDocuments" ? chat.choose("선납 영수증") : verified;
    assert.equal(outcome.screen.id, expected);
    if (expected === "prepaidReceipt") assert.ok(outcome.actions.some(({ label }) => label === "팩스"));
  }
});

test("regular document sending accepts only an offered monthly date", () => {
  const chat = begin(37);
  chat.choose("사업자등록증");
  chat.choose("계약자 본인");
  approvePass(chat);
  chat.choose("계약 확인", { "계약 또는 제품명": "직수 정수기" });
  chat.choose("매월 받기");
  const invalid = chat.choose("이 날짜로 계속", { "정기 발송일": "1일" });
  assert.equal(invalid.screen.id, "s6");
  assert.match(invalid.fields[0].error, /12일/);
  assert.equal(chat.choose("이 날짜로 계속", { "정기 발송일": "매월 말일" }).screen.id, "s7");
  chooseAvailable(chat, "이메일과 팩스");
  const result = chooseAvailable(chat, "발송 요청", { "이메일 주소": "test@example.com", "팩스 번호": "02-0000-1234" });
  const card = result.messages.at(-1);
  assert.equal(card.items.find(({ title }) => title === "정기 발송일")?.detail, "매월 말일");
  assert.equal(card.items.find(({ title }) => title === "수신 이메일")?.detail, "t••@example.com");
  assert.equal(card.items.find(({ title }) => title === "수신 팩스")?.detail, "••-••••-1234");
  assert.doesNotMatch(card.text, /발송했어요|처리했어요/);
});

test("cash-receipt shipment and retroactive issuance check approval and payment eligibility", () => {
  for (const [request, contract, expected] of [
    ["발행 여부 확인", "직수 정수기", "receiptApproved"],
    ["영수증 받기", "직수 정수기", "s5"],
    ["영수증 받기", "SK-261125-050", "receiptPendingApproval"],
    ["전월분 소급 발행", "SK-261125-049", "taxReceiptConflict"],
    ["전월분 소급 발행", "SK-261125-051", "s3"],
  ]) {
    const chat = begin(48);
    chat.choose(request);
    chat.choose("계약 확인", { "계약 또는 제품명": contract });
    assert.equal(approvePass(chat).screen.id, expected, request);
  }
});
