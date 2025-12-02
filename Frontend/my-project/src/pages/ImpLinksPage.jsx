// pages/ImpLinksPage.jsx
import React, { useState, useMemo, useEffect } from "react";
import AddImpLinkModal from "../components/AddImpLinkModal";
import ImpLinksList from "../components/ImpLinksList";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { useImpLinks } from "../hooks/useImpLinks";

export default function ImpLinksPage({ linkType }) {   // ⭐ get "office" | "personal" from parent
  // Map category → icon image
  const CATEGORY_ICONS = {
    "Basecamp": "/icons/basecamp.png",
    "Clockify": "/icons/clockify.png",
    "Google-sheet": "/icons/google-sheets.png",
    "Google Doc": "/icons/google-docs.png",
    "Yt-links": "/icons/youtube.png",
    "Insta-links": "/icons/instagram.png",
    "Learning": "/icons/learning.png",
    "Sprint": "/icons/sprint.png",
    // add more as needed…
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [selectedLink, setSelectedLink] = useState(null);

  // delete + undo
  const [hiddenIds, setHiddenIds] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [undoTimer, setUndoTimer] = useState(null);

  // delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState(null);

  // search + filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(""); // "" = all

  const [toast, setToast] = useState(null);


  // ⭐ pass type into hook so it fetches /imp-links?type=office or personal
  const { links, loadingLinks, linksError, addLink, updateLink, deleteLink } =
    useImpLinks(linkType);

  // visible (not soft-deleted)
  const visibleLinks = useMemo(
    () => links.filter((l) => !hiddenIds.includes(l._id)),
    [links, hiddenIds]
  );

  // all categories present in links (from backend)
  const allCategories = useMemo(() => {
    const set = new Set();
    links.forEach((item) => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [links]);

  // tags only for selected category (or for all if no category selected)
  const tagsForSelectedCategory = useMemo(() => {
    const set = new Set();

    visibleLinks.forEach((item) => {
      if (selectedCategory && item.category !== selectedCategory) return;
      (item.tags || []).forEach((t) => set.add(t));
    });

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [visibleLinks, selectedCategory]);

  // main filtered list
  const filteredLinks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return visibleLinks.filter((item) => {
      // category filter
      if (selectedCategory && item.category !== selectedCategory) {
        return false;
      }

      // search
      const text =
        `${item.name || ""} ${item.description || ""} ${(item.tags || []).join(
          " "
        )}`.toLowerCase();
      const matchesSearch = term ? text.includes(term) : true;

      // tags
      const matchesTags =
        selectedTags.length === 0
          ? true
          : selectedTags.every((tag) => item.tags?.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [visibleLinks, searchTerm, selectedTags, selectedCategory]);

  const handleOpenLink = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleAddClick = () => {
    setSelectedLink(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleEditLink = (item) => {
    setSelectedLink(item);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleSubmitLink = async (payload, existing) => {
    if (modalMode === "edit" && existing?._id) {
      await updateLink(existing._id, payload);

      setToast({
        type: "success",
        message: "Link updated successfully!",
      });

    } else {
      await addLink(payload);

      setToast({
        type: "success",
        message: "New link added 🎉",
      });
    }
  };


  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLink(null);
    setModalMode("create");
  };

  // tag filter click
  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearTagFilters = () => setSelectedTags([]);

  // category filter click
  const toggleCategory = (cat) => {
    setSelectedCategory((prev) => (prev === cat ? "" : cat));
    setSelectedTags([]); // reset tags when changing category
  };

  // delete flow
  const handleDeleteLink = (item) => {
    setLinkToDelete(item);
    setDeleteModalOpen(true);
  };

  const cancelDeleteModal = () => {
    setDeleteModalOpen(false);
    setLinkToDelete(null);
  };

  const confirmDelete = () => {
    const item = linkToDelete;
    if (!item) return;

    setDeleteModalOpen(false);
    setLinkToDelete(null);

    // soft hide from UI
    setHiddenIds((prev) => [...prev, item._id]);
    setPendingDelete(item);

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(async () => {
      try {
        await deleteLink(item._id); // final delete to backend
      } catch (err) {
        // on error, restore
        setHiddenIds((prev) => prev.filter((id) => id !== item._id));
        console.error(err);
      } finally {
        setPendingDelete(null);
        setUndoTimer(null);
      }
    }, 3000); // 3s

    setUndoTimer(timer);
  };

  const handleUndoDelete = () => {
    if (!pendingDelete) return;
    if (undoTimer) clearTimeout(undoTimer);

    setHiddenIds((prev) => prev.filter((id) => id !== pendingDelete._id));
    setPendingDelete(null);
    setUndoTimer(null);
  };

  const formatCategoryLabel = (cat) =>
    cat
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");


  function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      {/* Full-page blurred backdrop */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-xs"></div>

      {/* Toast message */}
      <div
        className={`
          relative top-[20vh]
          px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium
          animate-slide-in flex items-center gap-2
          border border-white/40
          ${toast.type === "success" ? "text-white bg-emerald-500" : ""}
          ${toast.type === "error" ? "text-white bg-red-500" : ""}
        `}
      >
        {/* Icon */}
        {toast.type === "success" && <span className="text-lg">✔️</span>}
        {toast.type === "error" && <span className="text-lg">⚠️</span>}

        {/* Message */}
        {toast.message}
      </div>
    </div>
  );
}



  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);


  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-5xl w-full px-4 py-10 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Links</h1>
            <p className="text-md text-gray-500">
              All your important learning URLs as cards.
            </p>
          </div>

          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-md font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-md active:scale-95 transition-transform"
          >
            <span className="text-xl leading-none">＋</span>
            Add Link
          </button>
        </div>

        {/* Search + Category + Tag filters */}
        <div className="mb-6 space-y-3">
          {/* Search box */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, description, or tags..."
            className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />

          <h1>All categories :- </h1>

          {/* Category chips */}
          {allCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allCategories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm border transition shadow-sm ${isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-600"
                      : "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100"
                      }`}
                  >
                    {/* Icon (if exists) */}


                    <span className="flex items-center gap-1">
                      {/* Icon (if exists) */}
                      {CATEGORY_ICONS[cat] && (
                        <img
                          src={CATEGORY_ICONS[cat]}
                          alt={cat}
                          className="w-4 h-4 rounded-sm object-contain"
                        />
                      )}

                      {formatCategoryLabel(cat)}
                    </span>
                  </button>
                );
              })}

              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("");
                    setSelectedTags([]);
                  }}
                  className="px-3 py-1 rounded-full text-sm border border-red-300 text-red-400 font-medium hover:bg-red-500 hover:text-white hover:font-medium hover:border-red-500 "
                >
                  Clear category
                </button>
              )}
            </div>
          )}

          <h1>All tags :- </h1>
          {/* Tag chips */}
          {tagsForSelectedCategory.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tagsForSelectedCategory.map((tag) => {
                const isActive = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm border transition shadow-sm ${isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-600"
                      : "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100"
                      }`}
                  >
                    #{tag}
                  </button>
                );
              })}

              {selectedTags.length > 0 && (
                <button
                  type="button"
                  onClick={clearTagFilters}
                  className="px-3 py-1 rounded-full text-sm border border-red-300 text-red-400  hover:bg--100 hover:text-white hover:border-red-500 hover:font-medium font-medium hover:bg-red-500"
                >
                  Clear tags
                </button>
              )}
            </div>
          )}
        </div>

        {/* List */}
        <ImpLinksList
          links={filteredLinks}
          loading={loadingLinks}
          error={linksError}
          onOpenLink={handleOpenLink}
          onEditLink={handleEditLink}
          onDeleteLink={handleDeleteLink}
        />

        {/* Add / Edit modal */}
        <AddImpLinkModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitLink}
          mode={modalMode}
          initialData={selectedLink}
          linkType={linkType}      // ⭐ pass type down to modal
        />

        {/* Delete confirmation modal */}
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={cancelDeleteModal}
          onConfirm={confirmDelete}
          itemName={linkToDelete?.name}
        />

        <Toast toast={toast} />

        {/* Undo toast */}
        {pendingDelete && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-md px-4 py-2 rounded-full shadow-lg flex items-center gap-3">
            <span>Link deleted.</span>
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={handleUndoDelete}
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
