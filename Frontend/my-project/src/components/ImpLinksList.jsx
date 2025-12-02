// components/ImpLinksList.jsx
import React from "react";
import ImpLinkCard from "./ImpLinkCard";

export default function ImpLinksList({
  links,
  loading,
  error,
  onOpenLink,
  onEditLink,
  onDeleteLink,
}) {


  if (loading) {
    return (
      <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-400 text-md animate-pulse">
        Loading your links...
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 text-red-700 rounded-2xl p-4 text-md">
        {error}
      </div>
    );
  }

  if (!links || links.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-400 text-md">
        No links yet. Click{" "}
        <span className="font-medium text-indigo-500">Add Link</span> to
        create your first card.
      </div>
    );
  }

  // ⭐ Group links by category
  const grouped = links.reduce((acc, item) => {
    const cat = item.category?.trim() || "uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Sort category sections alphabetically
  const sortedCategories = Object.keys(grouped).sort((a, b) =>
    a.localeCompare(b)
  );

  const CATEGORY_ICONS = {
    "Basecamp": "/icons/basecamp.png",
    "Clockify": "/icons/clockify.png",
    "Google-sheet": "/icons/google-sheets.png",
    "Google Doc": "/icons/google-docs.png",
    "Yt-links": "/icons/youtube.png",
    "Insta-links": "/icons/instagram.png",
    "Learning": "/icons/learning.png",
    "Sprint": "/icons/sprint.png",
  };

  return (
    <div className="space-y-8">
      {sortedCategories.map((category) => (
        <div key={category}>
          {/* Section Title */}
          <div className="flex items-center gap-1  p-2 rounded-xl">
            {/* Icon */}
            {CATEGORY_ICONS[category] && (
              <img
                src={CATEGORY_ICONS[category]}
                alt={category}
                className="w-8 h-8 rounded-sm object-contain"
              />
            )}

            {/* Text + Count */}
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-700 capitalize">
                {category === "uncategorized"
                  ? "Other"
                  : category.split("-").join(" ")}
              </h3>

              <span className="text-sm text-slate-400">
                ({grouped[category].length})
              </span>
            </div>
          </div>


          {/* Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grouped[category].map((item) => (
              <ImpLinkCard
                key={item._id}
                item={item}
                onOpen={onOpenLink}
                onEdit={onEditLink}
                onDelete={onDeleteLink}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
