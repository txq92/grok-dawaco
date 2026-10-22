import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { Droplets, Info, RotateCcw, Users } from "lucide-react";
import {
  DEFAULT_PRICES,
  LINE_HINTS,
  PRICE_KEYS,
  PRICE_LABELS,
  calculateBill,
  formatUnitPrice,
  formatVnd,
  formatVolume,
  parseBill,
  type BillDraft,
  type BillError,
  type PriceKey,
} from "@/lib/water/calculator";

const STORAGE_KEY = "tien-nuoc:v1";
const CALC_MS = 900;

const SAMPLE: BillDraft = {
  people: "3",
  volume: "32",
  prices: {
    tier1: String(DEFAULT_PRICES.tier1),
    tier2: String(DEFAULT_PRICES.tier2),
    tier3: String(DEFAULT_PRICES.tier3),
    over: String(DEFAULT_PRICES.over),
  },
};

const BAR_CLASS: Record<PriceKey, string> = {
  tier1: "bg-water",
  tier2: "bg-water/70",
  tier3: "bg-water/40",
  over: "bg-ink",
};

function isDraft(value: unknown): value is BillDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as BillDraft;
  if (typeof draft.people !== "string" || typeof draft.volume !== "string") return false;
  if (!draft.prices || typeof draft.prices !== "object") return false;
  return PRICE_KEYS.every((key) => typeof draft.prices[key] === "string");
}

function errorFor(errors: BillError[], field: BillError["field"]): string | undefined {
  return errors.find((error) => error.field === field)?.message;
}

export function WaterDesk() {
  const [draft, setDraft] = useState<BillDraft>(SAMPLE);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settled, setSettled] = useState(false);
  const baseId = useId();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isDraft(parsed)) setDraft(parsed);
      }
    } catch {
      /* keep the sample */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, ready]);

  const parsed = useMemo(() => parseBill(draft), [draft]);
  const result = parsed.ok ? calculateBill(parsed.people, parsed.volume, parsed.prices) : null;
  const errors = parsed.ok ? [] : parsed.errors;
  const signature = parsed.ok
    ? `${parsed.people}|${parsed.volume}|${PRICE_KEYS.map((key) => parsed.prices[key]).join(",")}`
    : "";

  useEffect(() => {
    if (!signature) {
      setProgress(0);
      setSettled(false);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setProgress(100);
      setSettled(true);
      return;
    }
    setProgress(0);
    setSettled(false);
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const ratio = Math.min(1, (now - start) / CALC_MS);
      const eased = 1 - (1 - ratio) ** 2;
      setProgress(Math.round(eased * 100));
      if (ratio < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        setSettled(true);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [signature]);

  function setPeople(people: string) {
    setDraft((current) => ({ ...current, people }));
  }

  function setVolume(volume: string) {
    setDraft((current) => ({ ...current, volume }));
  }

  function setPrice(key: PriceKey, value: string) {
    setDraft((current) => ({
      ...current,
      prices: { ...current.prices, [key]: value },
    }));
  }

  function stepPeople(delta: number) {
    const text = draft.people.trim();
    const base = /^\d+$/.test(text) ? Number(text) : 0;
    setPeople(String(Math.max(0, base + delta)));
  }

  function resetPrices() {
    setDraft((current) => ({ ...current, prices: { ...SAMPLE.prices } }));
  }

  async function copyResult() {
    if (!result || !parsed.ok) return;
    const lines = result.lines
      .map(
        (line) =>
          `${line.label}: ${formatVolume(line.volume)} × ${formatUnitPrice(line.unitPrice)} = ${formatVnd(line.amount)}`,
      )
      .join("\n");
    const text = [
      `Nhân khẩu: ${parsed.people}`,
      `Tiêu thụ: ${formatVolume(parsed.volume)}`,
      `Định mức: ${formatVolume(result.quota)}`,
      lines,
      `Tổng: ${formatVnd(result.total)}`,
      "Đơn giá đã gồm VAT và các khoản phí.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const pricesDirty = PRICE_KEYS.some(
    (key) => draft.prices[key].trim().replace(",", ".") !== String(DEFAULT_PRICES[key]),
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold tracking-wide text-water uppercase">
          <Droplets className="size-4" aria-hidden="true" />
          Sổ tính tiền nước
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Tiền nước theo nhân khẩu
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted">
          Nhập số người và lượng nước trong tháng. Trang chia sản lượng vào định mức,
          từng bậc giá, rồi cộng tiền. Đơn giá đã gồm VAT và phí.
        </p>
      </header>

      <div className="sticky top-0 z-10 -mx-4 border-b border-line bg-bg/95 px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-3 text-sm font-medium">
          <p>{settled ? "Đã tính xong" : parsed.ok ? "Đang tính tiền nước" : "Chưa tính được"}</p>
          <p className="tabular-nums">{parsed.ok ? `${progress}%` : "0%"}</p>
        </div>
        <div
          className="mt-2 h-3 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={parsed.ok ? progress : 0}
          aria-label={settled ? "Đã tính xong" : "Đang tính tiền nước"}
        >
          <div className="h-full rounded-full bg-water" style={{ width: `${parsed.ok ? progress : 0}%` }} />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section className="order-2 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5 lg:order-none">
          <h2 className="text-lg font-semibold">Số liệu tháng này</h2>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => event.preventDefault()}
          >
            <Field
              id={`${baseId}-people`}
              label="Số nhân khẩu"
              hint="Số nguyên, tính cả người đăng ký trong hộ."
              error={errorFor(errors, "people")}
            >
              <div className="flex gap-2">
                <Stepper label="Giảm một người" onClick={() => stepPeople(-1)}>
                  −
                </Stepper>
                <input
                  id={`${baseId}-people`}
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={Boolean(errorFor(errors, "people"))}
                  aria-describedby={`${baseId}-people-hint`}
                  className={`${inputClass(Boolean(errorFor(errors, "people")))} min-w-0 flex-1`}
                  value={draft.people}
                  onChange={(event) => setPeople(event.target.value)}
                />
                <Stepper label="Thêm một người" onClick={() => stepPeople(1)}>
                  +
                </Stepper>
              </div>
            </Field>

            <Field
              id={`${baseId}-volume`}
              label="Lượng nước tiêu thụ"
              hint="Mét khối. Dùng dấu phẩy hoặc chấm nếu có số lẻ."
              error={errorFor(errors, "volume")}
              suffix="m³"
            >
              <input
                id={`${baseId}-volume`}
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={Boolean(errorFor(errors, "volume"))}
                aria-describedby={`${baseId}-volume-hint`}
                className={`${inputClass(Boolean(errorFor(errors, "volume")))} pr-12`}
                value={draft.volume}
                onChange={(event) => setVolume(event.target.value)}
              />
            </Field>

            <button
              type="button"
              className="min-h-11 self-start rounded-full px-1 text-sm font-semibold text-water underline-offset-4 hover:underline"
              onClick={() =>
                setDraft((current) => ({ ...current, people: SAMPLE.people, volume: SAMPLE.volume }))
              }
            >
              Xem ví dụ 3 nhân khẩu, 32 m³
            </button>
          </form>
        </section>

        <section
          className="order-1 flex flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:order-none"
          aria-live="polite"
        >
          <div className="rounded-2xl bg-water px-5 py-6 text-surface sm:px-6">
            <p className="text-sm font-medium text-surface/80">Tổng tiền nước</p>
            {result && settled ? (
              <>
                <p className="font-display mt-5 text-4xl leading-none font-semibold break-words tabular-nums sm:text-6xl">
                  {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(result.total)}
                </p>
                <p className="mt-2 text-lg">đồng</p>
              </>
            ) : (
              <p className="font-display mt-5 text-3xl font-semibold">
                {parsed.ok ? "Đang tính…" : "Kiểm tra số liệu"}
              </p>
            )}
            <p className="mt-4 max-w-md text-sm leading-relaxed text-surface/85">
              Đơn giá đã gồm VAT và các khoản phí. Tổng là số tiền phải trả.
            </p>
            <button
              type="button"
              className="mt-5 inline-flex min-h-11 items-center rounded-full bg-surface px-4 text-sm font-semibold text-water disabled:opacity-50"
              onClick={copyResult}
              disabled={!result || !settled}
            >
              {copied ? "Đã chép bảng tính" : "Chép bảng tính"}
            </button>
          </div>

          {result && parsed.ok && settled ? (
            <>
              <dl className="grid grid-cols-3 gap-2">
                <Stat label="Định mức" value={formatVolume(result.quota)} />
                <Stat label="Trong mức" value={formatVolume(result.inQuota)} />
                <Stat label="Ngoài mức" value={formatVolume(result.overQuota)} />
              </dl>

              <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
                <h2 className="text-lg font-semibold">Phân bổ sản lượng</h2>
                <p className="mt-1 text-sm text-muted">
                  {parsed.people} nhân khẩu × 4 m³ = {formatVolume(result.quota)} định mức.
                </p>
                <AllocationBar result={result} totalVolume={parsed.volume} />
                <ul className="mt-4 divide-y divide-line">
                  {result.lines.map((line) => (
                    <li key={line.id} className="grid gap-1 py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-medium">
                          <span
                            className={`mr-2 inline-block size-2.5 rounded-full align-middle ${BAR_CLASS[line.id]}`}
                            aria-hidden="true"
                          />
                          {line.label}
                        </span>
                        <span className="font-semibold tabular-nums">{formatVnd(line.amount)}</span>
                      </div>
                      <p className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-muted tabular-nums">
                        <span>{line.hint}</span>
                        <span>
                          {formatVolume(line.volume)} × {formatUnitPrice(line.unitPrice)}
                        </span>
                      </p>
                    </li>
                  ))}
                  <li className="flex items-baseline justify-between gap-3 pt-3 font-semibold tabular-nums">
                    <span>Tổng sản lượng</span>
                    <span>{formatVolume(parsed.volume)}</span>
                  </li>
                </ul>
              </div>
            </>
          ) : parsed.ok ? (
            <p className="rounded-2xl border border-line bg-surface px-4 py-4 text-sm text-muted">
              Bảng chi tiết hiện khi thanh tiến trình đầy.
            </p>
          ) : (
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="text-lg font-semibold">Cần sửa số liệu</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted">
                {errors.map((error) => (
                  <li key={error.field}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}

          <aside className="flex gap-3 rounded-2xl border border-line bg-surface p-4 text-sm leading-relaxed text-muted">
            <Info className="mt-0.5 size-4 shrink-0 text-water" aria-hidden="true" />
            <div className="flex flex-col gap-2">
              <p className="font-medium text-ink">Giả định đang dùng, chưa phải quy định chính thức</p>
              <p>
                Định mức bằng 4 m³ nhân số nhân khẩu. Phần trong định mức chia theo ngưỡng cố định
                của một hộ: 10 m³ bậc 1, 20 m³ bậc 2, phần còn lại bậc 3. Ngưỡng không nhân theo số
                hộ quy đổi — câu “3 nhân khẩu tương đương 1 hộ” chỉ là diễn giải của ví dụ 32 m³.
              </p>
              <p>
                Không đăng ký nhân khẩu thì định mức bằng 0, toàn bộ sản lượng tính ngoài định mức.
                Tiền từng dòng làm tròn đến đồng; sản lượng giữ nguyên số lẻ. Giá mặc định đã gồm VAT
                và phí, nên mẫu 3 người / 32 m³ ra 425.480 đồng là số phải trả.
              </p>
            </div>
          </aside>
        </section>

        <section className="order-3 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5 lg:order-none">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Đơn giá</h2>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-water disabled:text-muted"
              onClick={resetPrices}
              disabled={!pricesDirty}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Giá mặc định
            </button>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Đồng trên mỗi m³, đã gồm VAT và phí. Nhập 5119 hoặc 5.119; dùng dấu phẩy cho phần lẻ (5.119,5). Giá đã lưu trên máy này.
          </p>
          <div className="grid gap-3">
            {PRICE_KEYS.map((key) => (
              <label key={key} className="grid gap-1.5" htmlFor={`${baseId}-${key}`}>
                <span className="grid gap-0.5 text-sm">
                  <span className="font-medium">{PRICE_LABELS[key]}</span>
                  <span className="text-muted">{LINE_HINTS[key]}</span>
                </span>
                <span className="relative">
                  <input
                    id={`${baseId}-${key}`}
                    inputMode="decimal"
                    aria-invalid={Boolean(errorFor(errors, key))}
                    className={`${inputClass(Boolean(errorFor(errors, key)))} pr-16`}
                    value={draft.prices[key]}
                    onChange={(event) => setPrice(key, event.target.value)}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted">
                    đ/m³
                  </span>
                </span>
                {errorFor(errors, key) ? (
                  <span className="text-sm font-medium text-ink">{errorFor(errors, key)}</span>
                ) : null}
              </label>
            ))}
          </div>
        </section>
      </div>

      <footer className="flex items-center gap-2 text-sm text-muted">
        <Users className="size-4" aria-hidden="true" />
        Tính trên máy bạn. Không gửi số liệu đi đâu.
      </footer>
    </main>
  );
}

function AllocationBar({
  result,
  totalVolume,
}: {
  result: NonNullable<ReturnType<typeof calculateBill>>;
  totalVolume: number;
}) {
  if (totalVolume <= 0) {
    return <p className="mt-4 text-sm text-muted">Không có sản lượng để phân bổ.</p>;
  }
  const label = result.lines
    .filter((line) => line.volume > 0)
    .map((line) => `${line.label} ${formatVolume(line.volume)}`)
    .join(", ");
  return (
    <div
      className="mt-4 flex h-3 overflow-hidden rounded-full bg-line"
      role="img"
      aria-label={label || "Không có sản lượng"}
    >
      {result.lines.map((line) =>
        line.volume > 0 ? (
          <span
            key={line.id}
            className={BAR_CLASS[line.id]}
            style={{ width: `${(line.volume / totalVolume) * 100}%` }}
          />
        ) : null,
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-3">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-semibold tabular-nums sm:text-base">{value}</dd>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  suffix,
  children,
}: {
  id: string;
  label: string;
  hint: string;
  error?: string;
  suffix?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        {children}
        {suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted">
            {suffix}
          </span>
        ) : null}
      </div>
      <p id={`${id}-hint`} className={error ? "text-sm font-medium text-ink" : "text-sm text-muted"}>
        {error ?? hint}
      </p>
    </div>
  );
}

function Stepper({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-line bg-bg text-xl font-medium text-ink hover:border-water"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function inputClass(invalid: boolean): string {
  return [
    "h-12 w-full rounded-xl border bg-bg px-3 text-base tabular-nums",
    "placeholder:text-muted",
    invalid ? "border-ink" : "border-line",
  ].join(" ");
}

