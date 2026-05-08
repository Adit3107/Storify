export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Storify",
  description: "Secure file sharing and storage solution.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
  ],
  navMenuItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Settings",
      href: "/settings",
    },
  ],
  links: {
    github: "https://github.com",
    twitter: "https://twitter.com",
  },
};
