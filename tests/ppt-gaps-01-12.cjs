const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const sandbox = vm.createContext({ window: {} });
for (const name of ['scenarios', 'audit-01-17', 'audit-18-36', 'audit-37-50', 'engine']) {
  const file = path.join(__dirname, '..', 'src', name + '.js');
  vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
}
const { SKIXChat, SKIX_SCENARIOS } = sandbox.window;

function start(no) {
  const chat = new SKIXChat(SKIX_SCENARIOS);
  chat.start(no);
  return chat;
}

function choose(chat, label, values) {
  const { actions, screen } = chat.getState();
  const action = actions.find((item) => item.label === label);
  assert.ok(action, `${screen.id} is missing ${label}`);
  return chat.choose(action.id, values);
}

function pass(chat) {
  choose(chat, 'PASS 본인인증');
  return choose(chat, '본인인증 확인');
}

function verify(chat, phone = '010-0000-1234') {
  choose(chat, '동의하고 계속');
  const { verification } = choose(chat, '인증번호 받기', { 이름: '김매직', '휴대폰 번호': phone });
  return choose(chat, '확인', { 인증번호: verification.code });
}

function item(state, title) {
  return state.messages.at(-1).items.find((entry) => entry.title === title)?.detail;
}

test('billing distinguishes a verified zero-contract customer from the membership fixture', () => {
  const empty = start(8);
  choose(empty, '분리 접수');
  verify(empty, '010-0000-0000');
  for (const [no, screen] of [[1, 'S07'], [2, 'S05'], [3, 'changeNotFound'], [4, 'chargeNotFound'], [5, 'arrearsNotFound']]) {
    const state = empty.start(no);
    assert.equal(state.screen.id, screen);
    assert.match(state.messages.at(-1).text, /설치 전이나 설치 당일/);
  }
  const chat = start(2);
  pass(chat);
  const membership = choose(chat, '정수기 멤버십 선택');
  assert.equal(item(membership, '멤버십료'), '월 16,900원');
  assert.match(item(membership, '결제정보'), /••••/);
  assert.ok(!membership.actions.some(({ label }) => /미납금 납부/.test(label)));
});

test('third-party current tender is blocked and invoices skip the optional cash receipt', () => {
  const current = start(8);
  choose(current, '분리 접수');
  verify(current, '010-0000-0012');
  current.start(4);
  choose(current, '전기레인지 선택');
  const blocked = choose(current, '등록 결제수단');
  assert.equal(blocked.screen.id, 'S03');
  assert.ok(blocked.actions.some(({ label }) => label === '가상계좌'));
  assert.ok(!blocked.actions.some(({ label }) => label === 'PASS 본인인증'));
  current.goBack();
  choose(current, '일회성 납부수단');
  const charge = choose(current, '실시간 계좌이체');
  assert.equal(charge.screen.id, 'S05');
  assert.ok(!charge.actions.some(({ label }) => /현금영수증/.test(label)));

  const late = start(8);
  choose(late, '분리 접수');
  verify(late, '010-0000-0012');
  late.start(5);
  const arrears = choose(late, '식기세척기 선택');
  assert.equal(item(arrears, '미납 회차'), '1회');
  choose(late, '미납금 납부');
  choose(late, '일회성 납부수단');
  assert.equal(choose(late, '가상계좌').screen.id, 'S06');
});

test('shared billing contract lookup shows one to four contracts and hands off at five', () => {
  const paymentContracts = ['직수 정수기', '공기청정기', '비데', '매트리스'];
  const cases = [
    [1, 'S02', ['직수 정수기', '공기청정기']],
    [2, 'S02', ['직수 정수기', '공기청정기', '정수기 멤버십']],
    [3, 'changeContract', ['직수 정수기', '공기청정기', '정수기·공기청정기 묶음', '비데']],
    [4, 'chargeContract', paymentContracts], [5, 'arrearsContract', paymentContracts],
    [7, 'S02', ['직수 정수기']]
  ];
  const checkList = (state, screen, names) => {
    assert.equal(state.screen.id, screen);
    assert.deepEqual(Array.from(state.actions, ({ label }) => label), names.map((name) => `${name} 선택`));
    assert.deepEqual(Array.from(state.messages.at(-1).items, ({ title }) => title), names);
  };
  for (const [no, screen, names] of cases) {
    checkList(pass(start(no)), screen, names);
    for (const phone of ['010-0000-0013', '010-0000-0014']) {
      const chat = start(8);
      choose(chat, '분리 접수');
      verify(chat, phone);
      const state = chat.start(no);
      assert.equal(state.screen.id, 'paymentContractHandoff');
      assert.deepEqual(Array.from(state.actions, ({ label }) => label), ['상담사 연결']);
      assert.match(state.messages.at(-1).text, /상담사 연결을 통해 안내해드릴 수 있어요/);
      assert.equal(state.messages.at(-1).items.length, 0);
      assert.equal(choose(chat, '상담사 연결').screen.id, '$handoff');
    }
  }

  const penalty = start(7);
  pass(penalty);
  choose(penalty, '직수 정수기 선택');
  checkList(choose(penalty, '위약금 조회'), 'S04', ['직수 정수기', '비데', '공기청정기', '매트리스']);

  const single = start(8);
  choose(single, '분리 접수');
  verify(single, '010-0000-0012');
  checkList(single.start(4), 'chargeContract', ['전기레인지']);
  checkList(single.start(5), 'arrearsContract', ['식기세척기']);
  choose(single, '식기세척기 선택');
  const change = choose(single, '결제정보 변경');
  assert.equal(change.screen.id, 'dishwasherPaymentDetails');
  assert.match(item(change, '식기세척기'), /DWA-1000/);
  checkList(choose(single, '다른 계약 확인'), 'changeContract', ['식기세척기']);
  const unverifiedForMembership = single.start(2);
  assert.equal(unverifiedForMembership.screen.id, 'lookupRetryExhausted');
  assert.match(unverifiedForMembership.messages.at(-1).text, /본인 확인을 완료하지 못했어요/);
});

test('move workflows route outsourced products before a visit can be booked', () => {
  for (const no of [8, 9]) {
    const chat = start(no);
    choose(chat, no === 8 ? '분리 접수' : '재설치 접수');
    verify(chat);
    choose(chat, '다른 제품');
    const routed = choose(chat, '다음', { '제품명 또는 모델명': '삼성전자 냉장고 RC-1000' });
    assert.equal(routed.screen.id, '$externalServiceProvider');
    assert.equal(item(routed, '서비스 대행업체'), '삼성전자');
    assert.equal(choose(chat, '대행업체 연락처 안내').scenario.no, 41);
  }

  const paired = start(8);
  choose(paired, '분리·재설치 접수');
  choose(paired, '휴대폰 확인');
  verify(paired);
  choose(paired, '이사·이동 완료');
  const provider = choose(paired, '예약 가능일자 확인', {
    '제품명 또는 모델명': '필립스 커피머신', 주소: '서울 영등포구 문래동 100호',
    '서비스 당일 연락받으실 휴대폰 번호': '010-0000-2345'
  });
  assert.equal(item(provider, '서비스 대행업체'), '필립스');
});

test('move workflows disclose package addresses and the correct supported fee example', () => {
  const split = start(8);
  choose(split, '분리 접수');
  verify(split);
  choose(split, '직수 정수기 선택');
  choose(split, '이사·이동 완료');
  choose(split, '등록 주소 사용');
  const dates = choose(split, '예약 가능일자 확인', { '서비스 당일 연락받으실 휴대폰 번호': '010-0000-2345' });
  assert.match(item(dates, '구독 제품 예상 비용'), /28,000원/);
  assert.ok(item(dates, '멤버십·일시불 제품 비용'));
  assert.match(dates.messages.at(-1).text, /운반은 별도로/);

  const bundle = start(9);
  choose(bundle, '재설치 접수');
  verify(bundle);
  choose(bundle, '묶음 계약의 직수 정수기 선택');
  choose(bundle, '이사·이동 완료');
  const address = choose(bundle, '주소 입력');
  assert.match(item(address, '묶음 계약의 주소'), /패키지 상품 전체/);
});

test('transfer document lists and cancellation lookup match the same chat session', () => {
  const chat = start(10);
  choose(chat, '명의변경 신청방법 문의');
  const papers = choose(chat, '명의변경 신청 서류');
  assert.equal(item(papers, '개인 → 개인'), '명의변경 신청서');
  assert.equal(item(papers, '개인 → 개인사업자 · 대표자가 같은 경우'), '사업자등록증');
  assert.match(item(papers, '현재 계약자 사망'), /사망확인서/);
  assert.ok(papers.messages.at(-1).items.every(({ title }) => !/법인/.test(title)));

  chat.start(10);
  choose(chat, '신청 취소');
  pass(chat);
  choose(chat, '직수 정수기 명의변경 신청 선택');
  assert.equal(choose(chat, '취소 요청').screen.id, 'transferCancelled');
  chat.reset({ preserveIdentity: true });
  chat.start(10);
  const lookup = choose(chat, '신청 상태 조회');
  assert.match(item(lookup, '직수 정수기 명의변경 신청'), /취소 완료/);
  choose(chat, '접수번호로 조회');
  const canceled = choose(chat, '접수 확인', { '명의변경 접수번호': 'NC-261125-001' });
  assert.equal(item(canceled, '진행 상태'), '취소 완료');
  chat.start(10);
  assert.equal(choose(chat, '신청 취소').screen.id, 'transferCancelEmpty');
  chat.reset();
  chat.start(10);
  choose(chat, '신청 상태 조회');
  assert.match(item(pass(chat), '직수 정수기 명의변경 신청'), /신청 접수/);
});

test('transfer resumes the same contract only after the required charges are paid', () => {
  const chat = start(10);
  choose(chat, '명의변경 신청');
  pass(chat);
  choose(chat, '공기청정기 선택');
  assert.equal(choose(chat, '당월 요금 납부').screen.id, 'paymentScope');
  for (const label of ['미납요금만 납부', '등록 결제수단', 'KB국민은행 선택', 'PASS 전자서명', '전자서명 확인']) choose(chat, label);
  const remaining = choose(chat, '명의변경 계속');
  assert.equal(remaining.screen.id, 'S04');
  assert.equal(item(remaining, '미납금(당월 미포함)'), '0원');
  assert.ok(!remaining.actions.some(({ label }) => label === '명의변경 신청'));
  assert.equal(choose(chat, '당월 요금 납부').screen.id, 'transferCurrentCharge');
  for (const label of ['등록 결제수단', 'KB국민은행 선택', 'PASS 전자서명', '전자서명 확인']) choose(chat, label);
  const resumed = choose(chat, '명의변경 계속');
  assert.equal(resumed.screen.id, 'transferAirPaid');
  assert.match(item(resumed, '명의변경 대상'), /ACL-1000/);
  assert.equal(choose(chat, '명의변경 신청').screen.id, 'S06');
});

test('fault and direct AS use provider, model and applicable in-chat help', () => {
  for (const no of [11, 12]) {
    const external = start(no);
    choose(external, '목록에 없는 제품');
    const routed = choose(external, '제품 확인', { '제품명 또는 모델명': '냉장고' });
    assert.equal(item(routed, '서비스 대행업체'), '삼성전자');

    const oven = start(no);
    choose(oven, '목록에 없는 제품');
    const allowed = choose(oven, '제품 확인', { '제품명 또는 모델명': '전기오븐레인지 EONB450' });
    assert.equal(allowed.selection.kind, 'service-symptom');

    const help = start(no);
    for (const label of ['정수기 선택', '물·급수', '출수', '물이 나오지 않아요']) choose(help, label);
    choose(help, '자가조치 보기');
    const next = choose(help, '문제가 계속돼요');
    assert.equal(next.screen.id, no === 11 ? 'S06' : '$nativeSmsConsent');
  }

  const signedIn = start(2);
  pass(signedIn);
  const products = signedIn.start(11);
  assert.equal(products.selection.title, '나의 보유제품');
  assert.ok(products.actions.some(({ card }) => card?.detail === 'BID-1000'));
});
