import StoreMapClient from "./StoreMapClient";

export default async function StoreMapPage() {
  const kakaoApiKey = process.env.JAVA_SCRIPT_KEY || "";
  
  let initialIndustries = [];
  let initialRegions = [];

  try {
    const res = await fetch("http://localhost:8080/api/v1/sim/store-list", {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      initialIndustries = data.indust_cats || [];
      initialRegions = data.reg_codes || [];
    } else {
      console.error("Backend store-list API returned status:", res.status);
    }
  } catch (e) {
    console.error("Failed to fetch store-list in page.tsx:", e);
  }

  return (
    <StoreMapClient 
      kakaoApiKey={kakaoApiKey} 
      initialIndustries={initialIndustries}
      initialRegions={initialRegions}
    />
  );
}
