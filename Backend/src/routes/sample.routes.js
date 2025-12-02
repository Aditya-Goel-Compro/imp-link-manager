import { Router } from "express";
import { addImpLink, deleteImpLink, getImpLinks, updateImpLink } from "../controllers/impLink.controller.js";
import { addCategory, getCategories } from "../controllers/category.controller.js";

const router = Router();


router.route("/imp-links").post(addImpLink).get(getImpLinks)
router.put("/imp-links/:id", updateImpLink);
router.delete("/imp-links/:id", deleteImpLink);

router.get("/categories", getCategories);
router.post("/categories", addCategory);

export default router;
