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
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  const bgColor = isDarkMode ? "#121212" : "#f7f7f7";
  const textColor = isDarkMode ? "#f5f5f5" : "#111";
  const secondaryColor = isDarkMode ? "#aaa" : "#555";
  const cardBg = isDarkMode ? "#1e1e1e" : "#fff";
  const modalBg = isDarkMode ? "#1b1f29" : "#f0f6ff";
  const borderColor = isDarkMode ? "#3399ff" : "navy";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: bgColor,
        color: textColor,
        padding: "2rem 1rem",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <style>
        {`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          input[type="file"] {
            border: none !important;
            outline: none !important;
            background: transparent;
            color: inherit;
          }
          input[type="file"]::file-selector-button {
            background: ${isDarkMode ? "#333" : "#eee"};
            color: ${isDarkMode ? "#fff" : "#000"};
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
          }
          input[type="file"]::file-selector-button:focus {
            outline: none;
          }
        `}
      </style>

      {/* Dark Mode Toggle */}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <button
          onClick={() => setIsDarkMode((prev) => !prev)}
          style={{
            backgroundColor: isDarkMode ? "#2c2c2c" : "#e0e0e0",
            color: isDarkMode ? "#fff" : "#000",
            border: "none",
            padding: "0.5rem 0.9rem",
            fontSize: window.innerWidth < 500 ? "1.2rem" : "1rem",
            borderRadius: "9999px",
            fontWeight: 600,
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {isDarkMode ? "☀️" : "🌙"}
          <span style={{ display: window.innerWidth < 500 ? "none" : "inline" }}>
            {isDarkMode ? "Light" : "Dark"}
          </span>
        </button>
      </div>

      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: isDarkMode ? "rgba(18,18,18,0.85)" : "rgba(255,255,255,0.85)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.2rem",
            fontWeight: "600",
            color: textColor,
          }}
        >
          🔍 Processing roast… shanti rakhiye!
        </div>
      )}

      <div style={{ maxWidth: "800px", width: "100%", textAlign: "center" }}>
        <h4 style={{ textTransform: "uppercase", color: "#000080", fontSize: "0.85rem" }}>
          Get ready to evaluate your resume
        </h4>
        <h4
          style={{
            textTransform: "uppercase",
            color: isDarkMode ? "#bbb" : "#888",
            fontSize: "0.75rem",
            textDecoration: "underline",
          }}
        >
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
          <span style={{ borderRight: typingFinished ? "none" : `2px solid ${textColor}`, paddingRight: "4px" }}>
            {typedText}
          </span>
        </h1>
        <p style={{ fontSize: "1rem", color: secondaryColor, marginBottom: "2rem" }}>
          Pro tip: One upload away from brutal honesty.
        </p>

        {!uploadId && (
          <div
            style={{
              border: `2px dashed ${borderColor}`,
              borderRadius: "10px",
              padding: "2rem",
              backgroundColor: cardBg,
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

      <footer
        style={{
          marginTop: "18rem",
          textAlign: "center",
          color: secondaryColor,
          fontSize: "0.85rem",
        }}
      >
        Developed by <strong>Ashwany Kumar Sharma</strong> • Took a lot of Sarcasm & Caffeine☕
      </footer>

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
              backgroundColor: modalBg,
              color: textColor,
              padding: "2rem",
              borderRadius: "12px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              border: `3px solid ${borderColor}`,
              transition: "all 0.3s ease-in-out",
            }}
          >
            <h2 style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "1rem" }}>🧠 Grammar Gauntlet</h2>
            <p
              style={{ marginBottom: "1.5rem", lineHeight: "1.6" }}
              dangerouslySetInnerHTML={{ __html: renderWithMarkdown(roast.grammar) }}
            />
            <h2 style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "1rem" }}>💥 Impact Igniter</h2>
            <p
              style={{ marginBottom: "1.5rem", lineHeight: "1.6" }}
              dangerouslySetInnerHTML={{ __html: renderWithMarkdown(roast.impact) }}
            />
            <h2 style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "1rem" }}>🧾 Formatting Finesse</h2>
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
                  backgroundColor: isDarkMode ? "#fff" : "#111",
                  color: isDarkMode ? "#000" : "#fff",
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
