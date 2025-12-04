// controllers/reminders.controller.js
import { Reminder } from "../models/reminder.model.js";

// POST /excel/reminders
const addReminder = async (req, res) => {
  console.log("⏰ addReminder called");
  console.log("📥 Body:", req.body);

  try {
    const { type, task, timeOfDay, isActive } = req.body;

    // Basic validation
    if (!type || !["office", "personal"].includes(type)) {
      console.log("❌ Invalid or missing type:", type);
      return res.status(400).json({
        success: false,
        message: "type is required and must be 'office' or 'personal'",
      });
    }

    if (!task || !task.trim()) {
      console.log("❌ Validation failed: task is required");
      return res.status(400).json({
        success: false,
        message: "Task is required",
      });
    }

    if (!timeOfDay || !/^\d{2}:\d{2}$/.test(timeOfDay)) {
      console.log("❌ Validation failed: invalid timeOfDay:", timeOfDay);
      return res.status(400).json({
        success: false,
        message: "timeOfDay must be in HH:MM format (24h)",
      });
    }

    const reminderData = {
      type,
      task: task.trim(),
      timeOfDay: timeOfDay.trim(),
      isActive: typeof isActive === "boolean" ? isActive : true,
    };

    console.log("🛠 Creating Reminder with data:", reminderData);

    const created = await Reminder.create(reminderData);

    console.log("✅ Reminder saved:", created);

    return res.status(201).json({
      success: true,
      message: "Reminder created successfully",
      data: created,
    });
  } catch (error) {
    console.error("💥 Error in addReminder:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating reminder",
    });
  }
};

// GET /excel/reminders?type=office|personal
const getReminders = async (req, res) => {
  console.log("📥 getReminders called");
  console.log("🔎 Query:", req.query);

  try {
    const { type } = req.query;

    const filter = {};
    if (type) {
      filter.type = type;
    }

    const reminders = await Reminder.find(filter).sort({ createdAt: 1 });

    console.log(`✅ Fetched ${reminders.length} reminders from DB`);

    return res.status(200).json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    console.error("💥 Error in getReminders:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching reminders",
    });
  }
};

// PATCH /excel/reminders/:id/done
const markReminderDoneToday = async (req, res) => {
  console.log("✅ markReminderDoneToday called");
  console.log("📥 Params:", req.params);

  try {
    const { id } = req.params;

    if (!id) {
      console.log("❌ Validation failed: ID is required");
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    // We store current date/time as lastDoneDate
    const now = new Date();
    console.log("🕒 Marking done at:", now.toISOString());

    const updated = await Reminder.findByIdAndUpdate(
      id,
      { lastDoneDate: now },
      { new: true, runValidators: true }
    );

    if (!updated) {
      console.log("❌ No Reminder found with id:", id);
      return res.status(404).json({
        success: false,
        message: "Reminder not found",
      });
    }

    console.log("✅ Reminder marked done for today:", updated);

    return res.status(200).json({
      success: true,
      message: "Reminder marked as done for today",
      data: updated,
    });
  } catch (error) {
    console.error("💥 Error in markReminderDoneToday:", error);

    if (error.name === "CastError") {
      console.log("❌ Invalid ObjectId in markReminderDoneToday:", req.params.id);
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating reminder",
    });
  }
};


const updateReminder = async (req, res) => {
  console.log("🛠 updateReminder called");
  console.log("📥 Params:", req.params);
  console.log("📥 Body:", req.body);

  try {
    const { id } = req.params;
    const { task, timeOfDay, repeat, isActive } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    if (!task || !task.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task is required",
      });
    }

    if (!timeOfDay || !/^\d{2}:\d{2}$/.test(timeOfDay)) {
      return res.status(400).json({
        success: false,
        message: "timeOfDay must be HH:MM format",
      });
    }

    const updateData = {
      task: task.trim(),
      timeOfDay: timeOfDay.trim(),
    };

    if (repeat) updateData.repeat = repeat;
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    console.log("🛠 Updating Reminder with data:", updateData);

    const updated = await Reminder.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      console.log("❌ No Reminder found with id:", id);
      return res.status(404).json({
        success: false,
        message: "Reminder not found",
      });
    }

    console.log("✅ Reminder updated:", updated);

    return res.status(200).json({
      success: true,
      message: "Reminder updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("💥 Error in updateReminder:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating reminder",
    });
  }
}; 


const deleteReminder = async (req, res) => {
  console.log("🗑 deleteReminder called");
  console.log("📥 Params:", req.params);

  try {
    const { id } = req.params;

    if (!id) {
      console.log("❌ Validation failed: ID is required for delete");
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    console.log("🔍 Attempting to delete reminder with id:", id);

    const deleted = await Reminder.findByIdAndDelete(id);

    if (!deleted) {
      console.log("❌ Reminder not found to delete:", id);
      return res.status(404).json({
        success: false,
        message: "Reminder not found",
      });
    }

    console.log("✅ Reminder deleted:", deleted);

    return res.status(200).json({
      success: true,
      message: "Reminder deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("💥 Error in deleteReminder:", error);

    if (error.name === "CastError") {
      console.log("❌ Invalid ObjectId in deleteReminder:", req.params.id);
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the reminder",
    });
  }
};


export { addReminder, getReminders, markReminderDoneToday , updateReminder , deleteReminder};
