const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const context = vm.createContext({ window: {} });
for (const file of ['scenarios.js', 'audit-01-17.js', 'audit-18-36.js', 'audit-37-50.js', 'engine.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8'), context, { filename: file });
}
const { SKIXChat, SKIX_SCENARIOS } = context.window;
const sampleAddress = '서울 영등포구 문래동';
const knownContract = { '계약 또는 제품명': '직수 정수기', 주소: sampleAddress };

function begin(no) {
  const chat = new SKIXChat(SKIX_SCENARIOS);
  chat.start(no);
  return chat;
}

function choose(chat, label, values) {
  const state = chat.getState();
  const action = state.actions.find((item) => item.label === label);
  assert.ok(action, `${state.scenario?.no}:${state.screen?.id}에서 ${label} 선택 가능`);
  return chat.choose(action.id, values);
}

function verify(chat, phone = '010-0000-1234', name = '김매직') {
  choose(chat, '휴대폰 확인');
  choose(chat, '동의하고 계속');
  const { verification } = choose(chat, '인증번호 받기', { 이름: name, '휴대폰 번호': phone });
  return choose(chat, '확인', { 인증번호: verification.code });
}

function stateItems(state) {
  return Object.fromEntries(state.messages.at(-1).items.map(({ title, detail }) => [title, detail]));
}

test('26 confirms each contract in a longer group and asks for the scope of breaking an existing bundle', () => {
  const chat = begin(26);
  verify(chat);
  choose(chat, '3건 이상 통합하기');
  const repeated = choose(chat, '계약 확인', { '통합할 계약': '직수 정수기, 공기청정기, 공기청정기', '대표 계약': '직수 정수기' });
  assert.ok(repeated.fields.some(({ error }) => error));
  const invalidRepresentative = choose(chat, '계약 확인', { '통합할 계약': '직수 정수기, 공기청정기, 비데', '대표 계약': '전기레인지' });
  assert.ok(invalidRepresentative.fields.find(({ label }) => label === '대표 계약').error);
  const grouped = choose(chat, '계약 확인', { '통합할 계약': '공기청정기，비데，직수 정수기', '대표 계약': '직수 정수기' });
  assert.equal(grouped.screen.id, 's5');
  const completed = choose(chat, '증빙 정보도 변경');
  assert.equal(stateItems(completed)['통합 대상 계약'], '공기청정기 · 비데 · 직수 정수기');

  const existing = begin(26);
  verify(existing);
  choose(existing, '계약 선택하기');
  choose(existing, '확인', { '첫 번째 계약': '직수 정수기', '두 번째 계약': 'SK-261125-029', '대표 계약': '직수 정수기' });
  const scope = choose(existing, '기존 묶음 해제 범위 확인');
  assert.match(stateItems(scope)['새 묶음 대상'], /직수 정수기.*029/);
  assert.equal(choose(existing, '기존 묶음을 풀고 통합하기').screen.id, 's5');
});

test('27, 28, 29, 30 and 36 deny verified but unlinked identities and keep recognized owner routes', () => {
  const cases = [
    { no: 27, entrances: [], fallback: 'splitAuthorityReview', known: 'splitLookup' },
    { no: 28, entrances: [], fallback: 's3', known: 's1' },
    { no: 29, entrances: ['제 필터 배송'], fallback: 's8', known: 'filterLookup' },
    { no: 30, entrances: ['관계 확인', '계약자 본인'], fallback: 's7', known: 'careLookup' },
    { no: 36, entrances: ['제품 회수'], fallback: 'returnNotFound', known: 's2' },
  ];
  for (const { no, entrances, fallback, known } of cases) {
    for (const [phone, name, expected] of [
      ['010-0000-9876', '이조회불명', fallback], ['010-0000-1234', '동명이인', fallback],
      ['010-0000-1234', '김매직', known],
    ]) {
      const chat = begin(no);
      entrances.forEach((label) => choose(chat, label));
      assert.equal(verify(chat, phone, name).screen.id, expected, `${no} ${expected}`);
    }
  }
});

test('28 links the chosen invoice month to the newly entered masked email', () => {
  const chat = begin(28);
  verify(chat);
  choose(chat, '계산서 수신 이메일');
  choose(chat, '수신 이메일 변경', { '이메일 주소': 'recipient@example.com' });
  choose(chat, '이미 발행한 계산서도 받기');
  assert.ok(choose(chat, '재발송 대상 확인', { '발행 월': '2024-13' }).fields[0].error);
  const requested = choose(chat, '재발송 대상 확인', { '발행 월': '2024-11' });
  assert.equal(stateItems(requested)['확인할 발행 월'], '2024-11');
  assert.equal(stateItems(requested)['세금계산서 수신 이메일'], 'r••@example.com');
  assert.doesNotMatch(JSON.stringify(requested.messages), /recipient@example\.com/);
});

test('28 displays masked current information only after identity matches and refreshes confirmed edits', () => {
  const unknown = verify(begin(28), '010-0000-9831');
  assert.equal(unknown.screen.id, 's3');
  assert.doesNotMatch(JSON.stringify(unknown.messages), /등록된 고객정보|m••@example\.com/);

  const chat = begin(28);
  assert.doesNotMatch(JSON.stringify(chat.getState().messages), /등록된 고객정보|m••@example\.com/);
  const profile = verify(chat);
  assert.equal(profile.messages.at(-1).recordGroups[0].title, '등록된 고객정보');
  assert.equal(Object.keys(stateItems(profile)).length, 8);
  assert.equal(stateItems(profile)['계약자 주소'], '서울 동작구 •••');
  assert.equal(stateItems(profile)['제품 사용 주소'], '서울 영등포구 •••');

  const email = choose(chat, '계산서 수신 이메일');
  assert.equal(email.messages.at(-1).recordGroups[0].title, '현재 등록 정보');
  assert.equal(stateItems(email)['세금계산서 수신 이메일'], 'm••@example.com');
  const saved = choose(chat, '수신 이메일 변경', { '이메일 주소': 'recipient@example.com' });
  const [before, after] = saved.messages.at(-1).recordGroups;
  assert.equal(before.title, '변경 전');
  assert.equal(before.items[0].detail, 'm••@example.com');
  assert.equal(after.title, '변경 후');
  assert.equal(after.items[0].detail, 'r••@example.com');
  assert.doesNotMatch(JSON.stringify(saved.messages), /recipient@example\.com/);
  assert.equal(stateItems(choose(chat, '다른 항목 변경'))['세금계산서 수신 이메일'], 'r••@example.com');
  chat.reset({ preserveIdentity: true });
  assert.equal(stateItems(chat.start(28))['세금계산서 수신 이메일'], 'r••@example.com');

  chat.reset();
  assert.doesNotMatch(JSON.stringify(chat.start(28).messages), /등록된 고객정보/);
  assert.equal(stateItems(verify(chat))['세금계산서 수신 이메일'], 'm••@example.com');
});

test('28 leaves the saved phone unchanged until the new number PASS succeeds', () => {
  const chat = begin(28);
  verify(chat);
  assert.equal(stateItems(choose(chat, '계약자 휴대폰'))['계약자 휴대폰 번호'], '010-••••-1234');
  const newPhone = { '휴대폰 번호': '010-0000-9876' };
  assert.equal(choose(chat, 'PASS 본인인증', newPhone).screen.id, '$auth');
  assert.equal(choose(chat, '취소').screen.id, 's2');
  assert.equal(stateItems(choose(chat, '뒤로'))['계약자 휴대폰 번호'], '010-••••-1234');
  choose(chat, '계약자 휴대폰');
  assert.equal(choose(chat, 'PASS 본인인증', newPhone).screen.id, '$auth');
  const saved = choose(chat, '본인인증 확인');
  assert.equal(stateItems(saved)['계약자 휴대폰 번호'], '010-••••-9876');
  assert.doesNotMatch(JSON.stringify(saved.messages), /010-0000-9876/);
  assert.equal(stateItems(choose(chat, '다른 항목 변경'))['계약자 휴대폰 번호'], '010-••••-9876');
});

test('29 matches both the contract and service address and distinguishes filter delivery needs', () => {
  const prepare = () => {
    const chat = begin(29);
    choose(chat, '제 필터 배송');
    verify(chat);
    return chat;
  };
  assert.equal(choose(prepare(), '배송 조회', { ...knownContract, '계약 또는 제품명': '모르는 계약' }).screen.id, 's8');
  assert.equal(choose(prepare(), '배송 조회', { ...knownContract, 주소: '서울 구로구 신도림동' }).screen.id, 's8');
  const chat = prepare();
  choose(chat, '배송 조회', knownContract);
  const selfCare = choose(chat, '자가교체 대상 확인');
  assert.equal(stateItems(selfCare)['필터 관리 방식'], '자가교체 · 택배 발송');
  const upcoming = prepare();
  choose(upcoming, '배송 조회', { ...knownContract, '계약 또는 제품명': 'SK-261125-029' });
  assert.equal(choose(upcoming, '배송 예정인데 아직 안 왔어요').screen.id, 'filterUpcoming');
  const thirdParty = begin(29);
  choose(thirdParty, '다른 분의 택배를 받았어요');
  assert.equal(choose(thirdParty, '회수 요청 확인', { 주소: '서울 구로구 신도림동', '휴대폰 번호': '010-0000-1234' }).screen.id, 'filterRecoveryUnconfirmed');
});

test('30 distinguishes care requests and 36 shows the matched return rather than a fulfilled request', () => {
  const care = begin(30);
  choose(care, '관계 확인');
  choose(care, '제품 사용자');
  verify(care);
  choose(care, '계약 확인', knownContract);
  choose(care, '다른 관리 요청');
  choose(care, '방문 중지·특별관리 안내');
  const delegated = choose(care, '요청 내용 확인', { '요청 내용': '방문 중지 이유 문의' });
  assert.equal(stateItems(delegated)['요청 항목'], '방문 중지·특별관리 확인');
  assert.equal(stateItems(delegated)['처리 상태'], '관할 지국 확인 필요');

  const recovery = begin(36);
  choose(recovery, '제품 회수');
  verify(recovery);
  choose(recovery, '회수 계약 조회', knownContract);
  choose(recovery, '계속하기');
  choose(recovery, '방문 담당자에게 전달');
  const confirmed = choose(recovery, '요청 내용 확인', { '요청 내용': '오후에 연락해 주세요' });
  assert.equal(stateItems(confirmed)['대상 계약'], '직수 정수기');
  assert.equal(stateItems(confirmed)['처리 상태'], '방문 담당자 확인 필요');
});

test('31 matches an authenticated application and displays only the modeled application state', () => {
  const chat = begin(31);
  choose(chat, '신청한 가입 상품 재확인');
  choose(chat, 'PASS 본인인증');
  choose(chat, '본인인증 확인');
  const invalid = choose(chat, '가입 신청 조회', { '가입 신청번호 또는 제품명': 'APP-999999-999' });
  assert.equal(invalid.screen.id, 'subscriptionReviewNotFound');
  choose(chat, '신청 정보 다시 입력');
  const found = choose(chat, '가입 신청 조회', { '가입 신청번호 또는 제품명': 'APP-261125-001' });
  assert.equal(stateItems(found)['신청 제품'], '직수 정수기 · WPU-1000');
  assert.equal(stateItems(found)['신청 상태'], '가입 상담 접수');
  assert.equal(stateItems(found)['가입 신청번호'], 'APP-••••-001');
});

test('31 verifies the current product independently of a self-reported replacement period', () => {
  const chat = begin(31);
  choose(chat, '기존 제품 교체');
  choose(chat, '교체 제품 확인', { '제품명 또는 모델명': '직수 정수기' });
  choose(chat, '36~41개월 사용');
  choose(chat, '보유 제품으로 확인');
  verify(chat);
  const obsolete = choose(chat, '보유 제품 확인', { ...knownContract, 주소: '서울 구로구 신도림동' });
  assert.equal(obsolete.screen.id, 'replacementUnverified');
  assert.equal(choose(chat, '보유 제품 다시 확인').screen.id, 'replacementContract');
  const matched = choose(chat, '보유 제품 확인', knownContract);
  assert.equal(stateItems(matched)['등록 제품'], '직수 정수기 · WPU-1000');
});

test('32 identifies two printed serial layouts without confirming an unknown membership', () => {
  for (const [serial, codes] of [['A'.repeat(14) + '61212345', ['6', '12']], ['A'.repeat(15) + '26B12345', ['26', 'B']]]) {
    const chat = begin(32);
    choose(chat, '보유 제품 확인');
    assert.equal(choose(chat, '제조번호 확인 위치').screen.id, 'membershipSerialGuide');
    choose(chat, '제조번호 입력');
    const result = choose(chat, '제품 제조번호 확인', { '제품 제조번호': serial });
    assert.equal(result.screen.id, 'membershipPrintedSerial');
    assert.deepEqual(stateItems(result), { '생산연도 코드': codes[0], '생산월 코드': codes[1] });
    assert.doesNotMatch(JSON.stringify(result.messages), new RegExp(serial));
  }
});

test('34 disambiguates shared phone records with both name and address before showing one visit', () => {
  const prepare = () => {
    const chat = begin(34);
    assert.equal(verify(chat, '010-0000-0002').screen.id, 'visitMultipleCustomers');
    choose(chat, '성함과 주소로 다시 확인');
    return chat;
  };
  const wrong = choose(prepare(), '접수 확인', { 이름: '다른사람', 주소: sampleAddress });
  assert.equal(wrong.screen.id, 'visitUnverified');
  const match = choose(prepare(), '접수 확인', { 이름: '김매직', 주소: sampleAddress });
  assert.equal(match.screen.id, 's4');
  assert.ok(stateItems(match)['접수번호']);
});

test('33 keeps completed and anticipated contact distinct while masking the contact', () => {
  for (const [phone, label] of [['010-0000-1234', '최근 상담 통화'], ['010-0000-0003', '예정된 연락 있음']]) {
    const chat = begin(33);
    choose(chat, '구독 가입 상담 후 연락을 기다리고 있어요');
    const result = choose(chat, '연락한 담당자 확인', { '휴대폰 번호': phone, 이름: '김매직' });
    assert.equal(stateItems(result)['확인된 연락'], label);
    assert.doesNotMatch(JSON.stringify(result.messages), new RegExp(phone));
  }
});

test('35 gates registered product lookup and labels only verified reference-table amounts', () => {
  const link = begin(35);
  choose(link, '등록 제품 비용 확인');
  assert.equal(verify(link, '010-0000-9999').screen.id, 'serviceOwnedUnverified');

  const registered = begin(35);
  choose(registered, '등록 제품 비용 확인');
  verify(registered);
  const product = choose(registered, '등록 제품 확인', { '제품명 또는 모델명': 'WPU-1000', 주소: sampleAddress });
  assert.equal(stateItems(product)['확인한 제품'], '직수 정수기 · WPU-1000');
  assert.ok(!Object.keys(stateItems(choose(registered, '필터 교체'))).length);

  const sharedPhone = begin(35);
  choose(sharedPhone, '등록 제품 비용 확인');
  assert.equal(verify(sharedPhone, '010-0000-0002').screen.id, 'serviceOwnedMultiple');
  const resolved = choose(sharedPhone, '등록 제품 확인', { 이름: '김매직', '제품명 또는 모델명': 'WPU-1000', 주소: sampleAddress });
  assert.equal(resolved.screen.id, 'serviceOwnedKind');

  for (const [name, remove, install] of [['업소용 정수기', '38,000원', '48,000원'], ['조리수 밸브', '22,000원', '40,000원']]) {
    const costs = begin(35);
    choose(costs, '이전설치');
    choose(costs, '제품 확인', { '제품명 또는 모델명': name });
    const state = choose(costs, '구독 제품');
    assert.deepEqual(stateItems(state), { '분리 기본비 예시': remove, '재설치 기본비 예시': install });
    assert.match(state.messages.at(-1).text, /참고 금액/);
  }
});
