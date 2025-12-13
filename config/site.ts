export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "嘴替机器人",
  description: "让AI用你的声音帮你吐槽",
  navItems: [
    {
      label: "首页",
      href: "/",
    },
    {
      label: "圣诞节",
      href: "/christmas",
    },
  ],
  navMenuItems: [
    {
      label: "首页",
      href: "/",
    },
    {
      label: "圣诞节",
      href: "/christmas",
    },
  ],
  links: {
    github: "https://github.com",
    twitter: "https://twitter.com",
    docs: "/",
    discord: "",
    sponsor: "",
  },
};
