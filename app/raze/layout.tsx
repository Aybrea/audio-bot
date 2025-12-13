import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raze Dance",
};

export default function RazeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="-mx-4">{children}</div>;
}
