// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: [
    "primeflex/primeflex.css",
    "primevue/resources/themes/md-dark-deeppurple/theme.css",
  ],
  devtools: { enabled: true },
  modules: ["nuxt-primevue", "@pinia/nuxt"],
});
