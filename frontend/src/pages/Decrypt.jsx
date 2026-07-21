import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiDownload, FiCheck, FiAlertTriangle, FiShieldOff } from "react-icons/fi";
import UploadCard from "../components/UploadCard";
import ProgressBar from "../components/ProgressBar";
import { decryptAndExtract, fileUrl } from "../services/api";

export default function Decrypt() {
  const [video, setVideo] = useState(null);
  const [keyHex, setKeyHex] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const canSubmit = video && keyHex.trim().length === 64 && status !== "working";

  async function handleDecrypt() {
    setStatus("working");
    setError("");
    setProgress(0);
    try {
      const data = await decryptAndExtract(video, keyHex.trim(), setProgress);
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Decryption failed.");
      setStatus("error");
    }
  }

  function reset() {
    setVideo(null);
    setKeyHex("");
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
        <h1 className="font-display font-bold text-3xl mb-2">Extract &amp; decrypt</h1>
        <p className="text-ink/55 mb-8">
          Upload the stego video and paste the AES key you were given.
        </p>

        <UploadCard
          label="Stego video"
          hint="The .avi file from the Encrypt page"
          accept={{ "video/*": [".avi", ".mp4", ".mov"] }}
          file={video}
          onFile={setVideo}
        />

        <div className="mt-4">
          <label className="text-xs text-ink/50 block mb-1.5">AES-256 key (64 hex characters)</label>
          <input
            value={keyHex}
            onChange={(e) => setKeyHex(e.target.value)}
            placeholder="e.g. 756b5478df42b1eb8043f504493717b..."
            className="w-full bg-card/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!canSubmit}
          onClick={handleDecrypt}
          className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {status === "working" ? "Decrypting..." : "Extract &amp; decrypt image"}
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
              <div className="flex items-center gap-2 font-medium">
                {result.integrity_ok ? (
                  <span className="flex items-center gap-2 text-accent">
                    <FiCheck /> Integrity verified — image matches the original exactly
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-yellow-400">
                    <FiShieldOff /> Recovered, but integrity check did not match
                  </span>
                )}
              </div>

              <img
                src={fileUrl(result.image_url)}
                alt="Recovered secret"
                className="w-full rounded-xl border border-white/10"
              />

              <a
                href={fileUrl(result.image_url)}
                download
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/15 hover:bg-white/5 transition-colors font-medium"
              >
                <FiDownload /> Download recovered image
              </a>

              <button onClick={reset} className="text-xs text-ink/50 hover:text-ink underline">
                Decrypt another file
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
