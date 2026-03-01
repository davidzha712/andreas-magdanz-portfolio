import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/shared/PageTransition";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <PageTransition>
        <main className="min-h-screen pt-16">{children}</main>
      </PageTransition>
      <Footer />
    </>
  );
}
