/** Pure water-bill math. UI must not reimplement these rules. */

export const QUOTA_M3_PER_PERSON = 4;
/** First block of in-quota volume, fixed per household under assumption A. */
export const TIER1_CAP_M3 = 10;
/** Next block of in-quota volume, fixed per household under assumption A. */
export const TIER2_CAP_M3 = 20;

export const PRICE_KEYS = ["tier1", "tier2", "tier3", "over"] as const;
export type PriceKey = (typeof PRICE_KEYS)[number];
export type Prices = Record<PriceKey, number>;

export const DEFAULT_PRICES: Prices = {
  tier1: 5119,
  tier2: 6135,
  tier3: 7644,
  over: 18101,
};

export const PRICE_LABELS: Record<PriceKey, string> = {
  tier1: "Bậc 1",
  tier2: "Bậc 2",
  tier3: "Bậc 3",
  over: "Ngoài định mức",
};

export const LINE_HINTS: Record<PriceKey, string> = {
  tier1: "10 m³ đầu trong định mức",
  tier2: "20 m³ tiếp theo trong định mức",
  tier3: "Phần trong định mức trên 30 m³",
  over: "Phần vượt định mức nhân khẩu",
};

export type BillLine = {
  id: PriceKey;
  label: string;
  hint: string;
  volume: number;
  unitPrice: number;
  /** Nearest đồng. Intermediate volumes are not rounded. */
  amount: number;
};

export type BillResult = {
  quota: number;
  inQuota: number;
  overQuota: number;
  lines: BillLine[];
  total: number;
};

export type BillDraft = {
  people: string;
  volume: string;
  prices: Record<PriceKey, string>;
};

export type BillError = {
  field: "people" | "volume" | PriceKey;
  message: string;
};

export type ParsedBill =
  | { ok: true; people: number; volume: number; prices: Prices }
  | { ok: false; errors: BillError[] };

export function roundVnd(amount: number): number {
  return Math.round(amount);
}

/**
 * Assumption A (not an official household-conversion rule):
 * quota = 4 × people; in-quota volume is split on fixed 10 / 20 / remainder
 * thresholds of a single household; the rest is the over-quota price.
 */
export function calculateBill(
  people: number,
  volume: number,
  prices: Prices,
): BillResult {
  if (!Number.isInteger(people) || people < 0) {
    throw new Error("Số nhân khẩu không hợp lệ.");
  }
  if (!Number.isFinite(volume) || volume < 0) {
    throw new Error("Lượng nước không hợp lệ.");
  }
  for (const key of PRICE_KEYS) {
    const price = prices[key];
    if (!Number.isFinite(price) || price < 0) {
      throw new Error("Đơn giá không hợp lệ.");
    }
  }

  const quota = QUOTA_M3_PER_PERSON * people;
  const inQuota = Math.min(volume, quota);
  const overQuota = Math.max(0, volume - quota);
  const tier1 = Math.min(inQuota, TIER1_CAP_M3);
  const tier2 = Math.min(Math.max(inQuota - TIER1_CAP_M3, 0), TIER2_CAP_M3);
  const tier3 = Math.max(inQuota - TIER1_CAP_M3 - TIER2_CAP_M3, 0);
  const volumes: Record<PriceKey, number> = {
    tier1,
    tier2,
    tier3,
    over: overQuota,
  };

  const lines: BillLine[] = PRICE_KEYS.map((id) => ({
    id,
    label: PRICE_LABELS[id],
    hint: LINE_HINTS[id],
    volume: volumes[id],
    unitPrice: prices[id],
    amount: roundVnd(volumes[id] * prices[id]),
  }));

  return {
    quota,
    inQuota,
    overQuota,
    lines,
    total: lines.reduce((sum, line) => sum + line.amount, 0),
  };
}

function parsePeople(raw: string): { value: number } | { message: string } {
  const text = raw.trim();
  if (!text) return { message: "Nhập số nhân khẩu." };
  if (text.startsWith("-")) return { message: "Số nhân khẩu không được âm." };
  if (!/^\d+$/.test(text)) {
    return { message: "Số nhân khẩu phải là số nguyên không âm." };
  }
  const value = Number(text);
  if (!Number.isSafeInteger(value)) {
    return { message: "Số nhân khẩu quá lớn." };
  }
  return { value };
}

function parseNonNegative(
  raw: string,
  empty: string,
  negative: string,
  invalid: string,
): { value: number } | { message: string } {
  const text = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!text) return { message: empty };
  if (text.startsWith("-")) return { message: negative };
  if (!/^\d+(\.\d+)?$/.test(text)) return { message: invalid };
  const value = Number(text);
  if (!Number.isFinite(value)) return { message: invalid };
  return { value };
}

/**
 * Unit prices follow Vietnamese notation: dots group thousands and a comma
 * separates decimals. Ungrouped prices (5119) remain valid. Volume parsing
 * stays separate so 5.119 m³ still means a fractional volume.
 */
function normalizePrice(raw: string): string {
  const text = raw.trim().replace(/\s/g, "");
  if (!/^\d+(,\d+)?$/.test(text) && !/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(text)) {
    return ""; // Reject malformed grouping rather than silently changing value.
  }
  return text.replace(/\./g, "").replace(",", ".");
}

export function parseBill(draft: BillDraft): ParsedBill {
  const errors: BillError[] = [];

  const people = parsePeople(draft.people);
  if ("message" in people) errors.push({ field: "people", message: people.message });

  const volume = parseNonNegative(
    draft.volume,
    "Nhập lượng nước tiêu thụ.",
    "Lượng nước không được âm.",
    "Lượng nước không hợp lệ.",
  );
  if ("message" in volume) errors.push({ field: "volume", message: volume.message });

  const prices = { ...DEFAULT_PRICES };
  for (const key of PRICE_KEYS) {
    const rawPrice = draft.prices[key] ?? "";
    const parsed = parseNonNegative(
      rawPrice.trim().startsWith("-") ? rawPrice : rawPrice.trim() ? (normalizePrice(rawPrice) || "invalid") : "",
      "Nhập đơn giá.",
      "Đơn giá không được âm.",
      "Đơn giá không hợp lệ.",
    );
    if ("message" in parsed) {
      errors.push({ field: key, message: parsed.message });
    } else {
      prices[key] = parsed.value;
    }
  }

  if (errors.length > 0 || "message" in people || "message" in volume) {
    return { ok: false, errors };
  }

  return { ok: true, people: people.value, volume: volume.value, prices };
}

export function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(roundVnd(amount))} đồng`;
}

export function formatVolume(m3: number): string {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(m3)} m³`;
}

export function formatUnitPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(price);
}

