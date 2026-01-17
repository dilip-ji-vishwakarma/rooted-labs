/* eslint-disable @typescript-eslint/no-explicit-any */
const CLIENT =
  process.env.NEXT_PUBLIC_CLIENT_NAME || process.env.CLIENT_NAME || "";

//  ---------------------------------------\\
if (!CLIENT) {
  throw new Error("CLIENT not set. Set NEXT_PUBLIC_CLIENT or CLIENT_NAME.");
}

// Small deep-merge (extra over base; no field drops)
function deepMerge<T extends Record<string, any>>(a: T, b: Partial<T> = {}): T {
  const out: any = { ...a };
  for (const k of Object.keys(b)) {
    const v = (b as any)[k];
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      out[k] &&
      typeof out[k] === "object"
    ) {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// Load from mock: src/client/<CLIENT>/mock/<entity>.ts
async function loadMockOptions(entity: string) {
  // NOTE: '@' should point to 'src' in your tsconfig paths. If not, see NOTE below.
  const url = `@/app/clients/${CLIENT}/mock/${entity}.ts`;
  const mod = await import(url);
  // generator may export either `options()` or `optionsBase`/`optionsExtra`
  if (typeof (mod as any).options === "function") {
    return await (mod as any).options();
  }
  const base = (mod as any).optionsBase ?? {};
  const extra = (mod as any).optionsExtra ?? {};
  return deepMerge(base, extra);
}

// ---- your existing fetch wrapper ----
export async function fetchEntityData(
  entity: string,
  op: "options" | "get" | "getOne" | "post" | "update" | "delete" | "export",
  payload?: any
) {
  // Mock-first for OPTIONS (no HTTP; avoids 404 & SSR mismatch)
  if (op === "options") {
    return await loadMockOptions(entity);
  }

  // real CRUD → backend
  const base = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const url = new URL(`${base}/${entity}/`, base);
  if (op === "get") {
    // attach query params from payload if any (page,size,q,sort,...)
    if (payload && typeof payload === "object") {
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "")
          url.searchParams.set(k, String(v));
      });
    }
    const res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  if (op === "getOne") {
    const id = payload?.id ?? payload;
    const res = await fetch(`${base}/${entity}/${id}/`, { method: "GET" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  if (op === "post") {
    console.log({ payload });
    const res = await fetch(`${base}/${entity}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  if (op === "update") {
    const id = payload?.id;
    console.log({ payload });

    const formData = structuredClone(payload);
    delete formData.id;
    const res = await fetch(`${base}/${entity}/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData ?? {}),
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  if (op === "delete") {
    const id = payload?.id ?? payload;
    const res = await fetch(`${base}/${entity}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    return true;
  }

  throw new Error(`Unknown op: ${op}`);
}
