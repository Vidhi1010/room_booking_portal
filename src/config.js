const hostname = window.location.hostname;

console.log("===NODE_ENV===", process.env.NODE_ENV, "===HOSTNAME===", hostname);

export const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
export const isStaging = hostname.startsWith("staging");
export const isProduction = hostname === "yatra.iskconjiasarai.com";

export const getApiBase = () => {
  if(isStaging) return "https://23bqlz3il2.execute-api.ap-south-1.amazonaws.com/stg";
  if(isProduction) return "https://lp0pdlvnca.execute-api.ap-south-1.amazonaws.com/prd";

  return "http://localhost:3000";
}

export const API_BASE = getApiBase();
