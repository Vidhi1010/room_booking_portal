// Kartik Govardhan Yatra 2026 — tentative schedule (2–4 October 2026).
// `highlight: true` bolds the row on both the landing preview and the full page.
// `preview: true` picks the row for the landing-page day-tab summary.

export const yatraSchedule = [
  {
    day: 1,
    label: "Day 1",
    date: "Friday, 2 October 2026",
    items: [
      { from: "5:00 AM",  to: null,       title: "Departure from Jia Sarai Parking via Faridabad–Palwal Highway", preview: true },
      { from: "9:00 AM",  to: null,       title: "Arrival in Govardhan Retreat Centre (GRC)", preview: true },
      { from: "8:30 AM",  to: "9:30 AM",  title: "Breakfast Prasadam at GRC" },
      { from: "9:30 AM",  to: "12:00 PM", title: "Settling in rooms and optional Mansi Ganga visit" },
      { from: "12:00 PM", to: "1:30 PM",  title: "Lecture @ GRC", highlight: true, preview: true },
      { from: "2:00 PM",  to: "2:30 PM",  title: "Lunch Prasadam @ GRC" },
      { from: "3:00 PM",  to: "4:00 PM",  title: "Travel to Vrindavan" },
      { from: "4:00 PM",  to: "5:00 PM",  title: "ISKCON Vrindavan Darshan", preview: true },
      { from: "5:00 PM",  to: "6:00 PM",  title: "Katha by Srila Prabhupada Disciples @ Vrindavan Temple", highlight: true, preview: true },
      { from: "6:00 PM",  to: "8:00 PM",  title: "Local temple visit" },
      { from: "8:00 PM",  to: "9:00 PM",  title: "Travel back to GRC" },
      { from: "9:00 PM",  to: "10:00 PM", title: "Dinner Prasadam @ GRC" },
      { from: "9:30 PM",  to: "10:00 PM", title: "Journalling" },
      { from: "10:00 PM", to: null,       title: "Rest" },
    ],
  },
  {
    day: 2,
    label: "Day 2",
    date: "Saturday, 3 October 2026",
    items: [
      { from: "3:30 AM",  to: null,       title: "Wake Up" },
      { from: "4:30 AM",  to: "5:00 AM",  title: "Mangala Aarti @ GRC", preview: true },
      { from: "5:00 AM",  to: "7:00 AM",  title: "Japa near Govardhan", preview: true },
      { from: "7:00 AM",  to: "7:30 AM",  title: "Guru Puja @ GRC Hall" },
      { from: "7:30 AM",  to: "9:00 AM",  title: "Lecture @ GRC Hall", highlight: true, preview: true },
      { from: "9:00 AM",  to: "9:30 AM",  title: "Breakfast Prasadam @ GRC" },
      { from: "10:00 AM", to: "11:00 AM", title: "Narsinha Temple & Mukharavind Temple" },
      { from: "11:00 AM", to: "1:00 PM",  title: "Break" },
      { from: "1:00 PM",  to: "2:30 PM",  title: "Lecture @ GRC", highlight: true },
      { from: "3:00 PM",  to: "3:30 PM",  title: "Prasad" },
      { from: "3:30 PM",  to: "8:00 PM",  title: "Visit to Radha Kund + Uddhav Kund + Kusuma Sarovar", preview: true },
      { from: "5:30 PM",  to: "7:30 PM",  title: "Kirtan Mela at Kusuma Sarovar — Pavan Nitai Pr & Team", highlight: true, preview: true },
      { from: "8:00 PM",  to: "8:30 PM",  title: "Return to GRC" },
      { from: "8:30 PM",  to: "9:30 PM",  title: "Dinner Prasadam @ GRC" },
      { from: "9:30 PM",  to: "10:00 PM", title: "Journalling" },
      { from: "10:00 PM", to: null,       title: "Rest" },
    ],
  },
  {
    day: 3,
    label: "Day 3",
    date: "Sunday, 4 October 2026",
    items: [
      { from: "3:30 AM",  to: null,       title: "Wake Up" },
      { from: "4:30 AM",  to: "5:00 AM",  title: "Mangala Aarti @ GRC", preview: true },
      { from: "5:00 AM",  to: "7:15 AM",  title: "Japa at GRC" },
      { from: "7:00 AM",  to: "7:30 AM",  title: "Guru Puja + Darshan Aarti @ GRC" },
      { from: "7:30 AM",  to: "9:00 AM",  title: "Lecture @ GRC", highlight: true, preview: true },
      { from: "9:00 AM",  to: "10:00 AM", title: "Breakfast Prasadam @ GRC" },
      { from: "10:00 AM", to: "11:00 AM", title: "Rest & Checkout" },
      { from: "11:00 AM", to: "12:30 PM", title: "Free time (Govardhan Visit & Shopping)", highlight: true, preview: true },
      { from: "1:00 PM",  to: "2:30 PM",  title: "Lecture @ GRC", highlight: true },
      { from: "3:00 PM",  to: "4:00 PM",  title: "Lunch @ GRC" },
      { from: "4:00 PM",  to: "7:00 PM",  title: "Visit: Bhandirvan, Taalvan & Vamsi Vata", preview: true },
      { from: "7:30 PM",  to: null,       title: "Yatra Ends: Departure to Delhi via Yamuna Expressway", highlight: true, preview: true },
    ],
  },
];

export const yatraDateRange = "2 – 4 October 2026";
