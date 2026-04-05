import { ProjectManagementScreen } from "@/features/project-management/components/project-management-screen";
import { getProjectManagementPageData } from "@/features/project-management/server/queries/get-project-management-page-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const pageData = await getProjectManagementPageData();

  return <ProjectManagementScreen pageData={pageData} />;
}
