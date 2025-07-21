// src/App.js
import React, { useState, useEffect } from "react";
import { supabase } from "./Supabase.js";
import UploadZone from "./components/UploadZone.js";

function App() {
  const [uploadId, setUploadId] = useState(null);
  const [roast, setRoast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!uploadId) return;

    setLoading(true);

    supabase
      .from("analyses")
      .select("grammar,impact,formatting")
      .eq("upload_id", uploadId)
      .single()
      .then(({ data }) => {
        if (data) {
          setRoast(data);
          setLoading(false);
          setShowModal(true);
        }
      });

    const subscription = supabase
      .channel(`analyses:upload_id=eq.${uploadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "analyses",
          filter: `upload_id=eq.${uploadId}`,
        },
        ({ new: newRow }) => {
          setRoast({
            grammar: newRow.grammar,
            impact: newRow.impact,
            formatting: newRow.formatting,
          });
          setLoading(false);
          setShowModal(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [uploadId]);

  // Basic markdown to HTML (bold only)
  const renderWithMarkdown = (text) => {
    if (!text) return "";
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f7f7f7",
        padding: "2rem",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: "800px", textAlign: "center" }}>
        <h4 style={{ textTransform: "uppercase", color: "#888", fontSize: "0.875rem" }}>
          Get ready to evaluate your resume
        </h4>
        <h1 style={{ fontSize: "3rem", fontWeight: "900", margin: "1rem 0" }}>
          Upload. Roast. Improve. Repeat.
        </h1>
        <p style={{ fontSize: "1rem", color: "#555", marginBottom: "2rem" }}>
          Pro tip: One upload away from brutal honesty.
        </p>

        {!uploadId && (
          <div
            style={{
              border: "2px dashed #ccc",
              borderRadius: "10px",
              padding: "2rem",
              backgroundColor: "#fff",
            }}
          >
            <UploadZone
              onRoastComplete={(id) => {
                setUploadId(id);
              }}
            />
          </div>
        )}

        {loading && (
          <p style={{ marginTop: "2rem", fontWeight: "500", fontSize: "1.1rem" }}>
            🔍 Processing roast… shanti rakhiye!
          </p>
        )}
      </div>

      {/* Roast Modal */}
      {showModal && roast && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 9999,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1rem",
          }}
          onClick={() => {
            setShowModal(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              color: "#111",
              padding: "2rem",
              borderRadius: "12px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "1rem" }}>
              🧠 Grammar Gauntlet
            </h2>
            <p
              style={{ marginBottom: "1.5rem", lineHeight: "1.6" }}
              dangerouslySetInnerHTML={{ __html: renderWithMarkdown(roast.grammar) }}
            />

            <h2 style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "1rem" }}>
              💥 Impact Igniter
            </h2>
            <p
              style={{ marginBottom: "1.5rem", lineHeight: "1.6" }}
              dangerouslySetInnerHTML={{ __html: renderWithMarkdown(roast.impact) }}
            />

            <h2 style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "1rem" }}>
              🧾 Formatting Finesse
            </h2>
            <p
              style={{ marginBottom: "2rem", lineHeight: "1.6" }}
              dangerouslySetInnerHTML={{ __html: renderWithMarkdown(roast.formatting) }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setUploadId(null);
                  setRoast(null);
                  setShowModal(false);
                }}
                style={{
                  backgroundColor: "#111",
                  color: "#fff",
                  padding: "0.75rem 1.5rem",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Roast Another Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: "auto",
          textAlign: "center",
          color: "#777",
          fontSize: "0.85rem",
          paddingTop: "4rem",
        }}
      >
        Developed by <strong>Ashwany</strong> • Roast My Resume Project
      </footer>
    </div>
  );
}

export default App;
