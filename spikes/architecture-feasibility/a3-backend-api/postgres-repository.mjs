const TENANT_ID_PATTERN = /^[a-z0-9_-]{1,64}$/;

/**
 * PostgreSQL-backed implementation of the A3 tenant repository contract.
 *
 * The supplied pool must connect with a role allowed to SET ROLE to
 * tinlance_app_runtime. Every tenant query runs in a transaction, with both
 * role and tenant context scoped using SET LOCAL / set_config(..., true).
 */
export function createPostgresRepository({ pool }) {
  if (!pool || typeof pool.connect !== "function" || typeof pool.query !== "function") {
    throw new TypeError("A PostgreSQL pool with connect() and query() is required");
  }

  async function withTenantTransaction(tenantId, operation) {
    if (typeof tenantId !== "string" || !TENANT_ID_PATTERN.test(tenantId)) {
      throw new TypeError("A verified, valid tenant identifier is required");
    }

    const client = await pool.connect();
    let transactionOpen = false;
    let releaseError;
    try {
      await client.query("BEGIN");
      transactionOpen = true;
      await client.query("SET LOCAL ROLE tinlance_app_runtime");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const result = await operation(client);
      await client.query("COMMIT");
      transactionOpen = false;
      return result;
    } catch (error) {
      if (transactionOpen) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          // pg.Pool removes a client released with an error instead of
          // returning a potentially transaction-poisoned session to the pool.
          releaseError = rollbackError;
        }
      }
      throw error;
    } finally {
      client.release(releaseError);
    }
  }

  return Object.freeze({
    async isReady() {
      try {
        await pool.query("SELECT 1");
        return true;
      } catch {
        return false;
      }
    },

    async findRecordForTenant(id, tenantId) {
      if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return null;
      }

      return withTenantTransaction(tenantId, async (client) => {
        const result = await client.query(
          "SELECT id, tenant_id, payload FROM public.tenant_records WHERE id = $1 LIMIT 1",
          [id]
        );
        const row = result.rows[0];
        if (!row) return null;
        const payload = row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
          ? row.payload
          : {};
        return { ...payload, id: row.id, tenantId: row.tenant_id };
      });
    }
  });
}
