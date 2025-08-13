export default {
    nav: {
        home: "Inicio",
        projects: "Proyectos",
        contact: "Contacto",
    },
    home: {
        intro: "Hola, soy Isaí Tobar",
        role: "Desarrollador de Software",
        subtitle: "Transformando ideas en experiencias digitales interactivas y fluidas con desarrollo frontend de vanguardia.",
    },
    footer: {
        rights: "Todos los derechos reservados.",
        builtWith: "Construido con",
        styledWith: "Estilizado con",
        deployedOn: "Desplegado en",
    },
    skills: {
        title: "Lo que hago 👌",
        list: ["JavaScript", "TypeScript", "Astro", "React"],
        categories: {
            web: "Desarrollo Web",
            mobile: "Desarrollo Móvil",
            uiux: "Diseño UI/UX & Prototipado",
        },
    },
    contact: {
        heading: "Hablemos",
        title: "Contacto",
        paragraph: "¿Tienes una pregunta o un proyecto en mente? No dudes en escribirme.",
        location: "Ubicación:",
        form: {
            name: "Nombre",
            email: "Correo",
            message: "Mensaje",
            submit: "Enviar",
            success: "✅ ¡Gracias por tu mensaje!",
            error: "Hubo un problema al enviar tu mensaje.",
        },
    },
    projects: {
        myWork: "Mi trabajo",
        title: "Proyectos",
        more: "Más proyectos en",
    },
    likes: {
        label: (count: number) => `${count} Me gusta`,
        aria: (count: number, liked: boolean) => {
            const base = `${count} Me gusta`;
            return liked
                ? `${base}. Ya diste like. Pulsa para quitar.`
                : `${base}. Pulsa para dar like.`;
        },
        thanks: '¡Gracias por tu like!',
        wait: 'Espera un momento...',
        rateLimited: 'Has interactuado demasiado rápido. Intenta más tarde.',
        noPermission: 'No tienes permisos para actualizar los likes.',
        loadError: 'Error cargando likes.',
    },
};
