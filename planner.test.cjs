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
  assert.equal(data.catalog.length, 34);
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
