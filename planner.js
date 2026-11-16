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
    version: 1, replacementVersion: 1, childName: "", childGender: "female", birthDate: data.meta.defaultBirthDate, asOfDate: today,
    exampleBirthday: true, paidSelected: {}, planSelected: {}, planConfirmed: {}, completed: {}, actualDates: {}, customDates: {},
    customMonths: {}, hideReplaced: false, hideUnplanned: false, hideCompleted: false,
  });
  const taskIds = [...data.schedule.map((t) => t.id), ...plans.flatMap((p) => p.doses.map((d) => d.id))];
  const planIds = plans.map((p) => p.id);
  const pick = (source, keys, match) => Object.fromEntries(keys
    .filter((key) => source && Object.hasOwn(source, key) && match(source[key]))
    .map((key) => [key, source[key]]));
  function readState(saved) {
    if (!saved || saved.version !== 1 || !parse(saved.birthDate)) throw new Error("无效的备份");
    const flags = (value) => value === true;
    const state = {
      ...empty(),
      childName: typeof saved.childName === "string" ? saved.childName.slice(0, 20) : "",
      childGender: saved.childGender === "male" ? "male" : "female",
      birthDate: saved.birthDate, asOfDate: parse(saved.asOfDate) ? saved.asOfDate : today,
      exampleBirthday: saved.exampleBirthday === true,
      paidSelected: pick(saved.paidSelected, data.schedule.filter((t) => !t.isFree).map((t) => t.id), flags),
      planSelected: pick(saved.planSelected, planIds, flags),
      planConfirmed: saved.replacementVersion === 1 ? pick(saved.planConfirmed, planIds, flags) : {},
      completed: pick(saved.completed, taskIds, flags),
      actualDates: pick(saved.actualDates, taskIds, parse),
      customDates: pick(saved.customDates, taskIds, parse),
      customMonths: pick(saved.customMonths, taskIds, (m) => Number.isInteger(m) && m >= 0 && m <= 1200),
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
    const map = new Map();
    const review = new Set(replacements.groups
      .filter((group) => replacements.courseHasRecord(state, group) && !plans.some((plan) => plan.group === group.id && active(state, plan)))
      .flatMap(replacements.ids));
    for (const plan of plans.filter((p) => active(state, p))) {
      for (const id of coverage(state, plan)) map.set(id, plan.label);
    }

    const base = data.schedule.map((task) => {
      const applicable = applies(task, state);
      const replacedBy = map.get(task.id) || "";
      return { ...task, ...timing(state, birth, task.id, task.ageMonths), applicable, replacedBy, review: review.has(task.id),
        planned: applicable && (task.isFree ? !replacedBy : Boolean(state.paidSelected[task.id])),
      };
    });
    const extra = plans.flatMap((plan) => {
      const planned = Boolean(active(state, plan));
      const byId = new Map();
      return plan.doses.flatMap((dose) => {
        const anchor = byId.get(dose.anchor);
        const actual = anchor && parse(state.actualDates[anchor.id]);
        const referenceMonths = (state.childGender === "male" ? dose.maleMonths : undefined) ?? dose.ageMonths;
        const date = anchor ? shift(actual || anchor.plannedDate, 0, dose.offsetDays) : undefined;
        const item = { ...dose, ...timing(state, birth, dose.id, referenceMonths, date),
          plan, applicable: true, planned, isFree: Boolean(plan.isFree), category: plan.isFree ? "free" : "paid", cost: dose.price, detail: plan.note,
        };
        byId.set(dose.id, item);
        return planned || hasRecord(state, dose.id) ? [item] : [];
      });
    });
    const asOf = parse(state.asOfDate);
    const end = shift(asOf, 0, 90);
    return [...base, ...extra].map((item) => {
      const has = hasRecord(state, item.id);
      const actual = parse(state.actualDates[item.id]);
      const done = Boolean(state.completed[item.id] && (!actual || actual <= asOf));
      return { ...item, hasRecord: has, done, actualAfterView: Boolean(actual && actual > asOf),
        status: done ? "done" : !item.applicable ? "not-applicable" : item.replacedBy ? "replaced"
          : !item.planned ? "not-planned" : item.review ? "review" : item.plannedDate < asOf ? "overdue" : item.plannedDate <= end ? "upcoming" : "later",
      };
    }).sort((a, b) => a.plannedDate - b.plannedDate || Number(b.isFree) - Number(a.isFree) || a.name.localeCompare(b.name, "zh-CN"));
  }

  function totals(items) {
    const planned = items.filter((item) => item.planned);
    const upcoming = planned.filter((item) => item.status === "upcoming");
    return { planned: planned.length, done: planned.filter((item) => item.done).length, upcoming, budget: planned.reduce((cost, item) => cost + (Number(item.cost) || 0), 0) };
  }

  root.VACCINE_PLANNER = { today, storageKey, iso, parse, shift, monthAt, empty, readState, items, totals };
})(typeof window === "undefined" ? globalThis : window);
