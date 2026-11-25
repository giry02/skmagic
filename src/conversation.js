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
  const cardDetails = new Set([...partnerCards.values()].map((card) => card.href));
  cardDetails.add("https://www.skmagic.com/event/skmagic-card-benefits");
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
  const categories = [
    ["결제·납부", "결제·납부", "card"],
    ["배송·설치", "배송·설치", "truck"],
    ["AS·케어", "A/S·케어", "tool"],
    ["계약·해약", "계약·해지", "folder"],
    ["고객정보·동의", "고객정보", "user"],
    ["문서발송", "증빙서류", "file"],
    ["가입·심사", "구독·멤버십", "bag"],
  ];
  const openCategories = new Set();
  let allCatalogItems = false;
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
    const item = button(scenario.displayTitle, "catalog-item");
    item.dataset.scenario = String(scenario.no);
    return item;
  }

  function syncCatalogSelection(flow) {
    for (const item of catalogList.querySelectorAll("[data-scenario]")) {
      if (Number(item.dataset.scenario) === flow?.scenario?.no) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
      item.disabled = Boolean(activeRequest);
    }
  }

  function renderCatalog(focusGroup) {
    const term = catalogSearch.value.trim();
    const content = document.createDocumentFragment();
    if (term || allCatalogItems) {
      const matches = term ? engine.find(term) : [...scenarios.values()];
      const text = !matches.length
        ? "해당 업무를 찾지 못했어요."
        : term ? `검색 결과 ${matches.length}개` : `전체 ${matches.length}개 업무`;
      const count = element("p", "catalog-results", text);
      count.setAttribute("role", "status");
      content.append(count);
      for (const scenario of matches) content.append(catalogItem(scenario));
    } else {
      for (const [category, label, symbol] of categories) {
        const toggle = button("", "catalog-group");
        const expanded = openCategories.has(category);
        const groupId = `catalog-group-${symbol}`;
        toggle.dataset.category = category;
        toggle.setAttribute("aria-expanded", String(expanded));
        toggle.setAttribute("aria-controls", groupId);
        const mark = icon(symbol);
        mark.classList.add("catalog-group-icon");
        const chevron = icon("chevron");
        chevron.classList.add("catalog-chevron");
        toggle.append(mark, element("span", "", label), chevron);
        const items = element("div", "catalog-items");
        items.id = groupId;
        items.hidden = !expanded;
        if (expanded) {
          for (const scenario of scenarios.values()) {
            if (scenario.category === category) items.append(catalogItem(scenario));
          }
        }
        content.append(toggle, items);
      }
    }
    catalogList.replaceChildren(content);
    catalogAll.textContent = allCatalogItems ? "분류 보기" : "전체 보기";
    catalogAll.setAttribute("aria-pressed", String(allCatalogItems));
    syncCatalogSelection(demoMode || workflow ? engine.getState() : null);
    if (focusGroup) {
      [...catalogList.querySelectorAll("[data-category]")]
        .find((node) => node.dataset.category === focusGroup)?.focus({ preventScroll: true });
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
    const hasOfficialCard = message.items?.some((item) => partnerCards.has(item.mediaKey));
    const turnStatus = message.status || (!user && !hasOfficialCard && message.items?.length
      && (message.demo || message.source === "demo") ? "예시 데이터" : "");
    if (turnStatus) content.append(element("p", "turn-meta", turnStatus));
    if (message.text) {
      const bubble = element("p", "bubble");
      if (message.source === "api") friendlyText(bubble, message.text);
      else bubble.textContent = message.text;
      content.append(bubble);
    }
    if (message.items?.length) {
      const group = element("div", "result-cards");
      for (const item of message.items) {
        const card = element("article", "result-card");
        const art = cardImage(item.mediaKey);
        if (art) {
          card.classList.add("has-card-art");
          card.append(art);
        }
        if (item.title) card.append(element("h3", "", item.title));
        if (item.detail) card.append(element("p", "", item.detail));
        group.append(card);
      }
      content.append(group);
    }
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
    const prompt = label + particle + (privateField(field) ? " 예시 값으로 입력해 주세요." : " 입력해 주세요.");
    addInputMessage("bot", error ? `${error} ${prompt}` : prompt);
  }

  function syncInputProgress(flow) {
    const fields = (flow?.fields ?? []).filter((field) => !field.readonly);
    if (!fields.length) {
      if (inputProgress) secureInput.value = "";
      inputProgress = null;
      return;
    }
    if (inputProgress?.screen === flow.screen) return;
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
    const names = { demo: "예시 대화", live: "AI 연결됨", checking: "연결 확인 중", offline: "AI 연결 대기" };
    modeLabel.textContent = names[detected];
    modeLabel.dataset.mode = detected;
    modeLabel.title = detected === "live" ? [connection.provider, connection.model].filter(Boolean).join(" · ") : "";
    composeNote.replaceChildren();
    if (demoMode) {
      composeNote.append(document.createTextNode("예시 데이터로 동작합니다. "));
      if (localFile) {
        const open = element("a", "", "AI 상담으로 열기");
        open.href = localServer;
        composeNote.append(open);
      } else {
        const open = element("a", "", "AI 상담으로 돌아가기");
        open.href = location.href;
        composeNote.append(open);
      }
    } else {
      const viewingPartners = workflow && engine.getState().scenario?.no === 6 && partnerCards.size;
      composeNote.textContent = viewingPartners ? "제휴 조건은 SK매직몰과 카드사에서 확인할 수 있어요."
        : workflow ? "예시 데이터로 상담을 진행하고 있어요." : "채팅에는 개인정보를 입력하지 마세요.";
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
      const useDemo = button("예시 대화");
      retry.addEventListener("click", () => requestReply(failedRequest.message, true));
      useDemo.addEventListener("click", () => {
        const question = failedRequest.message;
        clearConversation();
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
      const sample = button("예시 값 넣기");
      sample.id = "fill-sample";
      sample.addEventListener("click", () => {
        const editor = composerEntry();
        editor.value = field.sample;
        resizeInput();
        editor.focus({ preventScroll: true });
      });
      tools.append(sample);
    }
    if (field && !field.required) {
      const skip = button("건너뛰기");
      skip.addEventListener("click", () => captureInput(""));
      tools.append(skip);
    }
    if (field?.options?.length) {
      for (const choice of field.options) {
        const label = typeof choice === "string" ? choice : choice.label;
        const option = button(label, "action");
        option.addEventListener("click", () => captureInput(typeof choice === "string" ? choice : choice.value));
        tools.append(option);
      }
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
    const option = button(card ? "" : action.label, action.variant === "primary" && !card ? "action primary" : "action");
    option.dataset.action = action.id;
    if (action.requiresFields && pendingField() && !/주소 검색/.test(action.label)) option.disabled = true;
    if (!card) return option;

    option.classList.add("choice-card");
    option.dataset.cardKind = card.kind;
    option.setAttribute("aria-label", action.label);
    const image = cardImage(card.mediaKey);
    const mark = image || element("span", "choice-card-icon");
    if (!image) {
      const symbol = card.kind === "transfer" ? "transfer" : card.kind === "virtual" ? "wallet"
        : card.kind === "payment-record" ? "file" : "card";
      mark.append(icon(symbol));
    }
    mark.setAttribute("aria-hidden", "true");
    const caption = element("span", "choice-card-copy");
    caption.append(element("strong", "", card.title || action.label));
    if (card.detail) caption.append(element("span", "choice-card-detail", card.detail));
    if (card.phone) caption.append(element("span", "choice-card-phone", `${card.phoneLabel || "카드사 문의"} ${card.phone}`));
    option.append(mark, caption);
    if (card.kind !== "partner") {
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

  function renderWorkflow(flow) {
    const actions = flow.actions ?? [];
    const choices = element("div", "controls");
    const visual = actions.filter((action) => action.card);
    const plain = actions.filter((action) => !action.card);
    if (!visual.length && flow.selection?.detail) {
      const summary = element("div", "selection-summary");
      summary.append(element("strong", "", flow.selection.title), element("span", "", flow.selection.detail));
      choices.append(summary);
    }
    const inputTools = renderInputTools(flow);
    if (inputTools.childElementCount) choices.append(inputTools);
    if (visual.length) choices.append(renderCardOptions(visual, flow.selection));
    if (plain.length) {
      const list = element("div", "action-list");
      for (const action of plain) list.append(actionButton(action));
      choices.append(list);
    }
    choices.addEventListener("click", (event) => {
      const option = event.target.closest("button[data-action]");
      const action = actions.find((item) => item.id === option?.dataset.action);
      if (action) applyWorkflowAction(action);
    });
    if (choices.childElementCount) controls.append(choices);

    if (flow.screen?.kind === "internal-only" || workflow) {
      const extras = element("div", "workflow-tools");
      if (flow.screen?.kind === "internal-only" && flow.detail) extras.append(element("p", "", flow.detail));
      if (workflow) {
        const resume = button("AI에 이어서 질문하기");
        resume.addEventListener("click", () => {
          archiveWorkflow();
          update({ focus: true });
        });
        extras.append(resume);
      }
      controls.append(extras);
    }
  }

  function renderControls(flow) {
    controls.replaceChildren();
    if (flow) {
      renderWorkflow(flow);
      return;
    }
    if (!offer || activeRequest || failedRequest) return;
    const action = button(offer.displayTitle + " 예시로 진행", "action");
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
    syncInputProgress(flow);
    const messages = getRows();
    const empty = !messages.length;
    app.classList.toggle("is-empty", empty);
    byId("welcome").hidden = !empty;
    byId("starters").hidden = !empty;
    renderLog(messages);
    renderControls(flow);
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
      : "대화 안의 안내에 따라 계속해 주세요.";
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
    editor.placeholder = field
      ? field.placeholder || (field.type === "date" ? "예: 2026-11-30" : field.label + " 입력")
      : ready ? "위에서 다음 단계를 선택해 주세요."
        : empty ? "예: 정수기 렌탈료는 언제 빠져나가나요?" : (flow?.screen?.placeholder || "이어서 질문해 보세요");
    resizeInput();
    if (focus) {
      const target = blocked || ready
        ? controls.querySelector(".action:not(:disabled), button:not(:disabled)") || byId("new-chat")
        : editor;
      target?.focus({ preventScroll: true });
    }
    if (scroll) requestAnimationFrame(() => {
      chatScroll.scrollTop = empty ? 0 : chatScroll.scrollHeight;
    });
  }

  function archiveWorkflow() {
    if (!workflow) return;
    lastScenario = engine.getState().scenario?.no ?? lastScenario;
    liveRows.push(...getEngineRows());
    engine.reset();
    inputMessages = [];
    inputProgress = null;
    workflow = false;
  }

  function startWorkflow(scenario, fromMenu = false) {
    if (!scenario || activeRequest) return;
    setDrawer(false, false);
    if (demoMode) {
      engine.start(scenario.no);
    } else {
      archiveWorkflow();
      workflow = true;
      lastScenario = scenario.no;
      engine.start(scenario.no);
      if (fromMenu && scenario.no !== 50) liveRows.push({ role: "user", text: scenario.displayTitle });
      if (!fromMenu && scenario.no !== 6) liveRows.push({ role: "bot", text: "예시 데이터로 상담 절차를 이어갈게요.", status: "예시 대화" });
      offer = null;
      failedRequest = null;
    }
    update({ focus: true });
  }

  function clearConversation() {
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
    inputProgress = null;
    input.value = "";
    secureInput.value = "";
    engine.reset();
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
        offer = scenarios.get(Number(data.scenarioId)) ?? null;
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
    update({ focus: true });
  });
  catalogToggle.addEventListener("click", () => setDrawer(true));
  catalogClose.addEventListener("click", () => setDrawer(false));
  catalogBackdrop.addEventListener("click", () => setDrawer(false));
  mobileCatalog.addEventListener("change", () => setDrawer(false, false));
  catalogAll.addEventListener("click", () => {
    allCatalogItems = !allCatalogItems;
    catalogSearch.value = "";
    catalogList.scrollTop = 0;
    renderCatalog();
  });
  catalogSearch.addEventListener("input", () => {
    catalogList.scrollTop = 0;
    renderCatalog();
  });
  catalogSearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter") catalogList.querySelector("[data-scenario]:not(:disabled)")?.focus();
  });
  catalogList.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-category]");
    if (toggle) {
      const category = toggle.dataset.category;
      if (openCategories.has(category)) openCategories.delete(category);
      else openCategories.add(category);
      renderCatalog(category);
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
