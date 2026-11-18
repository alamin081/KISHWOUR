"use client";

import {
  type HomepageContent,
  type HomepageSectionFormValues,
} from "@/features/homepage/schema";
import { type HomepageSectionId } from "@/features/homepage/sections";

import {
  AboutForm,
  CategoriesForm,
  ContactForm,
  CraftForm,
  CustomManufacturingForm,
  FeaturedForm,
  HeroForm,
  SustainabilityForm,
  TestimonialsForm,
  WholesaleForm,
} from "./section-forms";

/**
 * The fields for one homepage section. `visible`, `order` and the section image are owned
 * by the editor, so each form below covers only that section's text and lists.
 */
export function SectionFields({
  id,
  content,
  serverErrors,
  onChangeSection,
  cloudinaryConfigured,
}: {
  id: HomepageSectionId;
  content: HomepageContent;
  /** Field errors from the last save, already scoped to this section. */
  serverErrors: Record<string, string>;
  cloudinaryConfigured: boolean;
  onChangeSection: <K extends HomepageSectionId>(
    id: K,
    values: HomepageSectionFormValues<K>,
  ) => void;
}) {
  switch (id) {
    case "hero":
      return (
        <HeroForm
          section={content.hero}
          serverErrors={serverErrors}
          onChange={(values) => onChangeSection("hero", values)}
        />
      );
    case "categories":
      return (
        <CategoriesForm
          section={content.categories}
          serverErrors={serverErrors}
          onChange={(values) => onChangeSection("categories", values)}
        />
      );
    case "featured":
      return (
        <FeaturedForm
          section={content.featured}
          serverErrors={serverErrors}
          onChange={(values) => onChangeSection("featured", values)}
        />
      );
    case "about":
      return (
        <AboutForm
          section={content.about}
          serverErrors={serverErrors}
          onChange={(values) => onChangeSection("about", values)}
        />
      );
    case "craft":
      return (
        <CraftForm
          section={content.craft}
          serverErrors={serverErrors}
          onChange={(values) => onChangeSection("craft", values)}
        />
      );
    case "wholesale":
      return (
        <WholesaleForm
          section={content.wholesale}
          serverErrors={serverErrors}
          onChange={(values) => onChangeSection("wholesale", values)}
        />
      );
    case "customManufacturing":
      return (
        <CustomManufacturingForm
          section={content.customManufacturing}
          serverErrors={serverErrors}
          onChange={(values) => onChangeSection("customManufacturing", values)}
        />
      );
    case "sustainability":
      return (
        <SustainabilityForm
          section={content.sustainability}
          serverErrors={serverErrors}
          onChange={(values) => onChangeSection("sustainability", values)}
        />
      );
    case "contact":
      return (
        <ContactForm
          section={content.contact}
          serverErrors={serverErrors}
          onChange={(values) => onChangeSection("contact", values)}
        />
      );
    case "testimonials":
      return (
        <TestimonialsForm
          section={content.testimonials}
          serverErrors={serverErrors}
          cloudinaryConfigured={cloudinaryConfigured}
          onChange={(values) => onChangeSection("testimonials", values)}
        />
      );
  }
}
