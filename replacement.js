/* Plan comparison metadata. Clinical conditions are linked to the owning source. */
((root) => {
  const guideline = "国家免疫规划疫苗儿童免疫程序及说明（2026年版）.pdf";
  const hpvSource = root.VACCINE_DATA.sources.find((source) => source.id === "hpv").url;
  const groups = [
    { id: "combination", icon: "layers", title: "百白破 · 脊灰", baseline: "分开接种", subtitle: "比较常规程序与五联方案", options: ["pentavalent"] },
    { id: "men-infant", icon: "shield", title: "婴幼儿流脑", baseline: "A群流脑多糖", subtitle: "比较 A 群、AC 结合与四价结合", options: ["menhyxia", "menac"] },
    { id: "men-child", icon: "shield", title: "3 岁及 6 岁流脑", baseline: "A+C群流脑多糖", subtitle: "比较 A+C 群与四价多糖", options: ["acyw-mpsv4"] },
    { id: "je", icon: "circle", title: "流行性乙型脑炎", baseline: "乙脑减毒活", subtitle: "比较减毒活与灭活程序", options: ["je-inactivated"] },
    { id: "hepa", icon: "circle", title: "甲型肝炎", baseline: "甲肝减毒活", subtitle: "比较减毒活与灭活程序", options: ["hepa-nip", "hepa-inactivated"] },
    { id: "hpv", icon: "shield", title: "HPV", baseline: "国家免疫规划双价 HPV", subtitle: "比较双价、四价与九价", options: ["hpv4", "hpv9"] },
  ];

  function legacyHepa() {
    return root.VACCINE_DATA.replacementPlans.find((p) => p.id === "hepa-inactivated").doses.map((d, i) => i ? {...d, anchor: "hepa-i-1", offsetMonths: 6} : d);
  }
  const patches = {
    pentavalent: {
      label: "五联疫苗（百白破-IPV-Hib）", schedule: "2、3、4、18 月龄，共 4 剂（排期示例）",
      basis: "第二部分 · 三、四",
      note: "门诊需核对品牌、剂次与间隔；按免疫程序完成 4 剂含 IPV 成分疫苗后，无需再接种 bOPV。6 周岁百白破仍保留在计划中。",
    },
    menhyxia: {
      label: "曼海欣 · ACYW135 结合", schedule: "6–23 月龄起种：2 剂，相隔 1–3 个月", extraSource: root.VACCINE_DATA.sources.find((s) => s.id === "men").url,
      basis: "第二部分 · 八",
      note: "小于 24 月龄儿童按具体流脑结合疫苗说明书完成规定剂次后，可计入 A 群流脑剂次。3 岁及 6 岁方案另行管理。",
    },
    menac: {
      label: "AC 结合流脑疫苗", priceBasis: "原公示预算以 3 剂 × 130 元估算，实际剂数取决于产品和起种年龄。", schedule: "剂次数与接种时间按产品和门诊安排",
      basis: "第二部分 · 八",
      note: "小于 24 月龄儿童按具体产品说明书完成全程后，可计入 A 群流脑剂次。时间线保留一条全程备忘。",
      doses: [{ id: "menac-course", ageMonths: 3, name: "AC结合流脑疫苗（全程备忘）", price: 390, course: true }],
    },
    "acyw-mpsv4": {
      label: "ACYW135 四价多糖", schedule: "3、6 周岁，各 1 剂（排期示例）",
      basis: "第二部分 · 八",
      note: "3 岁和 6 岁接种含 A、C 两群成分的疫苗，可计入相应剂次。门诊需核对具体产品、既往剂次和间隔。",
    },
    "je-inactivated": {
      label: "乙脑灭活 · 免疫规划", price: 0, isFree: true,
      schedule: "8 月龄 2 剂（间隔 7–10 天），2 岁、6 岁各 1 剂",
      replaces: ["task-33", "task-48"], basis: "第二部分 · 六、七",
      note: "当地供应及既往剂次由门诊核对。第 2 剂默认展示首剂计划日后第 7 天；登记首剂实际日期后，按实际日期推算，手动排期优先。",
      doses: [
        { id: "je-i-1", ageMonths: 8, name: "乙脑灭活疫苗 - 第1剂" },
        { id: "je-i-2", ageMonths: 8, anchor: "je-i-1", offsetDays: 7, name: "乙脑灭活疫苗 - 第2剂" },
        { id: "je-i-3", ageMonths: 24, name: "乙脑灭活疫苗 - 第3剂" },
        { id: "je-i-4", ageMonths: 72, name: "乙脑灭活疫苗 - 第4剂" },
      ],
    },
    "hepa-nip": {
      label: "甲肝灭活 · 免疫规划", price: 0, isFree: true, replaces: ["task-44"],
      schedule: "18 月龄、2 周岁，各 1 剂", basis: "第二部分 · 九、十",
      note: "先向当地门诊确认免疫规划灭活产品的供应；如已有剂次或需要补种，由门诊安排。",
      doses: [
        { id: "hepa-nip-1", ageMonths: 18, name: "甲肝灭活疫苗（免疫规划） - 第1剂" },
        { id: "hepa-nip-2", ageMonths: 24, anchor: "hepa-nip-1", offsetMonths: 6, name: "甲肝灭活疫苗（免疫规划） - 第2剂" },
      ],
    },
    "hepa-inactivated": {
      doses: legacyHepa(), label: "甲肝灭活 · 自费", schedule: "18 月龄、2 周岁，各 1 剂", basis: "第二部分 · 九、十",
      note: "符合说明书的甲肝灭活全程可计入免疫规划程序；若已有剂次或需要补种，由门诊确定衔接。",
    },
    hpv4: {
      label: "四价 HPV", priceBasis: "原公示预算按 3 剂 × 818 元估算，实际剂数按具体产品和年龄。", schedule: "剂次按具体产品说明书及门诊安排",
      basis: "第二部分 · 十一", extraSource: hpvSource,
      note: "比较开始接种前的全程选项。按说明书完成相应 HPV 全程后，符合免费资格的女孩无需再接种规划双价 HPV；已有剂次请带接种证请门诊核对。",
      doses: [{ id: "hpv4-course", ageMonths: 156, name: "四价HPV疫苗（全程备忘）", price: 2454, course: true }],
    },
    hpv9: {
      label: "九价 HPV", priceBasis: "原公示预算按 3 剂 × 1,318 元估算，实际剂数按具体产品和年龄。", schedule: "剂次按具体产品说明书及门诊安排",
      basis: "第二部分 · 十一", extraSource: hpvSource,
      note: "比较开始接种前的全程选项。原表佳达修 9 男性适用年龄为 16–26 岁；按说明书完成 HPV 全程后，符合免费资格的女孩无需再接种规划双价 HPV。",
      doses: [{ id: "hpv9-course", ageMonths: 156, maleMonths: 192, name: "九价HPV疫苗（全程备忘）", price: 3954, course: true }],
    },
  };
  const legacy = new Map(root.VACCINE_DATA.replacementPlans.map((plan) => [plan.id, plan]));
  const plans = groups.flatMap((group) => group.options.map((id) => ({
    ...legacy.get(id), ...patches[id], id, group: group.id,
    get name() { return this.label; },
  })));
  for (const plan of plans) plan.doses = plan.doses.map((dose) => ({ price: 0, ...dose }));

  const ids = (group) => [...new Set(plans.filter((plan) => plan.group === group.id).flatMap((plan) => plan.replaces))];
  const familyDoseIds = (group) => plans.filter((plan) => plan.group === group.id).flatMap((plan) => plan.doses.map((dose) => dose.id));
  const hasRecord = (state, id) => Boolean(state.completed[id] || state.actualDates[id]);
  const applies = (task, state) => !task.gender || (state.childGender === task.gender && state.birthDate >= "2011-11-10");
  const defaultName = (group, state) => group.id === "hpv" && !applies({ gender: "female" }, state) ? "不添加 HPV 方案" : group.baseline;
  const selection = (state, group) => group.options.find((id) => state.planSelected[id]) || "";
  const approved = (state, plan) => Boolean(plan && state.planSelected[plan.id] && state.planConfirmed[plan.id] === true);
  const coverage = (state, plan) => plan.replaces.filter((id) => {
    const task = root.VACCINE_DATA.schedule.find((item) => item.id === id);
    return task && applies(task, state) && !hasRecord(state, id);
  });
  const history = (state, group, selectedId) => {
    const others = group.options.filter((id) => id !== selectedId);
    const related = group.id === "men-child" ? ["task-50"] : group.id === "combination" ? ["task-57"] : [];
    return [...ids(group), ...related, ...plans.filter((plan) => others.includes(plan.id)).flatMap((plan) => plan.doses.map((dose) => dose.id))]
      .some((id) => hasRecord(state, id));
  };
  const active = (state, plan) => {
    const group = groups.find((item) => item.id === plan?.group);
    return group && selection(state, group) === plan.id && approved(state, plan);
  };

  const courseHasRecord = (state, group) => familyDoseIds(group).some((id) => hasRecord(state, id));
  const separateConflict = (state, plan) => plan?.id === "acyw-mpsv4" && state.paidSelected["task-50"] === true;

  function applyChoice(state, group, chosen, confirmed) {
    if (chosen && !group.options.includes(chosen)) return false;
    if (chosen && confirmed && group.id === "hpv" && !["female","male"].includes(state.childGender)) return false;
    const current = selection(state, group);
    const plan = plans.find((item) => item.id === chosen);
    const currentPlan = plans.find((item) => item.id === current);
    if (current !== chosen && courseHasRecord(state, group)) return false;
    if (chosen && !confirmed && active(state, currentPlan)) return false;
    if (confirmed && (separateConflict(state, plan) || (!active(state, plan) && history(state, group, chosen)))) return false;
    for (const id of group.options) {
      if (id === chosen) state.planSelected[id] = true;
      else delete state.planSelected[id];
      if (id === chosen && confirmed) state.planConfirmed[id] = true;
      else delete state.planConfirmed[id];
    }
    return true;
  }

  root.VACCINE_REPLACEMENTS = { guideline, groups, plans, ids, hasRecord, applies, defaultName, selection, active, coverage, history, courseHasRecord, separateConflict, applyChoice };
})(typeof window === "undefined" ? globalThis : window);
