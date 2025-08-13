export default {
    nav: {
        home: "Home",
        projects: "Projects",
        contact: "Contact",
    },
    home: {
        intro: "Hi, I'm Isaí Tobar",
        role: "Software Developer",
        subtitle: "Transforming ideas into interactive and seamless digital experiences with cutting-edge frontend development.",
    },
    footer: {
        rights: "All rights reserved.",
        builtWith: "Built with",
        styledWith: "Styled with",
        deployedOn: "Deployed on",
    },
    skills: {
        title: "What I do?",
        list: ["JavaScript", "TypeScript", "Astro", "React"],
        categories: {
            web: "Web Development",
            mobile: "Mobile Development",
            uiux: "UI/UX Design & Prototyping",
        },
    },
    contact: {
        heading: "Let's talk",
        title: "Contact",
        paragraph: "Have a question or a project in mind? Feel free to reach out.",
        location: "Location:",
        form: {
            name: "Name",
            email: "Email",
            message: "Message",
            submit: "Submit",
            success: "✅ Thank you for your message!",
            error: "There was a problem sending your message.",
        },
    },
    projects: {
        myWork: "My work",
        title: "Projects",
        more: "More projects on",
    },
    likes: {
        label: (count: number) => `${count} Like${count === 1 ? '' : 's'}`,
        aria: (count: number, liked: boolean) => {
            const base = `${count} Like${count === 1 ? '' : 's'}`;
            return liked
                ? `${base}. You liked this. Press to remove your like.`
                : `${base}. Press to like.`;
        },
        thanks: 'Thanks for your like!',
        wait: 'Please wait a moment...',
        rateLimited: 'You are interacting too fast. Try later.',
        noPermission: 'No permission to update likes.',
        loadError: 'Error loading likes.',
    },
};
