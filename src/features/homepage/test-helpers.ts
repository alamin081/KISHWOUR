import { type HomepageTestimonial } from "./schema";

/** Shared fixtures for the homepage unit tests. Never imported by application code. */

export const cloudinaryUrl = (publicId: string) =>
  `https://res.cloudinary.com/kishwour/image/upload/v1731600000/${publicId}.jpg`;

/** A valid testimonial carrying the given Cloudinary asset as its portrait. */
export function testimonialWithPhoto(publicId: string): HomepageTestimonial {
  return {
    id: publicId,
    quote: "A real quote would go here.",
    name: "Buyer",
    role: "",
    company: "",
    country: "",
    photo: { url: cloudinaryUrl(publicId), alt: "Portrait", publicId },
  };
}
