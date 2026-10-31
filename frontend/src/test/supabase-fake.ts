/**
 * Fake Supabase browser client untuk unit test (US-002 backend).
 * Mendukung rantai query yang dipakai `services/auth` + `store/auth`:
 * from().select().eq()/in().order()/single(), insert/update/delete/upsert,
 * serta auth.getSession/signInWithPassword/signOut/resetPasswordForEmail/
 * onAuthStateChange.
 */

import { LEAD_STATUSES } from "@/types/lead";

export interface FakeProfile {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface FakeUserRole {
  user_id: string;
  role_name: string;
}

export interface FakeAuthUser {
  id: string;
  email: string;
  password: string;
}

export interface FakeAuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: unknown | null;
  new_value: unknown | null;
  created_at: string;
}

export interface FakeMasterOption {
  category: string;
  value: string;
  is_active: boolean;
}

export interface FakeTeamMember {
  id: string;
  profile_id: string | null;
  name: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FakeDb {
  profiles: FakeProfile[];
  userRoles: FakeUserRole[];
  authUsers: FakeAuthUser[];
  auditLogs?: FakeAuditLog[];
  masterOptions?: FakeMasterOption[];
  teamMembers?: FakeTeamMember[];
  /** Tabel tambahan untuk cek referensi (leads, projects, dst.). */
  tables?: Record<string, Record<string, unknown>[]>;
  /** Tabel yang menolak DELETE tanpa error (mensimulasikan RLS/trigger di DB live). */
  blockedDeleteTables?: string[];
  /** Error yang dipaksa muncul dari setiap panggilan RPC. */
  rpcError?: { message: string; code?: string } | null;
  sessionUserId: string | null;
  sessionExpiresAt: number | null;
  resetError: string | null;
  listeners: ((event: string) => void)[];
}

type TableName = string;

type FilterOp = "eq" | "neq" | "in" | "ilike" | "gte" | "lte" | "is" | "not";

/** Tabel yang memiliki trigger audit di database live. */
const AUDITED_TABLES = new Set(["leads", "lead_interests", "lead_activities"]);

/**
 * Meniru trigger audit database: simpan snapshot lama/baru ke `auditLogs`.
 * Dipakai test timeline lead dan pemeriksaan audit tanpa memanggil DB nyata.
 */
function recordAudit(
  db: FakeDb,
  table: TableName,
  action: string,
  oldRow: Record<string, unknown> | null,
  newRow: Record<string, unknown> | null
): void {
  if (!AUDITED_TABLES.has(table)) {
    return;
  }
  const row = newRow ?? oldRow;
  if (!row) {
    return;
  }
  const entityId =
    table === "lead_interests" ? row["lead_id"] : row["id"];
  db.auditLogs ??= [];
  const profile = db.profiles.find((item) => item.id === db.sessionUserId);
  db.auditLogs.push({
    id: `AUD-${String(db.auditLogs.length + 1).padStart(4, "0")}`,
    actor_id: db.sessionUserId,
    actor_name: profile?.name ?? "Sistem",
    action,
    entity_type: table,
    entity_id: String(entityId ?? ""),
    old_value: oldRow ? { ...oldRow } : null,
    new_value: newRow ? { ...newRow } : null,
    created_at: new Date().toISOString(),
  });
}

function matches<T extends Record<string, unknown>>(
  row: T,
  filters: { column: string; op: FilterOp; value: unknown }[]
): boolean {
  return filters.every((filter) => {
    const actual = row[filter.column];
    if (filter.op === "eq" || filter.op === "is") {
      return actual === filter.value;
    }
    if (filter.op === "neq") {
      return actual !== filter.value;
    }
    if (filter.op === "not") {
      const inner = filter.value as { op: string; value: unknown };
      if (inner.op === "is") {
        return actual !== inner.value;
      }
      return actual !== inner.value;
    }
    if (filter.op === "ilike") {
      const needle = String(filter.value).replace(/%/g, "").toLowerCase();
      return String(actual ?? "").toLowerCase().includes(needle);
    }
    if (filter.op === "gte") {
      return String(actual ?? "") >= String(filter.value);
    }
    if (filter.op === "lte") {
      return String(actual ?? "") <= String(filter.value);
    }
    return (filter.value as unknown[]).includes(actual);
  });
}

class FakeQuery {
  private filters: { column: string; op: FilterOp; value: unknown }[] = [];
  private orderColumn: string | null = null;
  private orderAscending = true;
  private limitCount: number | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private singleRow = false;
  private insertRows: Record<string, unknown>[] | null = null;
  private updatePatch: Record<string, unknown> | null = null;
  private isDelete = false;
  private isUpsert = false;
  private returning = false;

  constructor(
    private readonly db: FakeDb,
    private readonly table: TableName
  ) {}

  select(): this {
    this.returning = true;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, op: "eq", value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push({ column, op: "neq", value });
    return this;
  }

  is(column: string, value: unknown): this {
    this.filters.push({ column, op: "is", value });
    return this;
  }

  not(column: string, op: string, value: unknown): this {
    this.filters.push({ column, op: "not", value: { op, value } });
    return this;
  }

  in(column: string, value: unknown): this {
    this.filters.push({ column, op: "in", value });
    return this;
  }

  ilike(column: string, value: unknown): this {
    this.filters.push({ column, op: "ilike", value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.filters.push({ column, op: "gte", value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.filters.push({ column, op: "lte", value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderColumn = column;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number): this {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  private allowEmptySingle = false;

  single(): this {
    this.singleRow = true;
    return this;
  }

  maybeSingle(): this {
    this.singleRow = true;
    this.allowEmptySingle = true;
    return this;
  }

  insert(rows: Record<string, unknown> | Record<string, unknown>[]): this {
    this.insertRows = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  update(patch: Record<string, unknown>): this {
    this.updatePatch = patch;
    return this;
  }

  delete(): this {
    this.isDelete = true;
    return this;
  }

  upsert(row: Record<string, unknown>): this {
    this.isUpsert = true;
    this.insertRows = [row];
    return this;
  }

  private rows(): Record<string, unknown>[] {
    if (this.table === "audit_logs") {
      this.db.auditLogs ??= [];
      return this.db.auditLogs as unknown as Record<string, unknown>[];
    }
    if (this.table === "master_options") {
      this.db.masterOptions ??= [];
      return this.db.masterOptions as unknown as Record<string, unknown>[];
    }
    if (this.table === "team_members") {
      this.db.teamMembers ??= [];
      return this.db.teamMembers as unknown as Record<string, unknown>[];
    }
    if (this.table === "profiles") {
      return this.db.profiles as unknown as Record<string, unknown>[];
    }
    if (this.table === "user_roles") {
      return this.db.userRoles as unknown as Record<string, unknown>[];
    }
    this.db.tables ??= {};
    this.db.tables[this.table] ??= [];
    return this.db.tables[this.table];
  }

  private execute(): { data: unknown; error: { message: string } | null } {
    const rows = this.rows();

    if (this.insertRows) {
      const inserted: Record<string, unknown>[] = [];
      for (const row of this.insertRows) {
        if (this.isUpsert) {
          const index = rows.findIndex((candidate) => {
            if (this.table === "lead_interests") {
              return candidate["lead_id"] === row["lead_id"];
            }
            return candidate["id"] === row["id"];
          });
          if (index >= 0) {
            const before = { ...rows[index] };
            rows[index] = { ...rows[index], ...row };
            recordAudit(this.db, this.table, "update", before, { ...rows[index] });
            inserted.push({ ...rows[index] });
            continue;
          }
        }
        const stored = { ...row };
        if (this.table === "team_members") {
          stored["id"] ??= `tm-${rows.length + 1}`;
          stored["profile_id"] ??= null;
          stored["is_active"] ??= true;
          stored["created_at"] ??= new Date().toISOString();
          stored["updated_at"] ??= stored["created_at"];
        }
        if (this.table === "lead_activities") {
          stored["id"] ??= `lan-${rows.length + 1}`;
          stored["author_id"] ??= null;
          stored["created_at"] ??= new Date().toISOString();
        }
        if (this.table === "clients") {
          const now = new Date().toISOString();
          const maxDisplay = rows.reduce((max, row) => {
            const match = /^KLI-(\d+)$/.exec(String(row["display_id"] ?? ""));
            return match ? Math.max(max, Number(match[1])) : max;
          }, 0);
          stored["id"] ??= `cli-${rows.length + 1}`;
          stored["display_id"] ??= `KLI-${String(maxDisplay + 1).padStart(3, "0")}`;
          stored["pic_name"] ??= null;
          stored["referrer"] ??= null;
          stored["source_lead_id"] ??= null;
          stored["created_at"] ??= now;
          stored["updated_at"] ??= now;
        }
        if (this.table === "leads") {
          const now = new Date().toISOString();
          const maxDisplay = rows.reduce((max, row) => {
            const match = /^LEAD-(\d+)$/.exec(String(row["display_id"] ?? ""));
            return match ? Math.max(max, Number(match[1])) : max;
          }, 0);
          stored["id"] ??= `lead-${rows.length + 1}`;
          stored["display_id"] ??= `LEAD-${String(maxDisplay + 1).padStart(3, "0")}`;
          stored["instagram"] ??= null;
          stored["pic_id"] ??= null;
          stored["next_follow_up"] ??= null;
          stored["source"] ??= null;
          stored["archived_at"] ??= null;
          stored["created_at"] ??= now;
          stored["updated_at"] ??= now;
        }
        if (this.table === "deals") {
          const now = new Date().toISOString();
          const maxDisplay = rows.reduce((max, row) => {
            const match = /^HDV-(\d+)$/.exec(String(row["display_id"] ?? ""));
            return match ? Math.max(max, Number(match[1])) : max;
          }, 0);
          stored["id"] ??= `deal-${rows.length + 1}`;
          stored["display_id"] ??= `HDV-${String(maxDisplay + 1).padStart(3, "0")}`;
          stored["status"] ??= "Draft";
          stored["created_by"] ??= null;
          stored["confirmed_by"] ??= null;
          stored["confirmed_at"] ??= null;
          stored["created_at"] ??= now;
          stored["updated_at"] ??= now;
        }
        if (this.table === "deal_payment_terms") {
          const maxTerm = rows.reduce((max, r) => {
            const match = /^TRM-(\d+)$/.exec(String(r["id"] ?? ""));
            return match ? Math.max(max, Number(match[1])) : max;
          }, 0);
          stored["id"] ??= `TRM-${String(maxTerm + 1).padStart(3, "0")}`;
        }
        if (this.table === "change_requests") {
          const now = new Date().toISOString();
          const maxDisplay = rows.reduce((max, row) => {
            const match = /^CR-(\d+)$/.exec(String(row["display_id"] ?? ""));
            return match ? Math.max(max, Number(match[1])) : max;
          }, 0);
          stored["id"] ??= `cr-${rows.length + 1}`;
          stored["display_id"] ??= `CR-${String(maxDisplay + 1).padStart(3, "0")}`;
          stored["status"] ??= "Diajukan";
          stored["created_at"] ??= now;
          stored["updated_at"] ??= now;
        }
        rows.push(stored);
        recordAudit(this.db, this.table, "insert", null, { ...stored });
        inserted.push({ ...stored });
      }
      const res = this.returning ? inserted : this.insertRows;
      if (this.singleRow) {
        return { data: res[0] ?? null, error: null };
      }
      return { data: res, error: null };
    }

    if (this.updatePatch) {
      const updated: Record<string, unknown>[] = [];
      for (const row of rows) {
        if (matches(row, this.filters)) {
          const before = { ...row };
          Object.assign(row, this.updatePatch);
          if (this.table === "team_members") {
            row["updated_at"] = new Date().toISOString();
          }
          recordAudit(this.db, this.table, "update", before, { ...row });
          updated.push({ ...row });
        }
      }
      if (this.singleRow) {
        return { data: updated[0] ?? null, error: null };
      }
      return { data: updated, error: null };
    }

    if (this.isDelete) {
      if (this.db.blockedDeleteTables?.includes(this.table)) {
        return { data: [], error: null };
      }
      const deleted = rows.filter((row) => matches(row, this.filters));
      for (const row of deleted) {
        recordAudit(this.db, this.table, "delete", { ...row }, null);
      }
      const kept = rows.filter((row) => !matches(row, this.filters));
      rows.length = 0;
      rows.push(...kept);
      return { data: this.returning ? deleted : [], error: null };
    }

    let result = rows.filter((row) => matches(row, this.filters));
    if (this.orderColumn) {
      const column = this.orderColumn;
      const ascending = this.orderAscending;
      result = [...result].sort((a, b) => {
        const compared = String(a[column]).localeCompare(String(b[column]));
        return ascending ? compared : -compared;
      });
    }
    if (this.rangeFrom !== null && this.rangeTo !== null) {
      result = result.slice(this.rangeFrom, this.rangeTo + 1);
    }
    if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount);
    }
    if (this.singleRow) {
      if (result.length === 0) {
        if (this.allowEmptySingle) {
          return { data: null, error: null };
        }
        return { data: null, error: { message: "No rows" } };
      }
      return { data: result[0], error: null };
    }
    return { data: result, error: null };
  }

  then<TResult1 = { data: unknown; error: { message: string } | null }>(
    onFulfilled?: (
      value: { data: unknown; error: { message: string } | null }
    ) => TResult1 | PromiseLike<TResult1>
  ): Promise<TResult1> {
    return Promise.resolve(this.execute()).then(onFulfilled);
  }
}

export interface FakeSupabaseClient {
  auth: {
    getSession: () => Promise<{
      data: { session: { user: { id: string }; expires_at: number } | null };
    }>;
    signInWithPassword: (input: {
      email: string;
      password: string;
    }) => Promise<{
      data: {
        user: { id: string } | null;
        session: { user: { id: string }; expires_at: number } | null;
      };
      error: { message: string } | null;
    }>;
    signOut: () => Promise<{ error: null }>;
    resetPasswordForEmail: (
      email: string,
      options?: { redirectTo?: string }
    ) => Promise<{ data: object; error: { message: string } | null }>;
    updateUser: (input: { password: string }) => Promise<{
      data: { user: { id: string } | null };
      error: { message: string } | null;
    }>;
    onAuthStateChange: (callback: (event: string) => void) => {
      data: { subscription: { unsubscribe: () => void } };
    };
  };
  from: (table: TableName) => FakeQuery;
  rpc: (
    name: string,
    args?: Record<string, unknown>
  ) => Promise<{
    data: unknown;
    error: { message: string; code?: string } | null;
  }>;
}

/**
 * Seed CRM untuk unit test: 8 lead (sama dengan `mocks/leads.ts`), tim/PIC
 * aktif + nonaktif, dan opsi master data inti. Setiap test mendapat salinan
 * baru lewat `createSupabaseFake(seedCrmFake())`.
 */
export function seedCrmFake(): Partial<FakeDb> {
  const createdAt = "2026-09-01T00:00:00Z";
  const teamMembers: FakeTeamMember[] = [
    {
      id: "tm-feby",
      profile_id: null,
      name: "Feby",
      status: "internal",
      is_active: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "tm-fira",
      profile_id: null,
      name: "Fira",
      status: "internal",
      is_active: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "tm-figo",
      profile_id: null,
      name: "Figo",
      status: "internal",
      is_active: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "tm-sinta",
      profile_id: null,
      name: "Sinta",
      status: "internal",
      is_active: false,
      created_at: createdAt,
      updated_at: createdAt,
    },
  ];

  const masterOptions: FakeMasterOption[] = [
    { category: "industry", value: "Teknologi", is_active: true },
    { category: "industry", value: "Jasa", is_active: true },
    { category: "industry", value: "Retail & E-commerce", is_active: true },
    { category: "industry", value: "Kesehatan", is_active: true },
    { category: "industry", value: "Properti", is_active: true },
    { category: "industry", value: "F&B", is_active: true },
    { category: "industry", value: "Pendidikan", is_active: true },
    { category: "industry", value: "Lainnya", is_active: true },
    ...LEAD_STATUSES.map((value) => ({
      category: "lead_status",
      value,
      is_active: true,
    })),
  ];

  const leads: Record<string, unknown>[] = [
    {
      id: "lead-1",
      display_id: "LEAD-001",
      contact_date: "2026-09-20",
      company_name: "PT Aruna Digital",
      industry: "Teknologi",
      whatsapp: "6281234567890",
      instagram: "@arunadigital",
      email: "halo@arunadigital.id",
      pic_id: "tm-feby",
      status: "Follow Up",
      next_follow_up: "2026-10-02",
      source: null,
      archived_at: null,
      created_at: "2026-09-20T03:00:00Z",
      updated_at: "2026-10-03T04:00:00Z",
    },
    {
      id: "lead-2",
      display_id: "LEAD-002",
      contact_date: "2026-09-22",
      company_name: "CV Mandala Kreasi",
      industry: "Jasa",
      whatsapp: "6289876543210",
      instagram: "@mandalakreasi",
      email: "info@mandalakreasi.com",
      pic_id: "tm-fira",
      status: "Interest",
      next_follow_up: null,
      source: null,
      archived_at: null,
      created_at: "2026-09-22T03:00:00Z",
      updated_at: "2026-10-04T02:20:00Z",
    },
    {
      id: "lead-3",
      display_id: "LEAD-003",
      contact_date: "2026-09-25",
      company_name: "Toko Berkah Jaya",
      industry: "Retail & E-commerce",
      whatsapp: "6281122334455",
      instagram: "@berkahjaya",
      email: "cs@berkahjaya.id",
      pic_id: "tm-figo",
      status: "New",
      next_follow_up: null,
      source: null,
      archived_at: null,
      created_at: "2026-09-25T03:00:00Z",
      updated_at: "2026-09-25T03:00:00Z",
    },
    {
      id: "lead-4",
      display_id: "LEAD-004",
      contact_date: "2026-09-18",
      company_name: "Klinik Sehat Sentosa",
      industry: "Kesehatan",
      whatsapp: "6285566778899",
      instagram: "@sehatsentosa",
      email: "admin@sehatsentosa.id",
      pic_id: "tm-feby",
      status: "Contacted",
      next_follow_up: "2026-10-10",
      source: null,
      archived_at: null,
      created_at: "2026-09-18T03:00:00Z",
      updated_at: "2026-09-28T05:00:00Z",
    },
    {
      id: "lead-5",
      display_id: "LEAD-005",
      contact_date: "2026-09-10",
      company_name: "PT Sinar Abadi Properti",
      industry: "Properti",
      whatsapp: "6289988776655",
      instagram: "@sinarabadi",
      email: "marketing@sinarabadi.co.id",
      pic_id: "tm-fira",
      status: "Closing",
      next_follow_up: null,
      source: null,
      archived_at: null,
      created_at: "2026-09-10T03:00:00Z",
      updated_at: "2026-10-02T06:00:00Z",
    },
    {
      id: "lead-6",
      display_id: "LEAD-006",
      contact_date: "2026-09-12",
      company_name: "Kopi Nusantara",
      industry: "F&B",
      whatsapp: "6283344556677",
      instagram: "@kopinusantara",
      email: "hello@kopinusantara.id",
      pic_id: "tm-figo",
      status: "Interest",
      next_follow_up: null,
      source: null,
      archived_at: null,
      created_at: "2026-09-12T03:00:00Z",
      updated_at: "2026-10-02T04:00:00Z",
    },
    {
      id: "lead-7",
      display_id: "LEAD-007",
      contact_date: "2026-09-08",
      company_name: "Bimbel Cerdas Bangsa",
      industry: "Pendidikan",
      whatsapp: "6287766554433",
      instagram: "@cerdasbangsa",
      email: "info@cerdasbangsa.id",
      pic_id: "tm-feby",
      status: "Lost",
      next_follow_up: null,
      source: null,
      archived_at: null,
      created_at: "2026-09-08T03:00:00Z",
      updated_at: "2026-09-15T04:00:00Z",
    },
    {
      id: "lead-8",
      display_id: "LEAD-008",
      contact_date: "2026-10-01",
      company_name: "Aruna Digital PT",
      industry: "Teknologi",
      whatsapp: "6281234567890",
      instagram: "@arunadigital2",
      email: "sales@arunadigital.id",
      pic_id: "tm-fira",
      status: "New",
      next_follow_up: null,
      source: null,
      archived_at: null,
      created_at: "2026-10-01T03:00:00Z",
      updated_at: "2026-10-01T03:00:00Z",
    },
  ];

  const lead_interests: Record<string, unknown>[] = [
    {
      lead_id: "lead-2",
      stage: "Demo",
      need: "Website company profile + katalog produk, estimasi 20 halaman.",
    },
    {
      lead_id: "lead-6",
      stage: "Price Sent",
      need: "Paket pengelolaan sosmed 3 platform selama 3 bulan.",
    },
  ];

  const clients: Record<string, unknown>[] = [
    {
      id: "cli-1",
      display_id: "KLI-001",
      company_name: "PT Sinar Abadi Properti",
      pic_name: "Bpk. Hendra Gunawan",
      phone: "6289988776655",
      email: "hendra@sinarabadi.co.id",
      referrer: "Referral",
      source_lead_id: "lead-5",
      created_at: "2026-10-02T07:00:00Z",
      updated_at: "2026-10-02T07:00:00Z",
    },
    {
      id: "cli-2",
      display_id: "KLI-002",
      company_name: "Yayasan Maju Bersama",
      pic_name: "Ibu Ratna Sari",
      phone: "6282211002233",
      email: "ratna@majubersama.or.id",
      referrer: "Instagram",
      source_lead_id: null,
      created_at: "2026-09-15T03:00:00Z",
      updated_at: "2026-09-15T03:00:00Z",
    },
  ];

  const deals: Record<string, unknown>[] = [
    {
      id: "deal-1",
      display_id: "HDV-001",
      title: "Website Company Profile",
      code: "PYT-2026-001",
      client_id: "cli-1",
      scope: "Pembuatan website company profile + katalog produk untuk PT Sinar Abadi Properti.",
      objective: "Menaikkan inquiry online 30% dalam 3 bulan setelah rilis.",
      value_idr: 45000000,
      term_scheme: "50-30-20 (DP, serah terima desain, go-live)",
      deadline: "2026-12-20",
      notes: "Logo dan foto dari klien paling lambat 20 Oktober.",
      status: "Menunggu Konfirmasi Produksi",
      created_by: null,
      confirmed_by: null,
      confirmed_at: null,
      created_at: "2026-10-03T05:00:00Z",
      updated_at: "2026-10-03T05:00:00Z",
    },
    {
      id: "deal-2",
      display_id: "HDV-002",
      title: "Sistem Informasi Yayasan",
      code: "PYT-2026-002",
      client_id: "cli-2",
      scope: "Sistem data donatur dan laporan kegiatan yayasan.",
      objective: "Merapikan administrasi dalam 2 bulan.",
      value_idr: 30000000,
      term_scheme: "50-50 (DP, serah terima)",
      deadline: "2026-11-30",
      notes: "",
      status: "Draft",
      created_by: null,
      confirmed_by: null,
      confirmed_at: null,
      created_at: "2026-10-01T04:00:00Z",
      updated_at: "2026-10-01T04:00:00Z",
    },
    {
      id: "deal-3",
      display_id: "HDV-003",
      title: "Website Katalog Yayasan",
      code: "PYT-2026-003",
      client_id: "cli-2",
      scope: "Website katalog program dan galeri kegiatan yayasan.",
      objective: "Donasi online naik 20% dalam 6 bulan.",
      value_idr: 25000000,
      term_scheme: "50-50 (DP, go-live)",
      deadline: "2026-12-15",
      notes: "Seed demo: sudah Dikonfirmasi dan menjadi PRJ-001.",
      status: "Dikonfirmasi",
      created_by: null,
      confirmed_by: null,
      confirmed_at: null,
      created_at: "2026-09-20T03:00:00Z",
      updated_at: "2026-09-21T03:00:00Z",
    },
    {
      id: "deal-4",
      display_id: "HDV-004",
      title: "Landing Page Properti",
      code: "PYT-2026-004",
      client_id: "cli-1",
      scope: "Landing page kampanye klaster baru.",
      objective: "Kumpulkan 200 prospek dalam sebulan.",
      value_idr: 15000000,
      term_scheme: "100 di muka",
      deadline: "2027-01-31",
      notes: "Seed demo: sudah Dikonfirmasi dan menjadi PRJ-002.",
      status: "Dikonfirmasi",
      created_by: null,
      confirmed_by: null,
      confirmed_at: null,
      created_at: "2026-09-20T03:00:00Z",
      updated_at: "2026-09-20T03:00:00Z",
    },
  ];

  const deal_features: Record<string, unknown>[] = [
    { deal_id: "deal-1", name: "Landing page", description: "Hero, layanan, galeri, kontak.", sort_order: 0 },
    { deal_id: "deal-1", name: "Katalog produk", description: "20 halaman + filter kategori + PDF.", sort_order: 1 },
    { deal_id: "deal-1", name: "Form kontak WA", description: "Tombol WhatsApp + notifikasi email.", sort_order: 2 },
    { deal_id: "deal-2", name: "Dashboard donatur", description: "CRUD + riwayat donasi.", sort_order: 0 },
    { deal_id: "deal-3", name: "Katalog program", description: "12 halaman program + pencarian.", sort_order: 0 },
    { deal_id: "deal-3", name: "Galeri kegiatan", description: "Galeri foto + video profil.", sort_order: 1 },
    { deal_id: "deal-4", name: "Landing page", description: "Hero, tipe unit, form survei.", sort_order: 0 },
  ];

  const deal_versions: Record<string, unknown>[] = [
    { deal_id: "deal-1", version: 1, value_idr: 45000000, deadline: "2026-12-20", note: "Versi awal saat handover dibuat.", created_at: "2026-10-03T05:00:00Z" },
    { deal_id: "deal-2", version: 1, value_idr: 30000000, deadline: "2026-11-30", note: "Versi awal saat handover dibuat.", created_at: "2026-10-01T04:00:00Z" },
    { deal_id: "deal-3", version: 1, value_idr: 25000000, deadline: "2026-12-15", note: "Versi awal saat handover dibuat.", created_at: "2026-09-20T03:00:00Z" },
    { deal_id: "deal-4", version: 1, value_idr: 15000000, deadline: "2027-01-31", note: "Versi awal saat handover dibuat.", created_at: "2026-09-20T03:00:00Z" },
  ];

  const deal_payment_terms: Record<string, unknown>[] = [
    { id: "TRM-001", deal_id: "deal-1", name: "DP 50%", kind: "percent", value: 50, milestone: "Penandatanganan kesepakatan", due_date: null, status: "Lunas" },
    { id: "TRM-002", deal_id: "deal-1", name: "Serah terima desain 30%", kind: "percent", value: 30, milestone: "Approval desain", due_date: null, status: "Ditagih" },
    { id: "TRM-003", deal_id: "deal-1", name: "Pelunasan 20%", kind: "percent", value: 20, milestone: null, due_date: "2026-12-20", status: "Belum Ditagih" },
    { id: "TRM-004", deal_id: "deal-2", name: "DP 50%", kind: "percent", value: 50, milestone: null, due_date: null, status: "Belum Ditagih" },
    { id: "TRM-005", deal_id: "deal-3", name: "DP 50%", kind: "percent", value: 50, milestone: "Penandatanganan kesepakatan", due_date: null, status: "Lunas" },
    { id: "TRM-006", deal_id: "deal-3", name: "Pelunasan 50%", kind: "percent", value: 50, milestone: null, due_date: "2026-12-15", status: "Belum Ditagih" },
  ];

  const change_requests: Record<string, unknown>[] = [
    {
      id: "cr-1",
      display_id: "CR-001",
      deal_id: "deal-2",
      kind: "negosiasi",
      description: "Klien meminta skema termin 30-40-30.",
      value_impact: null,
      deadline_impact: null,
      status: "Diajukan",
      created_by: null,
      created_by_name: "Figo",
      decided_at: null,
      created_at: "2026-10-02T03:00:00Z",
      updated_at: "2026-10-02T03:00:00Z",
    },
  ];

  return {
    teamMembers,
    masterOptions,
    tables: { leads, lead_interests, clients, deals, deal_features, deal_versions, deal_payment_terms, change_requests },
  };
}

/** Membuat fake + setter seed per test. */
export function createSupabaseFake(seed: Partial<FakeDb>): {
  db: FakeDb;
  client: FakeSupabaseClient;
  fire: (event: string) => void;
} {
  const db: FakeDb = {
    profiles: [],
    userRoles: [],
    authUsers: [],
    sessionUserId: null,
    sessionExpiresAt: null,
    resetError: null,
    listeners: [],
    ...seed,
  };

  const sessionFor = (userId: string) => ({
    user: { id: userId },
    expires_at: db.sessionExpiresAt ?? Math.floor(Date.now() / 1000) + 3600,
  });

  const client: FakeSupabaseClient = {
    auth: {
      getSession: async () => ({
        data: {
          session: db.sessionUserId ? sessionFor(db.sessionUserId) : null,
        },
      }),
      signInWithPassword: async ({ email, password }) => {
        const found = db.authUsers.find(
          (candidate) => candidate.email === email && candidate.password === password
        );
        if (!found) {
          return {
            data: { user: null, session: null },
            error: { message: "Invalid login credentials" },
          };
        }
        db.sessionUserId = found.id;
        return {
          data: { user: { id: found.id }, session: sessionFor(found.id) },
          error: null,
        };
      },
      signOut: async () => {
        db.sessionUserId = null;
        return { error: null };
      },
      resetPasswordForEmail: async () => {
        if (db.resetError) {
          return { data: {}, error: { message: db.resetError } };
        }
        return { data: {}, error: null };
      },
      updateUser: async ({ password }: { password: string }) => {
        const authUser = db.authUsers.find((u) => u.id === db.sessionUserId);
        if (!authUser) {
          return { data: { user: null }, error: { message: "Not authenticated" } };
        }
        authUser.password = password;
        return { data: { user: { id: authUser.id } }, error: null };
      },
      onAuthStateChange: (callback) => {
        db.listeners.push(callback);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
    from: (table) => new FakeQuery(db, table),
    rpc: async (name, args) => {
      if (db.rpcError) {
        return { data: null, error: db.rpcError };
      }
      if (name === "lead_audit_trail") {
        const leadId = String(args?.["p_lead_id"] ?? "");
        const rows = (db.auditLogs ?? [])
          .filter(
            (entry) =>
              entry.entity_id === leadId &&
              (entry.entity_type === "leads" ||
                entry.entity_type === "lead_interests")
          )
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((entry) => ({
            actor_name: entry.actor_name,
            action: entry.action,
            entity_type: entry.entity_type,
            old_value: entry.old_value,
            new_value: entry.new_value,
            created_at: entry.created_at,
          }));
        return { data: rows, error: null };
      }
      const tableByType: Record<string, string> = {
        lead: "leads",
        project: "projects",
        content_material: "content_materials",
      };
      const entityType = String(args?.["entity_type"] ?? "");
      const entityId = String(args?.["entity_id"] ?? "");
      const table = tableByType[entityType];
      if (
        !table ||
        (name !== "archive_entity" && name !== "restore_entity")
      ) {
        return {
          data: null,
          error: { message: `RPC tidak dikenal: ${name}`, code: "22023" },
        };
      }
      db.tables ??= {};
      db.tables[table] ??= [];
      const row = db.tables[table].find(
        (candidate) => candidate["id"] === entityId
      );
      if (!row) {
        return { data: null, error: null };
      }
      row["archived_at"] =
        name === "archive_entity" ? new Date().toISOString() : null;
      return { data: null, error: null };
    },
  };

  return {
    db,
    client,
    fire: (event) => {
      for (const listener of db.listeners) {
        listener(event);
      }
    },
  };
}
