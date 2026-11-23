/* Calendar and backup rules, shared by the browser and regression tests. */
((root) => {
  "use strict";
  const data = root.VACCINE_DATA;
  const replacements = root.VACCINE_REPLACEMENTS;
  const { plans, active, coverage, hasRecord, applies } = replacements;
  const storageKey = "daughter-vaccine-planner-v1";
  function iso(date) {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((n, i) => String(n).padStart(i ? 2 : 4, "0")).join("-");
  }
  function parse(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(y, m - 1, d, 12);
    return iso(date) === value ? date : null;
  }
  function shift(date, months = 0, days = 0) {
    const result = new Date(date);
    const day = result.getDate();
    result.setDate(1);
    result.setMonth(result.getMonth() + months);
    const last = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(day, last) + days);
    return result;
  }
  const today = iso(new Date());
  const empty = () => ({
    version: 1, calendarVersion: 2, replacementVersion: 1, childName: "", childGender: "unknown", birthDate: "", asOfDate: today, followToday: true, fluSeasons: {},
    exampleBirthday: false, paidSelected: {}, planSelected: {}, planConfirmed: {}, completed: {}, actualDates: {}, customDates: {},
    customMonths: {}, hideReplaced: false, hideUnplanned: false, hideCompleted: false,
  });
  const taskIds = [...data.schedule.map((t) => t.id), ...plans.flatMap((p) => p.doses.map((d) => d.id))];
  const planIds = plans.map((p) => p.id);
  const pick = (source, keys, match) => Object.fromEntries(keys
    .filter((key) => source && Object.hasOwn(source, key) && match(source[key]))
    .map((key) => [key, source[key]]));
  const fluYear = (value) => { const d = parse(value); return d.getFullYear() - (d.getMonth() < 6 ? 1 : 0); };
  const fluKey = (year, index) => `flu-${year}-${index}`;
  function readSeasons(saved) {
    return Object.fromEntries(Object.entries(saved || {}).filter(([key, value]) =>
      /^\d{4}$/.test(key) && parse(value?.date) && String(fluYear(value.date)) === key && [1, 2].includes(value.doses))
      .map(([key, { date, doses }]) => [key, { date, doses }]));
  }
  function readState(saved) {
    if (!saved || saved.version !== 1 || (!parse(saved.birthDate) && !(saved.calendarVersion === 2 && saved.birthDate === ""))) throw new Error("无效的备份");
    const flags = (value) => value === true;
    const fluSeasons = readSeasons(saved.fluSeasons);
    const knownIds = [...taskIds, ...Object.entries(fluSeasons).flatMap(([y, season]) => Array.from({length: season.doses}, (_, i) => fluKey(y, i + 1)))];
    const followToday = saved.followToday === true || !parse(saved.asOfDate);
    const state = {
      ...empty(),
      childName: typeof saved.childName === "string" ? saved.childName.slice(0, 20) : "",
      childGender: ["female", "male", "unknown"].includes(saved.childGender) ? saved.childGender : "unknown",
      birthDate: saved.birthDate, asOfDate: followToday ? today : saved.asOfDate, followToday, fluSeasons,
      exampleBirthday: saved.exampleBirthday === true,
      paidSelected: pick(saved.paidSelected, data.schedule.filter((t) => !t.isFree).map((t) => t.id), flags),
      planSelected: pick(saved.planSelected, planIds, flags),
      planConfirmed: saved.replacementVersion === 1 ? pick(saved.planConfirmed, planIds, flags) : {},
      completed: pick(saved.completed, knownIds, flags),
      actualDates: pick(saved.actualDates, knownIds, parse),
      customDates: pick(saved.customDates, knownIds, parse),
      customMonths: pick(saved.customMonths, knownIds, (m) => Number.isInteger(m) && m >= 0 && m <= 1200),
      hideReplaced: saved.hideReplaced === true, hideUnplanned: saved.hideUnplanned === true, hideCompleted: saved.hideCompleted === true,
    };
    for (const group of replacements.groups) {
      const selected = group.options.filter((id) => state.planSelected[id]);
      if (selected.length > 1) {
        const keep = selected.find((id) => plans.find((plan) => plan.id === id).doses.some((d) => hasRecord(state, d.id))) ?? selected[0];
        for (const id of selected) {
          if (id !== keep) delete state.planSelected[id];
          delete state.planConfirmed[id];
        }
      }
    }
    if (state.exampleBirthday && state.childGender !== "male" && state.birthDate === data.meta.defaultBirthDate && !state.childName && ![state.completed, state.actualDates, state.planSelected, state.paidSelected, state.customDates, state.customMonths].some((dict) => Object.keys(dict).length)) {
      state.birthDate = ""; state.childGender = "unknown"; state.exampleBirthday = false;
    }
    return state;
  }

  function timing(state, birth, id, referenceMonths, defaultDate = shift(birth, referenceMonths)) {
    const custom = parse(state.customDates[id]);
    const savedMonths = state.customMonths[id];
    const plannedDate = custom || (savedMonths === undefined ? defaultDate : shift(birth, savedMonths));
    const ageMonths = savedMonths ?? (custom ? monthAt(birth, custom) : referenceMonths);
    return { ageMonths, referenceMonths, plannedDate, defaultDate, isCustom: Boolean(custom || savedMonths !== undefined) };
  }
  function monthAt(birth, date) {
    return Math.max(0, Math.round((date.getFullYear() - birth.getFullYear()) * 12 + date.getMonth() - birth.getMonth() + (date.getDate() - birth.getDate()) / 30.4375));
  }

  function items(state) {
    const birth = parse(state.birthDate);
    if (!birth) return [];
    const map = new Map();
    const review = new Set(replacements.groups
      .filter((group) => replacements.courseHasRecord(state, group) && !plans.some((plan) => plan.group === group.id && active(state, plan)))
      .flatMap(replacements.ids));
    for (const plan of plans.filter((p) => active(state, p))) {
      for (const id of coverage(state, plan)) map.set(id, plan.label);
    }

    const byBaseId = new Map();
    const base = data.schedule.filter((task) => !task.legacyFlu || state.paidSelected[task.id] || hasRecord(state, task.id) || state.customDates[task.id] || state.customMonths[task.id] !== undefined).map((task) => {
      const applicable = applies(task, state);
      const replacedBy = map.get(task.id) || "";
      const anchor = byBaseId.get(task.anchor);
      const from = anchor && (parse(state.actualDates[anchor.id]) || anchor.plannedDate);
      const referenceDate = from ? shift(from, task.offsetMonths || 0, task.offsetDays || 0) : undefined;
      const item = { ...task, ...timing(state, birth, task.id, task.ageMonths, referenceDate), applicable, replacedBy, review: review.has(task.id),
        planned: applicable && (task.isFree ? !replacedBy : Boolean(state.paidSelected[task.id])),
      };
      if (task.catalogId === 14 && !hasRecord(state, task.id)) {
        const asOf = parse(state.asOfDate);
        const previousActual = parse(state.actualDates[task.previous]);
        item.pastWindow = asOf > shift(birth, 0, task.previous ? 224 : 84) || Boolean(previousActual && asOf > shift(previousActual, 0, 70));
      }
      if (from && !item.isCustom) item.ageMonths = monthAt(birth, item.plannedDate);
      byBaseId.set(task.id, item);
      return item;
    });
    const extra = plans.flatMap((plan) => {
      const planned = Boolean(active(state, plan));
      const byId = new Map();
      return plan.doses.flatMap((dose) => {
        const anchor = byId.get(dose.anchor);
        const actual = anchor && parse(state.actualDates[anchor.id]);
        const referenceMonths = (state.childGender === "male" ? dose.maleMonths : undefined) ?? dose.ageMonths;
        const date = anchor ? shift(actual || anchor.plannedDate, dose.offsetMonths || 0, dose.offsetDays || 0) : undefined;
        const item = { ...dose, ...timing(state, birth, dose.id, referenceMonths, date),
          plan, applicable: true, planned, isFree: Boolean(plan.isFree), category: plan.isFree ? "free" : "paid", cost: dose.price, detail: plan.note,
        };
        if (anchor && !item.isCustom) item.ageMonths = monthAt(birth, item.plannedDate);
        byId.set(dose.id, item);
        return planned || hasRecord(state, dose.id) ? [item] : [];
      });
    });
    const byFlu = data.schedule.find((task) => task.legacyFlu);
    const seasonal = Object.entries(state.fluSeasons).flatMap(([year, season]) => {
      const firstId = fluKey(year, 1);
      const first = timing(state, birth, firstId, monthAt(birth, parse(season.date)), parse(season.date));
      return Array.from({length: season.doses}, (_, i) => {
        const id = fluKey(year, i + 1);
        const date = i ? shift(parse(state.actualDates[firstId]) || first.plannedDate, 0, 28) : first.defaultDate;
        return { id, season: Number(year), index: i + 1, catalogId: 28, name: `${year}–${Number(year) + 1} 季流感疫苗 · 第 ${i + 1} 剂`,
          ...timing(state, birth, id, monthAt(birth, date), date), planned: true, applicable: true, isFree: false, cost: byFlu.cost,
          detail: i ? "首次两剂灭活程序的两剂至少相隔 4 周，使用同一厂家同种疫苗。" : "按门诊核对的本季安排登记。下一季可单独建计划。" };
      });
    });
    const asOf = parse(state.asOfDate);
    const end = shift(asOf, 0, 90);
    return [...base, ...extra, ...seasonal].map((item) => {
      const has = hasRecord(state, item.id);
      const actual = parse(state.actualDates[item.id]);
      const done = actual ? actual <= asOf : Boolean(state.completed[item.id]);
      const caution = item.pastWindow ? "已到需核对周龄或间隔的时间，请先查接种证；可补录既往实际接种。" : dateCaution(state, item, item.plannedDate, byBaseId);
      return { ...item, caution, hasRecord: has, done, actualAfterView: Boolean(actual && actual > asOf),
        status: done ? "done" : !item.applicable ? "not-applicable" : item.replacedBy ? "replaced"
          : !item.planned ? "not-planned" : (item.review || caution) ? "review" : item.plannedDate < asOf ? "overdue" : item.plannedDate <= end ? "upcoming" : "later",
      };
    }).sort((a, b) => a.plannedDate - b.plannedDate || Number(b.isFree) - Number(a.isFree) || a.name.localeCompare(b.name, "zh-CN"));
  }

  // Outside the routine program, preserve the appointment/history and call for review;
  // do not generate a catch-up course from an incomplete home record.
  const minimumGaps = {
    "task-7":[["task-5",0,28]], "task-26":[["task-5",4,0],["task-7",0,60]],
    "task-14":[["task-9",0,28]], "task-20":[["task-14",0,28]], "task-54":[["task-20",0,28]],
    "task-21":[["task-10",0,28]], "task-27":[["task-21",0,28]], "task-42":[["task-27",6,0]], "task-57":[["task-42",12,0]],
    "task-36":[["task-28",3,0]], "task-52":[["task-36",12,0]], "task-58":[["task-52",36,0]],
    "task-43":[["task-32",0,28]],
  };
  function rvBoundary(state, item, date) {
    if (item.catalogId !== 14 || !date) return false;
    const birth = parse(state.birthDate), limit = item.previous ? 224 : 84;
    return date > shift(birth, 0, limit) && date <= shift(birth, 0, limit + 6);
  }
  function dateCaution(state, item, date, baseMap) {
    const birth = parse(state.birthDate);
    if (!birth || !date) return "";
    if (date < birth) return "计划日期不能早于出生日期。";
    if (item.isFree && date < shift(birth, item.referenceMonths) && !item.anchor)
      return "早于这一剂的常规起始年龄。特殊程序请带接种证向门诊核对。";
    for (const [id, months, days] of minimumGaps[item.id] || []) {
      const previous = parse(state.actualDates[id]) || parse(state.customDates[id]) || baseMap?.get(id)?.plannedDate;
      if (previous && date < shift(previous, months, days)) return "与前一剂的间隔不足，请让门诊核对后续日期。";
    }
    if (item.id === "task-4" && date >= shift(birth, 48)) return "已满 4 周岁，常规程序不再补种卡介苗。";
    if ([ "task-28","task-36"].includes(item.id) && date >= shift(birth, 24)) return "已满 24 月龄，A 群多糖程序不再适用，请门诊核对儿童期流脑安排。";
    if (item.catalogId === 5 && date >= shift(birth, 84)) return "已满 7 周岁，百白破后续接种请按既往记录向门诊核对。";
    if (item.catalogId === 14) {
      if (date < shift(birth, 0, 42) || date > shift(birth, 0, item.previous ? 230 : 90))
        return item.previous ? "请核对五价轮状的周龄窗口（全程不晚于 32 周龄）。" : "请核对五价轮状首剂 6–12 周龄的窗口。";
      if (item.previous) {
        const prev = parse(state.actualDates[item.previous]) || parse(state.customDates[item.previous]) || baseMap?.get(item.previous)?.plannedDate;
        if (prev && (date < shift(prev, 0, 28) || date > shift(prev, 0, 70))) return "请核对五价轮状相邻剂次 4–10 周的间隔。";
      }
    }
    if (item.catalogId === 14 && rvBoundary(state, item, date)) return "处于五价轮状的周龄边界，请按所用产品核对门诊预约日。";
    if (item.season) {
      if (date < shift(birth, 6)) return "流感疫苗从 6 月龄起，请核对日期。";
      if (item.index === 1 && fluYear(iso(date)) !== item.season) return "首剂日期须落在所选季内。";
      if (item.index === 1 && state.fluSeasons[item.season]?.doses === 2 && date >= shift(birth, 108)) return "满 9 周岁的本季程序请核对为 1 剂。";
      if (item.index === 2 && date < item.defaultDate) return "灭活流感疫苗两剂至少相隔 4 周。";
    }
    if (item.anchor && date < item.defaultDate) return "日期早于按上剂推算的参考间隔，请向门诊核对。";
    if (item.id === "je-i-2" && date > shift(item.defaultDate, 0, 3)) return "乙脑灭活疫苗的前两剂相隔 7–10 天，请向门诊核对。";
    return "";
  }
  function agenda(list, asOfDate) {
    const pending = list.filter((i) => i.planned && !i.hasRecord);
    const next = pending.find((i) => ["upcoming","later"].includes(i.status));
    return { next: next ? pending.filter((i) => ["upcoming","later"].includes(i.status) && iso(i.plannedDate) === iso(next.plannedDate)) : [],
      past: pending.filter((i) => i.status === "overdue" || (i.status === "review" && iso(i.plannedDate) <= asOfDate)) };
  }
  function catalogSchedule(entry) {
    const list = entry.schedulePlan ? plans.find((plan) => plan.id === entry.schedulePlan).doses : data.schedule.filter((t) => t.catalogId === entry.id && t.isFree);
    return list.map((t) => ({months:t.ageMonths, days:t.offsetDays || 0, afterMonths:t.offsetMonths || 0}));
  }
  function setProfile(state, key, value) {
    if (!["birthDate", "asOfDate", "childGender"].includes(key)) return false;
    const changed = state[key] !== value;
    state[key] = value;
    if (key === "birthDate") state.exampleBirthday = false;
    if (key === "asOfDate") state.followToday = false;
    let reviewed = false;
    if (changed && key !== "asOfDate") for (const plan of plans) {
      if ((key === "birthDate" || plan.group === "hpv") && state.planConfirmed[plan.id]) {
        delete state.planConfirmed[plan.id]; reviewed = true;
      }
    }
    return reviewed;
  }
  function totals(items) {
    const planned = items.filter((item) => item.planned);
    const upcoming = planned.filter((item) => item.status === "upcoming");
    return { planned: planned.length, done: planned.filter((item) => item.done).length, upcoming, budget: planned.reduce((cost, item) => cost + (Number(item.cost) || 0), 0) };
  }

  root.VACCINE_PLANNER = { today, storageKey, iso, parse, shift, monthAt, empty, readState, items, totals, agenda, fluYear, fluKey, dateCaution, rvBoundary, catalogSchedule, setProfile };
})(typeof window === "undefined" ? globalThis : window);
