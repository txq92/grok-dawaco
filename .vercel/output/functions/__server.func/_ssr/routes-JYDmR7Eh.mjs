import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Droplets, i as Info, r as RotateCcw, t as Users } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-JYDmR7Eh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PRICE_KEYS = [
	"tier1",
	"tier2",
	"tier3",
	"over"
];
var DEFAULT_PRICES = {
	tier1: 5119,
	tier2: 6135,
	tier3: 7644,
	over: 18101
};
var PRICE_LABELS = {
	tier1: "Bậc 1",
	tier2: "Bậc 2",
	tier3: "Bậc 3",
	over: "Ngoài định mức"
};
var LINE_HINTS = {
	tier1: "10 m³ đầu trong định mức",
	tier2: "20 m³ tiếp theo trong định mức",
	tier3: "Phần trong định mức trên 30 m³",
	over: "Phần vượt định mức nhân khẩu"
};
function roundVnd(amount) {
	return Math.round(amount);
}
/**
* Assumption A (not an official household-conversion rule):
* quota = 4 × people; in-quota volume is split on fixed 10 / 20 / remainder
* thresholds of a single household; the rest is the over-quota price.
*/
function calculateBill(people, volume, prices) {
	if (!Number.isInteger(people) || people < 0) throw new Error("Số nhân khẩu không hợp lệ.");
	if (!Number.isFinite(volume) || volume < 0) throw new Error("Lượng nước không hợp lệ.");
	for (const key of PRICE_KEYS) {
		const price = prices[key];
		if (!Number.isFinite(price) || price < 0) throw new Error("Đơn giá không hợp lệ.");
	}
	const quota = 4 * people;
	const inQuota = Math.min(volume, quota);
	const overQuota = Math.max(0, volume - quota);
	const volumes = {
		tier1: Math.min(inQuota, 10),
		tier2: Math.min(Math.max(inQuota - 10, 0), 20),
		tier3: Math.max(inQuota - 10 - 20, 0),
		over: overQuota
	};
	const lines = PRICE_KEYS.map((id) => ({
		id,
		label: PRICE_LABELS[id],
		hint: LINE_HINTS[id],
		volume: volumes[id],
		unitPrice: prices[id],
		amount: roundVnd(volumes[id] * prices[id])
	}));
	return {
		quota,
		inQuota,
		overQuota,
		lines,
		total: lines.reduce((sum, line) => sum + line.amount, 0)
	};
}
function parsePeople(raw) {
	const text = raw.trim();
	if (!text) return { message: "Nhập số nhân khẩu." };
	if (text.startsWith("-")) return { message: "Số nhân khẩu không được âm." };
	if (!/^\d+$/.test(text)) return { message: "Số nhân khẩu phải là số nguyên không âm." };
	const value = Number(text);
	if (!Number.isSafeInteger(value)) return { message: "Số nhân khẩu quá lớn." };
	return { value };
}
function parseNonNegative(raw, empty, negative, invalid) {
	const text = raw.trim().replace(/\s/g, "").replace(",", ".");
	if (!text) return { message: empty };
	if (text.startsWith("-")) return { message: negative };
	if (!/^\d+(\.\d+)?$/.test(text)) return { message: invalid };
	const value = Number(text);
	if (!Number.isFinite(value)) return { message: invalid };
	return { value };
}
function parseBill(draft) {
	const errors = [];
	const people = parsePeople(draft.people);
	if ("message" in people) errors.push({
		field: "people",
		message: people.message
	});
	const volume = parseNonNegative(draft.volume, "Nhập lượng nước tiêu thụ.", "Lượng nước không được âm.", "Lượng nước không hợp lệ.");
	if ("message" in volume) errors.push({
		field: "volume",
		message: volume.message
	});
	const prices = { ...DEFAULT_PRICES };
	for (const key of PRICE_KEYS) {
		const parsed = parseNonNegative(draft.prices[key] ?? "", "Nhập đơn giá.", "Đơn giá không được âm.", "Đơn giá không hợp lệ.");
		if ("message" in parsed) errors.push({
			field: key,
			message: parsed.message
		});
		else prices[key] = parsed.value;
	}
	if (errors.length > 0 || "message" in people || "message" in volume) return {
		ok: false,
		errors
	};
	return {
		ok: true,
		people: people.value,
		volume: volume.value,
		prices
	};
}
function formatVnd(amount) {
	return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(roundVnd(amount))} đồng`;
}
function formatVolume(m3) {
	return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(m3)} m³`;
}
function formatUnitPrice(price) {
	return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(price);
}
var STORAGE_KEY = "tien-nuoc:v1";
var SAMPLE = {
	people: "3",
	volume: "32",
	prices: {
		tier1: String(DEFAULT_PRICES.tier1),
		tier2: String(DEFAULT_PRICES.tier2),
		tier3: String(DEFAULT_PRICES.tier3),
		over: String(DEFAULT_PRICES.over)
	}
};
var BAR_CLASS = {
	tier1: "bg-water",
	tier2: "bg-water/70",
	tier3: "bg-water/40",
	over: "bg-ink"
};
function isDraft(value) {
	if (!value || typeof value !== "object") return false;
	const draft = value;
	if (typeof draft.people !== "string" || typeof draft.volume !== "string") return false;
	if (!draft.prices || typeof draft.prices !== "object") return false;
	return PRICE_KEYS.every((key) => typeof draft.prices[key] === "string");
}
function errorFor(errors, field) {
	return errors.find((error) => error.field === field)?.message;
}
function WaterDesk() {
	const [draft, setDraft] = (0, import_react.useState)(SAMPLE);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const baseId = (0, import_react.useId)();
	(0, import_react.useEffect)(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (isDraft(parsed)) setDraft(parsed);
			}
		} catch {}
		setReady(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
	}, [draft, ready]);
	const parsed = (0, import_react.useMemo)(() => parseBill(draft), [draft]);
	const result = parsed.ok ? calculateBill(parsed.people, parsed.volume, parsed.prices) : null;
	const errors = parsed.ok ? [] : parsed.errors;
	function setPeople(people) {
		setDraft((current) => ({
			...current,
			people
		}));
	}
	function setVolume(volume) {
		setDraft((current) => ({
			...current,
			volume
		}));
	}
	function setPrice(key, value) {
		setDraft((current) => ({
			...current,
			prices: {
				...current.prices,
				[key]: value
			}
		}));
	}
	function stepPeople(delta) {
		const text = draft.people.trim();
		const base = /^\d+$/.test(text) ? Number(text) : 0;
		setPeople(String(Math.max(0, base + delta)));
	}
	function resetPrices() {
		setDraft((current) => ({
			...current,
			prices: { ...SAMPLE.prices }
		}));
	}
	async function copyResult() {
		if (!result || !parsed.ok) return;
		const lines = result.lines.map((line) => `${line.label}: ${formatVolume(line.volume)} × ${formatUnitPrice(line.unitPrice)} = ${formatVnd(line.amount)}`).join("\n");
		const text = [
			`Nhân khẩu: ${parsed.people}`,
			`Tiêu thụ: ${formatVolume(parsed.volume)}`,
			`Định mức: ${formatVolume(result.quota)}`,
			lines,
			`Tổng: ${formatVnd(result.total)}`,
			"Chưa gồm VAT và các khoản phí khác."
		].join("\n");
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1600);
		} catch {
			setCopied(false);
		}
	}
	const pricesDirty = PRICE_KEYS.some((key) => draft.prices[key].trim().replace(",", ".") !== String(DEFAULT_PRICES[key]));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center gap-2 text-sm font-semibold tracking-wide text-water uppercase",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Droplets, {
							className: "size-4",
							"aria-hidden": "true"
						}), "Sổ tính tiền nước"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl",
						children: "Tiền nước theo nhân khẩu"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-2xl text-base leading-relaxed text-muted",
						children: "Nhập số người và lượng nước trong tháng. Trang chia sản lượng vào định mức, từng bậc giá, rồi cộng tiền — chưa gồm thuế và phí."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-semibold",
							children: "Số liệu tháng này"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "flex flex-col gap-4",
							onSubmit: (event) => event.preventDefault(),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									id: `${baseId}-people`,
									label: "Số nhân khẩu",
									hint: "Số nguyên, tính cả người đăng ký trong hộ.",
									error: errorFor(errors, "people"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stepper, {
												label: "Giảm một người",
												onClick: () => stepPeople(-1),
												children: "−"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												id: `${baseId}-people`,
												inputMode: "numeric",
												autoComplete: "off",
												"aria-invalid": Boolean(errorFor(errors, "people")),
												"aria-describedby": `${baseId}-people-hint`,
												className: `${inputClass(Boolean(errorFor(errors, "people")))} min-w-0 flex-1`,
												value: draft.people,
												onChange: (event) => setPeople(event.target.value)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stepper, {
												label: "Thêm một người",
												onClick: () => stepPeople(1),
												children: "+"
											})
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									id: `${baseId}-volume`,
									label: "Lượng nước tiêu thụ",
									hint: "Mét khối. Dùng dấu phẩy hoặc chấm nếu có số lẻ.",
									error: errorFor(errors, "volume"),
									suffix: "m³",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: `${baseId}-volume`,
										inputMode: "decimal",
										autoComplete: "off",
										"aria-invalid": Boolean(errorFor(errors, "volume")),
										"aria-describedby": `${baseId}-volume-hint`,
										className: `${inputClass(Boolean(errorFor(errors, "volume")))} pr-12`,
										value: draft.volume,
										onChange: (event) => setVolume(event.target.value)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "min-h-11 self-start rounded-full px-1 text-sm font-semibold text-water underline-offset-4 hover:underline",
									onClick: () => setDraft((current) => ({
										...current,
										people: SAMPLE.people,
										volume: SAMPLE.volume
									})),
									children: "Xem ví dụ 3 nhân khẩu, 32 m³"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "flex flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1",
						"aria-live": "polite",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-water px-5 py-6 text-surface sm:px-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-medium text-surface/80",
										children: "Tổng tiền nước"
									}),
									result ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-display mt-2 text-4xl leading-none font-semibold break-words tabular-nums sm:text-6xl",
										children: new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(result.total)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-lg",
										children: "đồng"
									})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-display mt-2 text-3xl font-semibold",
										children: "Chưa tính được"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-4 max-w-md text-sm leading-relaxed text-surface/85",
										children: "Chưa gồm VAT, phí bảo vệ môi trường và các phụ phí khác."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "mt-5 inline-flex min-h-11 items-center rounded-full bg-surface px-4 text-sm font-semibold text-water disabled:opacity-50",
										onClick: copyResult,
										disabled: !result,
										children: copied ? "Đã chép bảng tính" : "Chép bảng tính"
									})
								]
							}),
							result && parsed.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "grid grid-cols-3 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: "Định mức",
										value: formatVolume(result.quota)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: "Trong mức",
										value: formatVolume(result.inQuota)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: "Ngoài mức",
										value: formatVolume(result.overQuota)
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-line bg-surface p-4 sm:p-5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-lg font-semibold",
										children: "Phân bổ sản lượng"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 text-sm text-muted",
										children: [
											parsed.people,
											" nhân khẩu × 4 m³ = ",
											formatVolume(result.quota),
											" định mức."
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AllocationBar, {
										result,
										totalVolume: parsed.volume
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
										className: "mt-4 divide-y divide-line",
										children: [result.lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "grid gap-1 py-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-baseline justify-between gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-medium",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: `mr-2 inline-block size-2.5 rounded-full align-middle ${BAR_CLASS[line.id]}`,
														"aria-hidden": "true"
													}), line.label]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-semibold tabular-nums",
													children: formatVnd(line.amount)
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-muted tabular-nums",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: line.hint }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
													formatVolume(line.volume),
													" × ",
													formatUnitPrice(line.unitPrice)
												] })]
											})]
										}, line.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex items-baseline justify-between gap-3 pt-3 font-semibold tabular-nums",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Tổng sản lượng" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatVolume(parsed.volume) })]
										})]
									})
								]
							})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-line bg-surface p-5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-semibold",
									children: "Cần sửa số liệu"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted",
									children: errors.map((error) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: error.message }, error.field))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
								className: "flex gap-3 rounded-2xl border border-line bg-surface p-4 text-sm leading-relaxed text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
									className: "mt-0.5 size-4 shrink-0 text-water",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-medium text-ink",
											children: "Giả định đang dùng, chưa phải quy định chính thức"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Định mức bằng 4 m³ nhân số nhân khẩu. Phần trong định mức chia theo ngưỡng cố định của một hộ: 10 m³ bậc 1, 20 m³ bậc 2, phần còn lại bậc 3. Ngưỡng không nhân theo số hộ quy đổi — câu “3 nhân khẩu tương đương 1 hộ” chỉ là diễn giải của ví dụ 32 m³." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Không đăng ký nhân khẩu thì định mức bằng 0, toàn bộ sản lượng tính ngoài định mức. Tiền từng dòng làm tròn đến đồng; sản lượng giữ nguyên số lẻ. Mẫu 3 người / 32 m³ ra 425.480 đồng với giá mặc định." })
									]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-semibold",
									children: "Đơn giá"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-water disabled:text-muted",
									onClick: resetPrices,
									disabled: !pricesDirty,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Giá mặc định"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm leading-relaxed text-muted",
								children: "Đồng trên mỗi m³. Giá đã lưu trên máy này."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid gap-3",
								children: PRICE_KEYS.map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "grid gap-1.5",
									htmlFor: `${baseId}-${key}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "grid gap-0.5 text-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-medium",
												children: PRICE_LABELS[key]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted",
												children: LINE_HINTS[key]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "relative",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												id: `${baseId}-${key}`,
												inputMode: "decimal",
												"aria-invalid": Boolean(errorFor(errors, key)),
												className: `${inputClass(Boolean(errorFor(errors, key)))} pr-16`,
												value: draft.prices[key],
												onChange: (event) => setPrice(key, event.target.value)
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted",
												children: "đ/m³"
											})]
										}),
										errorFor(errors, key) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm font-medium text-ink",
											children: errorFor(errors, key)
										}) : null
									]
								}, key))
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "flex items-center gap-2 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {
					className: "size-4",
					"aria-hidden": "true"
				}), "Tính trên máy bạn. Không gửi số liệu đi đâu."]
			})
		]
	});
}
function AllocationBar({ result, totalVolume }) {
	if (totalVolume <= 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-4 text-sm text-muted",
		children: "Không có sản lượng để phân bổ."
	});
	const label = result.lines.filter((line) => line.volume > 0).map((line) => `${line.label} ${formatVolume(line.volume)}`).join(", ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-4 flex h-3 overflow-hidden rounded-full bg-line",
		role: "img",
		"aria-label": label || "Không có sản lượng",
		children: result.lines.map((line) => line.volume > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: BAR_CLASS[line.id],
			style: { width: `${line.volume / totalVolume * 100}%` }
		}, line.id) : null)
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-line bg-surface px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-xs font-medium tracking-wide text-muted uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "mt-1 text-sm font-semibold tabular-nums sm:text-base",
			children: value
		})]
	});
}
function Field({ id, label, hint, error, suffix, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				htmlFor: id,
				className: "text-sm font-medium",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [children, suffix ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted",
					children: suffix
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				id: `${id}-hint`,
				className: error ? "text-sm font-medium text-ink" : "text-sm text-muted",
				children: error ?? hint
			})
		]
	});
}
function Stepper({ label, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		className: "inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-line bg-bg text-xl font-medium text-ink hover:border-water",
		onClick,
		children
	});
}
function inputClass(invalid) {
	return [
		"h-12 w-full rounded-xl border bg-bg px-3 text-base tabular-nums",
		"placeholder:text-muted",
		invalid ? "border-ink" : "border-line"
	].join(" ");
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WaterDesk, {});
}
//#endregion
export { Home as component };
