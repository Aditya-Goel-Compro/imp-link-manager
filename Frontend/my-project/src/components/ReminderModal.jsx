// src/components/ReminderModal.jsx
import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const REPEAT_OPTIONS = [
  { value: "daily", label: "Every day" },
  { value: "weekday", label: "Weekdays (Mon–Fri)" },
  { value: "weekend", label: "Weekends (Sat–Sun)" },
];

export default function ReminderModal({
  isOpen,
  onClose,
  onSave,
  mode = "create",          // "create" | "edit"
  initialData = null,       // existing reminder when editing
}) {
  const [form, setForm] = useState({
    task: "",
    timeOfDay: "",          // "HH:MM"
    repeat: "daily",        // "daily" | "weekday" | "weekend"
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isEdit = mode === "edit";

  // Prefill on open
  useEffect(() => {
    if (!isOpen) return;

    if (isEdit && initialData) {
      setForm({
        task: initialData.task || "",
        timeOfDay: initialData.timeOfDay || "",
        repeat: initialData.repeat || "daily",
      });
    } else {
      // create mode
      setForm({
        task: "",
        timeOfDay: "",
        repeat: "daily",
      });
    }
    setErrors({});
    setLoading(false);
  }, [isOpen, isEdit, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.task.trim()) e.task = "Task is required";
    if (!form.timeOfDay.trim()) {
      e.timeOfDay = "Time is required";
    } else if (!/^\d{2}:\d{2}$/.test(form.timeOfDay)) {
      e.timeOfDay = "Time must be in HH:MM format";
    }
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }

    setLoading(true);
    try {
      await onSave(
        {
          task: form.task.trim(),
          timeOfDay: form.timeOfDay.trim(),
          repeat: form.repeat,
        },
        initialData || null
      );
      onClose();
    } catch (err) {
      console.error("💥 onSave reminder error:", err);
      setErrors((prev) => ({
        ...prev,
        submit: err.message || "Something went wrong",
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 relative"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>

            <h2 className="text-xl font-semibold mb-1">
              {isEdit ? "Edit Reminder" : "Set Daily Reminder"}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              You’ll be reminded around 30 minutes before the time (IST).
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Task */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="task"
                  value={form.task}
                  onChange={handleChange}
                  placeholder="Example: Standup update in Basecamp"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.task && (
                  <p className="text-xs text-red-500 mt-1">{errors.task}</p>
                )}
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time (IST) <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="timeOfDay"
                  value={form.timeOfDay}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.timeOfDay && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.timeOfDay}
                  </p>
                )}
              </div>

              {/* Repeat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repeat
                </label>
                <select
                  name="repeat"
                  value={form.repeat}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {REPEAT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  You can extend logic later to behave differently for weekday/weekend.
                  For now it’s stored and shown.
                </p>
              </div>

              {errors.submit && (
                <p className="text-xs text-red-500">{errors.submit}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-sm border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed shadow"
                >
                  {loading
                    ? "Saving..."
                    : isEdit
                    ? "Save changes"
                    : "Save reminder"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
