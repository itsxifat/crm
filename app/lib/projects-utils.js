// lib/projects-utils.js

/* ---------- Helpers ---------- */
export const getStatusColor = (status) => {
  if (status === "In progress") return "bg-yellow-100 text-yellow-800";
  if (status === "Completed") return "bg-green-100 text-green-800";
  return "bg-gray-100 text-gray-800";
};

export const palette = ["bg-red-500", "bg-green-500", "bg-purple-500", "bg-yellow-500", "bg-blue-500"];

export const initialsOf = (name = "NA") =>
  name.split(" ").map((n) => n[0] || "").join("").slice(0, 2).toUpperCase();

export const normalizeId = (obj) => {
  const raw = obj?.id ?? obj?._id ?? obj?.value ?? obj?.email ?? obj?.name;
  return String(raw ?? "");
};

export const normalizeArrayWithId = (arr) =>
  (Array.isArray(arr) ? arr : []).map((x) => ({ ...x, id: normalizeId(x) }));

export const currency = (n) => {
  const v = Number(n) || 0;
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const emptyService = () => ({
  description: "",
  unitPrice: "",
  unit: "",
  totalPrice: 0,
  offerPrice: "",
  note: "",
});

/* ---------- API Helpers ---------- */
export async function getProjects() {
  try {
    const res = await fetch("/api/projects/list", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch projects");
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function saveProject(payload, isEdit = false) {
  try {
    const url = isEdit ? "/api/projects/update" : "/api/projects/create";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to save project");
    return await res.json();
  } catch (e) {
    console.error(e);
    return { success: false };
  }
}
