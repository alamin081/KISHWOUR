"use client";

/** Last-resort error boundary for failures in the root layout itself. */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          background: "#f8f6f0",
          color: "#292b25",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          textAlign: "center",
        }}
      >
        <title>Something went wrong | Kishwour</title>
        <div>
          <h1>Something went wrong</h1>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              background: "#176b43",
              color: "#f8f6f0",
              border: 0,
              borderRadius: 8,
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
