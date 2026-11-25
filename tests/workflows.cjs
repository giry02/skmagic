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

test("first-phase counselor routing follows Seoul hours and uses a local callback preview", () => {
  const OriginalDate = vm.runInContext("Date", sandbox);
  let now = "2026-11-23T00:00:00.000Z";
  sandbox.Date = class extends OriginalDate {
    constructor(...args) {
      super(...(args.length ? args : [now]));
    }
  };
  try {
    const open = begin(6).submit("상담사 연결");
    assert.ok(open.actions.some(({ label }) => label === "채팅 상담 연결 요청"));
    now = "2026-11-23T09:00:00.000Z";
    const chat = begin(6);
    const closed = chat.submit("상담사 연결");
    assert.ok(closed.actions.some(({ label }) => label === "상담사 전화 예약"));
    const callback = chat.choose("상담사 전화 예약");
    assert.equal(callback.fields[0].label, "휴대폰 번호");
    const result = chat.choose("전화 예약 요청", { "휴대폰 번호": "010-0000-1234" });
    assert.match(result.messages.at(-1).text, /운영 환경/);
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
  change.choose("은행 계좌");
  const signature = change.choose("PASS 전자서명", { 은행: "KB국민은행", 계좌번호: "000000001234", 생년월일: "900101" });
  assert.equal(signature.screen.id, "$auth");
  assert.ok(signature.actions.some(({ label }) => label === "전자서명 확인"));

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
    const chat = begin(no);
    approvePass(chat);
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
    return chat.choose(date.id).selectedDate;
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
    assert.equal(split.actions.find(({ label }) => label === "다음")?.disabled, true);
    const splitDate = pickDate(chat);
    chooseAvailable(chat, "다음");

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
  chat.choose(candidate.id);
  const booking = chat.choose("접수 요청");
  assert.equal(booking.screen.id, "S06");
  const details = booking.messages.at(-1).items;
  assert.match(details.find(({ title }) => title === "접수 제품")?.detail, /직수 정수기/);
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
  assert.equal(detail.messages.at(-1).text, "고객님, 제품 배송 정보 안내드립니다.");
  assert.deepEqual(Array.from(detail.actions, ({ label }) => label), ["계속하기"]);
  assert.equal(chooseAvailable(chat, "계속하기").screen.id, "S07");
});

test("delivery changes follow the original address, order update, and installer connectors", () => {
  const created = begin(17);
  verifyPhone(created, "010-0000-0006");
  chooseAvailable(created, "직수 정수기 주문 선택");
  chooseAvailable(created, "배송주소 수정");
  const updated = chooseAvailable(created, "확인", { "배송 주소": " 서울  종로구   청계천로 85 " });
  assert.equal(updated.screen.id, "S07");
  assert.deepEqual(Array.from(created.context.deliveryEvents), [
    "IF_AICC_R040", "IF_AICC_R037", "IF_AICC_P004", "IF_AICC_P021", "S07", "IF_AICC_P014",
  ]);
  assert.doesNotMatch(JSON.stringify(updated.messages), /IF_AICC_/);

  const dateChange = begin(17);
  verifyPhone(dateChange);
  chooseAvailable(dateChange, "직수 정수기 주문 선택");
  chooseAvailable(dateChange, "배송일정 수정");
  const dates = chooseAvailable(dateChange, "예약 가능일자 확인", { "희망 배송일": dateChange.getState().fields[0].sample });
  assert.equal(dates.actions.find(({ label }) => label === "확인")?.disabled, true);
  const date = dates.actions.find(({ label }) => /일\s*\([월화수목금토일]\) 선택$/u.test(label));
  assert.ok(date);
  const selected = chooseAvailable(dateChange, date.label);
  assert.match(selected.messages.at(-1).text, /확인 버튼/);
  assert.equal(chooseAvailable(dateChange, "확인").screen.id, "S07");

  const installer = begin(17);
  verifyPhone(installer);
  chooseAvailable(installer, "직수 정수기 주문 선택");
  chooseAvailable(installer, "설치마스터 전달 요청");
  const noted = chooseAvailable(installer, "확인", { "전달 요청 사항": "방문 전에 연락해 주세요" });
  assert.equal(noted.screen.id, "S08");
  assert.match(noted.messages.at(-1).text, /요청하신 사항은 설치 예정일 설치마스터가 확인할 수 있습니다\./);
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
  const pending = chat.choose("확인", {
    이름: "김매직",
    "휴대폰 번호": "010-0000-1234",
    사업자등록번호: "000-00-00000",
  });
  assert.equal(pending.screen.id, "transfereeConsent");
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
  const denied = begin(37);
  denied.choose("사업자등록증");
  assert.equal(denied.choose("계약자 아님").screen.id, "s4");
  assert.equal(denied.getState().fields.length, 0);

  const chat = begin(37);
  const authority = chat.choose("사업자등록증");
  assert.deepEqual(Array.from(authority.actions, ({ label }) => label), ["계약자 본인", "계약자 아님"]);

  chat.choose("계약자 본인");
  chat.choose("계약 확인", { "계약 또는 제품명": "직수 정수기" });
  chat.choose("한 번 받기");
  chat.choose("이메일");
  const result = chat.choose("발송 요청", { "이메일 주소": "solo@example.com" });
  assert.equal(result.screen.id, "s8");
  assert.match(result.messages.at(-1).text, /사업자등록증.*발송/);
  assert.ok(result.messages.every(({ text }) => !text.includes("solo@example.com")));
});

test("installation cancellation verifies the selected order and keeps a dispatch handoff pending", () => {
  const chat = begin(38);
  chat.choose("주문 확인");
  const orders = chat.choose("주문 조회", { 이름: "김매직", "휴대폰 번호": "010-0000-1234", 주소: "서울 영등포구 문래동" });
  assert.equal(orders.screen.id, "orderSelect");

  const dispatched = chat.choose("비데 · 출고 준비");
  assert.equal(dispatched.screen.id, "dispatchOrder");
  assert.match(dispatched.messages.at(-1).items.find(({ title }) => title === "주문번호")?.detail, /003$/);
  chat.choose("이 주문이 맞아요");
  chat.choose("담당자에게 취소 요청");
  const requested = chat.choose("취소 요청 전달", { "취소 사유": "일정 변경" });
  assert.equal(requested.screen.id, "orderHandoff");
  assert.ok(requested.actions.every(({ label }) => !label.includes("환불")));
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
});

test("a typed appliance determines whether a cooking-water valve is offered", () => {
  for (const [product, expected] of [["식기세척기", "s7"], ["직수 정수기", "valveChoice"]]) {
    const chat = begin(44);
    chat.choose("재설치 방문");
    chat.choose("설치 환경 확인", { "제품명 또는 모델명": product, "설치 장소": "싱크대 옆" });
    chat.choose("계속하기");
    chat.choose("재설치 방문 접수");
    const state = chat.choose("재설치 방문 정보 확인", {
      주소: "서울 영등포구 문래동", "희망 날짜": "2026-12-03", "휴대폰 번호": "010-0000-1234",
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
  chat.choose("계약 확인", { "계약 또는 제품명": "직수 정수기" });
  chat.choose("매월 받기");
  const invalid = chat.choose("이 날짜로 계속", { "정기 발송일": "1일" });
  assert.equal(invalid.screen.id, "s6");
  assert.match(invalid.fields[0].error, /12일/);
  assert.equal(chat.choose("이 날짜로 계속", { "정기 발송일": "매월 말일" }).screen.id, "s7");
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
