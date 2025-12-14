import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "圣诞快乐 - Merry Christmas",
  description: "体验充满魔力的圣诞节动画场景",
};

export default function ChristmasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
