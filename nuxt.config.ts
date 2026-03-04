import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  css: ["~/assets/css/tailwind.css"],

  app: {
    head: {
      htmlAttrs: { lang: "en" },
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "An unofficial API explorer for UKG Workforce Management. Authenticate and explore API endpoints without writing code.",
        },
        { property: "og:site_name", content: "WFM Relay" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
        { name: "robots", content: "index, follow" },
      ],
    },
  },

  runtimeConfig: {
    // Override via NUXT_WFM_TOKEN_URL_EVAL and NUXT_WFM_TOKEN_URL_PROD in .env
    wfmTokenUrlEval: '',
    wfmTokenUrlProd: '',
  },

  vite: {
    plugins: [tailwindcss() as any],
  },
  modules: ["shadcn-nuxt"],
  shadcn: {
    /**
     * Prefix for all the imported component.
     * @default "Ui"
     */
    prefix: "",
    /**
     * Directory that the component lives in.
     * Will respect the Nuxt aliases.
     * @link https://nuxt.com/docs/api/nuxt-config#alias
     * @default "@/components/ui"
     */
    componentDir: "@/components/ui",
  },
});