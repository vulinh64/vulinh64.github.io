// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {
    themes as prismThemes
} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
    markdown: {
        mermaid: true,
        hooks: {
            onBrokenMarkdownLinks: "warn",
            onBrokenMarkdownImages: "warn"
        }
    },
    plugins: [
        'docusaurus-plugin-zooming',
    ],
    title: 'Vu Linh Java',
    tagline: 'Random stuff I wrote (with some assistance from ChatGPT)',
    favicon: 'img/favicon.ico',

    // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
    future: {
        v4: true, // Improve compatibility with the upcoming Docusaurus v4
    },

    // Set the production url of your site here
    url: 'https://vulinhjava.io.vn',
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: '/',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    // organizationName: 'vulinh64', // Usually your GitHub org/user name.
    // projectName: 'vulinh64.github.io', // Usually your repo name.
    // deploymentBranch: 'gh-pages',

    onBrokenLinks: 'throw',

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    presets: [
        [
            'classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: false,
                blog: {
                    blogDescription: 'List of all my tech blog posts',
                    showReadingTime: true,
                    feedOptions: {
                        type: ['rss', 'atom'],
                        xslt: true,
                    },
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl: 'https://github.com/vulinh64/vulinh64.github.io/edit/main/',
                    // Useful options to enforce blogging best practices
                    onInlineTags: 'warn',
                    onInlineAuthors: 'warn',
                    onUntruncatedBlogPosts: 'warn',
                    blogSidebarTitle: 'Recent Posts',
                    blogSidebarCount: 12,
                    postsPerPage: 6,
                },
                theme: {
                    customCss: './src/css/custom.css',
                },
            }),
        ],
    ],

    themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            zooming: {
                selector: '.markdown img',
                delay: 500,
                background: {
                    light: 'rgba(101,108,133,0.8)',
                    dark: 'rgba(9,10,17,0.8)'
                },
                options: {}
            },
            blog: {
                sidebar: {
                    groupByYear: true
                }
            },
            announcementBar: {
                id: 'help_me',
                content: 'This website is a work in progress. Share your feedback on the <a target="_blank" rel="noopener noreferrer" href="https://github.com/vulinh64/vulinh64.github.io/issues">GitHub Issues</a> page to help me improve.',
                isCloseable: true
            },
            // Light mode is for the heretics!!!
            colorMode: {
                defaultMode: 'dark',
                disableSwitch: true,
            },
            metadata: [{
                name: 'keywords',
                content: 'java, blog, programming, tech, spring boot'
            }],
            image: 'img/icon.png',
            navbar: {
                title: 'Vu Linh Java',
                logo: {
                    alt: 'corrupted-sekiro',
                    src: 'img/icon.png',
                },
                items: [
                    {
                        label: 'Articles',
                        position: 'left',
                        items: [
                            {
                                to: '/blog',
                                label: 'All Articles',
                            },
                            {
                                to: '/blog/tags/java',
                                label: 'Java Articles',
                            },
                            {
                                to: '/blog/tags/spring-boot',
                                label: 'Spring Boot Articles',
                            }
                        ]
                    },
                    {
                        label: 'All Tags',
                        position: 'left',
                        to: '/blog/tags/',
                    },
                    {
                        href: 'https://linkedin.com/in/vulinh64',
                        label: 'LinkedIn',
                        position: 'right',
                    },
                    {
                        href: 'https://github.com/vulinh64',
                        label: 'GitHub',
                        position: 'right',
                    },
                    {
                        label: 'Tính thuế TNCN',
                        position: 'left',
                        items: [
                            {
                                to: '/tax-calculator',
                                label: 'Tính thuế TNCN',
                            },
                            {
                                to: '/vietnam-tax-calculation',
                                label: 'Tài liệu tham khảo'
                            }
                        ]
                    },
                    {
                        label: 'Spring Cron Generator',
                        position: 'left',
                        to: '/spring-cron-generator'
                    }
                ],
            },
            footer: {
                style: 'dark',
                links: [],
                copyright: `Welcome to my blog!`,
            },
            prism: {
                theme: prismThemes.vsLight,
                darkTheme: prismThemes.vsDark,
                additionalLanguages: ["java", "javascript", "typescript", "python", "powershell", "docker", "yaml"],
            },
            algolia: {
                appId: 'OUZDRHL5AP',
                apiKey: '5d4d49bdeb0170a26d68c7f0a6c5199e',
                indexName: 'Default Crawler',
                searchPagePath: 'search'
            }
        }),
};

export default config;