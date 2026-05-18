import { Router, type IRouter } from "express";
import healthRouter from "./health";
import languagesRouter from "./languages";
import topicsRouter from "./topics";
import resourcesRouter from "./resources";
import articlesRouter from "./articles";
import quizzesRouter from "./quizzes";
import syntaxRouter from "./syntax";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(languagesRouter);
router.use(topicsRouter);
router.use(resourcesRouter);
router.use(articlesRouter);
router.use(quizzesRouter);
router.use(syntaxRouter);
router.use(dashboardRouter);

export default router;
