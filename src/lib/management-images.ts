import twoAAsset from "@/assets/management/2a.jpeg.asset.json";
import fadAsset from "@/assets/management/fad.jpeg.asset.json";
import soveAsset from "@/assets/management/sove.jpeg.asset.json";
import dappiAsset from "@/assets/management/dappi.jpeg.asset.json";
import fwazAsset from "@/assets/management/fwaz.jpeg.asset.json";
import fahadAsset from "@/assets/management/fahad.jpeg.asset.json";
import naroAsset from "@/assets/management/naro.jpeg.asset.json";

export const DEFAULT_MANAGEMENT_IMAGES = [
  twoAAsset.url,
  fadAsset.url,
  soveAsset.url,
  dappiAsset.url,
  fwazAsset.url,
  fahadAsset.url,
  naroAsset.url,
] as const;

export const MANAGEMENT_MEMBERS = [
  { name: "2A", role: "OWNER" },
  { name: "FAD", role: "OWNER" },
  { name: "SOVE", role: "FOUNDER" },
  { name: "DAPPI", role: "FOUNDER" },
  { name: "FWAZ", role: "FOUNDER" },
  { name: "FAHAD", role: "DEV DIRECTOR" },
  { name: "NARO", role: "DEV DIRECTOR" },
] as const;