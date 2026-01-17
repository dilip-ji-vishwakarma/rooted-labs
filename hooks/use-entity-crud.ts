/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchEntityData } from "@/lib/api";

export type Mode = "client" | "server";
export type SortDir = "asc" | "desc";

export type UseEntityOptions = {
  mode?: Mode;
  preferredColumns?: string[];
  maxColumns?: number;
  fkPageSize?: number;
  id?: string | number;

  /** NEW: server/client filtering */
  filters?: Record<
    string,
    | unknown
    | {
        op: "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "contains" | "in";
        value: unknown;
      }
  >;
};

export type SchemaField = {
  name: string;
  className?: string;
  kind?:
    | "string"
    | "number"
    | "bool"
    | "date"
    | "fk"
    | "enum"
    | "email"
    | "url"
    | "file"
    | "image"
    | "image_gallery";
  required?: boolean;
  ref?: { entity: string; valueKey?: string; labelKey?: string };
  one_of?: Array<string | number>;
  regex?: string;
  min?: number;
  max?: number;
  validate?: {
    type?: "email" | "url";
    regex?: string;
    message?: string;
    min?: number;
    max?: number;
    min_length?: number;
    max_length?: number;
    one_of?: Array<string | number>;
  };
  options?: Array<{ value: string | number; label: string }>;
};

export type TableConfigType = {
  columns: string[];
  columnResolvers: Record<string, boolean>;
};

/* ---------------- helpers ---------------- */

function isIsoDate(s: any) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}/.test(s);
}
function smartCmp(a: any, b: any) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  const an = Number(a),
    bn = Number(b);
  if (!Number.isNaN(an) && !Number.isNaN(bn))
    return an === bn ? 0 : an < bn ? -1 : 1;
  if (isIsoDate(a) && isIsoDate(b)) {
    const ta = Date.parse(a),
      tb = Date.parse(b);
    if (Number.isFinite(ta) && Number.isFinite(tb))
      return ta === tb ? 0 : ta < tb ? -1 : 1;
  }
  if (typeof a === "boolean" && typeof b === "boolean")
    return a === b ? 0 : a ? 1 : -1;
  const sa = String(a),
    sb = String(b);
  return sa === sb ? 0 : sa < sb ? -1 : 1;
}

const isFileLike = (v: any) => typeof File !== "undefined" && v instanceof File;
const isBlobLike = (v: any) => typeof Blob !== "undefined" && v instanceof Blob;

function toBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(",").pop() || "");
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

async function uploadViaApi(entity: string, field: string, file: File | Blob) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`/api/${entity}/${field}/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json(); // backend returns any JSON; we pass it through
}

async function materializeUploads(
  entity: string,
  payload: Record<string, any>,
  schema: SchemaField[]
): Promise<Record<string, any>> {
  const out: Record<string, any> = { ...payload };
  const kmap = new Map(schema.map((f) => [f.name, f.kind]));

  // iterate fields and transform File/Blob & File[] for image_gallery
  for (const [k, v] of Object.entries(out)) {
    const kind = kmap.get(k);
    if (!kind) continue;

    // single file/image
    if (
      (kind === "file" || kind === "image") &&
      (isFileLike(v) || isBlobLike(v))
    ) {
      try {
        out[k] = await uploadViaApi(entity, k, v);
      } catch {
        // fallback to base64
        out[k] = await toBase64(v);
      }
      continue;
    }

    // gallery
    if (kind === "image_gallery" && Array.isArray(v) && v.length) {
      const results: any[] = [];
      for (const one of v) {
        if (isFileLike(one) || isBlobLike(one)) {
          try {
            results.push(await uploadViaApi(entity, k, one));
          } catch {
            results.push(await toBase64(one));
          }
        } else {
          results.push(one);
        }
      }
      out[k] = results;
      continue;
    }
  }

  return out;
}

/* -------------- Client-side filter engine (simple) -------------- */

type FilterOp = "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "contains" | "in";

function passesFilter(value: any, filter: any): boolean {
  // Equality by default (qty: 4)
  if (
    typeof filter !== "object" ||
    filter === null ||
    !("op" in (filter as any))
  ) {
    return value === filter;
  }

  const { op, value: rhs } = filter as { op: FilterOp; value: any };

  switch (op) {
    case "eq":
      return value === rhs;
    case "ne":
      return value !== rhs;
    case "lt":
      return Number(value) < Number(rhs);
    case "lte":
      return Number(value) <= Number(rhs);
    case "gt":
      return Number(value) > Number(rhs);
    case "gte":
      return Number(value) >= Number(rhs);
    case "contains":
      return String(value ?? "")
        .toLowerCase()
        .includes(String(rhs ?? "").toLowerCase());
    case "in":
      return Array.isArray(rhs) ? rhs.includes(value) : false;
    default:
      return value === rhs;
  }
}

function applyLocalFilters<T extends Record<string, any>>(
  rows: T[],
  filters?: UseEntityOptions["filters"]
): T[] {
  if (!filters || Object.keys(filters).length === 0) return rows;
  return rows.filter((row) =>
    Object.entries(filters).every(([key, f]) => passesFilter(row?.[key], f))
  );
}

/* ---------------- UNIFIED CRUD CONTROLLER ---------------- */

export function useEntity(entity: string, opts: UseEntityOptions = {}) {
  const modeInitial: Mode = opts.mode ?? "client";
  const preferredColumns = opts.preferredColumns ?? [];
  const maxColumns = opts.maxColumns;
  const fkPageSize = opts.fkPageSize ?? 500;

  const [mode, setMode] = useState<Mode>(modeInitial);
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [qInput, setQInput] = useState(""),
    [q, setQ] = useState("");
  const [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const [sortKey, setSortKey] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [schema, setSchema] = useState<SchemaField[]>([]);
  const [filters, setFilters] = useState<UseEntityOptions["filters"]>(
    opts.filters ?? {}
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // debounce qInput -> q
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => setQ(qInput.trim()),
      mode === "server" ? 300 : 0
    );
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [qInput, mode]);

  // reset page on critical changes
  useEffect(() => {
    setPage(1);
  }, [q, entity, mode, pageSize, sortKey, sortDir, JSON.stringify(filters)]);

  // /options -> fields + schema
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchEntityData(entity, "options");
        const tableCols = res?.table?.columns;
        const schemaList: any[] = Array.isArray(res?.schema)
          ? res.schema
          : Array.isArray(res?.fields)
          ? res.fields
          : [];
        const names =
          (Array.isArray(tableCols) && tableCols.length
            ? tableCols
            : schemaList.map((s: any) => s?.name || s).filter(Boolean)) ?? [];

        if (alive) {
          setFields(names);
          const normalized: SchemaField[] = schemaList
            .map((f: any) =>
              typeof f === "string" ? { name: f } : { ...f, name: f.name }
            )
            .filter((f: any) => f?.name);
          setSchema(normalized);
        }
      } catch {
        if (alive) {
          setFields([]);
          setSchema([]);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [entity]);

  const load = useCallback(
    async (id?: string | number) => {
      setLoading(true);
      setError(null);

      try {
        if (mode === "server") {
          // Convert filters → simple query params
          const filterQueryParams: Record<string, any> = {};
          for (const [key, f] of Object.entries(filters || {})) {
            if (!f) continue;
            filterQueryParams[key] =
              typeof f === "object" && "value" in f ? f.value : f;
          }
          const entity_url = id ? `${entity}/${id}` : entity;
          const data = await fetchEntityData(entity_url, "get", {
            page,
            size: pageSize,
            q,
            sortKey,
            sortDir,
            id,
            ...filterQueryParams,
          });

          const arr = Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data)
            ? data
            : data && typeof data === "object" && "id" in data
            ? [data]
            : [];

          setItems(arr);
          setTotal(
            Number.isFinite(data?.total) ? Number(data.total) : arr.length
          );

          if (!fields.length && arr.length) {
            setFields(Object.keys(arr[0]));
          }
        } else {
          // CLIENT SIDE MODE
          const data = await fetchEntityData(entity, "get");

          let list: any[] = Array.isArray(data)
            ? data
            : Array.isArray(data?.items)
            ? data.items
            : [];

          // search
          const needle = q.toLowerCase();
          if (needle) {
            const keys = fields.length
              ? fields
              : list[0]
              ? Object.keys(list[0])
              : [];
            list = list.filter((r) =>
              keys.some((k) =>
                String(r[k] ?? "")
                  .toLowerCase()
                  .includes(needle)
              )
            );
          }

          // filters
          list = applyLocalFilters(list, filters);

          // sort
          if (sortKey) {
            list = [...list].sort((a, b) => {
              const cmp = smartCmp(a?.[sortKey], b?.[sortKey]);
              return sortDir === "asc" ? cmp : -cmp;
            });
          }

          setItems(list);
          setTotal(list.length);

          if (!fields.length && list.length) {
            setFields(Object.keys(list[0]));
          }
        }
      } catch (err: any) {
        setError(String(err?.message || err));
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [
      entity,
      mode,
      page,
      pageSize,
      q,
      sortKey,
      sortDir,
      fields.length,
      JSON.stringify(filters),
    ]
  );

  useEffect(() => {
    load(opts?.id);
  }, [
    entity,
    mode,
    page,
    pageSize,
    q,
    sortKey,
    sortDir,
    JSON.stringify(filters),
  ]);

  // columns pick
  const cols = useMemo(() => {
    if (!fields || fields.length === 0) return [];
    if (!preferredColumns.length && !maxColumns) return fields;
    const byPref = preferredColumns.filter((p) => fields.includes(p));
    const restRaw = fields.filter((f) => !byPref.includes(f));
    const rest =
      typeof maxColumns === "number"
        ? restRaw.slice(0, Math.max(0, maxColumns - byPref.length))
        : restRaw;
    return [...byPref, ...rest];
  }, [fields, preferredColumns, maxColumns]);

  // paging
  const effectiveTotal = total;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));
  const curPage = Math.min(page, totalPages);
  const startIndex = (curPage - 1) * pageSize;

  const pageItems = useMemo(() => {
    return mode === "server"
      ? items
      : items.slice(startIndex, startIndex + pageSize);
  }, [items, mode, startIndex, pageSize]);

  // sort helpers
  const toggleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  };
  const isSortedAsc = (key: string) => sortKey === key && sortDir === "asc";
  const isSortedDesc = (key: string) => sortKey === key && sortDir === "desc";

  // FK/enum helper
  const pickLabel = (obj: any, valueKey: string, labelKey?: string) => {
    if (labelKey && obj && obj[labelKey] != null && obj[labelKey] !== "")
      return obj[labelKey];
    const prefs = [
      "name",
      "title",
      "label",
      "code",
      "display_name",
      "description",
    ];
    for (const k of Object.keys(obj || {})) {
      if (
        prefs.includes(k.toLowerCase()) &&
        typeof obj[k] === "string" &&
        obj[k]
      )
        return obj[k];
    }
    for (const k of Object.keys(obj || {})) {
      if (typeof obj[k] === "string" && obj[k]) return obj[k];
    }
    return obj?.[valueKey];
  };

  const loadRefOptions = useCallback(
    async (ref?: { entity: string; valueKey?: string; labelKey?: string }) => {
      if (!ref) return [];
      const { entity: refEntity, valueKey = "id", labelKey = "name" } = ref;
      const data = await fetchEntityData(refEntity, "get", {
        page: 1,
        size: fkPageSize,
      });
      const list = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];
      return list.map((r: any) => ({
        value: r[valueKey],
        label: String(pickLabel(r, valueKey, labelKey)),
      }));
    },
    [fkPageSize]
  );

  // --------- CREATE / UPDATE with upload support ----------
  const create = useCallback(
    async (
      payload: Record<string, any>,
      prop?: {
        default_entity?: string;
        reload?: boolean;
      }
    ) => {
      const targetEntity = prop?.default_entity || entity;

      const ready = await materializeUploads(targetEntity, payload, schema);
      const response = await fetchEntityData(targetEntity, "post", ready);
      if (prop?.reload !== false) {
        await load();
      }
      return response;
    },
    [entity, schema, load]
  );

  const update = useCallback(
    async (id: any, payload: Record<string, any>) => {
      const withId =
        id == null ? payload : { ...(payload || {}), id: id as any };
      const ready = await materializeUploads(entity, withId, schema);
      const response = await fetchEntityData(entity, "update", ready);
      await load();
      return response;
    },
    [entity, schema, load]
  );

  // delete + export (kept)
  const deleteById = useCallback(
    async (
      id: any,
      prop?: {
        default_entity?: string;
        reload?: boolean;
      }
    ) => {
      if (!id) return;
      const targetEntity = prop?.default_entity || entity;

      await fetchEntityData(targetEntity, "delete", id);
      if (prop?.reload !== false) {
        await load();
      }
    },
    [entity, load]
  );

  const exportBlob = useCallback(async (): Promise<Blob | null> => {
    const filtersParam =
      filters && Object.keys(filters).length > 0
        ? JSON.stringify(filters)
        : undefined;

    const blob = await fetchEntityData(entity, "export", {
      page,
      size: pageSize,
      q,
      sortKey,
      sortDir,
      ...(filtersParam ? { filters: filtersParam } : {}),
    });
    return blob instanceof Blob ? blob : null;
  }, [entity, page, pageSize, q, sortKey, sortDir, JSON.stringify(filters)]);

  // ---------- Filters helpers ----------
  const updateFilters = useCallback((next: UseEntityOptions["filters"]) => {
    setFilters((prev) => ({ ...(prev || {}), ...(next || {}) }));
  }, []);

  const clearFilters = useCallback(() => setFilters({}), []);

  return {
    // config/state
    entity,
    mode,
    setMode,
    loading,
    error,

    // list data & controls
    items,
    fields,
    cols,
    q,
    qInput,
    setQ,
    setQInput,
    page,
    pageSize,
    setPage,
    setPageSize,
    total,
    effectiveTotal,
    totalPages,
    curPage,
    startIndex,
    sortKey,
    sortDir,
    setSortKey,
    setSortDir,
    toggleSort,
    isSortedAsc,
    isSortedDesc,
    pageItems,

    // schema/form helpers
    schema,
    loadRefOptions,

    // actions
    create,
    update,
    deleteById,
    exportBlob,
    refresh: load,

    // filters (NEW)
    filters,
    setFilters,
    updateFilters,
    clearFilters,
  };
}

/** Back-compat alias (old name) */
export const useEntityList = useEntity;

/* ---------------- FORM-SPECIFIC HELPERS (centralized here) ---------------- */

export function useEntityOptions(entity: string) {
  const [schema, setSchema] = useState<SchemaField[]>([]);
  const [tableConfig, setTableConfig] = useState<TableConfigType>({
    columns: [],
    columnResolvers: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetchEntityData(entity, "options");
        setTableConfig(res.table);
        const raw: any[] = Array.isArray(res?.schema)
          ? res.schema
          : Array.isArray(res?.fields)
          ? res.fields
          : Array.isArray(res)
          ? res
          : [];
        const normalized: SchemaField[] = raw
          .map((f: any) =>
            typeof f === "string" ? { name: f } : { ...f, name: f?.name }
          )
          .filter((f) => f && f.name);
        if (alive) setSchema(normalized);
      } catch (e: any) {
        if (alive) setError(String(e?.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [entity]);

  return { schema, loading, error, tableConfig };
}

export function useRefOptions(ref?: {
  entity: string;
  valueKey?: string;
  labelKey?: string;
  size?: number;
}) {
  const [items, setItems] = useState<
    Array<{ value: string | number; label: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!ref) {
      setItems([]);
      return;
    }
    const { entity, valueKey = "id", labelKey = "name", size = 500 } = ref;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await fetchEntityData(entity, "get", { page: 1, size });
        const list = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        const pick = (obj: any, valueKey: string, labelKey?: string) => {
          if (labelKey && obj && obj[labelKey] != null && obj[labelKey] !== "")
            return obj[labelKey];
          const prefs = [
            "name",
            "title",
            "label",
            "code",
            "display_name",
            "description",
          ];
          for (const k of Object.keys(obj || {})) {
            if (
              prefs.includes(k.toLowerCase()) &&
              typeof obj[k] === "string" &&
              obj[k]
            )
              return obj[k];
          }
          for (const k of Object.keys(obj || {})) {
            if (typeof obj[k] === "string" && obj[k]) return obj[k];
          }
          return obj?.[valueKey];
        };
        const opts = list.map((r: any) => ({
          value: r[valueKey],
          label: String(pick(r, valueKey, labelKey)),
        }));
        if (alive) setItems(opts);
      } catch (e: any) {
        if (alive) setError(String(e?.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ref?.entity, ref?.valueKey, ref?.labelKey, ref?.size]);

  return { items, loading, error };
}
