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
    {
      label: "俄罗斯方块",
      href: "/tetris",
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
    {
      label: "俄罗斯方块",
      href: "/tetris",
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
