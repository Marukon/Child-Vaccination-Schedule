(() => {
  "use strict";
  const data = window.VACCINE_DATA;
  const r = window.VACCINE_REPLACEMENTS;
  const p = window.VACCINE_PLANNER;
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const name = (value) => String(value).replace(/^【[^】]+】\s*/u, "");
  const moneyFormatter = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 0 });
  const money = (value) => moneyFormatter.format(value);
  const dateLabel = (date) => `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  const shortDate = (date) => `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  const age = (m) => m === 0 ? "出生时" : m < 12 ? `${m} 月龄` : m % 12 === 0 ? `${m / 12} 周岁` : `${Math.floor(m / 12)} 岁 ${m % 12} 个月`;
  const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 24, 36, 48, 72, 108, 156, 162, 192];
  const icons = {
    layers: '<rect x="6" y="6" width="11" height="11" rx="2"/><path d="M9 20h9a2 2 0 0 0 2-2V9"/>',
    shield: '<path d="M12 3 5 6v5c0 4 2.5 7.5 7 10 4.5-2.5 7-6 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    circle: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8m-4-4h8"/>',
  };
  const groupOf = (id) => r.groups.find((group) => r.ids(group).includes(id));
  let state = p.empty();
  let storageIssue = false;
  try {
    const stored = localStorage.getItem(p.storageKey);
    if (stored) state = p.readState(JSON.parse(stored));
  } catch {
    storageIssue = true;
  }
  let items = [];
  let comparison;
  let editId;
  let draggingId;
  let toastTimer;

  function toast(message) {
    clearTimeout(toastTimer);
    const el = $("toast");
    el.textContent = message;
    el.classList.add("is-visible");
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 4300);
  }

  function persist(message) {
    try {
      localStorage.setItem(p.storageKey, JSON.stringify(state));
      storageIssue = false;
      if (message) toast(message);
    } catch {
      storageIssue = true;
      toast("浏览器未保存本次变更，请导出备份。");
    }
  }

  function renderProfile() {
    for (const key of ["childName", "childGender", "birthDate", "asOfDate"]) {
      if ($(key).value !== state[key]) $(key).value = state[key];
    }
    $("footerChildName").textContent = state.childName.trim() || "孩子";
    $("profileNote").textContent = state.exampleBirthday
      ? "当前使用示例生日。填写孩子的出生日期后，计划会自动更新。"
      : (storageIssue ? "浏览器无法读取或保存记录，请保留导出的备份。" : "计划按出生日期推算；调整不会改动已经记录的实际接种日期。");
  }

  function renderSummary() {
    const stats = p.totals(items);
    $("plannedCount").textContent = stats.planned;
    $("completedCount").textContent = stats.done;
    $("completionRate").textContent = `计划完成率 ${stats.planned ? Math.round(stats.done / stats.planned * 100) : 0}%`;
    $("upcomingCount").textContent = stats.upcoming.length;
    $("nextVisit").textContent = stats.upcoming[0] ? `最近计划 · ${shortDate(stats.upcoming[0].plannedDate)}` : "此后 90 天无计划";
    $("budgetTotal").textContent = money(stats.budget);
  }

  function renderReplacement() {
    $("replacementPlans").innerHTML = r.groups.map((group) => {
      const current = r.plans.find((plan) => plan.id === r.selection(state, group));
      const status = current ? (r.active(state, current) ? "已应用" : "待门诊确认") : "当前安排";
      return `<button class="replacement-row panel" type="button" data-compare="${group.id}" aria-haspopup="dialog">
        <span class="replacement-icon"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${icons[group.icon]}</svg></span>
        <span class="replacement-text"><strong>${group.title}</strong><small>${status} · ${esc(current?.label || r.defaultName(group, state))}</small></span>
        <span class="chevron" aria-hidden="true">›</span>
      </button>`;
    }).join("");
  }

  const labels = { replaced: "已调整", done: "已完成", review: "需核对衔接", overdue: "已过计划日", upcoming: "未来 90 天", "not-applicable": "当前资料不适用" };
  function visible(item) {
    const filter = $("scheduleFilter").value;
    if (filter !== "replaced" && state.hideReplaced && item.replacedBy) return false;
    if (!["done", "replaced", "paid"].includes(filter) && state.hideUnplanned && !item.planned && !item.hasRecord) return false;
    if (filter !== "done" && state.hideCompleted && item.done) return false;
    const query = $("scheduleSearch").value.trim().toLowerCase();
    if (query && !`${item.name} ${item.prevents || ""} ${item.detail || ""}`.toLowerCase().includes(query)) return false;
    return ({
      all: true, planned: item.planned, upcoming: item.status === "upcoming", overdue: item.status === "overdue",
      uncompleted: item.planned && !item.done, done: item.hasRecord, paid: !item.isFree, replaced: Boolean(item.replacedBy),
    })[filter];
  }

  function taskRow(item) {
    const group = item.plan ? r.groups.find((g) => g.id === item.plan.group) : groupOf(item.id);
    const title = name(item.name);
    const kind = item.isFree ? "免疫规划" : item.course ? "自费全程" : "自费可选";
    const description = item.hasRecord
      ? (state.actualDates[item.id] ? `实际接种 · ${dateLabel(p.parse(state.actualDates[item.id]))}${item.actualAfterView ? "（晚于查看日）" : ""}` : "已录入接种记录，日期未填")
      : item.replacedBy ? `当前由「${item.replacedBy}」方案安排`
      : !item.applicable ? "国家免疫规划双价 HPV 面向符合条件的 13 周岁女孩"
      : `${item.isCustom ? "自定计划" : "参考计划"} · ${dateLabel(item.plannedDate)}${item.course ? "（全程备忘）" : ""}`;
    return `<article class="task-card ${item.done ? "task-card--done" : ""}" data-task-id="${item.id}" ${item.planned && !item.hasRecord ? 'draggable="true"' : ""}>
      <div class="task-main">
        <div class="task-badges"><span class="badge badge--${item.isFree ? "free" : "paid"}">${kind}</span>${labels[item.status] ? `<span class="badge badge--${item.status}">${labels[item.status]}</span>` : ""}</div>
        <h4>${esc(title)}</h4><p>${esc(description)}</p>
      </div>
      <div class="task-actions">
        ${!item.isFree && !item.plan && !item.planned && !item.hasRecord && !standaloneConflict(item) ? `<button class="button" type="button" data-add="${item.id}" aria-label="加入${esc(title)}">加入计划</button>` : ""}
        ${group ? `<button class="button button--quiet" type="button" data-compare="${group.id}" aria-haspopup="dialog" aria-label="查看${esc(title)}的备选方案">看备选</button>` : ""}
        <button class="button" type="button" data-edit="${item.id}" aria-haspopup="dialog" aria-label="${item.planned || item.hasRecord ? "编辑" : "查看"}${esc(title)}">${item.planned || item.hasRecord ? (item.hasRecord ? "编辑记录" : "记录 / 改期") : "详情"}</button>
      </div>
    </article>`;
  }

  function renderTimeline() {
    const shown = items.filter(visible);
    const groups = Map.groupBy ? Map.groupBy(shown, (item) => item.ageMonths) : shown.reduce((map, item) => {
      if (!map.has(item.ageMonths)) map.set(item.ageMonths, []);
      map.get(item.ageMonths).push(item);
      return map;
    }, new Map());
    $("timeline").innerHTML = [...groups].map(([m, rows]) => `<section class="age-group" data-months="${m}">
      <h3 class="age-heading"><span class="age-dot"></span>${age(m)} <small>${rows.length} 项</small></h3>
      <div class="age-items">${rows.map(taskRow).join("")}</div></section>`).join("");
    $("emptyTimeline").hidden = Boolean(shown.length);
    for (const [key, id] of [["hideReplaced", "hideReplacedToggle"], ["hideUnplanned", "hideUnplannedToggle"], ["hideCompleted", "hideCompletedToggle"]]) $(id).checked = state[key];
  }

  function renderAll() {
    items = p.items(state);
    renderProfile();
    renderSummary();
    renderReplacement();
    renderTimeline();
  }

  function renderCatalog() {
    const query = $("catalogSearch").value.trim().toLowerCase();
    const filtered = data.catalog.filter((entry) => Object.values(entry).join(" ").toLowerCase().includes(query));
    $("catalogCount").textContent = filtered.length ? `${filtered.length} 项` : "未找到相关疫苗，试试其他关键词。";
    $("catalogGrid").innerHTML = filtered.map((entry) => `<details class="panel catalog-card"><summary>
      <span><strong>${esc(entry["疫苗名称"])}</strong><small>${esc(entry["疫苗大类"])}</small></span>
      <span class="badge badge--paid">${esc(entry["价格公示/收费标准"])}</span></summary>
      <dl>${Object.entries({ 适龄: "推荐接种对象/月龄", 剂次: "接种剂次", 预防: "可预防疾病", 方式: "接种途径", 部位: "接种部位", 禁忌提示: "接种禁忌", 常见反应: "不良反应" }).map(([label, key]) =>
      `<dt>${label}</dt><dd>${esc(entry[key] || "以产品说明书为准")}</dd>`).join("")}</dl></details>`).join("");
  }

  function renderSources() {
    const national = "https://www.ndcpa.gov.cn/jbkzzx/c100014/common/content/content_2073005020766703616.html";
    const sources = [
      { label: "国家免疫规划疫苗儿童免疫程序及说明（2026 年版）· PDF", url: r.guideline },
      { label: "国家疾控局 · 发布通知", url: national },
      { label: "国家疾控局 · 解读问答", url: "https://www.ndcpa.gov.cn/jbkzzx/c100013/common/content/content_2073002930292035584.html" },
      { label: "深圳市卫生健康委 · 进口四价、九价 HPV 男性适龄范围", url: "https://www.sz.gov.cn/hdjlpt/detail?pid=3461654&via=pc" },
      data.sources.at(-1),
    ];
    $("correctionList").innerHTML = [
      "常规百白破免疫程序为 2、4、6、18 月龄及 6 周岁；脊灰常规程序包括 2、3、4 月龄及 4 周岁。",
      "乙脑、甲肝的减毒活与灭活程序在国家免疫规划中均有说明。实际可用产品和衔接请向门诊核对。",
      "按说明书完成规定剂次的含 IPV、含百日咳成分或流脑结合疫苗，可按规范计入相应剂次。产品年龄、程序与间隔请交门诊核对。",
      "国家免疫规划双价 HPV 面向符合条件的 13 周岁女孩。已按说明书完成 HPV 全程者，无需重复接种。",
      "错过计划日时，请带接种证咨询门诊。时间线按常规程序展示，补种安排需单独确认。",
    ].map((note) => `<li>${note}</li>`).join("");
    $("sourceList").innerHTML = sources.map((source) => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} ↗</a></li>`).join("");
  }

  function openComparison(id) {
    const group = r.groups.find((item) => item.id === id);
    const current = r.selection(state, group);
    const chosen = r.plans.find((plan) => plan.id === current);
    comparison = { group, current, chosen: current, confirmed: Boolean(r.active(state, chosen)) };
    $("comparisonTitle").textContent = group.title;
    const baseline = r.ids(group).map((tid) => data.schedule.find((task) => task.id === tid)).filter((task) => r.applies(task, state));
    const related = r.plans.filter((plan) => plan.group === group.id);
    $("comparisonBody").innerHTML = `<fieldset class="option-set">
      <legend>选择要对比的方案</legend>
      ${[{ id: "", label: r.defaultName(group, state), price: 0, schedule: baseline.length ? `${baseline.length} 剂 · ${[...new Set(baseline.map((task) => age(task.ageMonths)))].join("、")}` : "保留现有接种计划" }, ...related].map((plan) => `
        <label class="option-card">
          <input type="radio" name="choice" value="${plan.id}" ${plan.id === current ? "checked" : ""}>
          <span><strong>${esc(plan.label)}</strong><small>${esc(plan.schedule)}</small></span>
          <span class="option-price">${plan.price ? money(plan.price) : plan.id || baseline.length ? "免疫规划" : "—"}</span>
        </label>`).join("")}
    </fieldset>
    <section class="impact" aria-labelledby="impact-title" id="comparisonImpact"></section>
    <label class="confirm-check" id="confirmationRow" hidden><input type="checkbox" id="confirmClinic"><span>接种门诊已核对产品、年龄和既往剂次，并确认以上安排。</span></label>
    <p class="dialog-hint" id="comparisonHint" role="status"></p>`;
    updateComparison();
    $("comparisonDialog").showModal();
  }

  function updateComparison() {
    const { group, current, chosen, confirmed } = comparison;
    const plan = r.plans.find((item) => item.id === chosen);
    const oldPlan = r.plans.find((item) => item.id === current);
    const locked = chosen !== current && r.courseHasRecord(state, group);
    const mixed = plan && !r.active(state, plan) && r.history(state, group, chosen);
    const separate = r.separateConflict(state, plan);
    const isApplied = Boolean(r.active(state, plan));
    const needsConfirmation = Boolean(plan && r.active(state, oldPlan) && !confirmed);
    const estimate = (id) => p.totals(p.items({ ...state,
      planSelected: { ...state.planSelected, ...Object.fromEntries(group.options.map((option) => [option, option === id])) },
      planConfirmed: { ...state.planConfirmed, ...Object.fromEntries(group.options.map((option) => [option, option === id])) },
    })).budget;
    const diff = estimate(chosen) - p.totals(items).budget;
    const replaced = plan ? r.coverage(state, plan).map((tid) => data.schedule.find((task) => task.id === tid)) : oldPlan && r.active(state, oldPlan) ? r.coverage(state, oldPlan).map((tid) => data.schedule.find((task) => task.id === tid)) : [];
    const kept = group.id === "combination" && plan ? '<p>保留：6 周岁百白破第 5 剂。</p>'

      : group.id === "men-child" && plan && state.paidSelected["task-50"] ? '<p>另有自选的 2 岁四价流脑项目，启用前请一并请门诊核对。</p>' : "";
    $("comparisonImpact").innerHTML = `<h3 id="impact-title">${plan ? "应用后的计划变化" : "常规安排"}</h3>
      ${plan ? `<p><strong>加入：</strong>${esc(plan.label)} · ${esc(plan.schedule)}</p>` : "<p>保留常规安排，自选项目保持原样。</p>"}
      ${replaced.length ? `<details class="impact-doses"><summary>${plan ? "对应" : "恢复"} ${replaced.length} 项免疫规划剂次</summary><ul>${replaced.map((task) => `<li>${age(task.ageMonths)} · ${esc(name(task.name))}</li>`).join("")}</ul></details>` : ""}
      ${kept}
      ${diff ? `<p><strong>自费预算变化：</strong>${diff > 0 ? "+" : "−"}${money(Math.abs(diff))}（公示参考）</p>` : "<p>自费预算不变。</p>"}
      ${plan ? `<p>${esc(plan.note)}</p><p class="impact-links"><a href="${esc(r.guideline)}" target="_blank" rel="noopener">2026 年版 · ${plan.basis} ↗</a>${plan.extraSource ? ` · <a href="${esc(plan.extraSource)}" target="_blank" rel="noopener">产品适龄 ↗</a>` : ""}</p>` : ""}`;
    $("confirmationRow").hidden = !plan || locked || Boolean(mixed) || separate;
    $("confirmClinic").checked = confirmed && !locked && !mixed && !separate;
    $("confirmClinic").disabled = isApplied;
    $("comparisonHint").textContent = locked ? "已有此类方案的接种记录。请带接种证向门诊确认衔接，当前安排和记录会保留。"
      : mixed ? "已有相关接种记录。请由门诊安排后续剂次。"
      : separate ? "计划里还有 2 岁的四价流脑项目。门诊确认可移出后，请先在时间线取消该项目。"
      : needsConfirmation ? "确认新的方案后再切换。取消会保留当前安排。"
      : plan ? (confirmed ? "应用后更新计划和预算。" : "可先存为备选，原时间线和预算保持不变。")
      : (r.active(state, oldPlan) ? "恢复常规安排并移出当前备选方案的计划剂次。" : "");
    $("saveComparison").disabled = locked || needsConfirmation || (confirmed && (Boolean(mixed) || separate));
    $("saveComparison").textContent = plan ? (confirmed && !mixed && !separate ? "应用方案" : "保存为备选") : r.active(state, oldPlan) ? "恢复常规安排" : "保留常规安排";
  }

  function standaloneConflict(item) {
    return item.id === "task-50" && Boolean(r.active(state, r.plans.find((plan) => plan.id === "acyw-mpsv4")));
  }

  function openTask(id) {
    const item = items.find((row) => row.id === id);
    if (!item) return;
    editId = id;
    $("taskDialogTitle").textContent = name(item.name);
    const editable = item.planned || item.hasRecord;
    const standaloneOptional = !item.isFree && !item.plan && (!standaloneConflict(item) || item.planned);
    $("taskDialogBody").innerHTML = `
      <p class="task-info">${esc(item.prevents ? `预防：${item.prevents}` : "")}${item.route ? ` · ${esc([item.route, item.site, item.dose].filter(Boolean).join(" · "))}` : ""}</p>
      ${item.detail ? `<p class="dialog-hint">${esc(item.detail)}</p>` : ""}
      ${item.replacedBy ? `<p>当前由「${esc(item.replacedBy)}」安排。</p>` : ""}
      ${item.review ? "<p>已有此类疫苗的接种记录。常规日期供参考，后续剂次请让门诊核对。</p>" : ""}
      ${standaloneConflict(item) ? "<p>已经应用 3 岁及 6 岁四价流脑方案；请向门诊核对衔接。</p>" : ""}
      ${!item.isFree && item.cost ? `<p>公示价格参考：${money(item.cost)}${item.course ? "（全程）" : ""}</p>` : ""}
      ${standaloneOptional ? `<label class="confirm-check"><input type="checkbox" id="editPaid" ${item.planned ? "checked" : ""}> 纳入自费计划</label>` : ""}
      ${editable ? `<div class="editor-grid">
        <label>计划日期<input type="date" id="editDue" value="${p.iso(item.plannedDate)}" min="${state.birthDate}" required></label>
        <label>移动到其他月龄<select id="editMonth"><option value="">选择月龄</option>${months.map((m) => `<option value="${m}">${age(m)}</option>`).join("")}</select></label>
      </div>
      <p class="dialog-hint">参考日期：${dateLabel(item.defaultDate)}。改期前请与门诊核对。</p>
      ${item.isCustom ? '<button class="button button--quiet" type="button" id="restoreDue">恢复参考日期</button>' : ""}
      <label class="confirm-check"><input type="checkbox" id="editDone" ${state.completed[id] ? "checked" : ""}> ${item.course ? "已完成全程" : "已接种"}</label>
      <label class="actual-field">${item.course ? "全程完成日期" : "实际接种日期"} <input type="date" id="editActual" value="${state.actualDates[id] || ""}" min="${state.birthDate}" max="${p.today}"></label>
      <p class="dialog-hint">可先勾选完成，实际日期可稍后补录。${item.course ? "确认已完成该产品规定的全部剂次后再勾选。" : ""}</p>` : ""}`;
    $("taskForm").querySelector('[type="submit"]').hidden = !editable && !standaloneOptional;
    $("taskDialog").showModal();
  }

  function closeAndRender(dialog, trigger) {
    dialog.close();
    renderAll();
    (trigger() || $("timeline-title")).focus({ preventScroll: true });
  }

  $("comparisonForm").addEventListener("change", (event) => {
    if (event.target.name === "choice") {
      comparison.chosen = event.target.value;
      comparison.confirmed = comparison.chosen === comparison.current && Boolean(state.planConfirmed[comparison.chosen]);
    } else if (event.target.id === "confirmClinic") comparison.confirmed = event.target.checked;
    updateComparison();
  });

  $("comparisonForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const { group, chosen, confirmed } = comparison;
    if (!r.applyChoice(state, group, chosen, Boolean(chosen && confirmed))) return;
    persist(!chosen ? "已保留常规安排" : confirmed ? "已更新接种计划和预算" : "已保存备选，原安排保留");
    const previous = comparison.invoker;
    closeAndRender($("comparisonDialog"), () => (previous && $("timeline").querySelector(`[data-task-id="${previous}"] [data-compare]`)) || $("replacementPlans").querySelector(`[data-compare="${group.id}"]`));
  });

  $("taskForm").addEventListener("change", (event) => {
    if (event.target.id === "editMonth" && event.target.value !== "") $("editDue").value = p.iso(p.shift(p.parse(state.birthDate), Number(event.target.value)));
    if (event.target.id === "editDue") $("editMonth").value = "";
    if (event.target.id === "editActual" && event.target.value) $("editDone").checked = true;
    if (event.target.id === "editDone" && !event.target.checked) $("editActual").value = "";
  });

  $("taskForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const item = items.find((row) => row.id === editId);
    if (!item) return;
    if ($("editPaid")) state.paidSelected[item.id] = $("editPaid").checked;
    if ($("editDue")) {
      const due = $("editDue").value;
      if (due !== p.iso(item.plannedDate) || $("editDue").dataset.restore) {
        if ($("editDue").dataset.restore && due === p.iso(item.defaultDate)) {
          delete state.customDates[item.id];
          delete state.customMonths[item.id];
        } else {
          state.customDates[item.id] = due;
          state.customMonths[item.id] = $("editMonth").value !== "" ? Number($("editMonth").value) : p.monthAt(p.parse(state.birthDate), p.parse(due));
        }
      }
      state.completed[item.id] = $("editDone").checked;
      if ($("editActual").value) state.actualDates[item.id] = $("editActual").value;
      else delete state.actualDates[item.id];
    }
    persist("已保存接种记录");
    closeAndRender($("taskDialog"), () => $("timeline").querySelector(`[data-edit="${item.id}"]`));
  });

  $("cancelComparison").addEventListener("click", () => $("comparisonDialog").close());
  $("cancelTask").addEventListener("click", () => $("taskDialog").close());

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.compare) {
      openComparison(button.dataset.compare);
      comparison.invoker = button.closest("[data-task-id]")?.dataset.taskId;
    }
    if (button.dataset.edit) openTask(button.dataset.edit);
    if (button.dataset.add) {
      state.paidSelected[button.dataset.add] = true;
      persist("已加入自费计划");
      renderAll();
      ($("timeline").querySelector(`[data-edit="${button.dataset.add}"]`) || $("timeline-title")).focus({ preventScroll: true });
    }
    if (button.id === "restoreDue") {
      $("editDue").value = p.iso(items.find((item) => item.id === editId).defaultDate);
      $("editDue").dataset.restore = "true";
      $("editMonth").value = "";
    }
  });

  $("timeline").addEventListener("dragstart", (event) => {
    const card = event.target.closest(".task-card[draggable='true']");
    if (!card) return;
    draggingId = card.dataset.taskId;
    event.dataTransfer.setData("text/plain", draggingId);
    event.dataTransfer.effectAllowed = "move";
  });
  $("timeline").addEventListener("dragover", (event) => {
    if (draggingId && event.target.closest(".age-group")) event.preventDefault();
  });
  $("timeline").addEventListener("drop", (event) => {
    const group = event.target.closest(".age-group");
    if (!group || !draggingId || event.dataTransfer.getData("text/plain") !== draggingId) return;
    event.preventDefault();
    const months = Number(group.dataset.months);
    state.customMonths[draggingId] = months;
    state.customDates[draggingId] = p.iso(p.shift(p.parse(state.birthDate), months));
    draggingId = null;
    persist(`已移动至 ${age(months)}`);
    renderAll();
  });
  $("timeline").addEventListener("dragend", () => { draggingId = null; });

  $("childName").addEventListener("input", () => { state.childName = $("childName").value; $("footerChildName").textContent = state.childName.trim() || "孩子"; persist(); });
  for (const key of ["childGender", "birthDate", "asOfDate"]) $(key).addEventListener("change", () => {
    const value = $(key).value;
    if (!value || (key !== "childGender" && !p.parse(value))) { renderProfile(); return; }
    const changed = state[key] !== value;
    const reviewed = changed && key !== "asOfDate" && Object.values(state.planConfirmed).some(Boolean);
    state[key] = value;
    if (key === "birthDate") state.exampleBirthday = false;
    if (reviewed) state.planConfirmed = {};
    persist(reviewed ? "孩子资料已更新，请重新确认备选方案。" : "");
    renderAll();
  });

  $("scheduleSearch").addEventListener("input", renderTimeline);
  $("scheduleFilter").addEventListener("change", renderTimeline);
  $("catalogSearch").addEventListener("input", renderCatalog);
  for (const [key, id] of [["hideReplaced", "hideReplacedToggle"], ["hideUnplanned", "hideUnplannedToggle"], ["hideCompleted", "hideCompletedToggle"]]) {
    $(id).addEventListener("change", () => { state[key] = $(id).checked; persist(); renderTimeline(); });
  }

  document.querySelector(".tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (!button) return;
    for (const tab of document.querySelectorAll("[data-tab]")) {
      tab.classList.toggle("is-active", tab === button);
      tab.setAttribute("aria-pressed", String(tab === button));
      $(tab.getAttribute("aria-controls")).hidden = tab !== button;
    }
  });

  $("printButton").addEventListener("click", () => window.print());
  $("exportButton").addEventListener("click", () => {
    const exportData = { app: data.meta.title, guideline: data.meta.guidelineVersion, exportedAt: new Date().toISOString(), state };
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(state.childName.trim() || "孩子").replace(/[\\/:*?"<>|]/g, "-")}-疫苗规划备份-${p.today}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast("已导出备份。文件含孩子的接种记录，请妥善保存。");
  });
  $("importButton").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", async () => {
    const file = $("importFile").files[0];
    try {
      if (!file) return;
      const parsed = JSON.parse(await file.text());
      const imported = p.readState(parsed.state ?? parsed);
      if (!window.confirm("导入会替换此浏览器中的当前计划。继续导入？")) return;
      state = imported;
      persist("备份已导入");
      renderAll();
    } catch {
      toast("导入失败，请选择本应用导出的备份文件。");
    } finally {
      $("importFile").value = "";
    }
  });
  $("resetButton").addEventListener("click", () => {
    if (!window.confirm("清空此浏览器中的资料、方案和接种记录？需要保留时，请先导出备份。")) return;
    state = p.empty();
    $("scheduleSearch").value = "";
    $("scheduleFilter").value = "planned";
    persist("计划已重置");
    renderAll();
  });

  renderAll();
  renderCatalog();
  renderSources();
})();
