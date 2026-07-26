const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const API_BASE = isLocal
  ? "https://23bqlz3il2.execute-api.ap-south-1.amazonaws.com/stg"
  : "https://lp0pdlvnca.execute-api.ap-south-1.amazonaws.com/prd";
