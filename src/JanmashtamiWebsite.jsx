import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  Star,
  Heart,
  Calendar,
  MapPin,
  Clock,
  Phone,
  Mail,
  Users,
  Music,
  ArrowRight,
  Camera,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Gift,
  Sparkles,
} from "lucide-react";

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
    "https://images.unsplash.com/photo-1578928948310-8df65d68b8a8?w=1400&q=80", 
    "https://images.unsplash.com/photo-1627894483866-8ce2e6d16913?w=1400&q=80",
  ];

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

  // countdown (August 10, 2025 as per website)
  useEffect(() => {
    const target = new Date("2025-08-10T18:00:00").getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft({ days: 30, hours: 10, minutes: 20, seconds: 52 });
        clearInterval(interval);
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
          scrollY > 60 ? "bg-gradient-to-r from-orange-600 to-red-600 backdrop-blur-md shadow-xl" : "bg-black/20"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center shadow-lg border-2 border-white/20">
              <span className="text-white text-xl">🕉️</span>
            </div>
            <div>
              <div className="text-white font-bold text-lg">Jaipur Kartik Yatra 2025</div>
              <div className="text-orange-200 text-xs">Jaipur • ISKCON</div>
            </div>
          </div>

          <div className="hidden md:flex gap-6">
            {["home", "about", "events", "gallery", "contact"].map((s) => (
              <button
                key={s}
                onClick={() => scrollToSection(s)}
                className="text-white hover:text-orange-200 font-medium px-3 py-2 rounded-md hover:bg-white/10 transition-all"
              >
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="text-white p-2 focus:outline-none hover:bg-white/10 rounded"
              aria-label="toggle menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center gap-1">
                <span className={`block h-0.5 w-full bg-white transform transition-all ${isMenuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
                <span className={`block h-0.5 w-full bg-white transition-all ${isMenuOpen ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 w-full bg-white transform transition-all ${isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
              </div>
            </button>
          </div>
        </div>

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
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <header id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, orange 1px, transparent 1px), 
                             radial-gradient(circle at 75% 75%, orange 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* slides */}
        {heroImages.map((src, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-all duration-1000 ${i === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-110 pointer-events-none"}`}
            aria-hidden={i !== currentSlide}
          >
            <img src={src} alt={`Hero ${i + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-orange-900/60 to-purple-900/70" />
          </div>
        ))}

        <div className="relative z-10 text-center px-4 max-w-5xl">
          <div className="text-7xl md:text-9xl mb-6">
            <span className="animate-bounce inline-block">🌟</span>
            <span className="animate-pulse inline-block mx-4">🪔</span>
            <span className="animate-bounce inline-block animation-delay-300">✨</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 mb-4 drop-shadow-lg">
            Jaipur Kartik Yatra
          </h1>
          
          <div className="text-2xl md:text-3xl font-bold text-white mb-2">Kartik Yatra 2025</div>
          
          <p className="text-lg md:text-xl text-orange-200 mb-6 max-w-3xl mx-auto">
            🙏 Celebrating the Lord Krishna with devotion, music, and community
          </p>

          {/* Event details badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 mb-6">
            <Gift className="w-5 h-5 text-yellow-300" />
            
          </div>

          {/* countdown */}
          <div className="flex justify-center gap-3 mb-8">
            {[
              { label: "Days", value: timeLeft.days },
              { label: "Hours", value: timeLeft.hours },
              { label: "Minutes", value: timeLeft.minutes },
              { label: "Seconds", value: timeLeft.seconds },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-md border border-white/20 px-4 py-3 rounded-xl text-white min-w-[70px] shadow-lg">
                <div className="text-2xl md:text-3xl font-bold">{item.value}</div>
                <div className="text-xs opacity-80 font-medium">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => scrollToSection("events")}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full font-semibold shadow-xl hover:scale-105 hover:shadow-2xl transition-all flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Join Celebrations
            </button>
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

        {/* Slide indicators */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-3 h-3 rounded-full transition-all ${i === currentSlide ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      </header>

      {/* QUICK INFO */}
      <section className="py-12 bg-white shadow-inner">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
          {[
            { icon: Calendar, title: "Date", value: "August 10, 2025", color: "text-blue-600" },
            { icon: MapPin, title: "Venue", value: " ISKCON, Jaipur", color: "text-green-600" },
            { icon: Gift, title: "Prasadam", value: "Prasadam", color: "text-purple-600" },
            { icon: Users, title: "Expected", value: "2000+ Devotees", color: "text-orange-600" }
          ].map((item, idx) => (
            <div key={idx} className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 text-center shadow-lg hover:scale-105 hover:shadow-xl transition-all border border-orange-100">
              <item.icon className={`mx-auto w-8 h-8 ${item.color} mb-4`} />
              <div className="text-2xl font-bold text-gray-800 mb-1">{item.value}</div>
              <div className="text-sm text-gray-600 font-medium">{item.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-20 bg-gradient-to-b from-orange-50 to-yellow-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 text-6xl">🪔</div>
          <div className="absolute top-20 right-20 text-4xl">🌺</div>
          <div className="absolute bottom-20 left-20 text-5xl">🕉️</div>
          <div className="absolute bottom-10 right-10 text-4xl">🎵</div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6">
            About Yatra
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto mb-8"></div>
          
          <p className="text-lg md:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed mb-8">
            . 
            This sacred festival brings together devotees from all walks of life to celebrate through devotional songs, cultural performances, 
            midnight aarti.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {[
              {
                icon: "🎵",
                title: "Kirtan & Bhajans",
                desc: "Soul-stirring devotional music and chanting sessions"
              },
              {
                icon: "💃",
                title: "Cultural Dance",
                desc: "Traditional dance performances celebrating Krishna's life"
              },
              {
                icon: "🥛",
                title: "Prasadam",
                desc: "Sacred food offerings blessed and shared with all"
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg hover:scale-105 transition-all">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-orange-900 text-xl mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
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
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Evening Aarti",
                date: "August 10, 2025",
                time: "6:00 PM - 7:30 PM",
                desc: "Traditional evening prayers and devotional songs to welcome the celebration",
                icon: "🪔",
                gradient: "from-orange-400 to-red-400"
              },
              {
                title: "Midnight Celebration",
                date: "August 10-11, 2025",
                time: "11:30 PM - 12:30 AM",
                desc: "Sacred midnight aarti marking the birth of Lord Krishna with special prayers",
                icon: "🌙",
                gradient: "from-purple-400 to-pink-400"
              },
              {
                title: "Dahi Handi",
                date: "August 11, 2025",
                time: "10:00 AM - 1:00 PM",
                desc: "Traditional Dahi Handi competition with teams and exciting cultural performances",
                icon: "🥛",
                gradient: "from-blue-400 to-cyan-400"
              },
              {
                title: "Bhajan Sandhya",
                date: "August 10, 2025",
                time: "7:30 PM - 9:00 PM",
                desc: "An enchanting evening of devotional music, bhajans, and spiritual satsang",
                icon: "🎵",
                gradient: "from-green-400 to-teal-400"
              },
              {
                title: "Krishna Leela",
                date: "August 11, 2025",
                time: "2:00 PM - 4:00 PM",
                desc: "Dramatic performances depicting the divine plays and stories of Lord Krishna",
                icon: "🎭",
                gradient: "from-yellow-400 to-orange-400"
              },
              {
                title: "Prasadam Distribution",
                date: "August 10-11, 2025",
                time: "Throughout the event",
                desc: "Sacred food offerings blessed and distributed to all devotees and visitors",
                icon: "🍽️",
                gradient: "from-pink-400 to-rose-400"
              },
            ].map((ev, i) => (
              <div key={i} className={`bg-gradient-to-br ${ev.gradient} p-1 rounded-2xl shadow-lg hover:scale-105 transition-all`}>
                <div className="bg-white rounded-2xl p-6 h-full">
                  <div className="text-4xl mb-4">{ev.icon}</div>
                  <h4 className="font-bold text-gray-800 text-xl mb-2">{ev.title}</h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">{ev.desc}</p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> {ev.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> {ev.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="py-20 bg-gradient-to-b from-orange-50 to-yellow-50">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            Festival Memories
          </h3>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto mb-12"></div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {heroImages.concat([
              "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
              "https://images.unsplash.com/photo-1502781252888-9143ba7f074e?w=800&q=80"
            ]).map((src, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden shadow-lg cursor-pointer group hover:scale-105 transition-all"
                onClick={() => setLightbox(src)}
              >
                <div className="relative">
                  <img src={src} alt={`Gallery ${i + 1}`} className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      <span className="text-sm font-semibold">Janmashtami Celebration</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* lightbox */}
        {lightbox && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal="true"
          >
            <img src={lightbox} alt="Lightbox" className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl" />
            <button 
              className="absolute top-4 right-4 text-white text-4xl hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center"
              onClick={() => setLightbox(null)}
            >
              ×
            </button>
          </div>
        )}
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            Get In Touch
          </h3>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto mb-12"></div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h4 className="text-2xl font-bold text-orange-900 mb-6">Event Information</h4>
                <div className="space-y-6">
                  {[
                    {
                      icon: MapPin,
                      title: "Venue",
                      value: " ISKCON, Jaipur",
                      subtitle: "ISKCON, Jaipur - 111111",
                      color: "text-green-600"
                    },
                    {
                      icon: Phone,
                      title: "Contact",
                      value: "+91-xxxxx xxxxx",
                      subtitle: "Call for any queries",
                      color: "text-blue-600"
                    },
                    {
                      icon: Mail,
                      title: "Email",
                      value: "iskonjaipur.cp@gmail.com",
                      subtitle: "For event details and support",
                      color: "text-purple-600"
                    },
                    {
                      icon: Users,
                      title: "Organized By",
                      value: "ISCKON, Jaipur",
                      subtitle: "Cultural organization",
                      color: "text-orange-600"
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl">
                      <item.icon className={`w-6 h-6 ${item.color} mt-1 flex-shrink-0`} />
                      <div>
                        <div className="font-semibold text-gray-800">{item.title}</div>
                        <div className="text-gray-900 font-medium">{item.value}</div>
                        <div className="text-sm text-gray-600">{item.subtitle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xl font-bold text-orange-900 mb-4">Follow ISKCON Jaipur</h4>
                <div className="flex gap-4">
                  {[
                    { icon: Instagram, label: "Instagram", color: "hover:bg-pink-600" },
                    { icon: Facebook, label: "Facebook", color: "hover:bg-blue-600" },
                    { icon: Twitter, label: "Twitter", color: "hover:bg-sky-600" },
                    { icon: Youtube, label: "YouTube", color: "hover:bg-red-600" },
                  ].map((social, idx) => (
                    <button
                      key={idx}
                      className={`w-12 h-12 rounded-full bg-gray-100 ${social.color} hover:text-white flex items-center justify-center transition-all hover:scale-110`}
                      aria-label={social.label}
                    >
                      <social.icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 shadow-lg">
              <h4 className="text-2xl font-bold text-orange-900 mb-6">Send us a Message</h4>
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Thank you for your interest! We'll respond soon. 🙏");
                  e.target.reset();
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                  <input 
                    name="name" 
                    required 
                    placeholder="Enter your full name" 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input 
                    name="email" 
                    type="email" 
                    required 
                    placeholder="your.email@example.com" 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea 
                    name="message" 
                    rows="5" 
                    required 
                    placeholder="Ask about the event, volunteer opportunities, or anything else..." 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none" 
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">We'll respond within 24 hours</div>
                  <button 
                    type="submit" 
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    Send Message
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
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
                  <span className="text-2xl">🕉️</span>
                </div>
                <div>
                  <div className="font-bold text-xl">Jaipur Kartik Yatra 2025</div>
                  <div className="text-orange-200 text-sm">ISKCON, Jaipur</div>
                </div>
              </div>
              <p className="text-orange-200 text-sm leading-relaxed">
                Join us in celebrating the divine Lord Krishna with devotion, music, and community spirit at ISKCON Jaipur.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-lg mb-4">Quick Links</h5>
              <div className="space-y-2">
                {["About Event", "Schedule", "Gallery", "Contact"].map((link) => (
                  <button
                    key={link}
                    onClick={() => scrollToSection(link.toLowerCase().replace(" ", ""))}
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
                <div>📅 August 10, 2025</div>
                <div>📍 Kalyan Mandapam, IIT Delhi</div>
                <div>📞 +91-95083-14944</div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-orange-200">
              © {new Date().getFullYear()} Sreshtha Club, IIT Delhi. All rights reserved.
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-orange-200">Made with</span>
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-sm text-orange-200">for Krishna devotees</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}