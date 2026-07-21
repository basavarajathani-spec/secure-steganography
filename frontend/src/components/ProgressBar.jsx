import { motion } from "framer-motion";

export default function ProgressBar({ value, label }) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-ink/60 mb-1.5">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ ease: "easeOut", duration: 0.3 }}
        />
      </div>
    </div>
  );
}
