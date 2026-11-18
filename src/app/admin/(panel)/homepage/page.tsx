import { permanentRedirect } from "next/navigation";

/** The homepage editor moved under /admin/pages; old links keep working. */
export default function AdminHomepageRedirect(): never {
  permanentRedirect("/admin/pages/home");
}
