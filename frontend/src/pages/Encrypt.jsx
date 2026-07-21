import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCopy, FiDownload, FiCheck, FiAlertTriangle } from "react-icons/fi";
import UploadCard from "../components/UploadCard";
import ProgressBar from "../components/ProgressBar";
import { encryptAndEmbed, fileUrl } from "../services/api";

export default function Encrypt() {
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | working | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const canSubmit = image && video && status !== "working";

  async function handleEncrypt() {
    setStatus("working");
    setError("");
    setProgress(0);
    try {
      const data = await encryptAndEmbed(image, video, setProgress);
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Encryption failed.");
      setStatus("error");
    }
  }

  function copyKey() {
    if (!result?.key_hex) return;
    navigator.clipboard.writeText(result.key_hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function reset() {
    setImage(null);
    setVideo(null);
    setResult(null);
    setError("");
    setStatus("idle");
    setProgress(0);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-display font-bold text-3xl mb-2">Encrypt &amp; embed</h1>
        <p className="text-ink/55 mb-8">
          Upload the image you want to protect and a cover video to hide it inside.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <UploadCard
            label="Secret image"
            hint="PNG or JPG"
            accept={{ "image/*": [".png", ".jpg", ".jpeg"] }}
            file={image}
            onFile={setImage}
          />
          <UploadCard
            label="Cover video"
            hint="AVI or MP4 (larger = more capacity)"
            accept={{ "video/*": [".avi", ".mp4", ".mov"] }}
            file={video}
            onFile={setVideo}
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!canSubmit}
          onClick={handleEncrypt}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {status === "working" ? "Encrypting..." : "Encrypt image into video"}
        </motion.button>

        <AnimatePresence>
          {status === "working" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6"
            >
              <ProgressBar value={progress} label="Uploading &amp; processing" />
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm"
            >
              <FiAlertTriangle className="text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {status === "done" && result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-2xl bg-card/70 border border-white/5 p-6 space-y-5"
            >
              <div className="flex items-center gap-2 text-accent font-medium">
                <FiCheck /> Encryption complete
              </div>

              <div>
                <label className="text-xs text-ink/50 block mb-1.5">
                  AES-256 key (save this — you'll need it to decrypt)
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-black/30 rounded-lg px-3 py-2.5 truncate">
                    {result.key_hex}
                  </code>
                  <button
                    onClick={copyKey}
                    className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    aria-label="Copy key"
                  >
                    {copied ? <FiCheck className="text-accent" /> : <FiCopy />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <Stat label="Frames used" value={`${result.stats.frames_used}/${result.stats.total_frames}`} />
                <Stat label="Payload size" value={`${(result.stats.bytes_embedded / 1024).toFixed(1)} KB`} />
              </div>

              <a
                href={fileUrl(result.download_url)}
                download
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/15 hover:bg-white/5 transition-colors font-medium"
              >
                <FiDownload /> Download stego video (.avi)
              </a>

              <p className="text-xs text-ink/40">
                This file uses a lossless codec on purpose — don't re-compress or
                convert it, or the hidden data will be destroyed.
              </p>

              <button onClick={reset} className="text-xs text-ink/50 hover:text-ink underline">
                Encrypt another file
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-black/20 px-3 py-2.5">
      <p className="text-xs text-ink/45">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
