import React from "react";
import { toast, type ToastOptions } from "react-toastify";

export interface RichToastContent {
  title: string;
  description?: string;
  link?: { href: string; label: string };
  image?: string;
}

type ToastInput = string | RichToastContent;

function ToastBody({ content }: { content: ToastInput }) {
  if (typeof content === "string") return <span>{content}</span>;

  const { title, description, link } = content;

  return (
    <div style={{ fontFamily: "monospace", lineHeight: 1.5 }}>
      <p
        style={{
          fontWeight: 700,
          fontSize: "0.8rem",
          margin: 0,
          marginBottom: description || link ? "3px" : 0,
          letterSpacing: "0.02em",
        }}
      >
        {title}
      </p>
      {description && (
        <p
          style={{
            margin: 0,
            fontSize: "0.72rem",
            opacity: 0.75,
            marginBottom: link ? "5px" : 0,
          }}
        >
          {description}
        </p>
      )}
      {link && (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            fontSize: "0.72rem",
            color: "#00e5ff",
            // textDecoration: "underline",
            // textUnderlineOffset: "2px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {link.label}
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      )}
    </div>
  );
}

const base: ToastOptions = {
  position: "bottom-left",
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  pauseOnFocusLoss: false,
  draggable: true,
  autoClose: 5000,
};

function iconFor(content: ToastInput) {
  if (typeof content === "string" || !content.image) return undefined;
  return (
    <img
      src={content.image}
      alt=""
      style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }}
    />
  );
}

export const notify = {
  success: (content: ToastInput, options?: ToastOptions) =>
    toast.success(<ToastBody content={content} />, {
      ...base,
      icon: iconFor(content),
      ...options,
    }),

  error: (content: ToastInput, options?: ToastOptions) =>
    toast.error(<ToastBody content={content} />, {
      ...base,
      icon: iconFor(content),
      ...options,
    }),

  warning: (content: ToastInput, options?: ToastOptions) =>
    toast.warning(<ToastBody content={content} />, {
      ...base,
      icon: iconFor(content),
      ...options,
    }),

  info: (content: ToastInput, options?: ToastOptions) =>
    toast.info(<ToastBody content={content} />, {
      ...base,
      icon: iconFor(content),
      ...options,
    }),
};
