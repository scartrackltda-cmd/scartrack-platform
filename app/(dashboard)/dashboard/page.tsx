import { redirect } from "next/navigation";

// /dashboard redirects to root dashboard (/)
export default function DashboardRedirectPage() {
  redirect("/");
}
