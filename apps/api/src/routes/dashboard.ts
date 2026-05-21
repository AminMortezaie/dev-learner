import { Router } from "express";
import { asyncHandler } from "../lib/async.ts";
import * as dashboardService from "../services/dashboard.service.ts";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/dashboard/stats",
  asyncHandler(async (_req, res) => {
    res.json(await dashboardService.getDashboardStats());
  }),
);

dashboardRouter.get(
  "/dashboard/recent-activity",
  asyncHandler(async (_req, res) => {
    res.json(await dashboardService.getRecentActivity());
  }),
);

dashboardRouter.get(
  "/dashboard/language-progress",
  asyncHandler(async (_req, res) => {
    res.json(await dashboardService.getLanguageProgress());
  }),
);
