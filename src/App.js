import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./Supabase.js";
import UploadZone from "./components/UploadZone.js";

function App() {
  const [uploadId, setUploadId] = useState(null);
  const [roast, setRoast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [typingFinished, setTypingFinished] = useState(false);

  const words = ["Upload.", "Roast.", "Improve.", "Repeat."];
  const wordIndex = useRef(0);
  const charIndex = useRef(0);
  const isDeleting = useRef(false);

  useEffect(() => {
    let timeout;

    const type = () => {
      if (wordIndex.current >= words.length) {
        setTypedText("Upload. Roast. Improve. Repeat.");
        setTypingFinished(true);
        return;
      }

      const currentWord = words[wordIndex.current];
      const updatedText = isDeleting.current
        ? currentWord.substring(0, charIndex.current - 1)
        : currentWord.substring(0, charIndex.current + 1);

      setTypedText(updatedText);

      if (!isDeleting.current && updatedText === currentWord) {
        isDeleting.current = true;
        timeout = setTimeout(type, 500);
      } else if (isDeleting.current && updatedText === "") {
        isDeleting.current = false;
        wordIndex.current++;
        charIndex.current = 0;
        timeout = setTimeout(type, 200);
      } else {
        charIndex.current += isDeleting.current ? -1 : 1;
        timeout = setTimeout(type, isDeleting.current ? 20 : 45);
      }
    };

    type();
    return () => clearTimeout(timeout);
  }, []);

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
          setTimeout(() => setShowModal(true), 100);
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
          setTimeout(() => setShowModal(true), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [uploadId]);

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
        padding: "2rem 1rem",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.2rem",
            fontWeight: "600",
          }}
        >
          🔍 Processing roast… shanti rakhiye!
        </div>
      )}

      <div style={{ maxWidth: "800px", width: "100%", textAlign: "center" }}>
        <h4 style={{ textTransform: "uppercase", color: "#888", fontSize: "0.85rem" }}>
          Get ready to evaluate your resume
        </h4>
        <h4 style={{ textTransform: "uppercase", color: "#888", fontSize: "0.75rem" }}>
          This Is Gonna Hurt
        </h4>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "900",
            margin: "1rem 0",
            minHeight: "3rem",
            wordWrap: "break-word",
            transition: "all 0.3s ease",
          }}
        >
          <span style={{ borderRight: typingFinished ? "none" : "2px solid black", paddingRight: "4px" }}>
            {typedText}
          </span>
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
              transition: "transform 0.3s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <UploadZone onRoastComplete={(id) => setUploadId(id)} />
          </div>
        )}
      </div>

      {/* Footer - Moved above the modal */}
      <footer
        style={{
          marginTop: "17rem",
          textAlign: "center",
          color: "#777",
          fontSize: "0.85rem",
        }}
      >
        Developed by <strong>Ashwany</strong> • Took a lot of Sarcasm & Caffeine☕
      </footer>

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
          onClick={() => setShowModal(false)}
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
                  transition: "transform 0.3s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                Roast Another Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
