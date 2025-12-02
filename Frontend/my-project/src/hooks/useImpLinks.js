// hooks/useImpLinks.js
import { useCallback, useEffect, useState } from "react";
import { backendUrl } from "../constant";
const API_URL = `${backendUrl}/imp-links`;

export function useImpLinks(linkType) {
  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [linksError, setLinksError] = useState("");

  const fetchLinks = useCallback(async () => {
    setLoadingLinks(true);
    setLinksError("");

    try {
      const url = linkType
        ? `${API_URL}?type=${encodeURIComponent(linkType)}`
        : API_URL;

      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("❌ Error fetching links:", data);
        throw new Error(data?.message || "Failed to load links");
      }

      setLinks(data.data || []);
      console.log("✅ Links loaded:", data.data);
    } catch (err) {
      console.error("💥 fetchLinks error:", err);
      setLinksError(err.message || "Something went wrong while loading links");
    } finally {
      setLoadingLinks(false);
    }
  }, [linkType]);

  const addLink = useCallback(
    async (payload) => {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // payload already includes type
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("❌ API error:", data);
        throw new Error(data?.message || "Failed to add link");
      }

      console.log("✅ Link added:", data);

      if (data.data) {
        // only push if it's same type as current view (safety)
        if (!linkType || data.data.type === linkType) {
          setLinks((prev) => [data.data, ...prev]);
        }
      }

      return data.data;
    },
    [linkType]
  );

  const updateLink = useCallback(async (id, payload) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), // includes type
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("❌ API error (update):", data);
      throw new Error(data?.message || "Failed to update link");
    }

    if (data.data) {
      setLinks((prev) =>
        prev.map((link) => (link._id === id ? data.data : link))
      );
    }

    return data.data;
  }, []);

  const deleteLink = useCallback(async (id) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("❌ API error (delete):", data);
      throw new Error(data?.message || "Failed to delete link");
    }

    setLinks((prev) => prev.filter((link) => link._id !== id));
    return data.data;
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  return {
    links,
    loadingLinks,
    linksError,
    fetchLinks,
    addLink,
    updateLink,
    deleteLink,
  };
}
