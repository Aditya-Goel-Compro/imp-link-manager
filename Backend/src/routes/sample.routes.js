import { Router } from "express";
import { addImpLink, deleteImpLink, getImpLinks, updateImpLink } from "../controllers/impLink.controller.js";
import { addCategory, getCategories } from "../controllers/category.controller.js";
import { addReminder, deleteReminder, getReminders, markReminderDoneToday, updateReminder } from "../controllers/reminders.controller.js";
import { exportImpLinksExcel } from "../controllers/impLinksExport.controller.js";

const router = Router();


router.route("/imp-links").post(addImpLink).get(getImpLinks)
router.put("/imp-links/:id", updateImpLink);
router.delete("/imp-links/:id", deleteImpLink);

router.get("/categories", getCategories);
router.post("/categories", addCategory);


router
  .route("/reminders")
  .get(getReminders)    // GET /excel/reminders?type=office|personal
  .post(addReminder);   // POST /excel/reminders

router.patch("/reminders/:id/done", markReminderDoneToday); 

router.put("/reminders/:id", updateReminder);   // 👈 new
router.delete("/reminders/:id", deleteReminder);   

router.get("/imp-links/export", exportImpLinksExcel);

export default router;
