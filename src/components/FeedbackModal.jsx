import React, { useState, useRef } from "react";
import { X, Bug, MessageSquare, Lightbulb, Send, CheckCircle, ImagePlus, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as Sentry from "@sentry/react";

const CATEGORIES = [
  { id: "bug", label: "Bug Report", icon: Bug, color: "text-terminal-red", border: "border-terminal-red/40", bg: "bg-terminal-red/10" },
  { id: "feedback", label: "Feedback", icon: MessageSquare, color: "text-terminal-accent", border: "border-terminal-accent/40", bg: "bg-terminal-accent/10" },
  { id: "feature", label: "Feature Request", icon: Lightbulb, color: "text-terminal-yellow", border: "border-terminal-yellow/40", bg: "bg-terminal-yellow/10" },
];

export default function FeedbackModal({ onClose }) {
  const [category, setCategory] = useState("feedback");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const fileInputRef = useRef(null);

  function handleScreenshotChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  }

  function removeScreenshot() {
    setScreenshot(null);
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const attachments = [];
      if (screenshot) {
        const buffer = await screenshot.arrayBuffer();
        attachments.push({ data: new Uint8Array(buffer), filename: screenshot.name, contentType: screenshot.type });
      }

      await Sentry.captureFeedback(
        { name: name.trim() || undefined, email: email.trim() || undefined, message: message.trim() },
        { captureContext: { tags: { feedbackType: category } }, attachments },
      );
      setSubmitted(true);
      setTimeout(onClose, 2000);
    } catch {
      setSubmitting(false);
    }
  }

  const active = CATEGORIES.find((c) => c.id === category);

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        className="relative w-full max-w-md bg-terminal-surface border border-terminal-border rounded-2xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-terminal-border">
          <span className="font-mono text-sm font-bold text-terminal-text tracking-wider">SEND US A MESSAGE</span>
          <button onClick={onClose} className="text-terminal-dim hover:text-terminal-text transition-colors">
            <X size={16} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              className="flex flex-col items-center justify-center gap-3 py-12 px-5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <CheckCircle size={36} className="text-terminal-green" />
              <p className="font-mono text-sm text-terminal-green">Received. Thank you!</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              className="p-5 flex flex-col gap-4"
              onSubmit={handleSubmit}
              initial={{ opacity: 1 }}
            >
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { setCategory(cat.id); if (cat.id !== "bug") removeScreenshot(); }}
                      className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border transition-all duration-150 ${
                        isActive ? `${cat.border} ${cat.bg}` : "border-terminal-border hover:border-terminal-muted"
                      }`}
                    >
                      <Icon size={15} className={isActive ? cat.color : "text-terminal-dim"} />
                      <span className={`font-mono text-[10px] tracking-wide ${isActive ? cat.color : "text-terminal-dim"}`}>
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-terminal-card border border-terminal-border rounded-lg px-3 py-2 font-mono text-xs text-terminal-text placeholder:text-terminal-dim/50 focus:outline-none focus:border-terminal-accent/50"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-terminal-card border border-terminal-border rounded-lg px-3 py-2 font-mono text-xs text-terminal-text placeholder:text-terminal-dim/50 focus:outline-none focus:border-terminal-accent/50"
                />
              </div>

              <textarea
                required
                rows={5}
                placeholder={
                  category === "bug"
                    ? "Describe the bug — what happened and what you expected..."
                    : category === "feature"
                    ? "Describe the feature you'd like to see..."
                    : "Share your thoughts or suggestions..."
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-terminal-card border border-terminal-border rounded-lg px-3 py-2 font-mono text-xs text-terminal-text placeholder:text-terminal-dim/50 focus:outline-none focus:border-terminal-accent/50 resize-none"
              />

              <AnimatePresence>
                {category === "bug" && (
                  <motion.div
                    key="screenshot"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleScreenshotChange}
                    />
                    {screenshotPreview ? (
                      <div className="relative rounded-lg overflow-hidden border border-terminal-red/30 bg-terminal-card">
                        <img src={screenshotPreview} alt="Screenshot preview" className="w-full max-h-36 object-cover" />
                        <button
                          type="button"
                          onClick={removeScreenshot}
                          className="absolute top-1.5 right-1.5 bg-terminal-bg/80 rounded-full text-terminal-dim hover:text-terminal-red transition-colors"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 w-full py-2.5 px-3 rounded-lg border border-dashed border-terminal-border hover:border-terminal-red/40 bg-terminal-card text-terminal-dim hover:text-terminal-red/80 transition-all duration-150"
                      >
                        <ImagePlus size={13} />
                        <span className="font-mono text-xs">Add a screenshot</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-mono text-xs tracking-wider font-bold transition-all duration-150 disabled:opacity-40 ${active.bg} ${active.border} border ${active.color} hover:brightness-125`}
              >
                <Send size={12} />
                {submitting ? "SENDING···" : "SEND"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
