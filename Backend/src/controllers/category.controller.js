// controllers/category.controller.js
import { Category } from "../models/category.model.js";

// GET /categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("💥 Error in getCategories:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching categories",
    });
  }
};

// POST /categories
const addCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const trimmedName = name.trim();

    // check if already exists
    const existing = await Category.findOne({ name: trimmedName });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Category already exists",
        data: existing,
      });
    }

    const createdCategory = await Category.create({ name: trimmedName });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: createdCategory,
    });
  } catch (error) {
    console.error("💥 Error in addCategory:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating category",
    });
  }
};

export { getCategories, addCategory };
