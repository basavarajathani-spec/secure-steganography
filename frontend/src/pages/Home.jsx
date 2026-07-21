import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiShield, FiFilm, FiKey, FiArrowRight } from "react-icons/fi";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const steps = [
  { title: "Encrypt", desc: "Your image is locked with AES-256-CBC before it ever touches the video." },
  { title: "Embed", desc: "The ciphertext is hidden bit-by-bit inside a cover video's pixels." },
  { title: "Transmit", desc: "The stego video looks completely ordinary to anyone watching it." },
  { title: "Recover", desc: "The receiver extracts and decrypts it back to the exact original image." },
];

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden pt-24 pb-32 px-6">
        <div className="absolute inset-0 cipher-grid" aria-hidden="true" />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="flex flex-col items-center"
          >
            <motion.span
              variants={fadeUp}
              className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-5"
            >
              AES-256 &middot; LSB Video Steganography
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="font-display font-extrabold text-4xl sm:text-6xl leading-tight mb-6"
            >
              Hide an image
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                inside a video.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-ink/60 text-lg max-w-xl mb-10">
              Encrypt any image with AES-256, then invisibly embed it inside an
              ordinary-looking video. Nothing about the file betrays its secret.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/encrypt"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-secondary font-medium hover:shadow-lg hover:shadow-primary/30 transition-shadow"
              >
                Encrypt an image
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/decrypt"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/15 font-medium hover:bg-white/5 transition-colors"
              >
                Decrypt a video
              </Link>
            </motion.div>
          </motion.div>

          {/* signature element: a "frame" of scrolling bits collapsing into a lock */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="relative mx-auto mt-16 w-full max-w-lg h-40 rounded-2xl border border-white/10 bg-card/60 overflow-hidden flex items-center justify-center"
          >
            <div
              className="absolute inset-0 opacity-30 animate-bitscroll"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent 0 18px, rgba(6,182,212,0.35) 18px 19px)",
                backgroundSize: "100% 400px",
              }}
              aria-hidden="true"
            />
            <motion.div
              className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-drift"
            >
              <FiShield size={26} className="text-white" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="font-display font-bold text-2xl sm:text-3xl text-center mb-14"
        >
          How it works
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="rounded-2xl bg-card/70 border border-white/5 p-6"
            >
              <span className="text-xs font-mono text-accent">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-display font-semibold text-lg mt-2 mb-2">{step.title}</h3>
              <p className="text-sm text-ink/55 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid sm:grid-cols-3 gap-6"
        >
          {[
            { icon: FiShield, title: "AES-256-CBC", desc: "Military-grade encryption on every image, every time." },
            { icon: FiFilm, title: "Lossless embedding", desc: "FFV1-encoded video preserves every hidden bit exactly." },
            { icon: FiKey, title: "Your key, your control", desc: "Keys are generated client-visible and never stored server-side." },
          ].map(({ icon: Icon, title, desc }) => (
            <motion.div key={title} variants={fadeUp} className="text-center px-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-white/5 flex items-center justify-center mb-4">
                <Icon className="text-accent" size={20} />
              </div>
              <h3 className="font-display font-semibold mb-2">{title}</h3>
              <p className="text-sm text-ink/55">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
