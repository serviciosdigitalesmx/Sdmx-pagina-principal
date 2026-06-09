import type { LandingContent, Tenant } from "../types";
import { LandingRenderer } from "../landing/landing-renderer";

type ContentRendererProps = {
  tenant: Tenant;
  content: LandingContent;
};

export function ContentRenderer({ tenant, content }: ContentRendererProps) {
  return <LandingRenderer tenant={tenant} landingContent={content} />;
}
