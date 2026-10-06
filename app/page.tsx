import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import Hero from "@/components/site/Hero";
import { AboutSection, VisionMissionValues } from "@/components/site/AboutSections";
import ServicesSection from "@/components/site/ServicesSection";
import FeaturedPosts from "@/components/site/FeaturedPosts";
import PartnersSection from "@/components/site/PartnersSection";
import TeamSection from "@/components/site/TeamSection";
import MapContactSection from "@/components/site/MapContactSection";
import CtaSection from "@/components/site/CtaSection";
import FloatingContact from "@/components/site/FloatingContact";
import ThemeSwitcher from "@/components/site/ThemeSwitcher";
import ContactFormSection from "@/components/site/ContactFormSection";
import { getContent } from "@/lib/settings";
import {
  getPartners,
  getPosts,
  getServices,
  getTeamMembers,
} from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [content, services, partners, members, featured] = await Promise.all([
    getContent(),
    getServices(),
    getPartners(),
    getTeamMembers(),
    getPosts({ featured: true, limit: 3 }),
  ]);

  const posts = featured.length ? featured : await getPosts({ limit: 3 });

  return (
    <>
      <Header contact={content.contact} />
      <main className="flex-1">
        <Hero hero={content.hero} />
        <AboutSection about={content.about} id="gioi-thieu" />
        <VisionMissionValues
          vision={content.vision}
          mission={content.mission}
          values={content.values}
        />
        <ServicesSection services={services} />
        <FeaturedPosts posts={posts} />
        <PartnersSection partners={partners} />
        <TeamSection members={members} />
        <ContactFormSection contact={content.contact} />
        <MapContactSection contact={content.contact} map={content.map} />
        <CtaSection contact={content.contact} />
      </main>
      <Footer
        contact={content.contact}
        slogan={content.footer.slogan}
        copyright={content.footer.copyright}
        address={content.contact.address}
      />
      <FloatingContact contact={content.contact} />
      <ThemeSwitcher />
    </>
  );
}
