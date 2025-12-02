import { useState } from "react";
import { api } from "./api";

function ExcelUpload() {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");
    setLoading(true);
    setData([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${api}/excel/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload file");
      }

      const json = await res.json();
      setData(json.extractedData || []);
    } catch (err) {
      console.error(err);
      setError("Error uploading or processing file.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!data.length) return;

    setFinalizing(true);
    setError("");

    try {
      const res = await fetch(`${api}/excel/store`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data }),
      });

      if (!res.ok) {
        throw new Error("Failed to store data");
      }

      const json = await res.json();
      alert(json.message || "Data stored successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to store data.");
    } finally {
      setFinalizing(false);
    }
  };

  const hasData = data && data.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <h1 className="text-3xl md:text-3xl font-semibold text-slate-800 mb-4">
          Excel Upload & Preview
        </h1>

        <p className="text-md text-slate-500 mb-6">
          Upload an <span className="font-semibold">.xlsx</span> or{" "}
          <span className="font-semibold">.xls</span> file. The data will be parsed on the backend
          and shown in the table below.
        </p>

        {/* Upload area */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-slate-700 font-medium mb-1">
              Choose an Excel file
            </p>
            <p className="text-sm text-slate-500">
              Maximum size depends on your server settings.
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

        {/* Selected file info */}
        {fileName && (
          <div className="mb-4 text-md text-slate-600">
            <span className="font-semibold">Selected:</span> {fileName}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-md text-red-700">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="mb-4 text-md text-slate-600">
            Processing file, please wait...
          </div>
        )}

        {/* Table */}
        {hasData && !loading && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-slate-800">
                Preview ({data.length} rows)
              </h2>

              <button
                onClick={handleFinalize}
                disabled={finalizing}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-md font-medium hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {finalizing ? "Saving..." : "Finalize & Store"}
              </button>
            </div>

            <div className="overflow-auto max-h-[400px] border border-slate-200 rounded-xl">
              <table className="min-w-full text-md">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    {Object.keys(data[0]).map((col) => (
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
                  {data.map((row, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      {Object.keys(data[0]).map((key) => (
                        <td
                          key={key}
                          className="px-3 py-2 border-b border-slate-100 text-slate-700"
                        >
                          {String(row[key] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!hasData && !loading && (
          <p className="text-md text-slate-500 mt-2">
            No data yet. Upload an Excel file to see a preview here.
          </p>
        )}
      </div>
    </div>
  );
}

export default ExcelUpload;
