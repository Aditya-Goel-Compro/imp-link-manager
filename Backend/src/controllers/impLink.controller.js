// controllers/impLinks.controller.js
import { ImpLink } from "../models/impLinks.model.js"; // make sure .js if using ES modules

// POST /imp-links
const addImpLink = async (req, res) => {
  try {
    const { name, link, tags, description, category, type } = req.body;

    // 1) Basic required fields check
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!link || !link.trim()) {
      return res.status(400).json({
        success: false,
        message: "Link is required",
      });
    }

    // 2) type is required: "office" | "personal"
    if (!type || !String(type).trim()) {
      return res.status(400).json({
        success: false,
        message: "Type is required (office or personal)",
      });
    }

    const normalizedType = String(type).trim();

    if (!["office", "personal"].includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: "Type must be either 'office' or 'personal'",
      });
    }

    // 3) Validate URL format (simple check)
    try {
      new URL(link.trim());
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Link must be a valid URL",
      });
    }

    // 4) Normalize / validate tags
    let normalizedTags = [];

    if (Array.isArray(tags)) {
      normalizedTags = tags
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter((t) => t.length > 0);
    } else if (typeof tags === "string") {
      normalizedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }

    // 5) Prepare data for DB (category + type from frontend)
    const impLinkData = {
      name: name.trim(),
      link: link.trim(),
      category: category ? String(category).trim() : "",
      type: normalizedType, // ⭐ new
      tags: normalizedTags,
      description: description ? description.trim() : "",
    };

    // 6) Save to DB
    const createdImpLink = await ImpLink.create(impLinkData);

    return res.status(201).json({
      success: true,
      message: "Important link added successfully",
      data: createdImpLink,
    });
  } catch (error) {
    console.error("💥 Error in addImpLink:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while adding the link",
    });
  }
};

// GET /imp-links
// supports ?type=office or ?type=personal
const getImpLinks = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};

    if (type) {
      const normalizedType = String(type).trim();
      if (!["office", "personal"].includes(normalizedType)) {
        return res.status(400).json({
          success: false,
          message: "Query 'type' must be either 'office' or 'personal'",
        });
      }
      filter.type = normalizedType;
    }
    const links = await ImpLink.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: links,
    });
  } catch (error) {
    console.error("💥 Error in getImpLinks:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the links",
    });
  }
};

// PUT /imp-links/:id
const updateImpLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, link, tags, description, category, type } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    // name required
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    // link required
    if (!link || !link.trim()) {
      return res.status(400).json({
        success: false,
        message: "Link is required",
      });
    }

    // type required
    if (!type || !String(type).trim()) {
      return res.status(400).json({
        success: false,
        message: "Type is required (office or personal)",
      });
    }

    const normalizedType = String(type).trim();

    if (!["office", "personal"].includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: "Type must be either 'office' or 'personal'",
      });
    }

    // Validate URL format
    try {
      new URL(link.trim());
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Link must be a valid URL",
      });
    }

    // Normalize tags
    let normalizedTags = [];

    if (Array.isArray(tags)) {
      normalizedTags = tags
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter((t) => t.length > 0);
    } else if (typeof tags === "string") {
      normalizedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }

    const updateData = {
      name: name.trim(),
      link: link.trim(),
      category: category ? String(category).trim() : "",
      type: normalizedType, // ⭐ new
      tags: normalizedTags,
      description: description ? description.trim() : "",
    };

    const updatedImpLink = await ImpLink.findByIdAndUpdate(id, updateData, {
      new: true, // return updated doc
      runValidators: true, // respect schema validation
    });

    if (!updatedImpLink) {
      return res.status(404).json({
        success: false,
        message: "Link not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Important link updated successfully",
      data: updatedImpLink,
    });
  } catch (error) {
    console.error("💥 Error in updateImpLink:", error);

    // handle invalid ObjectId case
    if (error.name === "CastError") {
      console.log("❌ Invalid ObjectId in updateImpLink:", req.params.id);
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the link",
    });
  }
};

// DELETE /imp-links/:id
const deleteImpLink = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    const deletedImpLink = await ImpLink.findByIdAndDelete(id);

    if (!deletedImpLink) {
      return res.status(404).json({
        success: false,
        message: "Link not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Important link deleted successfully",
      data: deletedImpLink,
    });
  } catch (error) {
    console.error("💥 Error in deleteImpLink:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the link",
    });
  }
};

export { addImpLink, getImpLinks, updateImpLink, deleteImpLink };
