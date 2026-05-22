import type { Request, Response } from "express";
import { issueService } from "./issue.service";

const validTypes = ["bug", "feature_request"];
const validStatus = ["open", "in_progress", "resolved"];

const attachReporters = async (issues: any[]) => {
  if (issues.length === 0) return [];

  const ids = [...new Set(issues.map((i) => i.reporter_id))] as number[];
  const users = await issueService.getUsersByIds(ids);

  const map: any = {};
  for (const u of users.rows) {
    map[u.id] = u;
  }

  return issues.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    type: i.type,
    status: i.status,
    reporter: map[i.reporter_id] || null,
    created_at: i.created_at,
    updated_at: i.updated_at,
  }));
};

const createIssue = async (req: Request, res: Response) => {
  try {
    const { title, description, type } = req.body;

    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: "Title, description and type are required!",
      });
    }
    if (title.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Title cannot exceed 150 characters!",
      });
    }
    if (description.length < 20) {
      return res.status(400).json({
        success: false,
        message: "Description must be at least 20 characters!",
      });
    }
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be bug or feature_request!",
      });
    }

    const reporterId = (req.user as any).id;
    const result = await issueService.createIssueInDB(
      { title, description, type },
      reporterId,
    );

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const getAllIssues = async (req: Request, res: Response) => {
  try {
    const sort = (req.query.sort as string) || "newest";
    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;

    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type filter!",
      });
    }
    if (status && !validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status filter!",
      });
    }

    const result = await issueService.getAllIssuesFromDB(sort, type, status);
    const data = await attachReporters(result.rows);

    res.status(200).json({
      success: true,
      message: "Issues retrieved successfully",
      data: data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await issueService.getSingleIssueFromDB(id as string);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue not found!",
      });
    }

    const data = await attachReporters(result.rows);

    res.status(200).json({
      success: true,
      message: "Issue retrieved successfully",
      data: data[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const updateIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, type, status } = req.body;
    const requester = req.user as any;

    const existing = await issueService.getSingleIssueFromDB(id as string);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue not found!",
      });
    }

    const issue = existing.rows[0];
    const isMaintainer = requester.role === "maintainer";

    if (!isMaintainer) {
      if (issue.reporter_id !== requester.id) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own issues!",
        });
      }
      if (issue.status !== "open") {
        return res.status(409).json({
          success: false,
          message: "Cannot edit an issue that is no longer open!",
        });
      }
      if (status !== undefined) {
        return res.status(403).json({
          success: false,
          message: "Only maintainers can change issue status!",
        });
      }
    }

    if (title !== undefined && title.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Title cannot exceed 150 characters!",
      });
    }
    if (description !== undefined && description.length < 20) {
      return res.status(400).json({
        success: false,
        message: "Description must be at least 20 characters!",
      });
    }
    if (type !== undefined && !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be bug or feature_request!",
      });
    }
    if (status !== undefined && !validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be open, in_progress or resolved!",
      });
    }

    const result = await issueService.updateIssueInDB(id as string, {
      title,
      description,
      type,
      status,
    });

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const deleteIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await issueService.deleteIssueFromDB(id as string);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue not found!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};
