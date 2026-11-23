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
  let unreadableBackup = "";
  try {
    const stored = localStorage.getItem(p.storageKey);
    if (stored) {
      try { state = p.readState(JSON.parse(stored)); }
      catch { unreadableBackup = stored; storageIssue = true; }
    }
  } catch {
    storageIssue = true;
  }
  let items = [];
  let comparison;
  let editId;
  let editInvoker;
  let printMode = false;
  let resumeChoice;
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
    if (unreadableBackup) { toast("旧存档已保留。本次更改请先导出备份。"); return; }
    try {
      localStorage.setItem(p.storageKey, JSON.stringify(state));
      storageIssue = false;
      if (message) toast(message);
    } catch {
      storageIssue = true;
      toast("浏览器未保存本次变更，请导出备份。");
    }
  }

  const catalogItem = (id) => data.catalog.find((entry) => entry.id === id);
  const sourceItem = (id) => data.sources.find((source) => source.id === id);
  const names = (value) => name(value).replace(/\s+-\s+/u, " · ").replace(/（(?:全程完成|学龄前加强|幼儿加强|13周岁女孩免费[^）]*)）/gu, "");
  function renderProfile() {
    for (const key of ["childName", "childGender", "birthDate", "asOfDate"]) {
      if ($(key).value !== state[key]) $(key).value = state[key];
    }
    $("storageWarning").hidden = !storageIssue;
    $("storageWarning").textContent = unreadableBackup ? "旧存档未能识别，已原样保留。本次编辑不会覆盖它；请先导出备份，再决定是否导入可用的存档。" : "当前浏览器无法保存记录，请从「打印与备份」导出。";
    const personal = Boolean(state.birthDate);
    $("profileDetails").hidden = !personal;
    $("footerChildName").textContent = state.childName.trim() || "孩子";
    $("profileCaption").textContent = `${state.childName.trim() || "孩子"}的资料 · ${state.birthDate}　编辑`;
    $("profileNote").textContent = storageIssue ? "本机无法保存记录，请导出备份。" : state.exampleBirthday
      ? "旧记录使用了示例生日。请核对出生日期，已登记的实际日期会保留。"
      : "性别用于判断免费 HPV 资格；可以稍后填写。调整生日不会改动已登记的实际日期。";
    $("useToday").disabled = state.followToday;
    $("useToday").textContent = state.followToday ? "已跟随今天" : "跟随今天";
    $("printHeading").textContent = personal ? `${state.childName.trim() || "孩子"}的接种计划 · 出生日期 ${state.birthDate} · 查看到 ${state.asOfDate}` : "儿童常规接种年龄表 · 国家免疫规划 2026 年版";
  }

  function renderSummary() {
    const personal = Boolean(state.birthDate);
    $("startPanel").hidden = personal;
    $("visitContent").hidden = !personal;
    $("timelineControls").hidden = !personal;
    $("progressStrip").hidden = !personal;
    $("seasonCard").hidden = !personal;
    $("timelineLink").firstChild.textContent = personal ? "查看时间线 " : "按年龄浏览 ";
    $("timeline-title").textContent = personal ? "接种时间线" : "按年龄看接种安排";
    $("timelineIntro").textContent = personal ? "以接种证登记实际日期；自费项目可在筛选中添加。" : "默认列出乙脑、甲肝的减毒活程序；灭活程序可在「比较替代方案」查看。";
    if (!personal) { $("heroTitle").textContent = "孩子下次什么时候接种？"; return; }
    const stats = p.totals(items);
    const {next, past} = p.agenda(items, state.asOfDate);
    const first = next[0];
    const date = first && p.iso(first.plannedDate);
    $("heroTitle").textContent = first ? (date === state.asOfDate ? (state.followToday ? "今天的接种安排" : "这天的接种安排") : "下一次接种安排") : "查看孩子的接种记录";
    $("visitContent").innerHTML = `<p class="visit-date">${first ? dateLabel(first.plannedDate) : "没有待安排的未来剂次"}</p>
      ${first ? `<div class="visit-list">${next.map((i) => `<div><strong>${esc(names(i.name))}</strong><button class="button" type="button" data-edit="${i.id}" aria-label="登记${esc(names(i.name))}">登记接种</button></div>`).join("")}</div>` : ""}
      ${state.childGender === "unknown" && state.birthDate >= "2011-11-10" && p.monthAt(p.parse(state.birthDate),p.parse(state.asOfDate)) >= 150 ? '<button class="button button--quiet" type="button" id="checkHpv">填写性别，核对免费 HPV 资格</button>' : ""}
      <p class="visit-note">${state.exampleBirthday ? "当前沿用示例生日，请在孩子资料里核对。 " : ""}${state.followToday ? "按今天" : "查看日：" + state.asOfDate} · 日期为家庭备忘，以门诊预约为准。</p>`;
    $("progressStrip").innerHTML = `<span>计划 <strong>${stats.planned}</strong> 项</span><button type="button" data-show="done">已登记 <strong>${items.filter((i) => i.hasRecord).length}</strong> 项</button>
      ${past.length ? `<button type="button" class="past-link" data-show="overdue">往期未登记 <strong>${past.length}</strong> 项 ›</button>` : ""}
      <span>自费估算 <strong>${money(stats.budget)}</strong></span>`;
    const year = p.fluYear(state.asOfDate);
    const season = state.fluSeasons[year];
    $("seasonSummary").textContent = `${year}–${year + 1} 季 · ${season ? "已安排 " + season.doses + " 剂" : "尚未设置"}`;
    $("seasonButton").textContent = season ? "查看本季安排" : "设置本季计划";
  }

  function renderReplacement() {
    $("replacementPlans").innerHTML = r.groups.map((group) => {
      const current = r.plans.find((plan) => plan.id === r.selection(state, group));
      const status = current ? (r.active(state, current) ? "已应用" : "备选") : "";
      return `<button class="replacement-row panel" type="button" data-compare="${group.id}" aria-haspopup="dialog">
        <span class="replacement-icon"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${icons[group.icon]}</svg></span>
        <span class="replacement-text"><strong>${group.title}</strong><small>${esc(current ? status + " · " + current.label : group.subtitle)}</small></span>
        <span class="chevron" aria-hidden="true">›</span>
      </button>`;
    }).join("");
  }

  const labels = { replaced: "已调整", done: "已完成", review: "需核对衔接", overdue: "往期未登记", upcoming: "未来 90 天", "not-applicable": "当前资料不适用" };
  function visible(item) {
    if (printMode) return item.planned || item.hasRecord;
    const filter = $("scheduleFilter").value;
    if (filter !== "replaced" && state.hideReplaced && item.replacedBy) return false;
    if (!["done", "replaced", "paid"].includes(filter) && state.hideUnplanned && !item.planned && !item.hasRecord) return false;
    if (filter !== "done" && state.hideCompleted && item.done) return false;
    const query = $("scheduleSearch").value.trim().toLowerCase();
    if (query && !`${item.name} ${item.prevents || ""} ${item.detail || ""}`.toLowerCase().includes(query)) return false;
    return ({
      all: true, planned: item.planned, upcoming: item.status === "upcoming", overdue: !item.hasRecord && (item.status === "overdue" || (item.status === "review" && p.iso(item.plannedDate) <= state.asOfDate)),
      uncompleted: item.planned && !item.done, done: item.hasRecord, paid: !item.isFree, replaced: Boolean(item.replacedBy),
    })[filter];
  }

  function taskRow(item) {
    const group = item.plan ? r.groups.find((g) => g.id === item.plan.group) : groupOf(item.id);
    const title = names(item.name);
    const kind = item.isFree ? "免疫规划" : item.course ? "自费全程" : "自费可选";
    const description = item.hasRecord
      ? (state.actualDates[item.id] ? `实际接种 · ${dateLabel(p.parse(state.actualDates[item.id]))}${item.actualAfterView ? "（晚于查看日）" : ""}` : "已录入接种记录，日期未填")
      : item.caution || (item.replacedBy ? `当前由「${item.replacedBy}」方案安排`
      : !item.applicable ? "国家免疫规划双价 HPV 面向符合条件的 13 周岁女孩"
      : `${item.isCustom ? "自定计划" : "参考计划"} · ${dateLabel(item.plannedDate)}${item.course ? "（全程备忘）" : ""}`);
    return `<article class="task-card ${item.done ? "task-card--done" : ""}" data-task-id="${item.id}" ${item.planned && !item.hasRecord ? 'draggable="true"' : ""}>
      <div class="task-main">
        <div class="task-badges"><span class="badge badge--${item.isFree ? "free" : "paid"}">${kind}</span>${labels[item.status] ? `<span class="badge badge--${item.status}">${labels[item.status]}</span>` : ""}</div>
        <h4>${esc(title)}</h4><p>${esc(description)}</p>
      </div>
      <div class="task-actions">
        ${!item.isFree && !item.plan && !item.season && !item.planned && !item.hasRecord && !item.caution && !standaloneConflict(item) ? `<button class="button" type="button" data-add="${item.id}" aria-label="加入${esc(title)}">加入计划</button>` : ""}
        ${group ? `<button class="button button--quiet" type="button" data-compare="${group.id}" aria-haspopup="dialog" aria-label="查看${esc(title)}的备选方案">换方案</button>` : ""}
        <button class="button" type="button" data-edit="${item.id}" aria-haspopup="dialog" aria-label="${item.planned || item.hasRecord ? "编辑" : "查看"}${esc(title)}">${item.planned || item.hasRecord ? (item.hasRecord ? "编辑记录" : "登记接种") : "详情"}</button>
      </div>
    </article>`;
  }

  function renderTimeline() {
    if (!state.birthDate) {
      const byAge = new Map();
      for (const task of data.schedule.filter((t) => t.isFree)) {
        if (!byAge.has(task.ageMonths)) byAge.set(task.ageMonths, []);
        byAge.get(task.ageMonths).push(task);
      }
      $("timeline").innerHTML = [...byAge].map(([m, rows]) => `<section class="guide-row"><h3>${age(m)}</h3><div>${rows.map((t) => `<button type="button" data-reference="${t.catalogId}" aria-label="查看${esc(names(t.name))}资料">${esc(names(t.name))}${t.gender ? "（符合条件的女孩）" : ""}</button>`).join("")}</div></section>`).join("");
      $("emptyTimeline").hidden = true;
      return;
    }
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

  function scheduleText(entry) {
    const rows = p.catalogSchedule(entry);
    return rows.length ? `${rows.length} 剂 · ${rows.map((row) => row.days ? "首剂后 7–10 天" : row.afterMonths ? "首剂后 " + row.afterMonths + " 个月" : age(row.months)).join("、")}` : "";
  }
  function renderCatalog() {
    const query = $("catalogSearch").value.trim().toLowerCase();
    const type = $("catalogType").value;
    const filtered = data.catalog.filter((entry) => (!type || entry.type === type) &&
      [entry.name, entry.prevents, entry.note, scheduleText(entry)].join(" ").toLowerCase().includes(query));
    $("catalogCount").textContent = filtered.length ? `共 ${filtered.length} 项资料` : "未找到匹配资料，请更换关键词或资料范围。";
    $("catalogGrid").innerHTML = filtered.map((entry) => {
      const source = sourceItem(entry.source);
      const schedule = scheduleText(entry);
      return `<details id="ref-${entry.id}" class="panel catalog-card"><summary>
        <span><strong>${esc(entry.name)}</strong><small>${esc(entry.prevents)}</small></span><span class="badge badge--${entry.type === "免疫规划" ? "free" : "paid"}">${entry.type}</span></summary>
        <div class="ref-body">${schedule ? `<p class="ref-regimen"><strong>常规程序</strong>　${esc(schedule)}</p>` : ""}<p>${esc(entry.note)}</p>
        ${entry.route ? `<p><strong>接种方式</strong>　${esc(entry.route)}</p>` : ""}
        ${entry.care ? `<p>${esc(entry.care)}</p>` : ""}
        ${entry.price ? `<p class="dialog-hint">费用参考：${esc(entry.price)}</p>` : ""}
        ${source ? `<a href="${esc(source.url)}" target="_blank" rel="noopener">查看依据：${esc(source.label)} ↗</a>` : '<p class="dialog-hint">原门诊公示条目；请以所用产品说明书为准。</p>'}
        ${entry.compare ? `<button type="button" class="button" data-compare="${entry.compare}" data-suggest="${({18:"pentavalent",22:"menac",25:"hepa-nip",27:"acyw-mpsv4",30:"hpv4",31:"hpv9",35:"je-inactivated"})[entry.id] || ""}" aria-haspopup="dialog">比较这一类的方案</button>` : ""}</div></details>`;
    }).join("");
  }
  function renderSources() {
    const sources = [{label:"国家儿童免疫程序 · 本地 PDF",url:r.guideline}, ...data.sources];
    $("correctionList").innerHTML = data.correctionNotes.map((note) => `<li>${esc(note)}</li>`).join("");
    $("sourceList").innerHTML = sources.map((source) => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} ↗</a></li>`).join("");
  }

  function openComparison(id, suggested) {
    const group = r.groups.find((item) => item.id === id);
    const current = r.selection(state, group);
    const initial = group.options.includes(suggested) ? suggested : current;
    comparison = { group, current, chosen: initial, trigger: document.activeElement };
    $("comparisonTitle").textContent = group.title;
    const baseline = r.ids(group).map((tid) => data.schedule.find((task) => task.id === tid)).filter((task) => !state.birthDate || (group.id === "hpv" && state.childGender === "unknown") || r.applies(task, state)).sort((a,b) => a.ageMonths - b.ageMonths);
    const related = r.plans.filter((plan) => plan.group === group.id);
    $("comparisonBody").innerHTML = `<fieldset class="option-set">
      <legend>选择要比较的方案</legend>
      ${[{ id: "", label: group.id === "hpv" && state.childGender === "unknown" ? group.baseline + "（符合资格时）" : r.defaultName(group, state), price: 0, schedule: baseline.length ? `${baseline.length} 剂 · ${[...new Set(baseline.map((task) => age(task.ageMonths)))].join("、")}` : "保留现有接种计划" }, ...related].map((plan) => `
        <label class="option-card">
          <input type="radio" name="choice" value="${plan.id}" ${plan.id === initial ? "checked" : ""}>
          <span><strong>${esc(plan.label)}</strong><small>${esc(plan.schedule)}</small></span>
          <span class="option-price">${plan.price ? money(plan.price) : plan.id || baseline.length ? "免疫规划" : "—"}</span>
        </label>`).join("")}
    </fieldset>
    <section class="impact" aria-labelledby="impact-title" id="comparisonImpact"></section>

    <p class="dialog-hint" id="comparisonHint" role="status"></p>`;
    updateComparison();
    $("comparisonDialog").showModal();
  }

  function updateComparison() {
    const { group, current, chosen } = comparison;
    const plan = r.plans.find((item) => item.id === chosen);
    const oldPlan = r.plans.find((item) => item.id === current);
    const locked = chosen !== current && r.courseHasRecord(state, group);
    const mixed = plan && !r.active(state, plan) && r.history(state, group, chosen);
    const separate = r.separateConflict(state, plan);
    const isApplied = Boolean(r.active(state, plan));
    const unknownHPV = group.id === "hpv" && state.childGender === "unknown";
    const estimate = (id) => p.totals(p.items({ ...state,
      planSelected: { ...state.planSelected, ...Object.fromEntries(group.options.map((option) => [option, option === id])) },
      planConfirmed: { ...state.planConfirmed, ...Object.fromEntries(group.options.map((option) => [option, option === id])) },
    })).budget;
    const diff = state.birthDate ? estimate(chosen) - p.totals(items).budget : (plan?.price || 0);
    const replaced = plan ? (state.birthDate ? r.coverage(state, plan) : plan.replaces).map((tid) => data.schedule.find((task) => task.id === tid)) : oldPlan && r.active(state, oldPlan) ? r.coverage(state, oldPlan).map((tid) => data.schedule.find((task) => task.id === tid)) : [];
    const kept = group.id === "combination" && plan ? '<p>仍需保留：6 周岁百白破第 5 剂。</p>'

      : group.id === "men-infant" && plan ? "<p>仍需保留：3、6 周岁流脑安排。</p>"
      : group.id === "men-child" && plan && state.paidSelected["task-50"] ? '<p>另有自选的 2 岁四价流脑项目，启用前请一并请门诊核对。</p>' : "";
    const relevant = new Set([...r.ids(group), ...r.plans.filter((p) => p.group === group.id).flatMap((p) => p.doses.map((d) => d.id)), ...(group.id === "combination" ? ["task-57"] : group.id === "men-child" ? ["task-50"] : [])]);
    const history = items.filter((item) => item.hasRecord && relevant.has(item.id));
    $("comparisonImpact").innerHTML = `<h3 id="impact-title">${plan ? "这会怎样改变计划？" : "常规安排"}</h3>
      ${plan ? `<p><strong>加入：</strong>${esc(plan.label)}${plan.doses[0].course ? "（一条全程备忘）" : " · " + plan.doses.length + " 剂"}</p>` : "<p>保留常规安排，自选项目保持原样。</p>"}
      ${replaced.length ? `<details class="impact-doses"><summary>${plan ? "对应" : "恢复"} ${replaced.length} 项免疫规划剂次</summary><ul>${replaced.map((task) => `<li>${age(task.ageMonths)} · ${esc(names(task.name))}</li>`).join("")}</ul></details>` : ""}
      ${kept}
      ${diff ? `<p><strong>自费预算变化：</strong>${diff > 0 ? "+" : "−"}${money(Math.abs(diff))}（公示参考）</p>` : "<p>自费预算不变。</p>"}
      ${plan?.priceBasis ? `<p>${esc(plan.priceBasis)}</p>` : ""}
      ${history.length ? `<details class="impact-doses"><summary>已登记的相关记录 · ${history.length} 项</summary><ul>${history.map((i) => `<li>${esc(names(i.name))} · ${esc(state.actualDates[i.id] || "日期待补")}</li>`).join("")}</ul></details>` : ""}
      ${plan ? `<details class="impact-doses"><summary>适用条件与依据</summary><p>${esc(plan.note)}</p><p class="impact-links"><a href="${esc(r.guideline)}" target="_blank" rel="noopener">2026 年版 · ${plan.basis} ↗</a>${plan.extraSource ? ` · <a href="${esc(plan.extraSource)}" target="_blank" rel="noopener">产品说明 ↗</a>` : ""}</p></details>` : ""}`;
    const draft = $("draftComparison"), save = $("saveComparison");
    const blocked = locked || mixed || separate;
    draft.hidden = !state.birthDate || !plan || isApplied || locked || Boolean(r.active(state, oldPlan)) || (current === chosen);
    save.disabled = Boolean(state.birthDate && (locked || (plan && !isApplied && blocked)));
    save.textContent = !state.birthDate ? "填写生日以保存" : isApplied || (!chosen && !current) ? "完成"
      : !chosen ? "恢复常规安排" : unknownHPV ? "填写性别以核对" : "门诊已确认，应用方案";
    $("comparisonHint").textContent = locked ? "已有本方案接种记录，无法整套切换。请带接种证到门诊核对剩余剂次。"
      : mixed ? "已有相关接种记录，整套替换已停用。请让门诊核对后续剂次。"
      : separate ? "已选 2 岁四价流脑。切换前请先请门诊核对，在时间线移出重复项目。"
      : !state.birthDate ? "可先比较；填写生日后才能保存到孩子的时间线。"
      : plan && unknownHPV ? "请补充性别，以便核对免费资格和产品适龄。"
      : plan && current === chosen && !isApplied ? "已存为备选，原安排保持不变。门诊核对后可应用。"
      : plan && r.active(state, oldPlan) && !isApplied ? "已有生效方案。门诊核对新方案后可切换，关闭则保留现有安排。"
      : plan && !isApplied ? "门诊尚未核对产品、年龄与既往剂次时，可先保留备选；原计划继续有效。"
      : !chosen && r.active(state, oldPlan) ? "恢复常规安排后，已选方案将移出待办。" : "";
  }

  function standaloneConflict(item) {
    return item.id === "task-50" && Boolean(r.active(state, r.plans.find((plan) => plan.id === "acyw-mpsv4")));
  }

  function openTask(id) {
    const item = items.find((row) => row.id === id);
    if (!item) return;
    editId = id; editInvoker = document.activeElement;
    $("taskDialogTitle").textContent = names(item.name);
    const optional = !item.isFree && !item.plan && !item.season && (!standaloneConflict(item) || item.planned);
    const editable = item.planned || item.hasRecord || optional;
    const maySelect = optional && (item.planned || !item.caution);
    const haveActual = state.actualDates[id] || "";
    const info = catalogItem(item.catalogId);
    $("taskDialogBody").innerHTML = `
      ${item.caution || item.review ? `<p class="notice">${esc(item.caution || "已有相关接种记录，请让门诊核对后续安排。")} 仍可按接种证登记实际情况。</p>` : ""}
      ${item.replacedBy ? `<p>当前由「${esc(item.replacedBy)}」安排。</p>` : ""}
      ${standaloneConflict(item) ? "<p>已有 3 岁及 6 岁四价流脑方案，请向门诊核对衔接。</p>" : ""}
      ${editable ? `<label class="actual-field">${item.course ? "全程完成日期" : "实际接种日期"}<input type="date" id="editActual" value="${haveActual}" min="${haveActual && haveActual < state.birthDate ? haveActual : state.birthDate}" max="${p.today}"></label>
      <label class="check-line"><input type="checkbox" id="editDone" ${state.completed[id] ? "checked" : ""}> ${item.course ? "已按产品要求完成全程" : "已接种"}（日期可稍后补）</label>
      ${maySelect ? `<label class="check-line"><input type="checkbox" id="editPaid" ${item.planned ? "checked" : ""}> 纳入自费计划</label>` : ""}
      <details class="edit-planning"><summary>调整计划日期 <span>${p.iso(item.plannedDate)}</span></summary>
        <div class="editor-grid"><label>计划日期<input type="date" id="editDue" value="${p.iso(item.plannedDate)}" required></label>
          <label>移动到其他月龄<select id="editMonth"><option value="">选择月龄</option>${months.map((m) => `<option value="${m}">${age(m)}</option>`).join("")}</select></label></div>
        <p class="dialog-hint">参考日期：${dateLabel(item.defaultDate)}。改期请与门诊核对。</p>
        ${item.isCustom ? '<button class="button button--quiet" type="button" id="restoreDue">恢复参考日期</button>' : ""}
      </details>` : ""}
      <details class="edit-planning" ${!editable ? "open" : ""}><summary>查看接种说明</summary><div class="ref-body">
        ${item.prevents || info ? `<p>预防：${esc(item.prevents || info.prevents)}</p>` : ""}
        ${item.detail ? `<p>${esc(item.detail)}</p>` : ""}
        ${!item.isFree && item.cost ? `<p>原门诊公示参考：${money(item.cost)}${item.course ? "（原表全程估算）" : " / 剂"}</p>` : ""}
        ${sourceItem(info?.source) ? `<a href="${esc(sourceItem(info.source).url)}" target="_blank" rel="noopener">查看程序依据 ↗</a>` : ""}
      </div></details>`;
    $("taskForm").querySelector('[type="submit"]').hidden = !editable;
    $("taskDialog").showModal();
  }

  function closeAndRender(dialog, trigger) {
    dialog.close();
    renderAll();
    (trigger() || $("timeline-title")).focus({ preventScroll: true });
  }

  $("comparisonForm").addEventListener("change", (event) => {
    if (event.target.name === "choice") { comparison.chosen = event.target.value; updateComparison(); }
  });
  function finishComparison(draft) {
    const {group, chosen, current, trigger} = comparison;
    if (!state.birthDate) {
      resumeChoice = {id:group.id, chosen}; $("comparisonDialog").close(); showTab("plan"); $("startBirth").focus(); return;
    }
    const plan = r.plans.find((item) => item.id === chosen);
    if (!draft && chosen && group.id === "hpv" && state.childGender === "unknown") {
      resumeChoice = {id:group.id, chosen}; $("comparisonDialog").close(); showTab("plan"); $("profileDetails").open = true; $("childGender").focus(); return;
    }
    if (!draft && ((!chosen && !current) || r.active(state, plan))) { $("comparisonDialog").close(); return; }
    if (!r.applyChoice(state, group, chosen, Boolean(chosen && !draft))) return;
    persist(!chosen ? "已恢复常规安排" : draft ? "备选已保存，原计划保留" : "已更新计划；接种记录保持原样");
    closeAndRender($("comparisonDialog"), () => trigger?.isConnected ? trigger : $("replacementPlans").querySelector(`[data-compare="${group.id}"]`));
  }
  $("comparisonForm").addEventListener("submit", (event) => { event.preventDefault(); finishComparison(false); });
  $("draftComparison").addEventListener("click", () => finishComparison(true));

  $("taskForm").addEventListener("change", (event) => {
    if ($("editDue")) $("editDue").setCustomValidity("");
    if (event.target.id === "editMonth" && event.target.value !== "") $("editDue").value = p.iso(p.shift(p.parse(state.birthDate), Number(event.target.value)));
    if (event.target.id === "editDue") $("editMonth").value = "";
    if (event.target.id === "editActual" && event.target.value) $("editDone").checked = true;
    if (event.target.id === "editDone" && !event.target.checked) $("editActual").value = "";
  });

  $("taskForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const item = items.find((row) => row.id === editId);
    if (!item) return;
    if ($("editDone")?.checked && state.birthDate > p.today && !item.hasRecord) { toast("实际接种请在孩子出生后登记。"); return; }
    if ($("editDue")) {
      const due = $("editDue").value;
      if (due !== p.iso(item.plannedDate) || $("editDue").dataset.restore) {
        const warning = p.dateCaution(state, item, p.parse(due), new Map(items.map((i) => [i.id,i])));
        const boundaryConfirmed = warning?.startsWith("处于") && p.rvBoundary(state,item,p.parse(due)) && window.confirm("此日期处于产品的周龄边界。是否保留门诊已核对的预约日期？");
        if (warning && !boundaryConfirmed) { $("editDue").closest("details").open = true; $("editDue").setCustomValidity(warning); $("editDue").reportValidity(); return; }
        if ($("editDue").dataset.restore && due === p.iso(item.defaultDate)) {
          delete state.customDates[item.id];
          delete state.customMonths[item.id];
        } else {
          state.customDates[item.id] = due;
          state.customMonths[item.id] = $("editMonth").value !== "" ? Number($("editMonth").value) : p.monthAt(p.parse(state.birthDate), p.parse(due));
        }
      }
      if (item.season && item.index === 1 && due !== p.iso(item.plannedDate)) {
        state.fluSeasons[item.season].date = due;
        delete state.customDates[item.id]; delete state.customMonths[item.id];
      }
      state.completed[item.id] = $("editDone").checked;
      if ($("editActual").value) state.actualDates[item.id] = $("editActual").value;
      else delete state.actualDates[item.id];
    }
    if ($("editPaid")) state.paidSelected[item.id] = $("editPaid").checked;
    persist("已保存");
    closeAndRender($("taskDialog"), () => editInvoker?.isConnected ? editInvoker : $("timeline").querySelector(`[data-edit="${item.id}"]`));
  });

  $("cancelTask").addEventListener("click", () => $("taskDialog").close());

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.compare) {
      openComparison(button.dataset.compare, button.dataset.suggest);

    }
    if (button.dataset.edit) openTask(button.dataset.edit);
    if (button.id === "checkHpv") { $("profileDetails").open = true; $("childGender").focus(); }
    if (button.dataset.reference) {
      showTab("catalog"); $("catalogType").value = ""; $("catalogSearch").value = catalogItem(Number(button.dataset.reference)).name; renderCatalog();
      const ref = $("ref-" + button.dataset.reference); ref.open = true; ref.querySelector("summary").focus();
    }
    if (button.dataset.show) {
      $("scheduleFilter").value = button.dataset.show; $("scheduleSearch").value = ""; renderTimeline(); $("timeline-title").focus();
    }
    if (button.dataset.add) {
      const add = items.find((i) => i.id === button.dataset.add);
      if (!add || add.caution || standaloneConflict(add)) return;
      state.paidSelected[button.dataset.add] = true;
      persist("已加入自费计划");
      renderAll();
      ($("timeline").querySelector(`[data-edit="${button.dataset.add}"]`) || $("timeline-title")).focus({ preventScroll: true });
    }
    if (button.id === "restoreDue") {
      $("editDue").setCustomValidity("");
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
    const moving = items.find((i) => i.id === draggingId);
    const caution = p.dateCaution(state, moving, p.shift(p.parse(state.birthDate), months), new Map(items.map((i) => [i.id,i])));
    if (caution) { draggingId = null; toast(caution); return; }
    const movedDate = p.iso(p.shift(p.parse(state.birthDate), months));
    if (moving.season && moving.index === 1) {
      state.fluSeasons[moving.season].date = movedDate; delete state.customDates[draggingId]; delete state.customMonths[draggingId];
    } else { state.customMonths[draggingId] = months; state.customDates[draggingId] = movedDate; }
    draggingId = null;
    persist(`已移动至 ${age(months)}`);
    renderAll();
  });
  $("timeline").addEventListener("dragend", () => { draggingId = null; });

  function reopenChoice() {
    if (resumeChoice) { const pending = resumeChoice; resumeChoice = null; openComparison(pending.id, pending.chosen); }
  }
  $("startForm").addEventListener("submit", (event) => {
    event.preventDefault(); const birth = $("startBirth").value;
    if (!p.parse(birth)) return;
    state.birthDate = birth; state.exampleBirthday = false;
    persist("已生成接种日历"); renderAll(); $("heroTitle").setAttribute("tabindex", "-1"); $("heroTitle").focus(); reopenChoice();
  });
  $("useToday").addEventListener("click", () => { state.asOfDate = p.today; state.followToday = true; persist(); renderAll(); });
  $("childName").addEventListener("input", () => { state.childName = $("childName").value; $("footerChildName").textContent = state.childName.trim() || "孩子"; persist(); });
  for (const key of ["childGender", "birthDate", "asOfDate"]) $(key).addEventListener("change", () => {
    const value = $(key).value;
    if (!value || (key !== "childGender" && !p.parse(value))) { renderProfile(); return; }
    const reviewed = p.setProfile(state, key, value);
    persist(reviewed ? "孩子资料已更新，请重新确认备选方案。" : "");
    renderAll(); if (key === "childGender") reopenChoice();
  });

  $("scheduleSearch").addEventListener("input", renderTimeline);
  $("scheduleFilter").addEventListener("change", renderTimeline);
  $("catalogSearch").addEventListener("input", renderCatalog);
  $("catalogType").addEventListener("change", renderCatalog);
  for (const [key, id] of [["hideReplaced", "hideReplacedToggle"], ["hideUnplanned", "hideUnplannedToggle"], ["hideCompleted", "hideCompletedToggle"]]) {
    $(id).addEventListener("change", () => { state[key] = $(id).checked; persist(); renderTimeline(); });
  }

  function showTab(id) {
    for (const tab of document.querySelectorAll("[data-tab]")) {
      const selected = tab.dataset.tab === id;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-pressed", String(selected));
      $(tab.getAttribute("aria-controls")).hidden = !selected;
    }
  }
  document.querySelector(".tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (button) showTab(button.dataset.tab);
  });
  document.querySelector(".brand").addEventListener("click", () => showTab("plan"));

  // A season identifies a family's entries by July–June; the clinic supplies the appointment.
  const seasonYear = () => p.fluYear(state.asOfDate);
  function seasonBounds(year) {
    const ageStart = p.iso(p.shift(p.parse(state.birthDate), 6));
    return [ageStart > `${year}-07-01` ? ageStart : `${year}-07-01`, `${year + 1}-06-30`];
  }
  function seasonFormState() {
    const year = seasonYear(), doses = Number($("seasonDoses").value);
    const [min, max] = seasonBounds(year);
    const secondRecorded = r.hasRecord(state, p.fluKey(year, 2)), firstRecorded = r.hasRecord(state, p.fluKey(year, 1));
    const legacy = items.find((i) => i.legacyFlu && (i.hasRecord || i.planned));
    const legacyDate = legacy && (state.actualDates[legacy.id] || (legacy.hasRecord ? "" : p.iso(legacy.plannedDate)));
    const conflict = Boolean(legacy && (!legacyDate || p.fluYear(legacyDate) === year) && !state.fluSeasons[year]);
    $("seasonDateRow").hidden = !doses;
    $("seasonDate").required = Boolean(doses); $("seasonDate").min = min; $("seasonDate").max = max;
    $("seasonDate").setCustomValidity("");
    if (doses === 2 && p.parse($("seasonDate").value) >= p.shift(p.parse(state.birthDate), 108)) $("seasonDate").setCustomValidity("满 9 周岁请按门诊确认的本季 1 剂程序安排。");
    const locked = Boolean((firstRecorded || secondRecorded) && !doses || secondRecorded && doses < 2);
    $("seasonHint").textContent = locked ? "已有接种记录，请保留已登记的剂次。"
      : conflict ? "旧版流感项目可能涉及本季。请在时间线核对其实际日期，或继续使用原记录。"
      : min > max ? "孩子在这一季结束前尚未满 6 月龄。" : "按所选季单独保存，不会覆盖其他季的接种记录。";
    $("seasonForm").querySelector('[type="submit"]').disabled = locked || (doses > 0 && (conflict || min > max));
  }
  $("seasonButton").addEventListener("click", () => {
    const year = seasonYear(), season = state.fluSeasons[year];
    $("seasonTitle").textContent = `${year}–${year + 1} 季流感安排`;
    $("seasonGuide").textContent = year === 2026 ? "6 月龄至未满 9 岁，首次接种流感疫苗且选用灭活疫苗时需要 2 剂，至少相隔 4 周。请与门诊核对产品和接种史。" : "请按该流感季的指南和门诊核对结果选择剂次及日期。";
    $("seasonDoses").value = season?.doses ?? "";
    $("seasonDate").value = season?.date || "";
    seasonFormState(); $("seasonDialog").showModal();
  });
  $("seasonForm").addEventListener("input", seasonFormState);
  $("cancelSeason").addEventListener("click", () => $("seasonDialog").close());
  $("seasonForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const year = seasonYear(), doses = Number($("seasonDoses").value);
    if ($("seasonForm").querySelector('[type="submit"]').disabled) return;
    const old = state.fluSeasons[year];
    if (doses) state.fluSeasons[year] = {date:$("seasonDate").value, doses};
    else delete state.fluSeasons[year];
    for (const i of [1, 2]) {
      const key = p.fluKey(year, i);
      if (!doses || i > doses || (i === 1 && old?.date !== $("seasonDate").value)) {
        delete state.customDates[key]; delete state.customMonths[key];
      }
    }
    persist("已保存本季流感安排"); closeAndRender($("seasonDialog"), () => $("seasonButton"));
  });

  window.addEventListener("beforeprint", () => { printMode = true; renderTimeline(); });
  window.addEventListener("afterprint", () => { printMode = false; renderTimeline(); });
  $("printButton").addEventListener("click", () => window.print());
  $("exportButton").addEventListener("click", () => {
    const exportData = { ...(unreadableBackup ? { previousUnreadable: unreadableBackup } : {}), app: data.meta.title, guideline: data.meta.guidelineVersion, exportedAt: new Date().toISOString(), state };
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
      unreadableBackup = ""; state = imported;
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
    unreadableBackup = ""; state = p.empty(); $("startForm").reset(); $("profileDetails").open = false;
    $("scheduleSearch").value = "";
    $("scheduleFilter").value = "planned";
    persist("计划已重置");
    renderAll();
  });

  renderAll();
  renderCatalog();
  renderSources();
})();
