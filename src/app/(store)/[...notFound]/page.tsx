import { notFound } from "next/navigation";

/** Routes unknown URLs to the storefront 404 (rendered inside the store layout). */
export default function CatchAllNotFound() {
  notFound();
}
