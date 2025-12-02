import mongoose, { Schema } from "mongoose";

const impLinksSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },

    link: { type: String, required: true, trim: true },

    tags: { type: [String], default: [] },

    category: {
      type: String,
      trim: true,
      default: "",
    },

    description: { type: String, trim: true },

    // ⭐ NEW FIELD: office | personal
    type: {
      type: String,
      enum: ["office", "personal"],
      required: true,
    },
  },
  { timestamps: true }
);

// Virtual formatted date
impLinksSchema.virtual("createdTime").get(function () {
  if (!this.createdAt) return "";
  return this.createdAt.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

// Make virtuals visible in JSON
impLinksSchema.set("toJSON", { virtuals: true });
impLinksSchema.set("toObject", { virtuals: true });

export const ImpLink = mongoose.model("ImpLink", impLinksSchema);
