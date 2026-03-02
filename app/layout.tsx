export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // html/body are rendered in app/[locale]/layout.tsx with the correct lang attribute
  return children;
}
