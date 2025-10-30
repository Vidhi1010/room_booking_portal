import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import {
  ChevronDown,
  Star,
  Heart,
  Calendar,
  MapPin,
  Clock,
  Phone,
  Users,
  ArrowRight,
  Camera,
  Gift,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ImageSlider } from "./ImageSlider";
import { EventCards } from "./EventCards";

const NextArrow = ({ onClick }) => (
  <div
    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer z-10 bg-white/80 hover:bg-orange-500 hover:text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-110"
    onClick={onClick}
  >
    <ChevronRight className="w-6 h-6" />
  </div>
);

const PrevArrow = ({ onClick }) => (
  <div
    className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer z-10 bg-white/80 hover:bg-orange-500 hover:text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-110"
    onClick={onClick}
  >
    <ChevronLeft className="w-6 h-6" />
  </div>
);

const LazyImage = ({ src, alt, className, onClick }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={className} onClick={onClick}>
      {!isLoaded && (
        <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-2xl"></div>
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
};

export default function JanmashtamiWebsite() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    days: "--",
    hours: "--",
    minutes: "--",
    seconds: "--",
  });
  const [lightbox, setLightbox] = useState(null);

  const heroImages = [
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1400&q=80",
    "https://www.rupanugabhajanashram.com/wp-content/uploads/2023/12/12-sri-sri-radha-Govinda-dev-ji-mandira-featured.jpg",
  ];

  const [gallerySlide, setGallerySlide] = useState(0);

  const eventGalleryImages = [
    "./gallery/1.jpg",
    "./gallery/7.jpg",
    "./gallery/5.jpg",
    "./gallery/14.jpg",
    "./gallery/19.jpg",
    "./gallery/27.jpg",
    "./gallery/30.jpg",
  ];

  // Gallery images
  const galleryImages = [
    "./gallery/8.jpg",
    "./gallery/7.jpg",
    "./gallery/3.jpg",
    "./gallery/5.jpg",
    "./gallery/6.jpg",
    "./gallery/2.jpg",
    "./gallery/1.jpg",
    "./gallery/9.jpg",
    "./gallery/10.jpg",
    "./gallery/11.jpg",
    "./gallery/12.jpg",
    "./gallery/13.jpg",
    "./gallery/14.jpg",
    "./gallery/15.jpg",
    "./gallery/16.jpg",
    "./gallery/17.jpg",
    "./gallery/18.jpg",
    "./gallery/20.jpg",
    "./gallery/19.jpg",
    "./gallery/21.jpg",
    "./gallery/22.jpg",
    "./gallery/23.jpg",
    "./gallery/24.jpg",
    "./gallery/25.jpg",
    "./gallery/26.jpg",
    "./gallery/27.jpg",
    "./gallery/28.jpg",
    "./gallery/29.jpg",
    "./gallery/30.jpg",
    "./gallery/31.jpg",
    "./gallery/32.jpg",
    "./gallery/33.jpg",
    "./gallery/34.jpg",
    "./gallery/35.jpg",
    "./gallery/36.jpg",
    "./gallery/38.jpg",
    "./gallery/39.jpg",
    "./gallery/40.jpg",
  ];
  const slidesToShow = 1;
  const maxGallerySlide = Math.max(0, galleryImages.length - slidesToShow);

  const nextGallerySlide = () => {
    setGallerySlide((prev) => (prev + 1) % galleryImages.length);
  };

  const prevGallerySlide = () => {
    setGallerySlide((prev) =>
      prev - 1 < 0 ? galleryImages.length - 1 : prev - 1
    );
  };

  // Gallery auto slide
  /* useEffect(() => {
  const t = setInterval(() => {
    setGallerySlide((p) => (p + 1) % (maxGallerySlide + 1));
  }, 5000); // change slide every 5s
  return () => clearInterval(t);
}, [maxGallerySlide]); */

  // slider auto advance
  useEffect(() => {
    const t = setInterval(() => {
      setCurrentSlide((p) => (p + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  // sticky nav state
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const eventDate = new Date("2025-10-05T23:59:59").getTime(); // Event start
      const diff = eventDate - now;

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-yellow-50 to-pink-50 text-gray-900">
      {/* NAV */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 60
            ? "bg-gradient-to-r from-orange-600 to-red-600 backdrop-blur-md shadow-xl"
            : "bg-black/20"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center shadow-lg border-2 border-white/20">
              <span className="text-white text-xl">🦚</span>
            </div>
            <div>
              <div className="text-white font-bold text-lg">
                Jaipur Kartik Yatra 2025
              </div>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-6 items-center">
            {["home", "about", "events", "gallery", "contact"].map((s) => (
              <button
                key={s}
                onClick={() => scrollToSection(s)}
                className="text-white hover:text-orange-200 font-medium px-3 py-2 rounded-md hover:bg-white/10 transition-all"
              >
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}

            {/* Register Button for Desktop */}
            <button
              onClick={() => (window.location.href = "/room-booking")}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full font-semibold hover:scale-105 transition-all"
            >
              Register
            </button>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="text-white p-2 focus:outline-none hover:bg-white/10 rounded"
              aria-label="toggle menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center gap-1">
                <span
                  className={`block h-0.5 w-full bg-white transform transition-all ${
                    isMenuOpen ? "rotate-45 translate-y-1.5" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-full bg-white transition-all ${
                    isMenuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-full bg-white transform transition-all ${
                    isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-gradient-to-r from-orange-600 to-red-600 backdrop-blur-md">
            <div className="flex flex-col px-4 py-2">
              {["home", "about", "events", "gallery", "contact"].map((s) => (
                <button
                  key={s}
                  onClick={() => scrollToSection(s)}
                  className="text-white text-left py-3 border-b border-white/20 hover:bg-white/10 transition-all"
                >
                  {s[0].toUpperCase() + s.slice(1)}
                </button>
              ))}

              {/* Register Button for Mobile */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  window.location.href = "/room-booking";
                }}
                className="text-white text-left py-3 border-b border-white/20 hover:bg-white/10 transition-all"
              >
                Register
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <header
        id="home"
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, orange 1px, transparent 1px), 
                             radial-gradient(circle at 75% 75%, orange 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* slides */}
        {heroImages.map((src, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-all duration-1000 ${
              i === currentSlide
                ? "opacity-100 scale-100"
                : "opacity-0 scale-110 pointer-events-none"
            }`}
            aria-hidden={i !== currentSlide}
          >
            <img
              src={src}
              alt={`Hero ${i + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-orange-900/60 to-purple-900/70" />
          </div>
        ))}

        <div className="relative z-10 text-center px-4 max-w-5xl">
          <div className="text-7xl md:text-9xl mb-6">
            <span className="animate-bounce inline-block">🌟</span>
            <span className="animate-pulse inline-block mx-4">🪔</span>
            <span className="animate-bounce inline-block animation-delay-300">
              ✨
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 mb-4 drop-shadow-lg">
            Jaipur Kartik Yatra 2025
          </h1>

          <div className="text-2xl md:text-3xl font-bold text-white mb-2">
            A sacred spiritual journey through Jaipur’s most revered temples
          </div>

          <p className="text-lg md:text-xl text-orange-200 mb-6 max-w-3xl mx-auto">
            🙏🙏🙏
          </p>

          {/* countdown */}
          {/* <div className="flex justify-center gap-3 mb-8">
            {[
              { label: "Days", value: timeLeft.days },
              { label: "Hours", value: timeLeft.hours },
              { label: "Minutes", value: timeLeft.minutes },
              { label: "Seconds", value: timeLeft.seconds },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-md border border-white/20 px-4 py-3 rounded-xl text-white min-w-[70px] shadow-lg"
              >
                <div className="text-2xl md:text-3xl font-bold">
                  {item.value}
                </div>
                <div className="text-xs opacity-80 font-medium">
                  {item.label}
                </div>
              </div>
            ))}
          </div> */}

          {/* donation */}
          <div className="text-center mt-6">
            <button
              onClick={() =>
                window.open("https://pages.razorpay.com/iskjs", "_blank")
              }
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full font-semibold shadow-xl hover:scale-105 hover:shadow-2xl transition-all flex items-center gap-2 justify-center mx-auto"
            >
              🙏 Donate & Support the Yatra
            </button>
            <br />
            <br />
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            {/* <Link
              to="/room-booking"
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full font-semibold shadow-xl hover:scale-105 hover:shadow-2xl transition-all flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Yatra Registration
            </Link> */}
            <button
              onClick={() => scrollToSection("contact")}
              className="border-2 border-white/60 text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-orange-900 transition-all backdrop-blur-md bg-white/10"
            >
              Get Details
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-white/80" />
        </div>
      </header>

      {/* ABOUT */}
      <section
        id="about"
        className="py-20 bg-gradient-to-b from-orange-50 to-yellow-50 relative overflow-hidden"
      >
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6 text-center md:text-center">
            About Yatra
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto mb-12"></div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Poster Image */}
            <div className="h-full w-full">
              <img
                src="./gallery/4.png"
                alt="Kartik Jaipur Yatra 2025 Poster"
                className="rounded-2xl shadow-xl w-full h-auto"
                loading="lazy"
              />
            </div>

            {/* Right Column - Text + Button */}
            <div className="text-gray-700 space-y-4 leading-relaxed text-lg md:text-xl">
              <p>
                In the sacred month of Kartik, when every step taken towards
                devotion brings multiplied blessings, we invite you to embark on
                a soul-nourishing journey — the Kartik Jaipur Yatra 2025.
              </p>
              <p>
                Over three days, devotees will immerse themselves in the divine
                atmosphere of Jaipur, visiting historic temples where the
                presence of the Lord is deeply felt — Govind Dev Ji, Radha
                Gopinath, Radha Madhav, Galtaji, Khole Ke Hanuman Ji, and the
                serene Kanak Bagh.
              </p>
              <p>
                This yatra is more than a pilgrimage; it is an opportunity to
                pause from daily routines and reconnect with what truly matters
                — satsang, seva, kirtan, and darshan. Surrounded by the company
                of devotees and guided under the divine association of HG Sundar
                Gopal Prabhu ji and HG Ashraya Prabhu ji, the holy names resound
                in every heart, filling the soul with joy, peace, and strength.
              </p>

              <p className="font-semibold text-orange-700">✨ Why Join?</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Receive the mercy of Jaipur’s ancient deities.</li>
                <li>
                  Deepen your devotion through kirtan, association, and
                  discourses.
                </li>
                <li>Experience the warmth of a vibrant devotee community.</li>
                <li>
                  Recharge spiritually while enjoying the beauty of Jaipur’s
                  sacred heritage.
                </li>
              </ul>

              <p>
                ✨ Whether you come seeking blessings, association, or simply
                the joy of serving, the Kartik Jaipur Yatra 2025 will leave your
                heart enriched and uplifted.
              </p>

              {/* Register Button */}
              <div className="mt-6">
                <Link
                  to="/room-booking"
                  className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full font-semibold shadow-xl hover:scale-105 transition-all"
                >
                  Register Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK INFO */}
      <section className="py-12 bg-white shadow-inner">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
          {[
            {
              icon: Calendar,
              title: "Yatra Starts in Jaipur",
              value: "October 31, 2025, 10:00 AM",
              color: "text-blue-600",
            },
            {
              icon: Calendar,
              title: "Yatra ends in Jaipur",
              value: "November 2, 2025, 5:00 PM",
              color: "text-green-600",
            },
            {
              icon: MapPin,
              title: "Accommodation",
              value: "Hotel Amer City Heritage, Jaipur",
              color: "text-purple-600",
            },
            {
              icon: Users,
              title: "Expected",
              value: "200+ Devotees",
              color: "text-orange-600",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 text-center shadow-lg hover:scale-105 hover:shadow-xl transition-all border border-orange-100"
            >
              <item.icon className={`mx-auto w-8 h-8 ${item.color} mb-4`} />
              <div className="text-2xl font-bold text-gray-800 mb-1">
                {item.value}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {item.title}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-yellow-50 to-orange-50">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4 mb-12">
            Event Highlights
          </h3>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto mb-12"></div>

          <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-2xl shadow-lg">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/Tzxcj2Jt3U4"
              title="Event Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section id="events" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            Festival Events
          </h3>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto mb-12"></div>

          <EventCards />

          <div className="mb-12">
            <ImageSlider
              settings={{
                dots: true,
                infinite: true,
                autoplay: true,
                speed: 500,
                slidesToShow: 1,
                slidesToScroll: 1,
                lazyLoad: true,
                nextArrow: <NextArrow />,
                prevArrow: <PrevArrow />,
                customPaging: (i) => (
                  <div className="w-4 h-4 rounded-full bg-orange-300/50 hover:bg-orange-400 transition-all" />
                ),
                appendDots: (dots) => (
                  <div className="mt-4">
                    <ul className="flex justify-center gap-1 list-none p-0 m-0">
                      {dots.map((dot, i) => (
                        <li key={i} className="relative">
                          {dot.props.className.includes("slick-active") ? (
                            <div className="w-4 h-4 bg-orange-500 rounded-full transition-all" />
                          ) : (
                            <div className="w-3 h-3 bg-gray-300 rounded-full opacity-50 hover:opacity-80 transition-all" />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
              }}
              images={eventGalleryImages.map((src, i) => (
                <div
                  key={i}
                  className="px-2 flex justify-center items-center"
                  style={{
                    width: "100%", // full width of slider
                    height: "600px", // fixed height for all images
                    minHeight: "300px", // ensures all slides have same height
                    maxHeight: "400px",
                  }}
                >
                  <img
                    src={src}
                    alt={`Gallery ${i + 1}`}
                    className="w-full h-[600px] object-cover rounded-2xl shadow-lg"
                  />
                </div>
              ))}
            />
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section
        id="gallery"
        className="py-20 bg-gradient-to-b from-orange-50 to-yellow-50"
      >
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            Festival Memories
          </h3>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto mb-12"></div>

          {/* Gallery Slider */}
          <div>
            <ImageSlider
              settings={{
                dots: true,
                infinite: true,
                autoplay: true,
                speed: 500,
                slidesToShow: 1,
                slidesToScroll: 1,
                lazyLoad: true,
                nextArrow: <NextArrow />,
                prevArrow: <PrevArrow />,
                customPaging: (i) => (
                  <div className="w-4 h-4 rounded-full bg-orange-300/50 hover:bg-orange-400 transition-all" />
                ),
                appendDots: (dots) => (
                  <div className="mt-4">
                    <ul className="flex justify-center gap-1 list-none p-0 m-0">
                      {dots.map((dot, i) => (
                        <li key={i} className="relative">
                          {dot.props.className.includes("slick-active") ? (
                            <div className="w-4 h-4 bg-orange-500 rounded-full transition-all" />
                          ) : (
                            <div className="w-3 h-3 bg-gray-300 rounded-full opacity-50 hover:opacity-80 transition-all" />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
              }}
              images={galleryImages.map((src, i) => (
                <div
                  key={i}
                  className="px-2 flex justify-center items-center"
                  style={{
                    width: "100%", // full width of slider
                    height: "600px", // fixed height for all images
                    minHeight: "300px", // ensures all slides have same height
                    maxHeight: "400px",
                  }}
                >
                  <img
                    src={src}
                    alt={`Gallery ${i + 1}`}
                    className="w-full h-[600px] object-cover rounded-2xl shadow-lg"
                  />
                </div>
              ))}
            />
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            Get In Touch
          </h3>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto mb-12"></div>

          <div className="space-y-12">
            <div>
              <h4 className="text-2xl font-bold text-orange-900 mb-6">
                Event Information
              </h4>
              <div className="space-y-6">
                {[
                  {
                    icon: MapPin,
                    title: "Venue",
                    value: "Hotel Amer City Heritage",
                    subtitle:
                      "B-2, Near Brahmpuri Police Station, Amer Road, JAIPUR-302002 (Rajasthan) INDIA",
                    color: "text-green-600",
                  },
                  {
                    icon: Phone,
                    title: "Contact",
                    value: "Surya Narayana Das +91-7907737187",
                    subtitle: "Apurva Prem Das +91-9711460737",
                    color: "text-blue-600",
                  },
                  {
                    icon: Users,
                    title: "Organized By",
                    value: "ISKCON Jia Sarai BACE",
                    subtitle: "Cultural organization",
                    color: "text-orange-600",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-2 p-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl text-center"
                  >
                    <item.icon className={`w-6 h-6 ${item.color} mb-2`} />
                    <div className="font-semibold text-gray-800">
                      {item.title}
                    </div>
                    <div className="text-gray-900 font-medium">
                      {item.value}
                    </div>
                    <div className="text-sm text-gray-600">{item.subtitle}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gradient-to-r from-orange-900 via-red-900 to-purple-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🦚</span>
                </div>
                <div>
                  <div className="font-bold text-xl">
                    Jaipur Kartik Yatra 2025
                  </div>
                </div>
              </div>
              <p className="text-orange-200 text-sm leading-relaxed">
                Join us in celebrating the divine Lord Krishna with devotion,
                music, and community.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-lg mb-4">Quick Links</h5>
              <div className="space-y-2">
                {["About Event", "Gallery", "Contact"].map((link) => (
                  <button
                    key={link}
                    onClick={() =>
                      scrollToSection(link.toLowerCase().replace(" ", ""))
                    }
                    className="block text-orange-200 hover:text-white transition-colors text-sm"
                  >
                    {link}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-bold text-lg mb-4">Event Details</h5>
              <div className="space-y-2 text-sm text-orange-200">
                <div>📅 October 31, 2025</div>
                <div>📍 Hotel Amer City Heritage, Jaipur</div>
                <div>📞 +91-7907737187</div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-orange-200">
              © {new Date().getFullYear()}. All rights reserved.
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-orange-200">Made with</span>
              {/* <Heart className="w-4 h-4 text-red-400" /> */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="#f87171"
                className="text-red-400"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="text-sm text-orange-200">
                for Krishna devotees
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
