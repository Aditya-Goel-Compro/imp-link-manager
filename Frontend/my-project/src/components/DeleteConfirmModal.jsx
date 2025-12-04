// components/DeleteConfirmModal.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemName = "this item",
  itemType = "link", // 👈 "link" | "reminder"
}) {
  const isReminder = itemType === "reminder";

  const title = isReminder ? "Delete Reminder?" : "Delete Link?";
  const noun = isReminder ? "reminder" : "item";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 relative"
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {title}
            </h2>

            <p className="text-md text-gray-600 mb-6">
              Are you sure you want to delete this {noun}
              <span className="font-medium"> "{itemName}"</span>?{" "}
              You can undo this for the next 3 seconds.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-md border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-xl text-md font-medium text-white bg-red-600 hover:bg-red-700 shadow"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
