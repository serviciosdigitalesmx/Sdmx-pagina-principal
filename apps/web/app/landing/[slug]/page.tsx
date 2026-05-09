import TenantLandingClient from "./tenant-landing-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  return <TenantLandingClient slug={slug} />;
}
