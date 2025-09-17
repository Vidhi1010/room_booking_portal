import React from "react";

export function EventCards() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
      {[
        {
          title: "Mangal Aarti",
          desc: "Soulful morning programs to fill your heart with krishna prema",
          icon: "🪔",
          gradient: "from-orange-400 to-red-400",
        },
        {
          title: "Blissful Darshans ",
          desc: "Darshans at Jaipur’s most sacred temples",
          icon: "🙏",
          gradient: "from-purple-400 to-pink-400",
        },
        {
          title: "Hari Kathas",
          desc: "Enlivening Hari Kathas from senior devotees",
          icon: "📖",
          gradient: "from-blue-400 to-cyan-400",
        },
        {
          title: "Bhajan Sandhya",
          desc: "An enchanting evening of devotional music, bhajans, and spiritual satsang",
          icon: "🎵",
          gradient: "from-green-400 to-teal-400",
        },
        {
          title: "Krishna Leela",
          desc: "Dramatic performances depicting the divine plays and stories of Lord Krishna",
          icon: "🎭",
          gradient: "from-yellow-400 to-orange-400",
        },
        {
          title: "Delicious Prasadam",
          desc: "Sacred food offerings blessed and distributed to all devotees",
          icon: "🍽️",
          gradient: "from-pink-400 to-rose-400",
        },
      ].map((ev, i) => (
        <div
          key={i}
          className={`bg-gradient-to-br ${ev.gradient} p-1 rounded-2xl shadow-lg hover:scale-105 transition-all`}
        >
          <div className="bg-white rounded-2xl p-6 h-full">
            <div className="text-4xl mb-4">{ev.icon}</div>
            <h4 className="font-bold text-gray-800 text-xl mb-2">
              {ev.title}
            </h4>
            <p className="text-gray-600 mb-4 leading-relaxed">
              {ev.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}