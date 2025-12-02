import { useState } from "react";
import { api } from "./api";

function MoneyManager() {
  const [previewData, setPreviewData] = useState([]);
  const [savedData, setSavedData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");
    setPreviewData([]);
    setLoadingUpload(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${api}/excel/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Upload failed:", res.status, text);
        throw new Error("Failed to upload file");
      }

      const json = await res.json();
      setPreviewData(json.extractedData || []);
    } catch (err) {
      console.error(err);
      setError("Failed to upload or parse Excel file.");
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleSaveToDB = async () => {
    if (!previewData.length) return;
    setLoadingSave(true);
    setError("");

    try {
      const res = await fetch(`${api}/excel/store`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: previewData }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Store failed:", res.status, text);
        throw new Error("Failed to store data");
      }

      const json = await res.json();
      alert(json.message || "Data stored successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to store data in database.");
    } finally {
      setLoadingSave(false);
    }
  };

  const handleFetchFromDB = async () => {
    setLoadingFetch(true);
    setError("");

    try {
      const res = await fetch(`${api}/excel/list`);
      if (!res.ok) {
        const text = await res.text();
        console.error("Fetch failed:", res.status, text);
        throw new Error("Failed to fetch data");
      }

      const json = await res.json();
      setSavedData(json.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data from database.");
    } finally {
      setLoadingFetch(false);
    }
  };

  const renderTable = (rows, title) => {
    if (!rows || !rows.length) return null;

    const cols = [
      "bankName",
      "amount",
      "startDate",
      "maturityDate",
      "interestRate",
      "monthlyInterest",
      "dateOfAdding",
      "maturityAmount",
      "reinvest",
      "appName",
      "taxSaver",
    ];

    return (
      <div className="mt-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">{title}</h2>
        <div className="overflow-auto max-h-[400px] border border-slate-200 rounded-xl">
          <table className="min-w-full text-md">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                {cols.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row._id || i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  {cols.map((col) => (
                    <td key={col} className="px-3 py-2 border-b border-slate-100 text-slate-700">
                      {formatCell(row[col], col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const formatCell = (value, col) => {
    if (!value && value !== 0) return "";
    if (col.toLowerCase().includes("date")) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString();
      }
    }
    return value;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <h1 className="text-3xl md:text-3xl font-semibold text-slate-800 mb-4">
          All Money Management – FD Tracker
        </h1>

        <p className="text-md text-slate-500 mb-6">
          Upload your FD Excel file, preview the data, save it to MongoDB, and fetch it back later.
        </p>

        {/* Upload Section */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-slate-700 font-medium mb-1">Upload Excel file</p>
            <p className="text-sm text-slate-500">
              Columns should match your FD sheet (Bank, Amount, Start Date, etc.).
            </p>
          </div>
          <label className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-900 text-white text-md font-medium cursor-pointer hover:bg-slate-800 transition">
            <span>Select file</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {fileName && (
          <div className="text-md text-slate-600 mb-3">
            <span className="font-semibold">Selected:</span> {fileName}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-md text-red-700">
            {error}
          </div>
        )}

        {loadingUpload && (
          <p className="text-md text-slate-600 mb-2">Uploading and parsing Excel...</p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <button
            onClick={handleSaveToDB}
            disabled={!previewData.length || loadingSave}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-md font-medium hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loadingSave ? "Saving..." : "Save preview to DB"}
          </button>

          <button
            onClick={handleFetchFromDB}
            disabled={loadingFetch}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-700 text-white text-md font-medium hover:bg-slate-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loadingFetch ? "Fetching..." : "Fetch data from DB"}
          </button>
        </div>

        {/* Preview Table */}
        {renderTable(previewData, "Preview from uploaded file")}

        {/* Saved Data Table */}
        {renderTable(savedData, "Data fetched from MongoDB")}
      </div>
    </div>
  );
}

export default MoneyManager;
