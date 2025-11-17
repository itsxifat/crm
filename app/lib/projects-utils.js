export function currency(n = 0) {
  const x = Number(n || 0);
  return x.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function normalizeId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    if (v.id) return String(v.id);
    if (v._id) return String(v._id);
    if (v.$oid) return String(v.$oid);
  }
  return String(v);
}

export function normalizeArrayWithId(arr) {
  return (Array.isArray(arr) ? arr : []).map((x) => {
    const id = normalizeId(x);
    const name =
      x?.name ??
      x?.companyName ??
      x?.clientName ??
      x?.title ??
      x?.email ??
      "Unnamed";
    return { ...x, id: String(id), _id: String(id), name: String(name) };
  });
}

export function isLikelyObjectId(v) {
  return /^[a-fA-F0-9]{24}$/.test(String(v || ""));
}

export const palette = {
  emerald: "text-emerald-700 bg-emerald-50 border-emerald-200",
  sky: "text-sky-700 bg-sky-50 border-sky-200",
  amber: "text-amber-700 bg-amber-50 border-amber-200",
  rose: "text-rose-700 bg-rose-50 border-rose-200",
  zinc: "text-zinc-700 bg-zinc-50 border-zinc-200",
};

export function getStatusColor(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("progress")) return palette.sky;
  if (s.includes("pending")) return palette.amber;
  if (s.includes("completed") || s.includes("done")) return palette.emerald;
  if (s.includes("hold") || s.includes("cancel")) return palette.rose;
  if (s.includes("revision")) return palette.amber;
  return palette.zinc;
}

export function initialsOf(name) {
  if (!name) return "";
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("");
}

export function emptyService() {
  return {
    description: "",
    unitPrice: "",
    unit: "",
    totalPrice: 0,
    offerPrice: "",
    cost: "",
    note: "",
  };
}

function normalizeServices(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((s) => s && typeof s.description === "string" && s.description.trim().length)
    .map((s) => {
      const unit = Number(s.unit) || 0;
      const unitPrice = Number(s.unitPrice) || 0;
      const totalPrice = unit * unitPrice;
      const offer =
        s.offerPrice !== undefined && s.offerPrice !== null && s.offerPrice !== ""
          ? Number(s.offerPrice) || 0
          : undefined;
      const note =
        typeof s.note === "string" && s.note.trim() ? s.note.trim() : undefined;
      const cost = Number(s.cost) || 0;
      return {
        description: s.description.trim(),
        unit,
        unitPrice,
        totalPrice,
        ...(offer !== undefined ? { offerPrice: offer } : {}),
        ...(note !== undefined ? { note } : {}),
        ...(cost ? { cost } : {}),
      };
    });
}

export async function saveProject(payload, isEdit = false) {
  const cleaned = { ...payload, services: normalizeServices(payload.services || []) };

  if (cleaned.totalCost == null || cleaned.totalCost === "") {
    const servicesCost = cleaned.services.reduce(
      (sum, s) => sum + (Number(s.cost) || 0),
      0
    );
    cleaned.totalCost = servicesCost;
  }

  const url = isEdit ? "/api/projects/update" : "/api/projects/create";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleaned),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || "" };
  }

  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

const toArray = (json) => {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.rows)) return json.rows;
  if (Array.isArray(json?.data)) return json.data;
  return [];
};

export async function getProjects(options = {}) {
  const {
    q = "",
    page = 1,
    perPage = 25,
    light = false,
    includeServices = false,
  } = options;

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page) params.set("page", String(page));
  if (perPage) params.set("perPage", String(perPage));
  if (light) params.set("light", "1");
  if (!light && includeServices) params.set("include", "services");

  const url = `/api/projects${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  return toArray(json);
}

export async function getProjectsLight(opts = {}) {
  return getProjects({ ...opts, light: true });
}