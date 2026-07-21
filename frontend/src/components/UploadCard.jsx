import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { FiUploadCloud, FiCheckCircle, FiX } from "react-icons/fi";

export default function UploadCard({ label, accept, file, onFile, hint }) {
  const [isOver, setIsOver] = useState(false);

  const onDrop = useCallback(
    (accepted) => {
      if (accepted?.[0]) onFile(accepted[0]);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
    onDragEnter: () => setIsOver(true),
    onDragLeave: () => setIsOver(false),
  });

  return (
    <div
      {...getRootProps()}
      className={`relative rounded-2xl border-2 border-dashed p-6 cursor-pointer transition-colors
        ${isDragActive || isOver ? "border-accent bg-accent/5" : "border-white/15 bg-card/60 hover:border-white/30"}`}
    >
      <input {...getInputProps()} />
      <AnimatePresence mode="wait">
        {file ? (
          <motion.div
            key="file"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-3"
          >
            <FiCheckCircle className="text-accent shrink-0" size={22} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-ink/50">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFile(null);
              }}
              className="ml-auto p-1.5 rounded-full hover:bg-white/10"
              aria-label={`Remove ${label}`}
            >
              <FiX size={16} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center gap-2 py-4"
          >
            <motion.div
              animate={{ y: isDragActive ? -4 : 0 }}
              className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center"
            >
              <FiUploadCloud className="text-ink/70" size={20} />
            </motion.div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-ink/40">{hint}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
