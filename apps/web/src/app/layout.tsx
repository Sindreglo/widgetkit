import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Widgetkit",
  description: "A collection of powerful UI widgets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
