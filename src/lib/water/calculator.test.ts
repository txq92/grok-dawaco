import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_PRICES,
  calculateBill,
  parseBill,
  type BillDraft,
} from "./calculator.ts";

function draft(partial: Partial<BillDraft> & { people: string; volume: string }): BillDraft {
  return {
    people: partial.people,
    volume: partial.volume,
    prices: partial.prices ?? {
      tier1: String(DEFAULT_PRICES.tier1),
      tier2: String(DEFAULT_PRICES.tier2),
      tier3: String(DEFAULT_PRICES.tier3),
      over: String(DEFAULT_PRICES.over),
    },
  };
}

function bill(people: number, volume: number) {
  return calculateBill(people, volume, DEFAULT_PRICES);
}

describe("calculateBill", () => {
  it("TC-01: 3 người, 32 m³ = 425.480 đồng", () => {
    const result = bill(3, 32);
    assert.equal(result.quota, 12);
    assert.equal(result.inQuota, 12);
    assert.equal(result.overQuota, 20);
    assert.deepEqual(
      result.lines.map((line) => line.volume),
      [10, 2, 0, 20],
    );
    assert.deepEqual(
      result.lines.map((line) => line.amount),
      [51190, 12270, 0, 362020],
    );
    assert.equal(result.total, 425480);
    const volumeSum = result.lines.reduce((sum, line) => sum + line.volume, 0);
    assert.equal(volumeSum, 32);
  });

  it("TC-02: sản lượng 0", () => {
    assert.equal(bill(3, 0).total, 0);
  });

  it("TC-03: đúng 10 m³ trong định mức", () => {
    const result = bill(3, 10);
    assert.equal(result.lines[0]?.volume, 10);
    assert.equal(result.total, 51190);
  });

  it("TC-04: 12 m³, bậc 1 và bậc 2", () => {
    const result = bill(3, 12);
    assert.deepEqual(
      result.lines.map((line) => line.volume),
      [10, 2, 0, 0],
    );
    assert.equal(result.total, 63460);
  });

  it("TC-05: 1 người, 6 m³", () => {
    const result = bill(1, 6);
    assert.equal(result.quota, 4);
    assert.equal(result.inQuota, 4);
    assert.equal(result.overQuota, 2);
    assert.equal(result.total, 56678);
  });

  it("TC-06: 0 nhân khẩu, toàn bộ ngoài định mức", () => {
    const result = bill(0, 5);
    assert.equal(result.quota, 0);
    assert.equal(result.overQuota, 5);
    assert.equal(result.total, 90505);
  });

  it("TC-09: 9 người, 35 m³ chạm bậc 3", () => {
    const result = bill(9, 35);
    assert.equal(result.quota, 36);
    assert.equal(result.overQuota, 0);
    assert.deepEqual(
      result.lines.map((line) => line.volume),
      [10, 20, 5, 0],
    );
    assert.equal(result.total, 212110);
  });

  it("làm tròn tiền từng dòng khi có m³ lẻ, không làm tròn sản lượng", () => {
    const result = bill(3, 12.5);
    assert.equal(result.overQuota, 0.5);
    assert.equal(result.lines[3]?.amount, Math.round(0.5 * 18101));
    assert.equal(result.lines.reduce((sum, line) => sum + line.volume, 0), 12.5);
  });

  it("từ chối số âm", () => {
    assert.throws(() => bill(-1, 10));
    assert.throws(() => bill(3, -5));
  });
});

describe("parseBill", () => {
  it("TC-07 và TC-08: chặn dữ liệu sai", () => {
    const negativePeople = parseBill(draft({ people: "-1", volume: "10" }));
    assert.equal(negativePeople.ok, false);
    if (!negativePeople.ok) {
      assert.equal(negativePeople.errors[0]?.field, "people");
    }

    const decimalPeople = parseBill(draft({ people: "3.5", volume: "10" }));
    assert.equal(decimalPeople.ok, false);

    const negativeVolume = parseBill(draft({ people: "3", volume: "-5" }));
    assert.equal(negativeVolume.ok, false);
    if (!negativeVolume.ok) {
      assert.ok(negativeVolume.errors.some((error) => error.field === "volume"));
    }

    const comma = parseBill(draft({ people: "3", volume: "12,5" }));
    assert.equal(comma.ok, true);
    if (comma.ok) assert.equal(comma.volume, 12.5);
  });
});
