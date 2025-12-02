// components/AddImpLinkModal.jsx
import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { backendUrl } from "../constant";

const DEFAULT_CATEGORIES = [
  "learning-docs",
  "coding-links",
  "insta-links",
  "yt-links",
];

const CATEGORIES_API_URL = `${backendUrl}/categories`;

export default function AddImpLinkModal({
  isOpen,
  onClose,
  onSubmit,
  mode = "create",       // "create" | "edit"
  initialData = null,    // link object when editing
  linkType,              // "office" | "personal" (comes from route / workspace)
}) {
  const [form, setForm] = useState({
    name: "",
    link: "",
    description: "",
    category: "",
  });

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const [categories, setCategories] = useState([]); // from backend
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Effective type = either the type from existing link (edit), or the one from route/prop
  const effectiveType = (initialData?.type || linkType || "").toLowerCase();

  const resetForm = () => {
    setForm({
      name: "",
      link: "",
      description: "",
      category: "",
    });
    setTags([]);
    setTagInput("");
    setNewCategoryInput("");
    setShowAddCategory(false);
    setErrors({});
    setSuccessMessage("");
  };

  // fetch categories from backend
  const fetchCategories = async () => {
    try {
      setCatLoading(true);
      const res = await fetch(CATEGORIES_API_URL);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("❌ Error fetching categories:", data);
        // fallback to defaults if backend fails
        setCategories(DEFAULT_CATEGORIES);
        return;
      }

      const namesFromDb = (data.data || []).map((c) => c.name);
      // merge db + defaults (avoid duplicates)
      const merged = Array.from(
        new Set([...namesFromDb, ...DEFAULT_CATEGORIES])
      ).sort((a, b) => a.localeCompare(b));

      setCategories(merged);
    } catch (err) {
      console.error("💥 fetchCategories error:", err);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setCatLoading(false);
    }
  };

  // Prefill when editing + ensure category exists in options
  useEffect(() => {
    if (!isOpen) return;

    // always fetch categories when opening
    fetchCategories();

    if (mode === "edit" && initialData) {
      setForm({
        name: initialData.name || "",
        link: initialData.link || "",
        description: initialData.description || "",
        category: initialData.category || "",
      });
      setTags(Array.isArray(initialData.tags) ? initialData.tags : []);
      setTagInput("");
      setErrors({});
      setSuccessMessage("");
    }

    if (mode === "create" && !initialData) {
      resetForm();
    }
  }, [isOpen, mode, initialData]);

  // after categories are loaded, if editing and category isn't in list, add it
  useEffect(() => {
    if (mode === "edit" && initialData?.category) {
      const cat = initialData.category;
      setCategories((prev) =>
        prev.includes(cat) ? prev : [...prev, cat].sort((a, b) => a.localeCompare(b))
      );
    }
  }, [mode, initialData, categories.length]); // categories.length to re-run after fetch

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!form.link.trim()) {
      newErrors.link = "Link is required";
    } else {
      try {
        new URL(form.link.trim());
      } catch (e) {
        newErrors.link = "Please enter a valid URL (https://...)";
      }
    }

    // type should be present (from route/prop), but we can guard
    if (!effectiveType || !["office", "personal"].includes(effectiveType)) {
      newErrors.type = "Invalid or missing type (office/personal)";
    }

    return newErrors;
  };

  const addTagFromInput = () => {
    const value = tagInput.trim();
    if (!value) return;
    if (tags.includes(value)) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, value]);
    setTagInput("");
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTagFromInput();
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleAddNewCategory = async () => {
    const value = newCategoryInput.trim();
    if (!value) return;

    try {
      // call backend to create category
      const res = await fetch(CATEGORIES_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        console.error("❌ Error adding category:", data);
        // optional: surface error in UI
        setErrors((prev) => ({
          ...prev,
          category: data?.message || "Failed to add category",
        }));
        return;
      }

      const createdName = data.data?.name || value;

      setCategories((prev) =>
        prev.includes(createdName)
          ? prev
          : [...prev, createdName].sort((a, b) => a.localeCompare(b))
      );

      setForm((prev) => ({
        ...prev,
        category: createdName,
      }));

      setNewCategoryInput("");
      setShowAddCategory(false);
      setErrors((prev) => {
        const { category, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error("💥 handleAddNewCategory error:", err);
      setErrors((prev) => ({
        ...prev,
        category: "Something went wrong while adding category",
      }));
    }
  };

  const handleNewCategoryKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddNewCategory();
    }
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    link: form.link.trim(),
    category: form.category.trim(),
    tags,
    description: form.description.trim(),
    type: effectiveType,   // ⭐ send type to backend (non-editable)
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const payload = buildPayload();

    try {
      await onSubmit(payload, initialData || null);

      setSuccessMessage(
        mode === "edit"
          ? "Link updated successfully!"
          : "Link added successfully!"
      );
      resetForm();
      onClose();
    } catch (err) {
      console.error("💥 Error submitting form:", err);
      setErrors((prev) => ({
        ...prev,
        submit: err.message || "Something went wrong",
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isEdit = mode === "edit";

  // prevent Enter from submitting the form except for tags + textarea + newCategory
  const handleFormKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.target.tagName === "TEXTAREA") return; // allow new line
      if (e.target.name === "tags") return; // handled in handleTagKeyDown
      if (e.target.name === "newCategory") return; // handled in handleNewCategoryKeyDown
      e.preventDefault(); // block submit on Enter
    }
  };

  const formatCategoryLabel = (cat) =>
    cat
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const formatTypeLabel = (t) =>
    t === "office" ? "Office" : t === "personal" ? "Personal" : t;

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
            className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 relative "
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
          >
            <button
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl"
              onClick={handleClose}
              type="button"
            >
              ×
            </button>

            <h2 className="text-xl font-semibold mb-1">
              {isEdit ? "Edit Link" : "Add Important Link"}
            </h2>

            {/* Read-only Type indicator */}
            {effectiveType && (
              <p className="text-sm text-gray-500 mb-2">
                Type:{" "}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {formatTypeLabel(effectiveType)}
                </span>
              </p>
            )}

            <p className="text-sm text-gray-500 mb-4">
              {isEdit
                ? "Update your saved learning link."
                : "Store your learning links with tags so you can search later."}
            </p>

            {errors.type && (
              <p className="text-sm text-red-500 mb-2">{errors.type}</p>
            )}

            <form
              onSubmit={handleSubmit}
              onKeyDown={handleFormKeyDown}
              className="space-y-4"
            >
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. AWS Docs Basics"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="link"
                  value={form.link}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.link && (
                  <p className="text-sm text-red-500 mt-1">{errors.link}</p>
                )}
              </div>

              {/* Category (select + add new) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>

                <div className="flex gap-2">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">
                      {catLoading ? "Loading categories..." : "Select a category"}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {formatCategoryLabel(cat)}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowAddCategory((prev) => !prev)}
                    className="px-3 py-2 rounded-xl text-sm font-medium border border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  >
                    + New
                  </button>
                </div>

                {showAddCategory && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      name="newCategory"
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      onKeyDown={handleNewCategoryKeyDown}
                      placeholder="New category (e.g. twitter-links)"
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      className="px-3 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow"
                    >
                      Add
                    </button>
                  </div>
                )}

                {errors.category && (
                  <p className="text-sm text-red-500 mt-1">{errors.category}</p>
                )}

                <p className="text-sm text-gray-400 mt-1">
                  Choose an existing category or create a new one.
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>

                <input
                  type="text"
                  name="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Type tag and press Enter"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />

                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                      >
                        #{tag}
                        <button
                          type="button"
                          className="text-[10px] text-indigo-500 hover:text-indigo-700"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-400 mt-1">
                  Type a tag and press <b>Enter</b>. Example: <b>aws</b>,{" "}
                  <b>google-docs</b>, <b>notes</b>
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Short note about this link..."
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>

              {errors.submit && (
                <p className="text-sm text-red-500">{errors.submit}</p>
              )}
              {successMessage && (
                <p className="text-sm text-green-600">{successMessage}</p>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-sm border border-gray-300 text-gray-700 hover:bg-gray-100"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed shadow"
                  disabled={loading}
                >
                  {loading
                    ? isEdit
                      ? "Saving..."
                      : "Saving..."
                    : isEdit
                    ? "Save Changes"
                    : "Add Link"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
