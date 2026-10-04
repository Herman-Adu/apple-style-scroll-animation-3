"use server";

import React from "react";

export default function PreviewPage() {
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>MOMO Showcase Preview</h1>
      <p style={{ color: "#444", marginBottom: 16 }}>
        Minimal preview page showcasing core UI pieces and email demo data.
      </p>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18 }}>Email Templates Snapshot</h2>
        <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 6 }}>
          <p>Template gallery and quick preview rendered server-side.</p>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 18 }}>Orders / Checkout Snapshot</h2>
        <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 6 }}>
          <p>Order summary, stock indicators and low-stock warnings.</p>
        </div>
      </section>
    </div>
  );
}
