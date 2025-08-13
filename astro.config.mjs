// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
    // TODO: Ajusta "site" (y opcionalmente "base") según si es User Page o Project Page en GitHub Pages
    // site: "https://TU_USUARIO.github.io",
    // base: "/NOMBRE-DEL-REPO/",
    integrations: [tailwind(), react()],
    vite: {
        resolve: {
            alias: {
                "@": "/src",
                "@components": "/src/components",
            },
        },
    },
    output: "static",
    build: {
        inlineStylesheets: "auto",
    },
    server: {
        host: true,
        port: 4321,
    },
    i18n: {
        locales: ["es", "en"],
        defaultLocale: "en",
        routing: {
            prefixDefaultLocale: false,
        },
    },
});
