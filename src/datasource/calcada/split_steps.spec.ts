import { describe, expect, it } from "vitest";
import {
  SPLIT_STAGES,
  panelStages,
  stageBlockedReason,
  stageEnabled,
  stageSummary,
  stoppableStages,
} from "#src/datasource/calcada/split_steps.js";

describe("SPLIT_STAGES", () => {
  it("names the three server waves, all of them stopping points", () => {
    expect(stoppableStages()).toHaveLength(3);
    expect(stoppableStages().map((s) => s.wave)).toEqual([1, 2, 3]);
  });

  // Clear is a fourth button but not a fourth request: the points are kept
  // after a split so the cut can be judged against them, and only Clear takes
  // them away.
  it("offers Clear as a panel step with no request behind it", () => {
    expect(panelStages().map((s) => s.label)).toEqual([
      "Points",
      "Carve",
      "Cut",
      "Clear",
    ]);
    const clear = SPLIT_STAGES.find((s) => s.label === "Clear");
    expect(clear?.clientOnly).toBe(true);
    expect(clear?.stoppable).toBe(false);
    expect(stoppableStages()).not.toContainEqual(clear);
  });

  it("offers Clear whenever there is anything on screen to clear", () => {
    expect(stageEnabled(4, 0, true)).toBe(true);
    expect(stageEnabled(4, 3, true)).toBe(true);
    expect(stageEnabled(4, 0, false)).toBe(false);
  });

  // Each wave runs once now, so nothing reports a round and the panel never
  // has to explain a button firing several times.
  it("marks no wave as repeating", () => {
    expect(SPLIT_STAGES.some((s) => s.repeats)).toBe(false);
  });
});

describe("stageEnabled", () => {
  // The stages are a sequence. Offering all of them at once let step 3 run over
  // a carve that never happened.
  it("offers only the stage that comes next", () => {
    expect([1, 2, 3].map((w) => stageEnabled(w, 0, true))).toEqual([
      true,
      false,
      false,
    ]);
    expect([1, 2, 3].map((w) => stageEnabled(w, 1, true))).toEqual([
      false,
      true,
      false,
    ]);
    expect([1, 2, 3].map((w) => stageEnabled(w, 2, true))).toEqual([
      false,
      false,
      true,
    ]);
  });

  it("offers no server stage once all three have run", () => {
    expect([1, 2, 3].map((w) => stageEnabled(w, 3, true))).toEqual([
      false,
      false,
      false,
    ]);
  });

  it("says which stage to run first when one is pressed out of turn", () => {
    expect(stageBlockedReason(3, 0)).toContain("step 1");
    expect(stageBlockedReason(2, 0)).toContain("step 1");
    expect(stageBlockedReason(1, 2)).toContain("Already run");
    expect(stageBlockedReason(2, 1)).toBeUndefined();
  });
});

describe("stageSummary", () => {
  it("names a wave without a round, since none repeats", () => {
    expect(stageSummary(1, 0)).toBe("Points");
    expect(stageSummary(3, 2)).toBe("Cut");
  });

  it("falls back to the number for a wave it does not know", () => {
    expect(stageSummary(9, 0)).toBe("Stage 9");
  });
});
