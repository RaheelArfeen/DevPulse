import { pool } from "../../db/index";

const createIssueInDB = async (
  payload: { title: string; description: string; type: string },
  reporterId: number,
) => {
  const { title, description, type } = payload;
  const result = await pool.query(
    `INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [title, description, type, reporterId],
  );
  return result;
};

const getAllIssuesFromDB = async (
  sort: string,
  type?: string,
  status?: string,
) => {
  const sortDir = sort === "oldest" ? "ASC" : "DESC";
  const conditions: string[] = [];
  const values: any[] = [];

  if (type) {
    values.push(type);
    conditions.push(`type=$${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status=$${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT * FROM issues ${where} ORDER BY created_at ${sortDir}`,
    values,
  );
  return result;
};

const getSingleIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `SELECT * FROM issues WHERE id=$1`,
    [id],
  );
  return result;
};

const getUsersByIds = async (ids: number[]) => {
  if (ids.length === 0) return { rows: [] as any[] };
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
  const result = await pool.query(
    `SELECT id, name, role FROM users WHERE id IN (${placeholders})`,
    ids,
  );
  return result;
};

const updateIssueInDB = async (
  id: string,
  payload: { title?: string; description?: string; type?: string; status?: string },
) => {
  const { title, description, type, status } = payload;
  const result = await pool.query(
    `UPDATE issues SET
       title=COALESCE($1, title),
       description=COALESCE($2, description),
       type=COALESCE($3, type),
       status=COALESCE($4, status),
       updated_at=NOW()
     WHERE id=$5 RETURNING *`,
    [title ?? null, description ?? null, type ?? null, status ?? null, id],
  );
  return result;
};

const deleteIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `DELETE FROM issues WHERE id=$1`,
    [id],
  );
  return result;
};

export const issueService = {
  createIssueInDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  getUsersByIds,
  updateIssueInDB,
  deleteIssueFromDB,
};
