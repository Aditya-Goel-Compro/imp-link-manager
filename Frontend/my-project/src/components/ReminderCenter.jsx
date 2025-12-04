// src/components/ReminderCenter.jsx
import React, { useEffect, useState, useMemo } from "react";
import ReminderModal from "./ReminderModal";
import DeleteConfirmModal from "./DeleteConfirmModal"; // 👈 reuse existing modal
import { useReminders } from "../hooks/useReminders";

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function shouldNotifyReminder(reminder) {
  if (!reminder.timeOfDay) return false;
  const [hh, mm] = reminder.timeOfDay.split(":").map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return false;

  const now = new Date();
  const target = new Date();
  target.setHours(hh, mm, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  if (diffMs < 0 || diffMs > 30 * 60 * 1000) return false;

  if (reminder.lastDoneDate) {
    const doneDate = new Date(reminder.lastDoneDate);
    if (isSameDay(doneDate, now)) return false;
  }

  return true;
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeStr;

  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ReminderCenter({ workspace, showToast }) {
  const {
    reminders,
    loading,
    error,
    addReminder,
    updateReminder,
    markDoneToday,
    deleteReminder, // 👈 new from hook
  } = useReminders(workspace);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingReminder, setEditingReminder] = useState(null);

  const [activeReminder, setActiveReminder] = useState(null);
  const [alreadyNotifiedIds, setAlreadyNotifiedIds] = useState([]);

  // ⭐ delete with undo state
  const [hiddenReminderIds, setHiddenReminderIds] = useState([]);
  const [pendingDeleteReminder, setPendingDeleteReminder] = useState(null);
  const [deleteUndoTimer, setDeleteUndoTimer] = useState(null);

  // delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState(null);

  const today = new Date();

  // exclude hidden reminders (soft-deleted)
  const activeReminders = useMemo(
    () =>
      reminders.filter(
        (r) => r.isActive !== false && !hiddenReminderIds.includes(r._id)
      ),
    [reminders, hiddenReminderIds]
  );

  const todaysReminders = useMemo(
    () =>
      activeReminders.map((r) => {
        const doneToday =
          r.lastDoneDate && isSameDay(new Date(r.lastDoneDate), today);
        return { ...r, doneToday };
      }),
    [activeReminders, today]
  );

  // watcher for upcoming reminder times
  useEffect(() => {
    if (!activeReminders.length) return;

    const check = () => {
      activeReminders.forEach((r) => {
        if (alreadyNotifiedIds.includes(r._id)) return;
        if (!shouldNotifyReminder(r)) return;

        setActiveReminder(r);
        setAlreadyNotifiedIds((prev) => [...prev, r._id]);

        showToast?.({
          type: "success",
          message: `Reminder: ${r.task}`,
        });
      });
    };

    check();
    const id = setInterval(check, 60 * 1000);
    return () => clearInterval(id);
  }, [activeReminders, alreadyNotifiedIds, showToast]);

  // create / edit save
  const handleSaveReminder = async (form, existing) => {
    if (existing && existing._id) {
      await updateReminder(existing._id, {
        task: form.task,
        timeOfDay: form.timeOfDay,
        repeat: form.repeat,
        isActive: true,
      });
      showToast?.({
        type: "success",
        message: "Reminder updated!",
      });
    } else {
      await addReminder({
        task: form.task,
        timeOfDay: form.timeOfDay,
        repeat: form.repeat,
        isActive: true,
      });
      showToast?.({
        type: "success",
        message: "Reminder saved!",
      });
    }
    setEditingReminder(null);
    setModalMode("create");
  };

  const handleMarkDoneToday = async (reminderId, fromPopup = false) => {
    await markDoneToday(reminderId);
    showToast?.({
      type: "success",
      message: "Nice! Marked as done for today.",
    });
    if (fromPopup) setActiveReminder(null);
  };

  const handleSkip = () => setActiveReminder(null);

  const openCreateModal = () => {
    setEditingReminder(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const openEditModal = (rem) => {
    setEditingReminder(rem);
    setModalMode("edit");
    setModalOpen(true);
  };

  // ⭐ delete flow: open confirm modal
  const openDeleteModalForReminder = (rem) => {
    setReminderToDelete(rem);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setReminderToDelete(null);
  };

  // ⭐ confirm delete → soft hide + undo + hard delete after 3s
  const handleConfirmDeleteReminder = () => {
    const rem = reminderToDelete;
    if (!rem) return;

    closeDeleteModal();

    // soft hide
    setHiddenReminderIds((prev) => [...prev, rem._id]);
    setPendingDeleteReminder(rem);

    if (deleteUndoTimer) clearTimeout(deleteUndoTimer);

    const timer = setTimeout(async () => {
      try {
        await deleteReminder(rem._id);
        showToast?.({
          type: "success",
          message: "Reminder deleted.",
        });
      } catch (err) {
        // restore on error
        console.error("💥 deleteReminder error:", err);
        setHiddenReminderIds((prev) =>
          prev.filter((id) => id !== rem._id)
        );
        showToast?.({
          type: "error",
          message: err.message || "Failed to delete reminder",
        });
      } finally {
        setPendingDeleteReminder(null);
        setDeleteUndoTimer(null);
      }
    }, 3000); // 3s delay before backend delete

    setDeleteUndoTimer(timer);
  };

  // ⭐ undo delete
  const handleUndoDeleteReminder = () => {
    if (!pendingDeleteReminder) return;
    if (deleteUndoTimer) clearTimeout(deleteUndoTimer);

    setHiddenReminderIds((prev) =>
      prev.filter((id) => id !== pendingDeleteReminder._id)
    );
    setPendingDeleteReminder(null);
    setDeleteUndoTimer(null);
  };

  return (
    <>
      {/* Button under navbar */}
      <div className="w-full flex justify-center mt-4 mb-4">
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 shadow-sm active:scale-95 transition"
        >
          <i className="fa-regular fa-bell"></i>
          Set daily reminder
        </button>
      </div>

      {/* Today’s reminders list */}
      <div className="w-full max-w-5xl mx-auto mb-4">
        <div className="bg-white/70 border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">
                Today&apos;s reminders
              </span>
              <span className="text-[11px] text-slate-400">
                (IST · repeats daily)
              </span>
            </div>
            {loading && (
              <span className="text-[11px] text-slate-400 animate-pulse">
                Loading…
              </span>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500 mb-1">
              {error}
            </p>
          )}

          {(!todaysReminders || todaysReminders.length === 0) &&
            !loading &&
            !error && (
              <p className="text-xs text-slate-400">
                No reminders yet. Click{" "}
                <span className="font-medium">Set daily reminder</span> to add one.
              </p>
            )}

          {todaysReminders.length > 0 && (
            <div className="space-y-2">
              {todaysReminders.map((r) => (
                <div
                  key={r._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">
                        {r.task}
                      </span>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => openEditModal(r)}
                        className="text-[11px] text-slate-500 hover:text-indigo-600 underline underline-offset-2"
                      >
                        <i class="fa-solid fa-pen"></i>
                      </button>

                      {/* ⭐ Delete */}
                      <button
                        type="button"
                        onClick={() => openDeleteModalForReminder(r)}
                        className="text-[11px] text-red-500 hover:text-red-600 underline underline-offset-2"
                      >
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>⏰ {formatTime(r.timeOfDay)}</span>
                      {r.repeat && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                          {r.repeat === "daily"
                            ? "Daily"
                            : r.repeat === "weekday"
                            ? "Weekdays"
                            : r.repeat === "weekend"
                            ? "Weekends"
                            : r.repeat}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          r.doneToday
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}
                      >
                        {r.doneToday ? "Done today" : "Pending today"}
                      </span>
                    </span>
                  </div>

                  {!r.doneToday && (
                    <button
                      type="button"
                      onClick={() => handleMarkDoneToday(r._id, false)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-medium bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                    >
                      Mark done
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Reminder modal */}
      <ReminderModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingReminder(null);
          setModalMode("create");
        }}
        onSave={handleSaveReminder}
        mode={modalMode}
        initialData={editingReminder}
      />

      {/* ⭐ Delete confirmation modal (reused) */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDeleteReminder}
        itemName={reminderToDelete?.task}
        itemType="reminder"   // 👈 this changes the text
      />

     {/* Small inline popup when time is near (with backdrop) */}
{activeReminder && (
  <div className="fixed inset-0 z-40 flex items-center justify-center">
    {/* Backdrop */}
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

    {/* Popup */}
    <div className="relative px-5 py-4 rounded-2xl shadow-2xl bg-white border border-slate-200 w-[90vw] max-w-md">
      <h3 className="text-sm font-semibold text-slate-800 mb-1">
        Time for: {activeReminder.task}
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        Did you complete this task today?
      </p>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handleSkip}
          className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 text-slate-600 hover:bg-slate-100"
        >
          Not yet
        </button>
        <button
          type="button"
          onClick={() =>
            handleMarkDoneToday(activeReminder._id, true)
          }
          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
        >
          Mark Done
        </button>
      </div>
    </div>
  </div>
)}


      {/* ⭐ Undo pill for delete */}
      {pendingDeleteReminder && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="bg-slate-900 text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-3">
            <span>Reminder deleted.</span>
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={handleUndoDeleteReminder}
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </>
  );
}
