import { Router } from "express";
import { healthRouter } from "./health.ts";
import { languagesRouter } from "./languages.ts";
import { topicsRouter } from "./topics.ts";
import { resourcesRouter } from "./resources.ts";
import { articlesRouter } from "./articles.ts";
import { quizzesRouter } from "./quizzes.ts";
import { syntaxRouter } from "./syntax.ts";
import { dashboardRouter } from "./dashboard.ts";

const router = Router();

router.use(healthRouter);
router.use(languagesRouter);
router.use(topicsRouter);
router.use(resourcesRouter);
router.use(articlesRouter);
router.use(quizzesRouter);
router.use(syntaxRouter);
router.use(dashboardRouter);

export default router;
