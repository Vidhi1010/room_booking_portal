import { useRef, useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  MapPin,
  Calendar,
  Users,
  Star,
  ChevronDown,
  Play,
  ArrowRight,
  Sparkles,
  Sun,
  Heart,
  Music,
  Camera,
  X,
} from "lucide-react";

/* ───────────────────────── helpers ───────────────────────── */
function Section({ children, className = "", id }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function FloatingParticle({ delay, x, size }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        background:
          "radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 70%)",
      }}
      animate={{
        y: [0, -800],
        opacity: [0, 0.8, 0],
        scale: [0.5, 1.2, 0.3],
      }}
      transition={{
        duration: 8 + Math.random() * 6,
        repeat: Infinity,
        delay,
        ease: "easeOut",
      }}
    />
  );
}

/* ── infinite marquee row ── */
function MarqueeRow({ images, speed = 30, height = 280, reverse = false, onImageClick }) {
  const doubled = [...images, ...images];
  const gap = 16; // 1rem
  const cardWidth = Math.round(height * 1.4);
  const singleSetWidth = images.length * (cardWidth + gap);

  return (
    <div
      style={{
        position: "relative",
        height: `${height}px`,
        marginBottom: "1rem",
        overflow: "hidden",
      }}
    >
      <motion.div
        style={{
          display: "flex",
          gap: `${gap}px`,
          position: "absolute",
          top: 0,
          left: reverse ? `-${singleSetWidth}px` : "0px",
          height: "100%",
          width: "max-content",
        }}
        animate={{
          x: reverse ? [0, singleSetWidth] : [0, -singleSetWidth],
        }}
        transition={{
          x: {
            duration: speed,
            repeat: Infinity,
            ease: "linear",
            repeatType: "loop",
          },
        }}
        whileHover={{ animationPlayState: "paused" }}
      >
        {doubled.map((num, i) => (
          <div
            key={`${num}-${i}`}
            className="group"
            style={{
              position: "relative",
              flexShrink: 0,
              width: `${cardWidth}px`,
              height: "100%",
              borderRadius: "1rem",
              overflow: "hidden",
              cursor: "pointer",
            }}
            onClick={() => onImageClick(`/gallery/${num}.jpg`)}
          >
            <img
              src={`/gallery/${num}.jpg`}
              alt={`Yatra memory ${num}`}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              className="group-hover:scale-[1.15]"
            />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 40%, transparent 100%)",
              }}
            />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                borderRadius: "1rem",
                boxShadow: "inset 0 0 0 2px rgba(251,191,36,0.5), 0 0 30px rgba(251,191,36,0.15)",
              }}
            />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500">
              <Camera className="w-4 h-4 text-amber-400" />
              <span className="text-white/90 text-sm font-medium">View Photo</span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ──────────────────────── main page ─────────────────────── */
export default function VrajKartikYatra() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });

  /* parallax values */
  const heroY = useTransform(smoothProgress, [0, 0.25], [0, -200]);
  const heroScale = useTransform(smoothProgress, [0, 0.15], [1, 1.15]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);
  const titleY = useTransform(smoothProgress, [0, 0.15], [0, -120]);

  const [navSolid, setNavSolid] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [heroSlide, setHeroSlide] = useState(0);

  const heroSlides = [
    {
      img: "/banner/govardhan-retreat-center.jpg",
      tag: "Where You Stay",
      heading: "Comfortable Ashram Living",
      // desc: "Stay at serene retreat centres near the holy sites with clean rooms, spiritual ambiance & 24/7 facilities.",
    },
    {
      img: "/banner/IMG_8072.JPG",
      tag: "What You Experience",
      heading: "Soul-Stirring Kirtans & Aartis",
      // desc: "Begin each day with mangala aarti and immerse in hours of ecstatic kirtan with hundreds of devotees.",
    },
    {
      img: "/banner/IMG_6529.JPG",
      tag: "What You Eat",
      heading: "Pure Sattvic Prasadam",
      // desc: "Relish freshly prepared Vaishnav bhog — wholesome, sanctified meals served with love throughout the yatra.",
    },
    {
      img: "/banner/IMG_7472.JPG",
      tag: "What You Explore",
      heading: "Sacred Temples & Parikramas",
      // desc: "Walk the ancient pathways of Vrindavan, Govardhan, Mathura & Barsana — every step is a blessing.",
    },
  ];

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* hero carousel auto-advance */
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  /* gallery images split into 3 rows for marquee effect */
  const galleryRow1 = [1, 2, 3, 5, 6, 7, 8];
  const galleryRow2 = [9, 10, 11, 12, 13, 14, 15];
  const galleryRow3 = [18, 19, 21, 22, 24, 25, 26];

  const highlights = [
    {
      icon: <MapPin className="w-7 h-7" />,
      title: "Sacred Vrindavan",
      desc: "Walk through the holy lanes of Vrindavan, Mathura, Govardhan & Barsana — the divine playground of Lord Krishna.",
      img: "/gallery/7.jpg",
      span: "md:col-span-2 md:row-span-2",
      tall: true,
    },
    {
      icon: <Calendar className="w-7 h-7" />,
      title: "Kartik Month",
      desc: "Experience the most auspicious month of the Vedic calendar with daily kirtans, aartis, and parikramas.",
      stat: "30",
      statLabel: "Sacred Days",
    },
    {
      icon: <Users className="w-7 h-7" />,
      title: "Devotee Sangha",
      desc: "Travel with 200+ devotees in a spiritually charged atmosphere of love, devotion and divine association.",
      stat: "200+",
      statLabel: "Devotees",
    },
    {
      icon: <Music className="w-7 h-7" />,
      title: "Kirtan & Bhajans",
      desc: "Immerse yourself in soul-stirring kirtans and bhajans led by renowned devotee musicians throughout the yatra.",
      img: "/gallery/11.jpg",
      span: "md:col-span-2",
    },
    {
      icon: <Star className="w-7 h-7" />,
      title: "Temple Darshans",
      desc: "Special darshan arrangements at Banke Bihari, Radha Raman, ISKCON, Prem Mandir & many more sacred temples.",
      stat: "15+",
      statLabel: "Temples",
      span: "md:col-span-2"
    },
    {
      icon: <Heart className="w-7 h-7" />,
      title: "Seva Opportunities",
      desc: "Participate in Gau Seva, Prasadam distribution, and other devotional service opportunities during the yatra.",
      img: "/gallery/24.jpg",
      span: "md:col-span-2"
    },
  ];

  const itinerary = [
    { day: "Day 1", title: "Arrival in Vrindavan", desc: "Welcome ceremony, check-in, evening aarti at Banke Bihari Temple" },
    { day: "Day 2", title: "Mathura & Birthplace", desc: "Visit Krishna Janmabhoomi, Dwarkadhish Temple, Vishram Ghat" },
    { day: "Day 3", title: "Govardhan Parikrama", desc: "Sacred 21km parikrama of Govardhan Hill, Manasi Ganga, Kusum Sarovar" },
    { day: "Day 4", title: "Barsana & Nandgaon", desc: "Visit Radha Rani Temple in Barsana, Nand Bhavan in Nandgaon" },
    { day: "Day 5", title: "Vrindavan Exploration", desc: "Radha Raman Temple, Seva Kunj, Nidhivan, Prem Mandir light show" },
    { day: "Day 6", title: "Yamuna Aarti & Departure", desc: "Early morning Yamuna aarti, final darshans, departure blessings" },
  ];

  return (
    <div ref={containerRef} className="relative bg-[#0a0a0f] text-white overflow-hidden">
      {/* ─── progress bar ─── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 z-[100] origin-left"
        style={{ scaleX: smoothProgress }}
      />

      {/* ─── navbar ─── */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          navSolid
            ? "bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
              <Sun className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-wide bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
              Kartik Vraj Yatra
            </span>
          </motion.div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            {[
              ["about", "About"],
              ["highlights", "Highlights"],
              ["video", "Video"],
              ["itinerary", "Itinerary"],
              ["gallery", "Gallery"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="hover:text-amber-400 transition-colors duration-300 relative group"
              >
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-amber-400 group-hover:w-full transition-all duration-300" />
              </button>
            ))}
            <button
              onClick={() => scrollTo("register")}
              className="ml-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 hover:scale-105"
            >
              Register Now
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <header className="relative h-[100vh] flex items-center justify-center overflow-hidden">
        {/* carousel background images */}
        <AnimatePresence mode="sync">
          <motion.div
            key={heroSlide}
            className="absolute inset-0 z-0"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{ scale: [1, 1.08] }}
              transition={{ duration: 5, ease: "linear" }}
            >
              <img
                src={heroSlides[heroSlide].img}
                alt={heroSlides[heroSlide].heading}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/70 via-[#0a0a0f]/40 to-[#0a0a0f]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/50 via-transparent to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* floating particles */}
        <div className="absolute inset-0 overflow-hidden z-[1]">
          {Array.from({ length: 20 }).map((_, i) => (
            <FloatingParticle
              key={i}
              delay={i * 0.6}
              x={Math.random() * 100}
              size={4 + Math.random() * 8}
            />
          ))}
        </div>

        {/* hero content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
          {/* slide tag */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`tag-${heroSlide}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-amber-400/30 bg-amber-400/10 backdrop-blur-sm mb-8"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm font-medium tracking-wider uppercase">
                {heroSlides[heroSlide].tag}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* main title — stays constant */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[0.9] tracking-tight">
            <span className="block bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent">
              Kartik Vraj
            </span>
            <span className="block text-white/90 mt-2">Yatra 2026</span>
          </h1>

          {/* slide-specific subtitle */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`desc-${heroSlide}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-8 max-w-2xl"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-amber-300/90 mb-3">
                {heroSlides[heroSlide].heading}
              </h2>
              <p className="text-base sm:text-lg text-white/60 leading-relaxed">
                {heroSlides[heroSlide].desc}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => scrollTo("register")}
              className="group px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg hover:shadow-2xl hover:shadow-amber-500/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              Join the Yatra
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => scrollTo("video")}
              className="group px-8 py-4 rounded-full border border-white/20 text-white font-semibold text-lg hover:bg-white/5 transition-all duration-300 flex items-center gap-2"
            >
              <Play className="w-5 h-5 text-amber-400" />
              Watch Promo
            </button>
          </div>

          {/* carousel indicators */}
          <div className="mt-12 flex items-center gap-3">
            {heroSlides.map((slide, i) => (
              <button
                key={i}
                onClick={() => setHeroSlide(i)}
                className="group relative flex items-center"
                aria-label={`Go to slide: ${slide.tag}`}
              >
                <div
                  className={`h-[3px] rounded-full transition-all duration-500 ${
                    i === heroSlide
                      ? "w-10 bg-amber-400"
                      : "w-6 bg-white/20 hover:bg-white/40"
                  }`}
                />
                {/* tooltip */}
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black/80 text-[10px] text-white/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {slide.tag}
                </span>
              </button>
            ))}
          </div>

          {/* stats strip */}
          <div className="mt-10 flex items-center justify-center gap-8 sm:gap-16 text-white/50">
            {[
              ["3", "Days"],
              ["200+", "Devotees"],
              ["15+", "Visits"],
            ].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-amber-400">
                  {num}
                </div>
                <div className="text-xs sm:text-sm mt-1 uppercase tracking-wider">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8 text-amber-400/60" />
        </motion.div>
      </header>

      {/* ═══════════════════ ABOUT ═══════════════════ */}
      <Section id="about" className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0f0d1a] to-[#0a0a0f]" />
        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          {/* poster image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative group"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
            <img
              src="/images/poster_vraj_yatra.jpeg"
              alt="Kartik Vraj Yatra 2026 Poster"
              className="relative rounded-2xl shadow-2xl w-full object-cover border border-white/10"
            />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
          </motion.div>

          {/* text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">
                About the Yatra
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
              A Journey to the{" "}
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                Heart of Devotion
              </span>
            </h2>
            <p className="mt-6 text-white/60 text-lg leading-relaxed">
              Kartik Vraj Yatra 2026 is a once-in-a-lifetime spiritual journey
              through the sacred land of Vraj — Vrindavan, Mathura, Govardhan,
              and Barsana. During the holy month of Kartik, every step in this
              divine land carries immeasurable spiritual merit.
            </p>
            <p className="mt-4 text-white/60 text-lg leading-relaxed">
              Join hundreds of devotees as we traverse the same paths walked by
              Lord Krishna, singing His glories, visiting ancient temples, and
              immersing ourselves in the timeless culture of Vraj.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {["Vrindavan", "Mathura", "Govardhan", "Barsana", "Nandgaon"].map(
                (place) => (
                  <span
                    key={place}
                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/70 hover:border-amber-400/40 hover:text-amber-300 transition-all duration-300"
                  >
                    <MapPin className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                    {place}
                  </span>
                )
              )}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ═══════════════════ HIGHLIGHTS ═══════════════════ */}
      <Section id="highlights" className="relative py-32 px-6">
        <div className="absolute inset-0 bg-[#0a0a0f]" />
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 mb-6">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">
                Why Join Us
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold">
              Yatra{" "}
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                Highlights
              </span>
            </h2>
            <p className="mt-4 text-white/50 text-lg max-w-2xl mx-auto">
              Every moment of this yatra is crafted to deepen your connection
              with the divine.
            </p>
          </div>

          {/* bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[200px] gap-4">
            {highlights.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: "easeOut" }}
                className={`group relative rounded-3xl overflow-hidden cursor-default ${item.span || ""}`}
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* background image cards */}
                {item.img && (
                  <>
                    <img
                      src={item.img}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 group-hover:via-black/50 transition-all duration-700" />
                  </>
                )}

                {/* stat cards (no image) - animated number background */}
                {item.stat && !item.img && (
                  <div className="absolute inset-0 bg-white/[0.02]">
                    {/* large number watermark */}
                    <div
                      className="absolute -right-4 -bottom-6 font-black text-white/[0.04] leading-none select-none group-hover:text-amber-400/[0.08] transition-colors duration-700"
                      style={{ fontSize: "clamp(8rem, 12vw, 14rem)" }}
                    >
                      {item.stat}
                    </div>
                    {/* animated gradient border effect */}
                    <div
                      className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                      style={{
                        background: "linear-gradient(135deg, rgba(251,191,36,0.1) 0%, transparent 50%, rgba(249,115,22,0.1) 100%)",
                      }}
                    />
                  </div>
                )}

                {/* content overlay */}
                <div className={`relative h-full flex flex-col justify-end p-6 ${item.tall ? "p-8" : ""}`}>
                  {/* icon + number for stat cards */}
                  {item.stat && (
                    <div className="mb-auto flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-400/20 group-hover:scale-110 transition-all duration-500">
                        {item.icon}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl sm:text-4xl font-black bg-gradient-to-b from-amber-300 to-amber-500 bg-clip-text text-transparent">
                          {item.stat}
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-1">
                          {item.statLabel}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* icon for image cards */}
                  {item.img && !item.tall && (
                    <div className="mb-auto">
                      <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-400/20 transition-all duration-500">
                        {item.icon}
                      </div>
                    </div>
                  )}

                  {/* large featured card - special layout */}
                  {item.tall && (
                    <div className="absolute top-8 left-8 right-8">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform duration-500">
                        {item.icon}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.3em] text-amber-400/70 font-semibold">Featured</div>
                    </div>
                  )}

                  {/* title & description */}
                  <div>
                    <h3
                      className={`font-bold text-white group-hover:text-amber-300 transition-colors duration-500 ${
                        item.tall ? "text-2xl sm:text-3xl mb-3" : "text-lg mb-2"
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={`text-white/50 leading-relaxed group-hover:text-white/70 transition-colors duration-500 ${
                        item.tall ? "text-base max-w-md" : "text-sm line-clamp-2"
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>

                  {/* bottom decorative line */}
                  <div
                    className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700 ease-out"
                    style={{ width: "0%" }}
                    ref={null}
                  />
                </div>

                {/* hover shimmer effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: "linear-gradient(105deg, transparent 40%, rgba(251,191,36,0.03) 45%, rgba(251,191,36,0.06) 50%, rgba(251,191,36,0.03) 55%, transparent 60%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2s ease-in-out infinite",
                  }}
                />

                {/* animated bottom border on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════════════ VIDEO ═══════════════════ */}
      <Section id="video" className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#100a18] to-[#0a0a0f]" />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 mb-6">
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">
                Watch & Feel
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold">
              Experience the{" "}
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                Divine Energy
              </span>
            </h2>
            <p className="mt-4 text-white/50 text-lg max-w-2xl mx-auto">
              Get a glimpse of the spiritual journey that awaits you.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative group"
          >
            {/* ambient glow behind video */}
            <div className="absolute -inset-8 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 rounded-3xl blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-amber-900/20">
              <div className="aspect-video">
                <iframe
                  src="https://www.youtube.com/embed/Mj4w51gggYg?rel=0&modestbranding=1"
                  title="Kartik Vraj Yatra 2026 Promo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ═══════════════════ ITINERARY ═══════════════════ */}
      <Section id="itinerary" className="relative py-32 px-6">
        <div className="absolute inset-0 bg-[#0a0a0f]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px]" />

        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 mb-6">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">
                The Journey
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold">
              Yatra{" "}
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                Itinerary
              </span>
            </h2>
            <p className="mt-4 text-white/50 text-lg max-w-2xl mx-auto">
              Six days of divine experiences, carefully planned for your
              spiritual transformation.
            </p>
          </div>

          {/* timeline */}
          <div className="relative">
            {/* center line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-amber-400/40 via-amber-400/20 to-transparent" />

            {itinerary.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className={`relative flex items-start gap-8 mb-12 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* dot */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-400 border-4 border-[#0a0a0f] z-10 shadow-lg shadow-amber-400/30" />

                {/* card */}
                <div
                  className={`ml-16 md:ml-0 md:w-[calc(50%-2rem)] ${
                    i % 2 === 0 ? "md:pr-8 md:text-right" : "md:pl-8"
                  }`}
                >
                  <span className="inline-block px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold tracking-wider mb-3">
                    {item.day}
                  </span>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════════════ PARALLAX DIVIDER ═══════════════════ */}
      <div className="relative h-[60vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: "url('/gallery/14.jpg')" }}
        />
        <div className="absolute inset-0 bg-[#0a0a0f]/70 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/30 to-purple-900/30" />
        <div className="relative h-full flex items-center justify-center text-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-6xl font-black text-white/90 leading-tight max-w-3xl">
              &ldquo;Without mercy of Balaram, nobody{" "}
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                can appreciate
              </span>{" "}
              Vrindavana life&rdquo;
            </h2>
            <p className="mt-6 text-white/40 text-lg italic">
              — Srila Prabhupada
            </p>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════ GALLERY ═══════════════════ */}
      <section id="gallery" className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a0f]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[150px]" />

        <div className="relative">
          {/* heading */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 px-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 mb-6">
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">
                Memories
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold">
              Glimpses from{" "}
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                Previous Yatras
              </span>
            </h2>
            <p className="mt-4 text-white/50 text-lg max-w-2xl mx-auto">
              Relive the beautiful moments from our past spiritual journeys.
            </p>
          </motion.div>

          {/* marquee rows */}
          <MarqueeRow images={galleryRow1} speed={35} height={300} onImageClick={setLightboxImg} />
          <MarqueeRow images={galleryRow2} speed={28} height={260} reverse onImageClick={setLightboxImg} />
          <MarqueeRow images={galleryRow3} speed={32} height={280} onImageClick={setLightboxImg} />

          {/* edge fades */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 left-0 z-10"
            style={{ width: "10rem", background: "linear-gradient(to right, #0a0a0f, transparent)" }}
          />
          <div
            className="pointer-events-none absolute top-0 bottom-0 right-0 z-10"
            style={{ width: "10rem", background: "linear-gradient(to left, #0a0a0f, transparent)" }}
          />
        </div>
      </section>

      {/* ─── lightbox ─── */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8"
            onClick={() => setLightboxImg(null)}
          >
            <button
              className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
              onClick={() => setLightboxImg(null)}
            >
              <X className="w-8 h-8" />
            </button>
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={lightboxImg}
              alt="Gallery"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════ CTA / REGISTER ═══════════════════ */}
      <Section id="register" className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#12091f] to-[#0a0a0f]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-full blur-[120px]" />

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-500/20">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl sm:text-6xl font-black leading-tight">
              Ready to Begin Your{" "}
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                Spiritual Journey?
              </span>
            </h2>
            <p className="mt-6 text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
              Limited seats available. Register now to secure your spot on this
              transformative pilgrimage to the sacred land of Vraj.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="group px-10 py-5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold text-lg hover:shadow-2xl hover:shadow-amber-500/30 transition-all duration-300 hover:scale-105 flex items-center gap-3">
                Register for Yatra
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <p className="mt-6 text-white/30 text-sm">
              Registration opens soon • Stay tuned for updates
            </p>
          </motion.div>
        </div>
      </Section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="relative border-t border-white/5 py-12 px-6">
        <div className="absolute inset-0 bg-[#0a0a0f]" />
        <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-white/30 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
              <Sun className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white/50">
              Kartik Vraj Yatra 2026
            </span>
          </div>
          <div className="flex items-center gap-6">
            {["About", "Highlights", "Itinerary", "Gallery", "Contact"].map(
              (item) => (
                <button
                  key={item}
                  onClick={() =>
                    scrollTo(item.toLowerCase())
                  }
                  className="hover:text-amber-400 transition-colors"
                >
                  {item}
                </button>
              )
            )}
          </div>
          <p>Hare Krishna · All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}
