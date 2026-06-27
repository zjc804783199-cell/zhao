import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Analysis from "@/pages/Analysis";
import Watchlist from "@/pages/Watchlist";
import Learn from "@/pages/Learn";
import Navbar from "@/components/layout/Navbar";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis/:code" element={<Analysis />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/learn" element={<Learn />} />
        </Routes>
      </div>
    </Router>
  );
}
