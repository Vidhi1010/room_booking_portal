import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Download, MapPin, Sparkles } from "lucide-react";
import { defaultTheme } from "./themes";
import { yatraSchedule, yatraDateRange } from "./yatraSchedule";
import { trackEvent } from "./analytics";

export default function SchedulePage() {
  const theme = defaultTheme;
  const [searchParams] = useSearchParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (searchParams.get("print") === "1") {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  const handleDownloadPdf = () => {
    trackEvent("Schedule", "download_pdf", "schedule_page");
    window.print();
  };

  return (
    <div
      className="min-h-screen"
      style={{ ...theme.cssVars, backgroundColor: "var(--t-bg)", color: "var(--t-text)" }}
    >
      {/* print-only styles: hide chrome, keep clean schedule */}
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          html, body { background: #ffffff !important; }
          .no-print { display: none !important; }
          .print-container {
            padding: 0 !important;
            background: #ffffff !important;
            color: #111827 !important;
          }
          .print-day { page-break-inside: avoid; break-inside: avoid; }
          .print-row { page-break-inside: avoid; break-inside: avoid; }
          .print-muted { color: #4b5563 !important; }
          .print-accent { color: #b45309 !important; }
          .print-border { border-color: #e5e7eb !important; }
        }
      `}</style>

      {/* ─── top bar ─── */}
      <div
        className="no-print sticky top-0 z-40 backdrop-blur-lg"
        style={{
          backgroundColor: "var(--t-nav-solid)",
          borderBottom: "1px solid var(--t-border)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: "var(--t-text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t-accent-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t-text-secondary)")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Yatra
          </Link>
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 hover:scale-105"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="print-container max-w-5xl mx-auto px-6 py-16">
        {/* ─── header ─── */}
        <div className="text-center mb-14">
          <div
            className="no-print inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--t-accent-tag)" }}
            >
              Tentative Schedule
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight">
            Kartik Govardhan{" "}
            <span
              className="print-accent"
              style={{
                background: `linear-gradient(to right, var(--t-accent-from), var(--t-accent-to))`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Yatra 2026
            </span>
          </h1>
          <div
            className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
            style={{ color: "var(--t-text-secondary)" }}
          >
            <span className="inline-flex items-center gap-2 print-muted">
              <Calendar className="w-4 h-4" />
              {yatraDateRange}
            </span>
            <span className="inline-flex items-center gap-2 print-muted">
              <MapPin className="w-4 h-4" />
              Govardhan Retreat Centre &amp; Vrindavan
            </span>
          </div>
          <p
            className="mt-4 text-xs italic print-muted"
            style={{ color: "var(--t-text-faint)" }}
          >
            Schedule is tentative and subject to change.
          </p>
        </div>

        {/* ─── days ─── */}
        <div className="space-y-14">
          {yatraSchedule.map((day, idx) => (
            <motion.section
              key={day.day}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="print-day"
            >
              <div
                className="flex items-baseline gap-4 pb-4 mb-6 border-b print-border"
                style={{ borderColor: "var(--t-border-strong)" }}
              >
                <span
                  className="print-accent text-xs font-bold tracking-[0.25em] uppercase"
                  style={{ color: "var(--t-accent-tag)" }}
                >
                  {day.label}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold">{day.date}</h2>
              </div>

              <ul className="divide-y" style={{ borderColor: "var(--t-border)" }}>
                {day.items.map((item, i) => (
                  <li
                    key={i}
                    className="print-row grid grid-cols-[92px_1fr] sm:grid-cols-[140px_1fr] gap-4 sm:gap-6 py-3 border-t print-border first:border-t-0"
                    style={{ borderColor: "var(--t-border)" }}
                  >
                    <div
                      className={`text-xs sm:text-sm font-mono tabular-nums leading-relaxed ${
                        item.highlight ? "print-accent" : "print-muted"
                      }`}
                      style={{
                        color: item.highlight
                          ? "var(--t-accent-tag)"
                          : "var(--t-text-muted)",
                      }}
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <Clock className="w-3 h-3 opacity-60 shrink-0" />
                        <span>{item.from}</span>
                      </div>
                      {item.to && (
                        <div className="mt-0.5 pl-4 opacity-80">→ {item.to}</div>
                      )}
                    </div>
                    <div
                      className={`text-sm sm:text-base leading-relaxed ${
                        item.highlight ? "font-semibold" : ""
                      }`}
                    >
                      {item.title}
                    </div>
                  </li>
                ))}
              </ul>
            </motion.section>
          ))}
        </div>

        {/* ─── footer note ─── */}
        <div
          className="mt-16 pt-8 border-t print-border text-center text-xs"
          style={{
            borderColor: "var(--t-border)",
            color: "var(--t-text-faint)",
          }}
        >
          Hare Krishna · Kartik Govardhan Yatra 2026
        </div>
      </div>
    </div>
  );
}
