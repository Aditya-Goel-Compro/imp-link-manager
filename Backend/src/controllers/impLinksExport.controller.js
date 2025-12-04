// controllers/impLinksExport.controller.js
import ExcelJS from "exceljs";
import { ImpLink } from "../models/impLinks.model.js";

const exportImpLinksExcel = async (req, res) => {
  console.log("📤 exportImpLinksExcel called");

  try {
    // Fetch all links
    const allLinks = await ImpLink.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${allLinks.length} links for export`);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ImpLinks Tool";
    workbook.created = new Date();

    // Helper: create a sheet with headers
    const createSheet = (name) => {
      const sheet = workbook.addWorksheet(name);
      sheet.columns = [
        { header: "Title of card", key: "title", width: 40 },
        { header: "Link",          key: "link",  width: 50 },
        { header: "Category",      key: "category", width: 20 },
        { header: "Tags",          key: "tags",  width: 30 },
        { header: "Description",   key: "description", width: 40 },
        { header: "Created At",    key: "createdAt", width: 22 },
      ];

      // Make header bold
      sheet.getRow(1).font = { bold: true };
      return sheet;
    };

    const officeSheet = createSheet("Office");
    const personalSheet = createSheet("Personal");

    // Helper to format date in IST-like readable way
    const formatDate = (date) => {
      if (!date) return "";
      return new Date(date).toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    // Fill data
    allLinks.forEach((linkDoc) => {
      const rowData = {
        title: linkDoc.name || "",
        link: linkDoc.link || "",
        category: linkDoc.category || "",
        tags: Array.isArray(linkDoc.tags) ? linkDoc.tags.join(", ") : "",
        description: linkDoc.description || "",
        createdAt: formatDate(linkDoc.createdAt),
      };

      // Decide sheet by type (default → Personal if missing)
      const type = linkDoc.type || "personal";
      if (type === "office") {
        officeSheet.addRow(rowData);
      } else {
        personalSheet.addRow(rowData);
      }
    });

    // Generate as buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set headers for download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="imp-links.xlsx"');

    console.log("📦 Sending Excel file to client");
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("💥 Error in exportImpLinksExcel:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while exporting links to Excel",
    });
  }
};

export { exportImpLinksExcel };
