import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = "G-71WWLGG2NJ";

export const initGA = () => {
  ReactGA.initialize(GA_MEASUREMENT_ID);
};

export const trackPageView = (path) => {
  ReactGA.send({ hitType: "pageview", page: path });
};

export const trackEvent = (category, action, label) => {
  ReactGA.event({ category, action, label });
};
