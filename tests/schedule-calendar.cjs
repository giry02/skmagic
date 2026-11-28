const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = path.join(__dirname, "..", "src");
const runtime = vm.createContext({ window: {} });
for (const file of ["scenarios.js", "audit-01-17.js", "audit-18-36.js", "audit-37-50.js", "engine.js"]) {
  vm.runInContext(fs.readFileSync(path.join(source, file), "utf8"), runtime, { filename: file });
}
const { SKIXChat, SKIX_SCENARIOS } = runtime.window;

function schedule(no, screen) {
  const chat = new SKIXChat(SKIX_SCENARIOS);
  chat.start(no);
  chat.showDemoScreen(screen);
  return chat;
}

test("the calendar accepts only offered dates and leaves the booking request to the customer", () => {
  const chat = schedule(12, "S05");
  const before = chat.getState();
  const { dates, moreActionId, requestId } = before.scheduleCalendar;
  assert.equal(before.actions.find(({ id }) => id === moreActionId).label, "더보기");
  assert.equal(before.actions.find(({ id }) => id === requestId).label, "접수 요청");
  assert.ok(dates.length > 4);
  assert.ok(dates.every((date) => date > before.scheduleCalendar.today));
  assert.equal(chat.chooseCalendarDate("2000-01-01").messages.length, before.messages.length);
  const selected = chat.chooseCalendarDate(dates[4]);
  assert.equal(selected.screen.id, "S05");
  assert.equal(selected.scheduleCalendar.selected, dates[4]);
  assert.match(selected.messages.at(-1).text, /‘접수 요청’을 눌러/);
  assert.equal(chat.choose("접수 요청").screen.id, "S06");
});

test("the first split date continues automatically to the reinstallation address", () => {
  const chat = schedule(8, "pairSplitSchedule");
  const calendar = chat.getState().scheduleCalendar;
  assert.equal(calendar.requestId, undefined);
  const selected = chat.chooseCalendarDate(calendar.dates[0]);
  assert.equal(selected.screen.id, "pairInstallAddress");
  assert.equal(selected.scheduleCalendar, null);
});

test("pickup and recurring delivery use different date controls", () => {
  const pickup = schedule(36, "s6").getState();
  assert.equal(pickup.scheduleCalendar.dates.length, 2);
  assert.equal(pickup.scheduleCalendar.moreActionId, undefined);
  assert.equal(pickup.actions.find(({ id }) => id === pickup.scheduleCalendar.requestId).label, "이 날짜로 요청");
  assert.equal(schedule(19, "billMonthly").getState().scheduleCalendar, null);
});
