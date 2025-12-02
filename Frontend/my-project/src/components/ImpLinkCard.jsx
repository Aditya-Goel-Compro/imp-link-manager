// components/ImpLinkCard.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";

export default function ImpLinkCard({ item, onOpen, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);

  const handleOpen = () => {
    if (!item?.link) return;
    onOpen?.(item.link);
  };

  const handleCopy = async () => {
    if (!item?.link) return;

    try {
      await navigator.clipboard.writeText(item.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // Format category like: "learning-docs" -> "Learning Docs"
  const formatCategory = (cat) => {
    if (!cat) return "";
    return cat
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const formatType = (type) => {
    if (!type) return "";
    const t = String(type).toLowerCase();
    if (t === "office") return "Office";
    if (t === "personal") return "Personal";
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

  const categoryLabel = formatCategory(item.category);
  const typeLabel = formatType(item.type);

  const typeBadgeClasses =
    item.type === "office"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : item.type === "personal"
        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <motion.div
      className="
  group relative bg-white rounded-2xl border border-slate-200 p-4 
  flex flex-col justify-between shadow-lg hover:shadow-[0px_4px_16px_rgba(17,17,26,0.1),_0px_8px_24px_rgba(17,17,26,0.1),_0px_16px_56px_rgba(17,17,26,0.1)] hover:border-indigo-200 transition-all duration-200 hover:-translate-y-0.5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Top badges row */}
      {(typeLabel || categoryLabel) && (
        <div className="mb-2 flex items-center justify-between gap-2 text-[10px]">
          {/* Type (left) */}
          {typeLabel && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium border ${typeBadgeClasses} animate-border-blink`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-blink" />
              {typeLabel}
            </span>
          )}

          {/* Category (right) */}
          {categoryLabel && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-slate-50 text-slate-700 border border-slate-200  ">
              {categoryLabel}
            </span>
          )}
        </div>
      )}

      <div className="flex justify-between gap-2 items-start">
        {/* Left side: Title + Copy */}
        <div className="flex-1 flex gap-2 items-start">
          <button
            className="text-md font-semibold hover:underline text-left line-clamp-2 bg-yellow-200 text-black p-2 border-0 rounded-2xl"
            onClick={handleOpen}
            title={item.link}
          >
            {item.name}
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="mt-0.5 text-gray-400 hover:text-indigo-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy Link"
          >
            <i className="fa-solid fa-copy"></i>
          </button>

          {/* Copied Feedback */}
          {copied && (
            <span className="text-[10px] text-green-600 ml-1">
              Copied!
            </span>
          )}
        </div>

        {/* Edit + Delete Buttons */}
        <div className="flex flex-row items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            className="text-gray-400 hover:text-indigo-600 text-sm"
            onClick={() => onEdit?.(item)}
            title="Edit"
          >
            <i className="fa-solid fa-pencil"></i>
          </button>

          <button
            type="button"
            className="text-red-500 hover:text-red-700 text-sm"
            onClick={() => onDelete?.(item)}
            title="Delete"
          >
            <i className="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="mt-2 text-sm text-gray-600">
          {item.description}
        </p>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer Date */}
      {item.createdAt && (
        <p className="mt-3 text-[10px] text-gray-400">
          Added:{" "}
          {new Date(item.createdAt).toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </p>
      )}
    </motion.div>
  );
}
