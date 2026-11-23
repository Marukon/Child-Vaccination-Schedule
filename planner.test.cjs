const assert = require("node:assert/strict");
const test = require("node:test");
globalThis.window = {};
require("./data.js");
require("./replacement.js");
require("./planner.js");

const { VACCINE_REPLACEMENTS: r, VACCINE_PLANNER: p, VACCINE_DATA: data } = window;
const group = (id) => r.groups.find((g) => g.id === id);
const row = (state, id) => p.items(state).find((item) => item.id === id);
const budget = (state) => p.totals(p.items(state)).budget;
const testState = () => ({ ...p.empty(), birthDate: "2025-01-31", asOfDate: "2025-09-30" });

test("every comparison refers to valid, uniquely identified doses and a single option group", () => {
  const seen = new Set(data.schedule.map((t) => t.id));
  for (const plan of r.plans) {
    assert.ok(plan.replaces.every((id) => data.schedule.some((t) => t.id === id && t.isFree)));
    assert.equal(r.groups.filter((g) => g.options.includes(plan.id)).length, 1);
    assert.equal(plan.doses.reduce((n, dose) => n + dose.price, 0), plan.price);
    for (const dose of plan.doses) {
      if (dose.anchor) assert.ok(seen.has(dose.anchor));
      assert.equal(seen.has(dose.id), false);
      seen.add(dose.id);
    }
  }
  assert.deepEqual(data.catalog.map((c) => c.id), Array.from({length:35}, (_, i) => i + 1));
  assert.ok(data.schedule.every((t) => data.catalog.some((c) => c.id === t.catalogId)));
  for (const c of data.catalog) {
    if (c.source) assert.ok(data.sources.some((source) => source.id === c.source && source.url.startsWith("https://")));
    if (c.compare) assert.ok(group(c.compare));
  }
});

test("a draft keeps baseline doses and budget unchanged; applying switches both", () => {
  const s = testState();
  const men = group("men-infant");
  assert.ok(r.applyChoice(s, men, "menhyxia", false));
  assert.equal(budget(s), 0);
  assert.equal(row(s, "task-28").planned, true);
  assert.equal(row(s, "menhyxia-1"), undefined);
  assert.ok(r.applyChoice(s, men, "menhyxia", true));
  assert.equal(budget(s), 840);
  assert.equal(row(s, "task-28").status, "replaced");
  assert.equal(row(s, "task-52").planned, true);
  assert.equal(row(s, "menhyxia-1").planned, true);
});

test("same-group alternatives switch only after confirmation and can return to baseline", () => {
  const s = testState();
  const men = group("men-infant");
  assert.ok(r.applyChoice(s, men, "menhyxia", true));
  assert.equal(r.applyChoice(s, men, "menac", false), false);
  assert.equal(budget(s), 840);
  assert.ok(r.applyChoice(s, men, "menac", true));
  assert.equal(budget(s), 390);
  assert.equal(row(s, "menhyxia-1"), undefined);
  assert.ok(r.applyChoice(s, men, "", false));
  assert.equal(row(s, "task-28").planned, true);
  assert.equal(budget(s), 0);
});

test("already recorded baseline doses prevent applying a new whole course", () => {
  const s = testState();
  s.completed["task-9"] = true;
  assert.ok(r.applyChoice(s, group("combination"), "pentavalent", false));
  assert.equal(r.applyChoice(s, group("combination"), "pentavalent", true), false);
  assert.equal(row(s, "task-9").status, "done");
  assert.equal(row(s, "task-57").planned, true);
});

test("recorded alternate doses lock switching, preserving past doses and their dates", () => {
  const s = testState();
  const men = group("men-infant");
  r.applyChoice(s, men, "menhyxia", true);
  s.completed["menhyxia-1"] = true;
  s.actualDates["menhyxia-1"] = "2025-07-31";
  assert.equal(r.applyChoice(s, men, "menac", true), false);
  assert.equal(r.applyChoice(s, men, "", false), false);
  assert.equal(r.applyChoice(s, men, "menhyxia", false), false);
  assert.equal(row(s, "menhyxia-1").done, true);
});

test("sibling paid ACYW item and the 3/6 year course require clinic review before co-planning", () => {
  const s = testState();
  s.paidSelected["task-50"] = true;
  assert.equal(r.applyChoice(s, group("men-child"), "acyw-mpsv4", true), false);
  assert.equal(row(s, "task-50").planned, true);
  assert.equal(row(s, "task-52").planned, true);
});

test("inactivated JE adds four planning rows, with the second tied to the first", () => {
  const s = testState();
  assert.ok(r.applyChoice(s, group("je"), "je-inactivated", true));
  assert.equal(p.iso(row(s, "je-i-1").plannedDate), "2025-09-30");
  assert.equal(p.iso(row(s, "je-i-2").plannedDate), "2025-10-07");
  s.customDates["je-i-1"] = "2025-10-12";
  assert.equal(p.iso(row(s, "je-i-2").plannedDate), "2025-10-19");
  s.actualDates["je-i-1"] = "2025-10-15";
  assert.equal(p.iso(row(s, "je-i-2").plannedDate), "2025-10-22");
  s.customDates["je-i-2"] = "2025-10-23";
  assert.equal(p.iso(row(s, "je-i-2").plannedDate), "2025-10-23");
  assert.equal(p.items(s).filter((item) => item.plan?.id === "je-inactivated").length, 4);
  assert.equal(row(s, "task-33").planned, false);
  assert.equal(budget(s), 0);
});

test("HepA compares two different funding paths without mixing their courses", () => {
  const s = testState();
  const hepa = group("hepa");
  r.applyChoice(s, hepa, "hepa-nip", true);
  assert.equal(row(s, "hepa-nip-2").planned, true);
  assert.equal(budget(s), 0);
  r.applyChoice(s, hepa, "hepa-inactivated", true);
  assert.equal(row(s, "hepa-nip-2"), undefined);
  assert.equal(row(s, "hepa-i-2").planned, true);
  assert.equal(budget(s), 316);
});

test("HPV honors the national birth-date cutoff and does not place boys' imported nine-valent option at 13", () => {
  const s = testState();
  s.childGender = "female";
  s.birthDate = "2011-11-09";
  assert.equal(row(s, "task-60").applicable, false);
  s.birthDate = "2011-11-10";
  assert.equal(row(s, "task-60").applicable, true);
  s.childGender = "male";
  assert.equal(row(s, "task-60").applicable, false);
  r.applyChoice(s, group("hpv"), "hpv9", true);
  assert.equal(p.iso(row(s, "hpv9-course").plannedDate), "2027-11-10");
});

test("a legacy backup imports dates and history while requiring replacement reconfirmation", () => {
  const legacy = testState();
  delete legacy.replacementVersion;
  legacy.planSelected.menhyxia = true;
  legacy.planConfirmed.menhyxia = true;
  legacy.completed["menhyxia-1"] = true;
  legacy.actualDates["menhyxia-1"] = "2025-07-31";
  legacy.customDates["menhyxia-2"] = "2025-11-04";
  const s = p.readState(legacy);
  assert.equal(s.planSelected.menhyxia, true);
  assert.equal(s.planConfirmed.menhyxia, undefined);
  assert.equal(row(s, "task-28").status, "review");
  assert.equal(row(s, "menhyxia-1").done, true);
  assert.equal(s.actualDates["menhyxia-1"], "2025-07-31");
  assert.equal(s.customDates["menhyxia-2"], "2025-11-04");
  assert.ok(r.applyChoice(s, group("men-infant"), "menhyxia", true));
  assert.equal(p.iso(row(s, "menhyxia-2").plannedDate), "2025-11-04");
  assert.deepEqual(p.readState(JSON.parse(JSON.stringify(s))).planConfirmed, s.planConfirmed);
});

test("recorded date is retained when viewing a day earlier than the actual vaccination", () => {
  const s = testState();
  s.asOfDate = "2025-02-01";
  s.completed["task-9"] = true;
  s.actualDates["task-9"] = "2025-03-31";
  assert.equal(row(s, "task-9").hasRecord, true);
  assert.equal(row(s, "task-9").done, false);
  assert.equal(row(s, "task-9").actualAfterView, true);
});

test("dates use calendar days and clamp end of month without accepting invalid backups", () => {
  assert.equal(p.iso(p.shift(p.parse("2024-01-31"), 1)), "2024-02-29");
  assert.equal(p.iso(p.shift(p.parse("2025-01-31"), 1)), "2025-02-28");
  assert.equal(p.parse("2025-02-30"), null);
  assert.throws(() => p.readState({ version: 1, birthDate: "2025-02-30" }));
});


test("national program and catalog use the same children’s dose definitions", () => {
  const dates = {1:[0,1,6],2:[0],3:[2,3],4:[4,48],5:[2,4,6,18,72],8:[8,18],9:[8,24],10:[6,9],11:[36,72],12:[18],13:[156,162],25:[18,24],35:[8,8,24,72]};
  for (const [id, expected] of Object.entries(dates)) {
    const ref = data.catalog.find((c) => c.id === Number(id));
    assert.equal(ref.type,"免疫规划");
    assert.deepEqual(p.catalogSchedule(ref).map((d) => d.months),expected);
  }
  assert.deepEqual(data.catalog.filter((c) => c.type === "免疫规划").map((c) => c.id),Object.keys(dates).map(Number));
  for (const id of [6,7,17,34]) assert.equal(data.catalog.find((c) => c.id === id).type,"特定情况");
  assert.equal(p.catalogSchedule(data.catalog.find((c) => c.id === 35))[1].days,7);
});

test("first use and empty backup require a real birthday; existing records on the example birthday survive", () => {
  assert.equal(p.empty().birthDate,"");
  assert.equal(p.empty().childGender,"unknown");
  assert.deepEqual(p.items(p.empty()),[]);
  assert.deepEqual(p.readState(p.empty()),p.empty());
  const old = { ...testState(), exampleBirthday:true, birthDate:data.meta.defaultBirthDate, childGender:"female" };
  delete old.calendarVersion; delete old.followToday;
  old.actualDates["task-9"]="2026-11-01"; old.paidSelected["task-30"]=true; old.customDates["task-30"]="2027-03-01";
  const restored=p.readState(old);
  assert.equal(restored.birthDate, old.birthDate);
  assert.equal(restored.followToday,false); assert.equal(restored.asOfDate, old.asOfDate);
  assert.equal(row(restored,"task-30").planned,true);
  assert.deepEqual(restored.actualDates,old.actualDates);
  assert.equal(p.readState({...old,followToday:true}).asOfDate,p.today);
});

test("entering sex never cancels unrelated courses, and unknown sex cannot activate an HPV course", () => {
  const s = testState();
  assert.equal(r.applyChoice(s, group("hpv"), "hpv9", true),false);
  r.applyChoice(s,group("combination"),"pentavalent",true);
  assert.equal(p.setProfile(s,"childGender","female"),false);
  assert.ok(r.active(s,r.plans.find((plan) => plan.id === "pentavalent")));
  assert.ok(r.applyChoice(s,group("hpv"),"hpv9",true));
  assert.equal(p.setProfile(s,"childGender","male"),true);
  assert.ok(s.planConfirmed.pentavalent); assert.ok(!s.planConfirmed.hpv9);
  assert.equal(p.setProfile(s,"birthDate","2025-02-01"),true);
  assert.equal(s.planSelected.pentavalent,true); assert.equal(s.planConfirmed.pentavalent,undefined);
});

test("EV71 uses one calendar month, HPV and inactivated HepA use six; actual dates and manual appointments win", () => {
  const s = testState(); s.childGender="female";
  assert.equal(p.iso(row(s,"task-34").plannedDate),"2025-08-31");
  s.customDates["task-29"]="2025-08-15";
  assert.equal(p.iso(row(s,"task-34").plannedDate),"2025-09-15");
  s.actualDates["task-29"]="2025-08-31";
  assert.equal(p.iso(row(s,"task-34").plannedDate),"2025-09-30");
  s.customDates["task-34"]="2025-10-02";
  assert.equal(p.iso(row(p.readState(s),"task-34").plannedDate),"2025-10-02");
  s.actualDates["task-60"]="2038-03-31";
  assert.equal(p.iso(row(s,"task-61").plannedDate),"2038-09-30");
  for (const [plan, first, second] of [["hepa-nip","hepa-nip-1","hepa-nip-2"],["hepa-inactivated","hepa-i-1","hepa-i-2"]]) {
    const st=testState(); r.applyChoice(st,group("hepa"),plan,true);
    st.actualDates[first]="2026-08-31";
    assert.equal(p.iso(row(st,second).plannedDate),"2027-02-28");
  }
});

test("past schedules are for checking the record; the upcoming visit groups unrecorded items by exact date", () => {
  const s=testState(); s.asOfDate="2025-03-31";
  let result=p.agenda(p.items(s),s.asOfDate);
  assert.deepEqual(new Set(result.next.map((i)=>i.id)),new Set(["task-9","task-10"]));
  assert.equal(result.past.length,3);
  s.actualDates["task-9"]="2025-03-31";
  assert.equal(row(s,"task-9").done,true);
  assert.deepEqual(p.agenda(p.items(s),s.asOfDate).next.map((i)=>i.id),["task-10"]);
  s.completed["task-10"]=true;
  assert.equal(p.iso(p.agenda(p.items(s),s.asOfDate).next[0].plannedDate),"2025-04-30");
});

test("RV5: boundaries, preceding dose intervals, expired windows and historical facts stay separate", () => {
  const s=testState(); s.asOfDate="2025-03-15";
  const birth=p.parse(s.birthDate), first=row(s,"task-12");
  for(const [days,ok] of [[41,false],[42,true],[84,true],[91,false]]) assert.equal(!p.dateCaution(s,first,p.shift(birth,0,days)),ok);
  assert.equal(p.rvBoundary(s,first,p.shift(birth,0,85)),true);
  assert.ok(p.dateCaution(s,first,p.shift(birth,0,85)));
  s.actualDates["task-12"]="2025-03-16";
  const second=row(s,"task-24");
  for(const [days,ok] of [[27,false],[28,true],[70,true],[71,false]]) assert.equal(!p.dateCaution(s,second,p.shift(p.parse("2025-03-16"),0,days)),ok);
  s.asOfDate="2026-01-31";
  assert.equal(row(s,"task-37").pastWindow,true);
  s.actualDates["task-37"]="2025-08-30";
  assert.equal(row(s,"task-37").done,true);
  assert.equal(row(s,"task-37").pastWindow,undefined);
});

test("flu seasons have independent dose records, real first doses anchor the second, historic single rows survive", () => {
  const s=testState(); s.asOfDate="2026-11-24";
  assert.ok(!row(s,"task-30")); assert.equal(p.fluYear("2026-06-30"),2025); assert.equal(p.fluYear("2026-07-01"),2026);
  s.fluSeasons={2025:{date:"2025-10-01",doses:1},2026:{date:"2026-10-10",doses:2}};
  s.completed["flu-2025-1"]=true; s.actualDates["flu-2025-1"]="2025-10-02";
  s.actualDates["flu-2026-1"]="2026-11-09";
  assert.equal(p.iso(row(s,"flu-2026-2").plannedDate),"2026-12-07");
  assert.ok(p.dateCaution(s,row(s,"flu-2026-2"),p.parse("2026-12-06")));
  assert.ok(row(s,"flu-2025-1").done);
  assert.equal(budget(s),246);
  s.customDates["flu-2026-2"]="2026-12-12";
  s.actualDates["task-30"]="2025-08-12";
  const restored=p.readState(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored.fluSeasons,s.fluSeasons);
  assert.equal(p.iso(row(restored,"flu-2026-2").plannedDate),"2026-12-12");
  assert.ok(row(restored,"task-30").done);
  assert.deepEqual(p.readState({...s,fluSeasons:{2026:{doses:2,date:"2024-10-01"}}}).fluSeasons,{});
});

test("earlier appointments respect program starting ages and recorded minimum gaps; stored history is still readable", () => {
  const s=testState(), birth=p.parse(s.birthDate); s.childGender="female";
  assert.ok(p.dateCaution(s,row(s,"task-57"),p.shift(birth,18)));
  s.actualDates["task-27"]="2026-05-31";
  const fourth=row(s,"task-42");
  assert.equal(fourth.status,"review");
  assert.ok(!p.dateCaution(s,fourth,p.parse("2026-11-30")));
  s.actualDates["task-42"]="2026-09-01"; s.asOfDate="2026-10-01";
  assert.equal(row(s,"task-42").done,true);
  s.customDates["task-4"]="2030-01-31";
  assert.equal(row(s,"task-4").status,"review");
});
