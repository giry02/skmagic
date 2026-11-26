(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);
  const app = byId("app");
  const chatScroll = byId("chat-scroll");
  const log = byId("chat-log");
  const controls = byId("chat-controls");
  const status = byId("chat-status");
  const form = byId("message-form");
  const input = byId("message-input");
  const secureInput = byId("secure-input");
  const inputLabel = byId("compose-input-label");
  const sendButton = byId("send-chat");
  const engine = new window.SKIXChat(window.SKIX_SCENARIOS);
  const scenarios = new Map(window.SKIX_SCENARIOS.map((scenario) => [scenario.no, scenario]));
  const partnerCards = new Map((window.SKIX_PARTNER_CARDS ?? []).map((card) => [card.id, card]));
  const partnerBenefitsUrl = "https://www.skmagic.com/event/skmagic-card-benefits";
  const cardDetails = new Set([...partnerCards.values()].map((card) => card.href));
  cardDetails.add(partnerBenefitsUrl);
  cardDetails.add("https://www.skmagic.com/event/cardbenefit");
  const localFile = location.protocol === "file:";
  const localServer = "http://127.0.0.1:4328/";
  const timeoutMs = 100_000;
  const modeLabel = byId("mode-label");
  const composeNote = byId("compose-note");
  const catalog = byId("catalog");
  const catalogList = byId("catalog-list");
  const catalogSearch = byId("catalog-search");
  const catalogToggle = byId("catalog-toggle");
  const catalogClose = byId("catalog-close");
  const catalogAll = byId("catalog-all");
  const catalogBackdrop = byId("catalog-backdrop");
  const chatPanel = byId("chat-panel");
  const mobileCatalog = matchMedia("(max-width: 840px)");
  const catalogPhases = [
    { id: 1, label: "1차", phase: "1차" },
    { id: 2, label: "2차", phase: "2차" },
    { id: 3, label: "3차", phase: "3차" },
    { id: 4, label: "4차", phase: "별도 검토", note: "별도 검토" },
  ];
  const recordPickers = new Map([
    [["1:S02", "2:S02", "3:changeContract", "4:chargeContract", "5:arrearsContract", "7:S02", "7:S04", "10:S03"], ["contract", "계약 선택"]],
    [["13:S02", "14:S01", "15:S02", "34:visitList"], ["appointment", "방문 접수 선택"]],
    [["16:S02", "17:S02", "38:orderSelect", "46:virtualRefundOrder", "46:cardRefundOrder"], ["order", "배송·설치 주문 선택"]],
  ].flatMap(([keys, picker]) => keys.map((key) => [key, picker])));
  const documentPickers = new Set([
    "19:s1", "19:billDocuments", "19:contractDocuments", "23:s2", "24:s1", "37:s1", "45:prepaidDocuments",
  ]);
  const schedulePickers = new Set(["8:S05", "9:S05", "12:S05", "14:S04", "17:S05", "36:s6"]);
  const dateChoice = /^(\d{1,2}월\s+\d{1,2}일)\s*\(([월화수목금토일])\)(?:\s+선택)?$/u;
  const monthlyChoice = /^매월 \d{1,2}일$/u;
  const deliveryChoice = /^(?:알림톡|이메일|팩스|이메일과 팩스|우편|문자로 받기|등록된 번호로 받기|이메일로 받기)$/u;
  const pickerIcons = {
    "service-symptom": "tool", product: "bag", contract: "folder", appointment: "tool", order: "truck",
    address: "truck", date: "calendar", channel: "chat", document: "file", term: "file", consent: "lock",
    payment: "wallet", reason: "file",
  };
  const openPhases = new Set();
  let drawerOpen = false;

  let demoMode = localFile;
  let liveRows = [];
  let apiHistory = [];
  let offer = null;
  let workflow = false;
  let lastScenario = null;
  let activeRequest = null;
  let pendingStatus = null;
  let failedRequest = null;
  let connection = { state: localFile ? "demo" : "checking", provider: "", model: "" };
  let renderedKeys = [];
  let inputProgress = null;
  let inputMessages = [];
  let revealedCode = null;

  function element(tag, className = "", text = "") {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function button(label, className = "text-button") {
    const node = element("button", className, label);
    node.type = "button";
    return node;
  }

  function icon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    svg.setAttribute("class", "icon");
    svg.setAttribute("aria-hidden", "true");
    use.setAttribute("href", "#i-" + name);
    svg.append(use);
    return svg;
  }

  function catalogItem(scenario) {
    const reviewOnly = scenario.screens[0]?.kind === "internal-only";
    const item = button(reviewOnly ? `${scenario.displayTitle} (운영 검토)` : scenario.displayTitle, "catalog-item");
    item.dataset.scenario = String(scenario.no);
    const number = String(scenario.no).padStart(2, "0");
    const details = `No.${number} · ${scenario.phase} · 상담코드 ${scenario.consultationCode}`;
    item.title = [details, scenario.firstPhaseScenario].filter(Boolean).join("\n");
    return item;
  }

  function syncCatalogSelection(flow) {
    for (const item of catalogList.querySelectorAll("[data-scenario]")) {
      if (Number(item.dataset.scenario) === flow?.scenario?.no) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
      item.disabled = Boolean(activeRequest);
    }
  }

  function renderCatalog(focusPhase) {
    const term = catalogSearch.value.trim();
    const matches = term ? engine.find(term) : [...scenarios.values()];
    const content = document.createDocumentFragment();
    if (term) {
      const text = matches.length ? `검색 결과 ${matches.length}개` : "해당 업무를 찾지 못했어요.";
      const count = element("p", "catalog-results", text);
      count.setAttribute("role", "status");
      content.append(count);
    }
    for (const { id, label, phase, note } of catalogPhases) {
      const phaseMatches = matches.filter((scenario) => scenario.phase === phase);
      if (term && !phaseMatches.length) continue;
      const expanded = Boolean(term) || openPhases.has(id);
      const groupId = `catalog-phase-${id}`;
      const heading = term ? element("h3", "catalog-group") : button("", "catalog-group");
      const mark = icon("folder");
      mark.classList.add("catalog-group-icon");
      heading.append(mark, element("span", "", label));
      if (note) heading.append(element("span", "catalog-phase-note", note));
      if (!term) {
        heading.dataset.phase = String(id);
        heading.setAttribute("aria-expanded", String(expanded));
        heading.setAttribute("aria-controls", groupId);
        const chevron = icon("chevron");
        chevron.classList.add("catalog-chevron");
        heading.append(chevron);
      }
      const items = element("div", "catalog-items");
      items.id = groupId;
      items.hidden = !expanded;
      if (expanded) for (const scenario of phaseMatches) items.append(catalogItem(scenario));
      content.append(heading, items);
    }
    catalogList.replaceChildren(content);
    catalogAll.textContent = !term && openPhases.size === catalogPhases.length ? "전체 접기" : "전체 펼치기";
    syncCatalogSelection(demoMode || workflow ? engine.getState() : null);
    if (focusPhase) {
      catalogList.querySelector(`[data-phase="${focusPhase}"]`)?.focus({ preventScroll: true });
    }
  }

  function setDrawer(open, restoreFocus = true) {
    const wasOpen = drawerOpen;
    drawerOpen = Boolean(mobileCatalog.matches && open);
    app.classList.toggle("catalog-open", drawerOpen);
    catalogToggle.setAttribute("aria-expanded", String(drawerOpen));
    catalogBackdrop.hidden = !drawerOpen;
    catalog.inert = mobileCatalog.matches && !drawerOpen;
    chatPanel.inert = drawerOpen;
    if (drawerOpen) {
      catalog.setAttribute("role", "dialog");
      catalog.setAttribute("aria-modal", "true");
      if (!wasOpen) catalogClose.focus();
    } else {
      catalog.removeAttribute("role");
      catalog.removeAttribute("aria-modal");
      if (wasOpen && restoreFocus && mobileCatalog.matches) catalogToggle.focus();
    }
  }

  function friendlyText(node, text) {
    for (const part of text.split(/(\*\*[^*\n]{1,180}\*\*)/g)) {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        node.append(element("strong", "", part.slice(2, -2)));
      } else {
        node.append(document.createTextNode(part));
      }
    }
  }

  function cardImage(mediaKey) {
    const product = partnerCards.get(mediaKey);
    if (!product?.image) return null;
    const img = element("img", "card-art");
    img.src = product.image;
    img.alt = "";
    img.decoding = "async";
    return img;
  }

  function renderResultCards(items, title) {
    const hasArtwork = items.some(({ mediaKey }) => Boolean(mediaKey));
    const group = element(title ? "section" : "div", hasArtwork ? "result-cards" : "result-cards result-records");
    if (title) {
      group.setAttribute("aria-label", title);
      group.append(element("h3", "result-record-title", title));
    }
    for (const item of items) {
      const card = element("article", "result-card");
      const art = cardImage(item.mediaKey);
      if (art) {
        card.classList.add("has-card-art");
        card.append(art);
      }
      if (item.title) card.append(element(title ? "h4" : "h3", "", item.title));
      if (item.detail) card.append(element("p", "", item.detail));
      group.append(card);
    }
    return group;
  }

  function renderTurn(message) {
    const user = message.role === "user";
    const turn = element("div", user ? "turn user" : "turn bot");
    if (!user) {
      const avatar = element("span", "bot-avatar");
      avatar.setAttribute("aria-hidden", "true");
      avatar.append(icon("chat"));
      turn.append(avatar);
    }
    const content = element("div", "turn-content");
    content.append(element("span", "sr-only", user ? "고객" : "AI 상담"));
    const turnStatus = message.status;
    if (turnStatus) content.append(element("p", "turn-meta", turnStatus));
    if (message.text) {
      const bubble = element("p", "bubble");
      if (message.source === "api") friendlyText(bubble, message.text);
      else bubble.textContent = message.text;
      content.append(bubble);
    }
    if (message.recordGroups?.length) {
      for (const { title, items } of message.recordGroups) content.append(renderResultCards(items, title));
    } else if (message.items?.length) content.append(renderResultCards(message.items));
    const details = (message.links ?? []).filter((link) => cardDetails.has(link.href));
    if (details.length) {
      const links = element("div", "card-detail-links");
      for (const link of details) {
        const target = element("a", "card-detail-link", link.label);
        target.href = link.href;
        target.target = "_blank";
        target.rel = "noopener noreferrer";
        target.append(icon("external"));
        links.append(target);
      }
      content.append(links);
    }
    turn.append(content);
    return turn;
  }

  function getEngineRows() {
    const rows = engine.getState().messages.slice(1);
    const firstVisible = workflow && rows[0]?.role === "user" ? 1 : 0;
    const visible = [];
    for (let index = firstVisible; index <= rows.length; index += 1) {
      if (index > firstVisible) visible.push({ ...rows[index - 1], source: "demo" });
      for (const item of inputMessages) {
        if (item.after === index) visible.push(item.message);
      }
    }
    return visible;
  }

  function addInputMessage(role, text) {
    inputMessages.push({
      after: Math.max(0, engine.getState().messages.length - 1),
      message: { role, text, source: "demo" },
    });
  }

  function pendingField() {
    return inputProgress?.fields.find((field) => !Object.hasOwn(inputProgress.values, field.id));
  }

  function privateField(field) {
    return field && (field.type === "password" || field.type === "email" || field.type === "tel"
      || /이름|성함|연락처|전화번호|주소|카드번호|계좌번호|생년월일|인증번호|사업자등록번호|계약\s*번호|주문\s*번호/.test(field.label));
  }

  function inputEcho(field, value) {
    if (!value) return "건너뛰기";
    const identifyingValue = /계약|주문/.test(field.label)
      && /(?:\d[\s-]*){7,}|^(?:CT|DL|ORD)[-\d]/i.test(value);
    return privateField(field) || identifyingValue ? field.label + " 입력" : value;
  }

  function promptForField(error) {
    const field = pendingField();
    if (!field) return;
    const label = field.label;
    const particle = /[가-힣]$/.test(label) && (label.charCodeAt(label.length - 1) - 44032) % 28 !== 0 ? "을" : "를";
    const prompt = label + particle + " 입력해 주세요.";
    addInputMessage("bot", error ? `${error} ${prompt}` : prompt);
  }

  function syncInputProgress(flow) {
    const fields = (flow?.fields ?? []).filter((field) => !field.readonly);
    if (!fields.length) {
      if (inputProgress) secureInput.value = "";
      inputProgress = null;
      return;
    }
    if (inputProgress?.screen === flow.screen) {
      inputProgress.fields = fields;
      return;
    }
    inputProgress = { screen: flow.screen, fields, values: Object.create(null) };
    input.value = "";
    secureInput.value = "";
    const lastMessage = flow.messages.at(-1);
    const alreadyAsked = fields.length === 1 && lastMessage?.role === "bot"
      && lastMessage.text?.includes(fields[0].label) && /입력해|알려\s*주/.test(lastMessage.text);
    if (!alreadyAsked) promptForField();
  }

  function composerEntry() {
    return privateField(pendingField()) ? secureInput : input;
  }

  function getRows() {
    if (demoMode) return getEngineRows();
    return workflow ? [...liveRows, ...getEngineRows()] : liveRows;
  }

  function renderLog(messages) {
    const keys = messages.map((message) => JSON.stringify(message));
    let prefix = 0;
    while (prefix < keys.length && prefix < renderedKeys.length && keys[prefix] === renderedKeys[prefix]) prefix += 1;
    while (log.children.length > prefix) log.lastElementChild.remove();
    for (const message of messages.slice(prefix)) log.append(renderTurn(message));
    renderedKeys = keys;
  }

  function markMode() {
    const detected = demoMode ? "demo" : connection.state;
    const names = { demo: "안내형 상담", live: "AI 연결됨", checking: "연결 확인 중", offline: "AI 연결 대기" };
    modeLabel.textContent = names[detected];
    modeLabel.dataset.mode = detected;
    modeLabel.title = detected === "live" ? [connection.provider, connection.model].filter(Boolean).join(" · ") : "";
    composeNote.textContent = "시연 환경 · 입력 내용은 실제 업무에 반영되지 않습니다.";
    if (demoMode) {
      const open = element("a", "", "AI 상담으로 열기");
      open.href = localFile ? localServer : location.href;
      composeNote.append(document.createTextNode(" "), open);
    }
  }

  function renderStatus() {
    status.replaceChildren();
    status.hidden = !activeRequest && !failedRequest;
    status.classList.toggle("is-error", Boolean(failedRequest));
    log.setAttribute("aria-busy", String(Boolean(activeRequest)));
    if (activeRequest) {
      const dots = element("span", "typing");
      dots.setAttribute("aria-hidden", "true");
      dots.append(element("span"), element("span"), element("span"));
      status.append(dots, element("span", "", "답변을 작성하고 있어요"));
    }
    if (failedRequest) {
      const retry = button("다시 시도");
      const useDemo = button("안내형 상담");
      retry.addEventListener("click", () => requestReply(failedRequest.message, true));
      useDemo.addEventListener("click", () => {
        const question = failedRequest.message;
        clearConversation({ preserveIdentity: true });
        demoMode = true;
        engine.submit(question);
        update({ focus: true });
      });
      status.append(element("span", "", failedRequest.error), retry, useDemo);
    }
  }

  function renderInputTools(flow) {
    const section = element("div", "input-tools");
    for (const field of flow.fields.filter((field) => field.readonly && field.value)) {
      const note = element("p", "input-readonly");
      note.append(element("strong", "", field.label), element("span", "", field.value));
      section.append(note);
    }
    const field = pendingField();
    const tools = element("div", "input-buttons");
    if (field?.sample) {
      const sample = button("값 채우기");
      sample.id = "fill-sample";
      sample.addEventListener("click", () => {
        const editor = composerEntry();
        editor.value = field.sample;
        resizeInput();
        editor.focus({ preventScroll: true });
      });
      tools.append(sample);
    }
    if (flow.verification?.kind === "sms") {
      const code = flow.verification.code;
      const notice = element("section", "verification-message");
      notice.id = "verification-message";
      notice.setAttribute("aria-label", "인증 문자");
      const number = element("strong", "verification-code", code);
      number.setAttribute("data-verification-code", "");
      notice.append(element("span", "verification-sender", "SK매직 인증 문자"), number,
        element("span", "verification-sender", "유효 시간 3분"));
      const sms = button("인증 문자 확인");
      sms.setAttribute("aria-controls", notice.id);
      const sync = () => {
        const expanded = revealedCode === code;
        sms.setAttribute("aria-expanded", String(expanded));
        notice.hidden = !expanded;
      };
      sms.addEventListener("click", () => {
        revealedCode = revealedCode === code ? null : code;
        sync();
      });
      sync();
      tools.prepend(sms);
      section.append(notice);
    }
    if (field && !field.required) {
      const skip = button("건너뛰기");
      skip.addEventListener("click", () => captureInput(""));
      tools.append(skip);
    }
    if (field?.options?.length) {
      const options = element("div", "input-choice-grid");
      options.setAttribute("role", "group");
      options.setAttribute("aria-label", field.label);
      for (const choice of field.options) {
        const label = typeof choice === "string" ? choice : choice.label;
        const option = button(label, "action");
        option.addEventListener("click", () => captureInput(typeof choice === "string" ? choice : choice.value));
        options.append(option);
      }
      section.append(options);
    }
    if (inputProgress && Object.keys(inputProgress.values).length) {
      const restart = button("다시 입력");
      restart.addEventListener("click", () => {
        inputProgress = null;
        addInputMessage("bot", "이 단계의 입력값을 다시 받을게요.");
        update({ focus: true });
      });
      tools.append(restart);
    }
    if (tools.childElementCount) section.append(tools);
    return section;
  }

  function actionButton(action) {
    const card = action.card;
    const partner = card?.kind === "partner";
    const option = partner ? element("a", "action")
      : button(card ? "" : action.label, action.variant === "primary" && !card ? "action primary" : "action");
    if (partner) {
      option.href = partnerBenefitsUrl + (card.id ? "#:~:text=" + encodeURIComponent(card.title) : "");
      option.target = "_blank";
      option.rel = "noopener noreferrer";
      option.title = "SK매직몰 제휴카드 혜택 새 창";
    }
    option.dataset.action = action.id;
    if (action.disabled || action.requiresFields && pendingField() && !/주소 검색/.test(action.label)) option.disabled = true;
    if (!card) return option;

    option.classList.add("choice-card");
    option.dataset.cardKind = card.kind;
    option.setAttribute("aria-label", action.label);
    if (card.kind === "reason") option.setAttribute("aria-pressed", String(action.variant === "selected"));
    if (card.kind !== "date" && (card.kind !== "symptom" || card.icon)) {
      const image = cardImage(card.mediaKey);
      const mark = image || element("span", "choice-card-icon");
      if (!image) {
        const symbols = { transfer: "transfer", virtual: "wallet", "payment-record": "file" };
        const symbol = card.icon === "tools" ? "tool" : card.icon;
        mark.append(icon(symbol || pickerIcons[card.kind] || symbols[card.kind] || "card"));
      }
      mark.setAttribute("aria-hidden", "true");
      option.append(mark);
    }
    const caption = element("span", "choice-card-copy");
    caption.append(element("strong", "", card.title || action.label));
    if (card.detail) {
      const detail = element("span", "choice-card-detail", card.detail);
      if (card.kind !== "partner") {
        detail.id = "choice-detail-" + action.id.replace(/[^a-z0-9-]/gi, "-");
        option.setAttribute("aria-describedby", detail.id);
      }
      caption.append(detail);
    }
    if (card.phone) caption.append(element("span", "choice-card-phone", `${card.phoneLabel || "카드사 문의"} ${card.phone}`));
    option.append(caption);
    if (card.kind !== "partner" && card.kind !== "date") {
      const arrow = icon("chevron");
      arrow.classList.add("choice-card-arrow");
      option.append(arrow);
    }
    return option;
  }

  function renderCardOptions(actions, selection) {
    const partners = actions.every((action) => action.card.kind === "partner");
    const section = element("section", partners ? "card-picker partner-picker" : "card-picker");
    section.setAttribute("aria-label", selection?.title || (partners ? "제휴카드 선택" : "결제 옵션 선택"));
    const cards = element("div", partners ? "choice-cards partner-carousel" : "choice-cards");
    for (const action of actions) cards.append(actionButton(action));
    if (partners) {
      const toolbar = element("div", "partner-toolbar");
      toolbar.append(element("span", "", `제휴카드 ${actions.length}개`));
      const arrows = element("div", "partner-arrows");
      const prev = button("", "catalog-icon-button carousel-arrow previous");
      const next = button("", "catalog-icon-button carousel-arrow");
      prev.setAttribute("aria-label", "이전 제휴카드");
      next.setAttribute("aria-label", "다음 제휴카드");
      prev.append(icon("chevron"));
      next.append(icon("chevron"));
      const updateArrows = () => {
        prev.disabled = cards.scrollLeft <= 1;
        next.disabled = cards.scrollLeft >= cards.scrollWidth - cards.clientWidth - 1;
      };
      const scroll = (direction) => cards.scrollBy({
        left: direction * (cards.firstElementChild.offsetWidth + 10),
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
      prev.addEventListener("click", () => scroll(-1));
      next.addEventListener("click", () => scroll(1));
      cards.addEventListener("scroll", updateArrows, { passive: true });
      requestAnimationFrame(updateArrows);
      arrows.append(prev, next);
      toolbar.append(arrows);
      section.append(toolbar);
    }
    section.append(cards);
    return section;
  }

  function recordCard(action, kind, items, used) {
    const [name, ...details] = action.label.replace(/\s+(?:(?:접수|주문|계약|제품)\s+)?선택$/u, "").split(" · ");
    const key = name.replace(/[^가-힣\p{L}\d]/gu, "");
    const item = items.find(({ title, detail }) => {
      if (!title || !key) return false;
      const label = title === "조회 대상" ? detail : title;
      const candidate = (label ?? "").replace(/[^가-힣\p{L}\d]/gu, "");
      return candidate && (candidate.startsWith(key) || key.startsWith(candidate));
    });
    if (item) used.add(item);
    return {
      kind, title: item?.title && item.title !== "조회 대상" ? item.title : name,
      detail: item?.detail || details.join(" · "),
    };
  }

  function describeWorkflowPicker(flow) {
    if (!flow?.screen) return null;
    const { actions, selection, screen, messages } = flow;
    if (["service-product", "service-symptom"].includes(selection?.kind)) {
      return { selection, actions: actions.filter((action) => action.card), used: new Set() };
    }
    if (actions.some((action) => action.card)) return null;

    const screenKey = `${flow.scenario.no}:${screen.id}`;
    const items = messages.at(-1)?.items ?? [];
    const used = new Set();
    const picker = (kind, title, options, cardFor, detail = "") => ({
      selection: { kind, title, detail },
      actions: options.map((action) => ({ ...action, card: cardFor(action) })),
      used,
    });
    const record = recordPickers.get(screenKey);
    if (record) {
      const [kind, title] = record;
      const options = actions.filter(({ label }) => /선택$/u.test(label) || (kind === "order" && label.includes(" · ")));
      if (options.length) return picker(kind, title, options, (action) => recordCard(action, kind, items, used));
    }

    const dates = actions.filter(({ label }) => dateChoice.test(label) || monthlyChoice.test(label));
    const pairedSchedule = /^pair(Split|Install)Schedule$/u.test(screen.id);
    const currentDate = pairedSchedule || schedulePickers.has(screenKey) ? flow.selectedDate : "";
    if (dates.length || currentDate) {
      const availability = items.find(({ title }) => title === "선택 가능일");
      if (availability) used.add(availability);
      const monthly = dates.some(({ label }) => monthlyChoice.test(label));
      const title = screen.id === "pairSplitSchedule" ? "분리 방문일 선택"
        : screen.id === "pairInstallSchedule" ? "재설치 방문일 선택"
        : monthly ? "정기 발송일 선택" : flow.scenario.no === 17 ? "배송일 선택"
        : flow.scenario.no === 36 ? "회수일 선택" : "방문일 선택";
      return picker("date", title, dates, ({ label }) => {
        const parsed = dateChoice.exec(label);
        return { kind: "date", title: parsed?.[1] || label, detail: parsed ? parsed[2] + "요일" : "" };
      }, currentDate ? `선택한 날짜 · ${currentDate}` : "");
    }

    const channels = actions.filter(({ label }) => deliveryChoice.test(label));
    if (channels.length) return picker("channel", "받는 방법", channels, ({ label }) => ({
      kind: "channel", title: label, icon: /이메일|팩스|우편/u.test(label) ? "file" : "chat",
    }));
    if (documentPickers.has(screenKey)) return picker("document", "문서 선택", actions, ({ label }) => ({
      kind: "document", title: label,
    }));
    if (screenKey === "22:s3") return picker("appointment", "서비스 종류 선택", actions, ({ label }) => ({
      kind: "appointment", title: label,
    }));
    if (screenKey === "45:prepaidPaymentMethods") {
      const kinds = { 카드: "credit", "실시간 계좌이체": "transfer", 가상계좌: "virtual" };
      return picker("payment", "선납 결제수단 선택", actions, ({ label }) => ({ kind: kinds[label], title: label }));
    }
    if (screenKey === "15:S03") {
      const reasons = actions.filter(({ label }) => !["나가기", "취소 요청"].includes(label));
      return picker("reason", "접수 취소 사유", reasons, ({ label }) => ({ kind: "reason", title: label }));
    }
    if (screenKey === "4:paymentScope") {
      const options = actions.filter(({ label }) => items.some(({ title }) => title === label));
      return picker("payment", "납부 범위 선택", options, ({ label }) => {
        const item = items.find(({ title }) => title === label);
        used.add(item);
        return { kind: "payment", title: label, detail: item.detail };
      });
    }
    if (screenKey === "8:addressOptions" || screenKey === "12:serviceCases") {
      const address = items.find(({ title }) => title === "등록 주소");
      if (address) used.add(address);
      return picker("address", "방문 주소 선택", actions, ({ label }) => ({
        kind: "address", title: label, detail: label.startsWith("등록") ? address?.detail : "",
      }));
    }
    if (screenKey === "45:prepaidTerms") {
      const terms = actions.filter(({ label }) => /^\d년 금액 확인$/u.test(label));
      return picker("term", "선납 기간 선택", terms, ({ label }) => {
        const title = label.split(" ")[0];
        const item = items.find((entry) => entry.title.startsWith(title));
        if (item) used.add(item);
        return { kind: "term", title, detail: item?.detail ? item.detail + " 할인" : "" };
      });
    }
    if (screenKey === "49:consentItems") {
      const company = items.find(({ title }) => title === "회사");
      if (company) used.add(company);
      return picker("consent", "동의 항목 선택", actions.filter(({ label }) => label !== "현재 상태 유지"), ({ label }) => {
        const status = items.find(({ title }) => title === label);
        if (status) used.add(status);
        return { kind: "consent", title: label, detail: status?.detail };
      }, company?.detail);
    }
    return null;
  }

  function renderWorkflowPicker(actions, selection) {
    const symptom = selection.kind === "service-symptom";
    const product = selection.kind === "service-product";
    const section = element("section", "workflow-picker card-picker");
    section.dataset.workflowPicker = selection.kind;
    if (symptom || product) section.dataset.servicePicker = symptom ? "symptom" : "product";
    const header = element("div", "workflow-picker-header");
    const symbol = pickerIcons[selection.kind];
    if (symbol) {
      const mark = element("span", "choice-card-icon");
      mark.append(icon(symbol));
      header.append(mark);
    }
    const heading = element("h3", "", selection.title);
    heading.id = "workflow-picker-title";
    heading.tabIndex = -1;
    section.setAttribute("aria-labelledby", heading.id);
    const copy = element("div", "workflow-picker-copy");
    copy.append(heading);
    if (selection.detail) copy.append(element("p", "", selection.detail));
    header.append(copy);
    section.append(header);

    if (symptom) {
      const progress = element("ol", "symptom-progress");
      progress.setAttribute("aria-label", "증상 분류 단계");
      for (const [index, label] of ["대분류", "중분류", "소분류"].entries()) {
        const current = index === selection.step;
        const value = selection.path?.[index];
        const step = element("li", current ? "is-current" : value ? "is-complete" : "");
        step.append(element("span", "", label));
        if (current) step.setAttribute("aria-current", "step");
        if (value) step.append(element("strong", "", value));
        progress.append(step);
      }
      section.append(progress);
    }

    if (actions.length) {
      const cards = element("div", "choice-cards workflow-picker-options");
      for (const action of actions) cards.append(actionButton(action));
      section.append(cards);
    }
    return section;
  }

  function renderWorkflow(flow, picker) {
    const actions = flow.actions ?? [];
    const choices = element("div", "controls");
    const visual = picker?.actions ?? actions.filter((action) => action.card);
    const visualIds = new Set(visual.map(({ id }) => id));
    const plain = actions.filter(({ id }) => !visualIds.has(id));
    if (flow.screen?.id === "$auth") {
      const request = element("div", "pass-request");
      const sign = actions.some((action) => action.label === "전자서명 확인");
      request.append(element("span", "pass-mark", "PASS"), element("strong", "", sign ? "전자서명" : "본인인증"));
      choices.append(request);
    }
    if (!picker && !visual.length && flow.selection?.detail) {
      const summary = element("div", "selection-summary");
      summary.append(element("strong", "", flow.selection.title), element("span", "", flow.selection.detail));
      choices.append(summary);
    }
    const inputTools = renderInputTools(flow);
    if (inputTools.childElementCount) choices.append(inputTools);
    if (picker) choices.append(renderWorkflowPicker(visual, picker.selection));
    else if (visual.length) choices.append(renderCardOptions(visual, flow.selection));
    if (plain.length) {
      const list = element("div", "action-list");
      for (const action of plain) list.append(actionButton(action));
      choices.append(list);
    }
    choices.addEventListener("click", (event) => {
      const option = event.target.closest("[data-action]");
      const action = actions.find((item) => item.id === option?.dataset.action);
      if (!action || action.disabled) return;
      if (option.tagName === "A") {
        setTimeout(() => {
          if (option.isConnected) applyWorkflowAction(action);
        }, 0);
      } else {
        applyWorkflowAction(action);
      }
    });
    if (choices.childElementCount) controls.append(choices);

    if (flow.screen?.kind === "internal-only" && flow.detail) {
      const extras = element("div", "workflow-tools");
      extras.append(element("p", "", flow.detail));
      controls.append(extras);
    }
  }

  function renderControls(flow, picker) {
    controls.replaceChildren();
    if (flow) {
      renderWorkflow(flow, picker);
      return;
    }
    if (!offer || activeRequest || failedRequest) return;
    const action = button(offer.displayTitle + " 계속하기", "action");
    action.addEventListener("click", () => startWorkflow(offer));
    const tools = element("div", "workflow-tools");
    tools.append(action);
    controls.append(tools);
  }

  function applyWorkflowAction(action, automatic = false) {
    const progress = inputProgress;
    if (action.requiresFields && progress && pendingField()) {
      const address = progress.fields.find((field) => field.label === "주소");
      if (!/주소 검색/.test(action.label) || !address || !progress.values[address.id]) {
        composerEntry().focus({ preventScroll: true });
        return;
      }
    }
    const next = engine.choose(action.id, progress?.values ?? {}, { echo: !automatic });
    const length = Math.max(0, next.messages.length - 1);
    inputMessages = inputMessages.filter((item) => item.after <= length);
    const failures = next.screen === progress?.screen ? next.fields.filter((field) => field.error) : [];
    if (failures.length && progress) {
      for (const field of failures) delete progress.values[field.id];
      promptForField(failures[0].error);
    } else if (next.screen !== progress?.screen || (action.requiresFields && !pendingField())) {
      inputProgress = null;
    }
    update({ focus: true });
  }

  function inputValue(field, text) {
    if (field.type !== "date") return text;
    const date = /^(\d{4})(?:\s*년\s*|[.\/-])(\d{1,2})(?:\s*월\s*|[.\/-])(\d{1,2})\s*일?$/.exec(text);
    return date ? `${date[1]}-${date[2].padStart(2, "0")}-${date[3].padStart(2, "0")}` : text;
  }

  function captureInput(text) {
    const field = pendingField();
    if (!field) return;
    const value = inputValue(field, String(text ?? "").trim());
    const error = engine.validateFieldValue(field.id, value);
    if (error) {
      promptForField(error);
      update({ focus: true });
      return;
    }
    inputProgress.values[field.id] = value;
    addInputMessage("user", inputEcho(field, value));
    if (pendingField()) {
      promptForField();
      update({ focus: true });
      return;
    }
    const next = engine.getState().actions.filter((action) => action.requiresFields);
    if (next.length === 1 && /^(확인|다음)$/.test(next[0].label)) {
      applyWorkflowAction(next[0], true);
      return;
    }
    const instruction = next.length === 1
      ? `입력을 마쳤어요. 위에서 ‘${next[0].label}’ 버튼을 선택해 주세요.`
      : "입력을 마쳤어요. 위에서 다음 단계를 선택해 주세요.";
    addInputMessage("bot", instruction);
    update({ focus: true });
  }

  function resizeInput() {
    input.style.height = "auto";
    input.style.height = Math.min(136, Math.max(25, input.scrollHeight)) + "px";
    const editor = composerEntry();
    sendButton.disabled = editor.disabled || Boolean(activeRequest) || !editor.value.trim();
  }

  function update({ focus = false, scroll = true } = {}) {
    const flow = demoMode || workflow ? engine.getState() : null;
    if (flow?.verification?.code !== revealedCode) revealedCode = null;
    syncInputProgress(flow);
    const messages = getRows();
    const picker = describeWorkflowPicker(flow);
    if (picker?.used.size && messages.at(-1)?.items) {
      const last = messages.at(-1);
      messages[messages.length - 1] = { ...last, items: last.items.filter((item) => !picker.used.has(item)) };
    }
    const empty = !messages.length;
    app.classList.toggle("is-empty", empty);
    byId("welcome").hidden = !empty;
    byId("starters").hidden = !empty;
    renderLog(messages);
    renderControls(flow, picker);
    renderStatus();
    markMode();
    syncCatalogSelection(flow);

    const field = pendingField();
    const editor = composerEntry();
    const progressive = Boolean(inputProgress);
    const blocked = !progressive && Boolean(flow?.inputDisabled || flow?.secure);
    const privateEntry = editor === secureInput;
    form.hidden = blocked;
    byId("secure-message").hidden = !blocked;
    byId("secure-message").querySelector("span").textContent = flow?.screen?.kind === "internal-only"
      ? "이 업무의 고객 채팅 절차는 검토 중이에요."
      : flow?.screen?.kind === "closed" ? "상단의 초기화 버튼으로 새 대화를 시작할 수 있어요." : "대화 안의 안내에 따라 계속해 주세요.";
    input.hidden = privateEntry;
    secureInput.hidden = !privateEntry;
    const ready = progressive && !field;
    input.disabled = blocked || ready || privateEntry;
    secureInput.disabled = !privateEntry;
    secureInput.inputMode = field?.inputMode || "";
    input.inputMode = privateEntry ? "" : field?.inputMode || "";
    inputLabel.htmlFor = editor.id;
    inputLabel.textContent = field ? field.label + " 입력" : "질문 입력";
    input.maxLength = field ? 250 : 1500;
    const hint = field?.placeholder;
    editor.placeholder = field
      ? field.type === "date" ? "YYYY-MM-DD" : hint && !/예[:시]|example\.com|0000-0000/.test(hint) ? hint : field.label + " 입력"
      : ready ? "위에서 다음 단계를 선택해 주세요."
        : empty ? "궁금한 내용을 입력해 주세요." : (flow?.screen?.placeholder || "이어서 질문해 보세요");
    resizeInput();
    if (focus) {
      const pickerHeading = controls.querySelector("#workflow-picker-title");
      const target = pickerHeading || (blocked || ready
        ? controls.querySelector(".action:not(:disabled), button:not(:disabled)") || byId("new-chat")
        : editor);
      target?.focus({ preventScroll: true });
    }
    if (scroll) requestAnimationFrame(() => {
      chatScroll.scrollTop = empty ? 0 : chatScroll.scrollHeight;
    });
  }

  function clearWorkflowDraft() {
    inputProgress = null;
    revealedCode = null;
    input.value = "";
    secureInput.value = "";
  }

  function archiveWorkflow() {
    if (!workflow) return false;
    lastScenario = engine.getState().scenario?.no ?? lastScenario;
    liveRows.push(...getEngineRows());
    engine.reset({ preserveIdentity: true });
    inputMessages = [];
    clearWorkflowDraft();
    workflow = false;
    return true;
  }

  function startWorkflow(scenario, fromMenu = false) {
    if (!scenario || activeRequest) return;
    setDrawer(false, false);
    if (demoMode) {
      clearWorkflowDraft();
      engine.start(scenario.no);
    } else {
      if (!archiveWorkflow()) clearWorkflowDraft();
      workflow = true;
      lastScenario = scenario.no;
      engine.start(scenario.no);
      if (fromMenu && scenario.no !== 50) liveRows.push({ role: "user", text: scenario.displayTitle });
      offer = null;
      failedRequest = null;
    }
    update({ focus: true });
  }

  function clearConversation({ preserveIdentity = false } = {}) {
    if (activeRequest) {
      clearTimeout(activeRequest.timer);
      activeRequest.controller.abort();
      activeRequest = null;
    }
    liveRows = [];
    apiHistory = [];
    workflow = false;
    offer = null;
    failedRequest = null;
    lastScenario = null;
    inputMessages = [];
    clearWorkflowDraft();
    if (preserveIdentity) engine.reset({ preserveIdentity: true });
    else engine.reset();
  }

  async function refreshConnection() {
    if (demoMode) return;
    const controller = new AbortController();
    pendingStatus?.abort();
    pendingStatus = controller;
    const timer = setTimeout(() => controller.abort(), 4500);
    try {
      const response = await fetch("/api/status", { signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error("연결을 확인하지 못했어요.");
      const service = await response.json();
      if (pendingStatus === controller && (service.available || connection.state !== "live")) {
        connection = { ...service, state: service.available ? "live" : "offline" };
      }
    } catch {
      if (pendingStatus === controller && connection.state !== "live") connection.state = "offline";
    } finally {
      clearTimeout(timer);
      if (pendingStatus === controller) {
        pendingStatus = null;
        markMode();
      }
    }
  }

  function errorMessage(data) {
    return typeof data?.error === "string" && /[가-힣]/.test(data.error) && data.error.length <= 160
      ? data.error
      : "AI 응답을 받아오지 못했어요. 잠시 후 다시 시도해 주세요.";
  }

  async function requestReply(message, retry = false) {
    if (activeRequest || demoMode) return;
    archiveWorkflow();
    if (!retry) liveRows.push({ role: "user", text: message });
    offer = null;
    failedRequest = null;
    const scopeReply = window.SKIXChat.corporateReply(message) || window.SKIXChat.inboundReviewReply(message);
    if (scopeReply) {
      liveRows.push({ role: "bot", text: scopeReply });
      apiHistory = [];
      lastScenario = null;
      update({ focus: true });
      return;
    }
    const controller = new AbortController();
    const request = { controller, timer: setTimeout(() => controller.abort(), timeoutMs) };
    activeRequest = request;
    update();
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ message, history: apiHistory.slice(-12), scenario: lastScenario ?? undefined })
      });
      const data = await response.json().catch(() => null);
      if (activeRequest !== request) return;
      if (!response.ok || typeof data?.reply !== "string" || !data.reply.trim()) {
        failedRequest = { message, error: errorMessage(data) };
        if (response.status === 503) connection.state = "offline";
      } else {
        const reply = data.reply.trim();
        liveRows.push({ role: "bot", text: reply, source: "api" });
        apiHistory.push({ role: "user", content: message }, { role: "assistant", content: reply });
        apiHistory = apiHistory.slice(-12);
        const suggested = scenarios.get(Number(data.scenarioId));
        offer = suggested?.screens[0]?.kind === "internal-only" ? null : suggested ?? null;
        lastScenario = offer?.no ?? lastScenario;
        connection = { ...connection, state: "live", provider: data.provider || connection.provider };
      }
    } catch (error) {
      if (activeRequest !== request) return;
      failedRequest = {
        message,
        error: error.name === "AbortError"
          ? "응답 시간이 길어지고 있어요. 다시 시도해 주세요."
          : "AI에 연결하지 못했어요. 다시 시도해 주세요."
      };
      if (error.name !== "AbortError") connection.state = "offline";
    } finally {
      clearTimeout(request.timer);
      if (activeRequest === request) {
        activeRequest = null;
        if (offer?.no === 6) startWorkflow(offer);
        else update();
      }
    }
  }

  function send(message) {
    const text = String(message ?? "").trim();
    if (!text || activeRequest) return;
    composerEntry().value = "";
    if (inputProgress) {
      captureInput(text);
    } else if (demoMode) {
      engine.submit(text);
      update({ focus: true });
    } else {
      requestReply(text);
      input.focus({ preventScroll: true });
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const editor = composerEntry();
    if (!editor.disabled) send(editor.value);
  });
  form.addEventListener("input", resizeInput);
  form.addEventListener("keydown", (event) => {
    if (event.target !== composerEntry()) return;
    if (event.key !== "Enter" || event.shiftKey || event.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    if (!sendButton.disabled) form.requestSubmit();
  });
  byId("starters").addEventListener("click", (event) => {
    const starter = event.target.closest("[data-question]");
    if (starter) send(starter.dataset.question);
  });
  byId("new-chat").addEventListener("click", () => {
    clearConversation();
    setDrawer(false, false);
    openPhases.clear();
    catalogSearch.value = "";
    catalogList.scrollTop = 0;
    renderCatalog();
    update({ focus: true });
  });
  catalogToggle.addEventListener("click", () => setDrawer(true));
  catalogClose.addEventListener("click", () => setDrawer(false));
  catalogBackdrop.addEventListener("click", () => setDrawer(false));
  mobileCatalog.addEventListener("change", () => setDrawer(false, false));
  catalogAll.addEventListener("click", () => {
    const collapse = !catalogSearch.value.trim() && openPhases.size === catalogPhases.length;
    openPhases.clear();
    if (!collapse) for (const { id } of catalogPhases) openPhases.add(id);
    catalogSearch.value = "";
    catalogList.scrollTop = 0;
    renderCatalog();
  });
  catalogSearch.addEventListener("input", () => {
    catalogList.scrollTop = 0;
    renderCatalog();
  });
  catalogSearch.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const [match] = engine.find(catalogSearch.value.trim());
    if (match) {
      event.preventDefault();
      catalogList.querySelector(`[data-scenario="${match.no}"]:not(:disabled)`)?.focus();
    }
  });
  catalogList.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-phase]");
    if (toggle) {
      const id = Number(toggle.dataset.phase);
      if (openPhases.has(id)) openPhases.delete(id);
      else openPhases.add(id);
      renderCatalog(id);
      return;
    }
    const item = event.target.closest("[data-scenario]");
    if (item) startWorkflow(scenarios.get(Number(item.dataset.scenario)), true);
  });
  document.addEventListener("keydown", (event) => {
    if (!drawerOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setDrawer(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...catalog.querySelectorAll("button:not(:disabled), input, a[href]")]
      .filter((item) => item.getClientRects().length);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first) return;
    const active = document.activeElement;
    if (!catalog.contains(active) || (event.shiftKey ? active === first : active === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  });

  setDrawer(false);
  renderCatalog();
  update();
  refreshConnection();
})();
