(() => {
  "use strict";

  const DATA = window.VACCINE_DATA;
  const STORAGE_KEY = "daughter-vaccine-planner-v1";
  const todayIso = new Date().toISOString().slice(0, 10);

  const MONTH_OPTIONS = [
    { val: 0, label: "0月龄 (出生时)" },
    { val: 1, label: "1月龄" },
    { val: 2, label: "2月龄" },
    { val: 3, label: "3月龄" },
    { val: 4, label: "4月龄" },
    { val: 5, label: "5月龄" },
    { val: 6, label: "6月龄" },
    { val: 7, label: "7月龄" },
    { val: 8, label: "8月龄" },
    { val: 9, label: "9月龄" },
    { val: 10, label: "10月龄" },
    { val: 11, label: "11月龄" },
    { val: 12, label: "12月龄 (1周岁)" },
    { val: 15, label: "15月龄" },
    { val: 18, label: "18月龄 (1.5周岁)" },
    { val: 24, label: "24月龄 (2周岁)" },
    { val: 36, label: "3周岁 (36月龄)" },
    { val: 48, label: "4周岁 (48月龄)" },
    { val: 72, label: "6周岁 (72月龄)" },
    { val: 108, label: "9周岁 (108月龄)" },
    { val: 156, label: "13周岁 (156月龄)" },
    { val: 162, label: "13.5周岁 (162月龄)" },
  ];

  const defaultState = {
    version: 1,
    childName: "",
    childGender: "female", // "female" | "male"
    birthDate: DATA.meta.defaultBirthDate,
    asOfDate: todayIso,
    paidSelected: {},
    planSelected: {},
    planConfirmed: {},
    completed: {},
    actualDates: {},
    customDates: {},   // taskId -> custom due date ISO (YYYY-MM-DD)
    customMonths: {},  // taskId -> custom ageMonths (number)
    hideReplaced: false,
    hideUnplanned: false,
    hideCompleted: false,
  };

  let state = loadState();
  let toastTimer;
  let draggedTaskId = null;

  const elements = {
    childName: document.getElementById("childName"),
    childGender: document.getElementById("childGender"),
    birthDate: document.getElementById("birthDate"),
    asOfDate: document.getElementById("asOfDate"),
    profileNote: document.getElementById("profileNote"),
    footerChildName: document.getElementById("footerChildName"),
    replacementPlans: document.getElementById("replacementPlans"),
    timeline: document.getElementById("timeline"),
    emptyTimeline: document.getElementById("emptyTimeline"),
    scheduleSearch: document.getElementById("scheduleSearch"),
    scheduleFilter: document.getElementById("scheduleFilter"),
    hideReplacedToggle: document.getElementById("hideReplacedToggle"),
    hideUnplannedToggle: document.getElementById("hideUnplannedToggle"),
    hideCompletedToggle: document.getElementById("hideCompletedToggle"),
    catalogSearch: document.getElementById("catalogSearch"),
    catalogGrid: document.getElementById("catalogGrid"),
    plannedCount: document.getElementById("plannedCount"),
    completedCount: document.getElementById("completedCount"),
    completionRate: document.getElementById("completionRate"),
    upcomingCount: document.getElementById("upcomingCount"),
    budgetTotal: document.getElementById("budgetTotal"),
    correctionList: document.getElementById("correctionList"),
    sourceList: document.getElementById("sourceList"),
    toast: document.getElementById("toast"),
    importFile: document.getElementById("importFile"),
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || saved.version !== 1) return structuredClone(defaultState);
      return {
        ...structuredClone(defaultState),
        ...saved,
        childGender: saved.childGender || "female",
        paidSelected: { ...saved.paidSelected },
        planSelected: { ...saved.planSelected },
        planConfirmed: { ...saved.planConfirmed },
        completed: { ...saved.completed },
        actualDates: { ...saved.actualDates },
        customDates: { ...saved.customDates },
        customMonths: { ...saved.customMonths },
        hideReplaced: Boolean(saved.hideReplaced),
        hideUnplanned: Boolean(saved.hideUnplanned),
        hideCompleted: Boolean(saved.hideCompleted),
      };
    } catch {
      return structuredClone(defaultState);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function cleanName(value) {
    return String(value ?? "")
      .replace(/^【[^】]+】/u, "")
      .replace(/^\s+|\s+$/gu, "");
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }

  function parseIso(iso) {
    if (!iso) return null;
    const [year, month, day] = iso.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  function isoFromDate(date) {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addMonths(date, count) {
    const result = new Date(date.getTime());
    const originalDay = result.getDate();
    result.setDate(1);
    result.setMonth(result.getMonth() + count);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(originalDay, lastDay));
    return result;
  }

  function addDays(date, count) {
    const result = new Date(date.getTime());
    result.setDate(result.getDate() + count);
    return result;
  }

  function formatDate(date) {
    if (!date) return "未设置";
    return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }

  function ageLabel(months) {
    if (months === 0) return "出生时";
    if (months < 12) return `${months}月龄`;
    if (months % 12 === 0) return `${months / 12}周岁`;
    return `${Math.floor(months / 12)}岁${months % 12}个月`;
  }

  function activeReplacementMap() {
    const map = new Map();
    for (const plan of DATA.replacementPlans) {
      const selected = Boolean(state.planSelected[plan.id]);
      const confirmed = !plan.confirmRequired || Boolean(state.planConfirmed[plan.id]);
      if (!selected || !confirmed) continue;
      for (const taskId of plan.replaces) map.set(taskId, plan.name);
    }
    return map;
  }

  function getEffectiveTiming(taskId, defaultMonths, birth) {
    const defaultDueDate = addMonths(birth, defaultMonths);
    const customDateIso = state.customDates[taskId];
    const customMonth = state.customMonths[taskId];

    if (customDateIso) {
      const customDate = parseIso(customDateIso);
      if (customDate) {
        let ageMonths = customMonth !== undefined
          ? customMonth
          : Math.max(0, Math.round((customDate.getFullYear() - birth.getFullYear()) * 12 + (customDate.getMonth() - birth.getMonth())));
        return {
          dueDate: customDate,
          ageMonths: ageMonths,
          isCustom: true,
          defaultDueDate: defaultDueDate,
          defaultAgeMonths: defaultMonths,
        };
      }
    } else if (customMonth !== undefined) {
      const newDueDate = addMonths(birth, customMonth);
      return {
        dueDate: newDueDate,
        ageMonths: customMonth,
        isCustom: customMonth !== defaultMonths,
        defaultDueDate: defaultDueDate,
        defaultAgeMonths: defaultMonths,
      };
    }

    return {
      dueDate: defaultDueDate,
      ageMonths: defaultMonths,
      isCustom: false,
      defaultDueDate: defaultDueDate,
      defaultAgeMonths: defaultMonths,
    };
  }

  function buildItems() {
    const birth = parseIso(state.birthDate) ?? parseIso(DATA.meta.defaultBirthDate);
    const replacements = activeReplacementMap();
    const isMale = state.childGender === "male";

    const items = [];

    for (const task of DATA.schedule) {
      // Gender specific filtering for HPV in national plan
      if (task.gender === "female" && isMale) {
        const timing = getEffectiveTiming(task.id, task.ageMonths, birth);
        items.push({
          ...task,
          planned: false,
          replacedBy: "国家免疫规划（2026年版）免费双价HPV仅面向13周岁女童；男童可自费接种九价HPV",
          dueDate: timing.dueDate,
          ageMonths: timing.ageMonths,
          isCustom: timing.isCustom,
          defaultDueDate: timing.defaultDueDate,
          defaultAgeMonths: timing.defaultAgeMonths,
          isPackage: false,
        });
        continue;
      }

      const replacedBy = replacements.get(task.id) || "";
      const selected = task.isFree ? !replacedBy : Boolean(state.paidSelected[task.id]);
      const timing = getEffectiveTiming(task.id, task.ageMonths, birth);
      items.push({
        ...task,
        planned: selected,
        replacedBy,
        dueDate: timing.dueDate,
        ageMonths: timing.ageMonths,
        isCustom: timing.isCustom,
        defaultDueDate: timing.defaultDueDate,
        defaultAgeMonths: timing.defaultAgeMonths,
        isPackage: false,
      });
    }

    for (const plan of DATA.replacementPlans) {
      if (!state.planSelected[plan.id]) continue;
      for (const dose of plan.doses) {
        const timing = getEffectiveTiming(dose.id, dose.ageMonths, birth);
        items.push({
          id: dose.id,
          uid: null,
          stage: plan.name,
          ageMonths: timing.ageMonths,
          name: dose.name,
          isFree: false,
          category: "paid",
          site: "以门诊及产品说明书为准",
          route: "以门诊及产品说明书为准",
          dose: "",
          prevents: plan.short,
          cost: dose.price,
          detail: plan.note,
          planned: true,
          replacedBy: "",
          dueDate: timing.dueDate,
          isCustom: timing.isCustom,
          defaultDueDate: timing.defaultDueDate,
          defaultAgeMonths: timing.defaultAgeMonths,
          isPackage: true,
          packageId: plan.id,
        });
      }
    }
    return items.sort((a, b) => a.ageMonths - b.ageMonths || a.dueDate - b.dueDate || Number(b.isFree) - Number(a.isFree) || a.name.localeCompare(b.name, "zh-CN"));
  }

  function itemStatus(item) {
    if (item.replacedBy) return "replaced";
    if (!item.planned) return "not-planned";
    if (state.completed[item.id]) return "done";
    const asOf = parseIso(state.asOfDate) ?? new Date();
    const due = item.dueDate;
    if (due < asOf) return "overdue";
    if (due <= addDays(asOf, 90)) return "upcoming";
    return "later";
  }

  function statusBadge(status) {
    const labels = {
      replaced: ["已替代/不适用", "replaced"],
      done: ["已完成", "done"],
      overdue: ["已过计划日", "overdue"],
      upcoming: ["未来90天", "upcoming"],
    };
    if (!labels[status]) return "";
    return `<span class="badge badge--${labels[status][1]}">${labels[status][0]}</span>`;
  }

  function renderReplacementPlans() {
    elements.replacementPlans.innerHTML = DATA.replacementPlans.map((plan) => {
      const selected = Boolean(state.planSelected[plan.id]);
      const confirmed = Boolean(state.planConfirmed[plan.id]);
      const impactText = plan.confirmRequired && selected && !confirmed
        ? `已选择，但尚未取消 ${plan.replaces.length} 个免费剂次`
        : `启用后直接替代 ${plan.replaces.length} 个对应免费剂次`;
      return `
        <article class="replacement-card ${selected ? "is-selected" : ""}">
          <div class="replacement-card__top">
            <div class="replacement-card__title">
              <label class="switch" aria-label="选择${escapeHtml(plan.name)}">
                <input class="plan-toggle" type="checkbox" data-plan-id="${escapeHtml(plan.id)}" ${selected ? "checked" : ""}>
                <span></span>
              </label>
              <div>
                <h3>${escapeHtml(plan.name)}</h3>
                <p class="replacement-card__short">${escapeHtml(plan.short)}</p>
              </div>
            </div>
            <div class="replacement-card__price">${formatMoney(plan.price)}</div>
          </div>
          <p class="replacement-card__note">${escapeHtml(plan.note)}</p>
          <div class="replacement-card__impact">${escapeHtml(impactText)}</div>
          ${plan.confirmRequired && selected ? `
            <label class="confirm-row">
              <input class="plan-confirm" type="checkbox" data-plan-id="${escapeHtml(plan.id)}" ${confirmed ? "checked" : ""}>
              <span>接种门诊已根据具体品牌、年龄和既往剂次确认：该方案可替代上述免费剂次。</span>
            </label>` : ""}
        </article>`;
    }).join("");
  }

  function matchesTimelineFilter(item, status) {
    if (state.hideReplaced && item.replacedBy) return false;
    if (state.hideUnplanned && !item.planned) return false;
    if (state.hideCompleted && state.completed[item.id]) return false;

    const query = elements.scheduleSearch.value.trim().toLowerCase();
    const filter = elements.scheduleFilter.value;
    const text = `${item.name} ${item.prevents} ${item.detail}`.toLowerCase();
    if (query && !text.includes(query)) return false;
    if (filter === "planned" && !item.planned) return false;
    if (filter === "upcoming" && status !== "upcoming") return false;
    if (filter === "overdue" && status !== "overdue") return false;
    if (filter === "uncompleted" && state.completed[item.id]) return false;
    if (filter === "paid" && item.category !== "paid") return false;
    if (filter === "replaced" && status !== "replaced") return false;
    return true;
  }

  function renderTimeline() {
    if (elements.hideReplacedToggle) {
      elements.hideReplacedToggle.checked = Boolean(state.hideReplaced);
      elements.hideReplacedToggle.closest(".toggle-chip")?.classList.toggle("is-active", Boolean(state.hideReplaced));
    }
    if (elements.hideUnplannedToggle) {
      elements.hideUnplannedToggle.checked = Boolean(state.hideUnplanned);
      elements.hideUnplannedToggle.closest(".toggle-chip")?.classList.toggle("is-active", Boolean(state.hideUnplanned));
    }
    if (elements.hideCompletedToggle) {
      elements.hideCompletedToggle.checked = Boolean(state.hideCompleted);
      elements.hideCompletedToggle.closest(".toggle-chip")?.classList.toggle("is-active", Boolean(state.hideCompleted));
    }

    const items = buildItems().map((item) => ({ ...item, status: itemStatus(item) }));
    const visibleItems = items.filter((item) => matchesTimelineFilter(item, item.status));
    const groups = new Map();
    for (const item of visibleItems) {
      if (!groups.has(item.ageMonths)) groups.set(item.ageMonths, []);
      groups.get(item.ageMonths).push(item);
    }

    elements.timeline.innerHTML = [...groups.entries()].map(([months, groupItems]) => {
      const due = groupItems[0]?.dueDate;
      return `
        <section class="age-group" data-age-months="${months}">
          <div class="age-label">
            <strong>${escapeHtml(ageLabel(months))}</strong>
            <span>${escapeHtml(formatDate(due))}</span>
          </div>
          <div class="age-items" data-age-months="${months}">
            ${groupItems.map(renderTaskCard).join("")}
          </div>
        </section>`;
    }).join("");

    elements.emptyTimeline.hidden = visibleItems.length > 0;
    updateSummary(items);
    bindDragEvents();
  }

  function renderTaskCard(item) {
    const isPaidChoice = item.category === "paid" && !item.isPackage;
    const checked = item.planned;
    const disabled = item.isFree || item.isPackage || Boolean(item.replacedBy);
    const completionDisabled = !item.planned || Boolean(item.replacedBy);
    const classes = [
      "task-card",
      item.category === "paid" ? "is-paid" : "",
      item.replacedBy ? "is-replaced" : "",
      item.status === "done" ? "is-done" : "",
      item.status === "overdue" ? "is-overdue" : "",
      item.isPackage ? "is-package" : "",
      item.planned ? "is-planned" : "",
    ].filter(Boolean).join(" ");
    const typeBadge = item.isPackage
      ? '<span class="badge badge--package">自费方案</span>'
      : item.isFree
        ? '<span class="badge badge--free">免费必选</span>'
        : '<span class="badge badge--paid">自费可选</span>';
    const actualDate = state.actualDates[item.id] || "";
    const dueIso = isoFromDate(item.dueDate);

    return `
      <article class="${classes}" draggable="true" data-task-id="${escapeHtml(item.id)}">
        <!-- 1. Left Lead: Drag Handle & Task Checkbox -->
        <div class="task-card__lead">
          <span class="drag-handle" title="按住可拖动到其他月龄" aria-hidden="true">⠿</span>
          <input
            class="task-select ${isPaidChoice ? "paid-choice" : ""}"
            type="checkbox"
            data-task-id="${escapeHtml(item.id)}"
            aria-label="${checked ? "取消" : "选择"}${escapeHtml(cleanName(item.name))}"
            ${checked ? "checked" : ""}
            ${disabled ? "disabled" : ""}
          >
        </div>

        <!-- 2. Middle Body: Title, Badges, Meta, Detail -->
        <div class="task-card__body">
          <div class="task-card__header">
            <h3 class="task-title">${escapeHtml(cleanName(item.name))}</h3>
            <div class="task-badges">
              ${typeBadge}
              ${statusBadge(item.status)}
              ${item.isCustom ? '<span class="badge badge--custom" title="此项目的计划日期已被您自定义修改">已自定</span>' : ''}
            </div>
          </div>
          <div class="task-meta">
            ${item.prevents ? `<span class="meta-chip">🛡️ 预防：${escapeHtml(item.prevents)}</span>` : ""}
            ${item.route ? `<span class="meta-chip">💉 ${escapeHtml(item.route)}${item.site ? ` · ${escapeHtml(item.site)}` : ""}</span>` : ""}
            ${item.dose ? `<span class="meta-chip">💊 ${escapeHtml(item.dose)}</span>` : ""}
          </div>
          ${item.detail ? `<div class="task-note">${escapeHtml(item.detail)}</div>` : ""}
          ${item.replacedBy ? `<div class="task-replacement-alert">✓ ${escapeHtml(item.replacedBy)}</div>` : ""}
        </div>

        <!-- 3. Right Aside: Planned Date, Month Changer, Completed Checkbox & Actual Date -->
        <div class="task-card__aside">
          <div class="schedule-box">
            <div class="schedule-box__header">
              <span>计划接种</span>
              ${item.isCustom ? `<button class="button-reset-date" type="button" data-task-id="${escapeHtml(item.id)}" title="恢复推荐计划日期（${ageLabel(item.defaultAgeMonths)}）">↺ 恢复</button>` : ""}
            </div>
            <input
              class="custom-due-date ${item.isCustom ? "is-custom" : ""}"
              type="date"
              data-task-id="${escapeHtml(item.id)}"
              value="${escapeHtml(dueIso)}"
              title="点击修改计划接种日期"
            >
            <select class="month-changer" data-task-id="${escapeHtml(item.id)}" aria-label="移动到其他月龄">
              <option value="" disabled selected>移至其他月龄...</option>
              ${MONTH_OPTIONS.map(m => `<option value="${m.val}" ${m.val === item.ageMonths ? "disabled" : ""}>${m.label}</option>`).join("")}
            </select>
          </div>

          <div class="record-box">
            <label class="done-check">
              <input class="done-choice" type="checkbox" data-task-id="${escapeHtml(item.id)}" ${state.completed[item.id] ? "checked" : ""} ${completionDisabled ? "disabled" : ""}>
              <span>已接种</span>
            </label>
            <input class="actual-date" type="date" data-task-id="${escapeHtml(item.id)}" value="${escapeHtml(actualDate)}" aria-label="实际接种日期" ${completionDisabled ? "disabled" : ""}>
            ${item.category === "paid" ? `<div class="price-tag">${formatMoney(item.cost)}</div>` : ""}
          </div>
        </div>
      </article>`;
  }

  function bindDragEvents() {
    const cards = document.querySelectorAll(".task-card[draggable='true']");
    const groups = document.querySelectorAll(".age-group");

    cards.forEach((card) => {
      card.addEventListener("dragstart", (e) => {
        draggedTaskId = card.dataset.taskId;
        card.classList.add("is-dragging");
        e.dataTransfer.setData("text/plain", draggedTaskId);
        e.dataTransfer.effectAllowed = "move";
      });

      card.addEventListener("dragend", () => {
        draggedTaskId = null;
        card.classList.remove("is-dragging");
        groups.forEach((g) => g.classList.remove("is-dragover"));
      });
    });

    groups.forEach((group) => {
      group.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        group.classList.add("is-dragover");
      });

      group.addEventListener("dragleave", (e) => {
        if (!group.contains(e.relatedTarget)) {
          group.classList.remove("is-dragover");
        }
      });

      group.addEventListener("drop", (e) => {
        e.preventDefault();
        group.classList.remove("is-dragover");
        const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
        if (!taskId) return;

        const targetMonths = parseInt(group.dataset.ageMonths, 10);
        if (Number.isNaN(targetMonths)) return;

        const birth = parseIso(state.birthDate) ?? parseIso(DATA.meta.defaultBirthDate);
        const newDate = addMonths(birth, targetMonths);

        state.customMonths[taskId] = targetMonths;
        state.customDates[taskId] = isoFromDate(newDate);
        saveState();
        renderTimeline();
        showToast(`已移动至 ${ageLabel(targetMonths)}（计划 ${formatDate(newDate)}）`);
      });
    });
  }

  function updateSummary(items) {
    const planned = items.filter((item) => item.planned);
    const completed = planned.filter((item) => state.completed[item.id]);
    const upcoming = planned.filter((item) => itemStatus(item) === "upcoming");
    const individualPaid = DATA.schedule
      .filter((item) => !item.isFree && state.paidSelected[item.id])
      .reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
    const packagePaid = DATA.replacementPlans
      .filter((plan) => state.planSelected[plan.id])
      .reduce((sum, plan) => sum + plan.price, 0);
    const rate = planned.length ? Math.round((completed.length / planned.length) * 100) : 0;

    elements.plannedCount.textContent = String(planned.length);
    elements.completedCount.textContent = String(completed.length);
    elements.completionRate.textContent = `完成率 ${rate}%`;
    elements.upcomingCount.textContent = String(upcoming.length);
    elements.budgetTotal.textContent = formatMoney(individualPaid + packagePaid);
  }

  function renderCatalog() {
    const query = elements.catalogSearch.value.trim().toLowerCase();
    const filtered = DATA.catalog.filter((item) => Object.values(item).join(" ").toLowerCase().includes(query));
    elements.catalogGrid.innerHTML = filtered.map((item) => {
      const isFree = String(item["疫苗大类"]).includes("免费");
      return `
        <article class="catalog-card">
          <div class="catalog-card__top">
            <div>
              <h3>${escapeHtml(item["疫苗名称"])}</h3>
              <div class="catalog-card__type">${escapeHtml(item["疫苗大类"])}</div>
            </div>
            <span class="catalog-card__cost">${escapeHtml(item["价格公示/收费标准"])}</span>
          </div>
          <dl>
            <dt>适龄</dt><dd>${escapeHtml(item["推荐接种对象/月龄"])}</dd>
            <dt>剂次</dt><dd>${escapeHtml(item["接种剂次"])}</dd>
            <dt>预防</dt><dd>${escapeHtml(item["可预防疾病"])}</dd>
            <dt>方式</dt><dd>${escapeHtml(`${item["接种途径"] || ""} · ${item["接种部位"] || ""}`)}</dd>
            <dt>禁忌提示</dt><dd>${escapeHtml(item["接种禁忌"])}</dd>
            <dt>常见反应</dt><dd>${escapeHtml(item["不良反应"])}</dd>
          </dl>
          ${isFree ? '<span class="badge badge--free">原表：免疫规划</span>' : '<span class="badge badge--paid">原表：非免疫规划</span>'}
        </article>`;
    }).join("");
  }

  function renderProfile() {
    elements.childName.value = state.childName;
    if (elements.childGender) elements.childGender.value = state.childGender;
    elements.birthDate.value = state.birthDate;
    elements.asOfDate.value = state.asOfDate;

    const childLabel = state.childName.trim() || (state.childGender === "female" ? "女宝" : "男宝");
    elements.footerChildName.textContent = childLabel;
    const birth = parseIso(state.birthDate);
    const genderNote = state.childGender === "female"
      ? "女宝满 13 周岁享国家免费双价 HPV 疫苗（或自费升级四价/九价）"
      : "男宝按 2026 规范不享免费双价 HPV，可自费选择九价 HPV";
    elements.profileNote.innerHTML = birth
      ? `💡 <strong>${escapeHtml(childLabel)}</strong>（${state.childGender === "female" ? "女宝" : "男宝"}）的接种计划从 <strong>${formatDate(birth)}</strong> 起算 · ${genderNote} · 依据 2026 年 6 月版国家免疫规划`
      : "💡 请设置出生日期或预产期，系统将自动推算全周期接种计划。";
  }

  function renderSources() {
    elements.correctionList.innerHTML = DATA.correctionNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("");
    elements.sourceList.innerHTML = DATA.sources.map((source) => `
      <li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a></li>`).join("");
  }

  function renderAll() {
    renderProfile();
    renderReplacementPlans();
    renderTimeline();
    renderCatalog();
    renderSources();
  }

  function handlePlanToggle(input) {
    const plan = DATA.replacementPlans.find((item) => item.id === input.dataset.planId);
    if (!plan) return;
    const selected = input.checked;
    if (selected && plan.exclusiveGroup) {
      for (const peer of DATA.replacementPlans.filter((item) => item.exclusiveGroup === plan.exclusiveGroup && item.id !== plan.id)) {
        state.planSelected[peer.id] = false;
        state.planConfirmed[peer.id] = false;
      }
    }
    state.planSelected[plan.id] = selected;
    if (!selected) state.planConfirmed[plan.id] = false;
    saveState();
    renderAll();
    showToast(selected ? `已加入“${plan.name}”` : `已取消“${plan.name}”`);
  }

  function handlePlanConfirm(input) {
    state.planConfirmed[input.dataset.planId] = input.checked;
    saveState();
    renderAll();
    showToast(input.checked ? "已按门诊确认应用替代关系" : "已恢复对应免费疫苗");
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2200);
  }

  function exportBackup() {
    const backup = {
      app: "宝贝疫苗接种全周期规划",
      guideline: "2026年6月版国家免疫规划标准",
      exportedAt: new Date().toISOString(),
      state,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = (state.childName.trim() || (state.childGender === "female" ? "女宝" : "男宝")).replace(/[\\/:*?"<>|]/g, "-");
    link.href = url;
    link.download = `${safeName}-疫苗规划备份-${todayIso}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("备份已导出");
  }

  async function importBackup(file) {
    try {
      const parsed = JSON.parse(await file.text());
      const imported = parsed.state ?? parsed;
      if (!imported || imported.version !== 1 || typeof imported.birthDate !== "string") throw new Error("格式不匹配");
      state = {
        ...structuredClone(defaultState),
        ...imported,
        childGender: imported.childGender || "female",
        paidSelected: { ...imported.paidSelected },
        planSelected: { ...imported.planSelected },
        planConfirmed: { ...imported.planConfirmed },
        completed: { ...imported.completed },
        actualDates: { ...imported.actualDates },
        customDates: { ...imported.customDates },
        customMonths: { ...imported.customMonths },
        hideReplaced: Boolean(imported.hideReplaced),
        hideUnplanned: Boolean(imported.hideUnplanned),
        hideCompleted: Boolean(imported.hideCompleted),
      };
      saveState();
      renderAll();
      showToast("记录已导入");
    } catch {
      showToast("无法导入：请选择本页面导出的备份文件");
    } finally {
      elements.importFile.value = "";
    }
  }

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.matches(".plan-toggle")) handlePlanToggle(target);
    if (target.matches(".plan-confirm")) handlePlanConfirm(target);
    if (target.matches(".paid-choice")) {
      state.paidSelected[target.dataset.taskId] = target.checked;
      saveState();
      renderTimeline();
      showToast(target.checked ? "已加入自费项目" : "已移出自费项目");
    }
    if (target.matches(".done-choice")) {
      const id = target.dataset.taskId;
      state.completed[id] = target.checked;
      if (target.checked && !state.actualDates[id]) state.actualDates[id] = state.asOfDate || todayIso;
      saveState();
      renderTimeline();
    }
    if (target.matches(".actual-date")) {
      state.actualDates[target.dataset.taskId] = target.value;
      saveState();
    }
    if (target.matches(".custom-due-date")) {
      const taskId = target.dataset.taskId;
      const newIso = target.value;
      if (!newIso) return;
      const newDate = parseIso(newIso);
      const birth = parseIso(state.birthDate) ?? parseIso(DATA.meta.defaultBirthDate);
      const months = Math.max(0, Math.round((newDate.getFullYear() - birth.getFullYear()) * 12 + (newDate.getMonth() - birth.getMonth()) + (newDate.getDate() - birth.getDate()) / 30.4375));
      state.customDates[taskId] = newIso;
      state.customMonths[taskId] = months;
      saveState();
      renderTimeline();
      showToast(`已调整计划日期为 ${formatDate(newDate)}（${ageLabel(months)}）`);
    }
    if (target.matches(".month-changer")) {
      const taskId = target.dataset.taskId;
      const targetMonths = parseInt(target.value, 10);
      if (Number.isNaN(targetMonths)) return;
      const birth = parseIso(state.birthDate) ?? parseIso(DATA.meta.defaultBirthDate);
      const newDate = addMonths(birth, targetMonths);
      state.customMonths[taskId] = targetMonths;
      state.customDates[taskId] = isoFromDate(newDate);
      saveState();
      renderTimeline();
      showToast(`已移至 ${ageLabel(targetMonths)}（计划 ${formatDate(newDate)}）`);
    }
  });

  if (elements.hideReplacedToggle) {
    elements.hideReplacedToggle.addEventListener("change", (e) => {
      state.hideReplaced = e.target.checked;
      saveState();
      renderTimeline();
      showToast(e.target.checked ? "已隐藏被替代的免费疫苗" : "已显示被替代的免费疫苗");
    });
  }

  if (elements.hideUnplannedToggle) {
    elements.hideUnplannedToggle.addEventListener("change", (e) => {
      state.hideUnplanned = e.target.checked;
      saveState();
      renderTimeline();
      showToast(e.target.checked ? "已隐藏未选择的项目" : "已显示所有备选项目");
    });
  }

  if (elements.hideCompletedToggle) {
    elements.hideCompletedToggle.addEventListener("change", (e) => {
      state.hideCompleted = e.target.checked;
      saveState();
      renderTimeline();
      showToast(e.target.checked ? "已隐藏已打过的疫苗" : "已显示全部疫苗");
    });
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (target.matches(".button-reset-date")) {
      const taskId = target.dataset.taskId;
      delete state.customDates[taskId];
      delete state.customMonths[taskId];
      saveState();
      renderTimeline();
      showToast("已恢复推荐计划日期");
    }
  });

  elements.childName.addEventListener("input", () => {
    state.childName = elements.childName.value;
    saveState();
    renderProfile();
  });

  elements.childGender.addEventListener("change", () => {
    state.childGender = elements.childGender.value;
    saveState();
    renderProfile();
    renderTimeline();
    showToast(state.childGender === "female" ? "已切换为女宝模式（含13岁免费双价HPV）" : "已切换为男宝模式（提示自费九价HPV）");
  });

  elements.birthDate.addEventListener("change", () => {
    state.birthDate = elements.birthDate.value || DATA.meta.defaultBirthDate;
    saveState();
    renderProfile();
    renderTimeline();
  });

  elements.asOfDate.addEventListener("change", () => {
    state.asOfDate = elements.asOfDate.value || todayIso;
    saveState();
    renderTimeline();
  });

  elements.scheduleSearch.addEventListener("input", renderTimeline);
  elements.scheduleFilter.addEventListener("change", renderTimeline);
  elements.catalogSearch.addEventListener("input", renderCatalog);

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("is-active", tab === button));
      document.querySelectorAll(".tab-panel").forEach((panel) => { panel.hidden = true; });
      document.getElementById(`${button.dataset.tab}Panel`).hidden = false;
    });
  });

  document.getElementById("printButton").addEventListener("click", () => window.print());
  document.getElementById("exportButton").addEventListener("click", exportBackup);
  document.getElementById("importButton").addEventListener("click", () => elements.importFile.click());
  elements.importFile.addEventListener("change", () => {
    const file = elements.importFile.files?.[0];
    if (file) importBackup(file);
  });

  document.getElementById("resetButton").addEventListener("click", () => {
    if (!window.confirm("确定清空已选方案、自定义日期和接种记录吗？此操作不会删除网页文件。")) return;
    state = structuredClone(defaultState);
    saveState();
    elements.scheduleSearch.value = "";
    elements.scheduleFilter.value = "all";
    renderAll();
    showToast("规划已重置");
  });

  renderAll();
})();
