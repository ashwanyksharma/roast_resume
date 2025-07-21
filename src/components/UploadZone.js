import React, { useState } from "react";
import { supabase } from "../Supabase.js";

export default function UploadZone({ onRoastComplete }) {
  const [status, setStatus] = useState("idle");

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus("uploading");

    const fileName = `${crypto.randomUUID()}.${file.name.split(".").pop()}`;
    // 1. Upload to Storage
    const { error: uploadErr } = await supabase
      .storage.from("resumes")
      .upload(fileName, file, { upsert: false });
    if (uploadErr) return setStatus("error-upload");

    // 2. Insert into uploads
    const { data: uploadRow, error: insertErr } = await supabase
      .from("uploads")
      .insert({
        file_path: fileName,
        file_size: file.size,
      })
      .select("id")
      .single();
    if (insertErr) return setStatus("error-insert");

    setStatus("processing");

    // 3. Call Edge Function
    // const res = await fetch(process.env.REACT_APP_EDGE_FUNCTION_URL, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ upload_id: uploadRow.id }),
    //   apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
    //   Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
    // });
    // if (!res.ok) return setStatus("error-roast");
    // inside handleFile, instead of fetch(...)
    const { data, error } = await supabase
      .functions
      .invoke("roast_resume", {
        method: "POST",
        body: JSON.stringify({ upload_id: uploadRow.id }),
      });

    if (error) {
      console.error("Function error:", error);
      return setStatus("error-roast");
    }


    // 4. All done!
    setStatus("done");
    onRoastComplete(uploadRow.id);
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={handleFile}
        disabled={status !== "idle" && status !== "error-upload"}
      />
      <p>Status: {status}</p>
    </div>
  );
}
