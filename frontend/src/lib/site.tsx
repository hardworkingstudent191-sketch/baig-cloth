import { createContext, useContext, type ReactNode } from "react";
import { api } from "./api";
import { useFetch } from "./useFetch";
import type { SiteSettings } from "./types";

/**
 * Store & brand settings (WhatsApp number, hours, socials, announcement…)
 * are fetched once and shared by header, footer, buttons and the store page.
 * Until they arrive — or if the API is unreachable — sensible defaults keep
 * every WhatsApp button working.
 */
const FALLBACK: SiteSettings = {
  name: "Baig Cloth",
  tagline: "Unstitched fabric, chosen by hand.",
  about_story: "",
  established: "",
  whatsapp: "923265382969",
  phone_display: "+92 326 5382969",
  email: "",
  address: ["Faisalabad, Punjab"],
  city: "Faisalabad",
  hours: [],
  map: { url: "", lat: null, lng: null },
  social: {},
  announcement: null,
  delivery_note: "",
};

const SiteContext = createContext<{ site: SiteSettings; loaded: boolean }>({ site: FALLBACK, loaded: false });

export function SiteProvider({ children }: { children: ReactNode }) {
  const { data } = useFetch((signal) => api.site(signal), "site");
  return <SiteContext.Provider value={{ site: data ?? FALLBACK, loaded: data !== null }}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteSettings {
  return useContext(SiteContext).site;
}
