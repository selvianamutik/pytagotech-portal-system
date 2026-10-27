/**
 * Fake Supabase browser client untuk unit test (US-002 backend).
 * Mendukung rantai query yang dipakai `services/auth` + `store/auth`:
 * from().select().eq()/in().order()/single(), insert/update/delete/upsert,
 * serta auth.getSession/signInWithPassword/signOut/resetPasswordForEmail/
 * onAuthStateChange.
 */

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

type FilterOp = "eq" | "in" | "ilike" | "gte" | "lte";

function matches<T extends Record<string, unknown>>(
  row: T,
  filters: { column: string; op: FilterOp; value: unknown }[]
): boolean {
  return filters.every((filter) => {
    const actual = row[filter.column];
    if (filter.op === "eq") {
      return actual === filter.value;
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

  single(): this {
    this.singleRow = true;
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
      for (const row of this.insertRows) {
        if (this.isUpsert) {
          const index = rows.findIndex(
            (candidate) => candidate["id"] === row["id"]
          );
          if (index >= 0) {
            rows[index] = { ...rows[index], ...row };
            continue;
          }
        }
        const stored = { ...row };
        if (this.table === "team_members") {
          stored["id"] ??= `tm-${rows.length + 1}`;
          stored["profile_id"] ??= null;
          stored["created_at"] ??= new Date().toISOString();
          stored["updated_at"] ??= stored["created_at"];
        }
        rows.push(stored);
      }
      return { data: this.insertRows, error: null };
    }

    if (this.updatePatch) {
      const updated: Record<string, unknown>[] = [];
      for (const row of rows) {
        if (matches(row, this.filters)) {
          Object.assign(row, this.updatePatch);
          if (this.table === "team_members") {
            row["updated_at"] = new Date().toISOString();
          }
          updated.push({ ...row });
        }
      }
      return { data: updated, error: null };
    }

    if (this.isDelete) {
      if (this.db.blockedDeleteTables?.includes(this.table)) {
        return { data: [], error: null };
      }
      const deleted = rows.filter((row) => matches(row, this.filters));
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
