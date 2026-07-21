import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Encrypt from "./pages/Encrypt";
import Decrypt from "./pages/Decrypt";

export default function App() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/encrypt" element={<Encrypt />} />
          <Route path="/decrypt" element={<Decrypt />} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-ink/30 py-10">
        Built with AES-256-CBC + LSB video steganography.
      </footer>
    </div>
  );
}
