import {
  Page,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/components/page-layout";

export default function DashboardPage() {
  return (
    <Page>
      <PageHeader>
        <PageTitle>Dashboard</PageTitle>
      </PageHeader>
      <PageContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-muted/50 aspect-video rounded-xl" />
          <div className="bg-muted/50 aspect-video rounded-xl" />
          <div className="bg-muted/50 aspect-video rounded-xl" />
        </div>
        <div className="mt-4 bg-muted/50 min-h-64 flex-1 rounded-xl" />
      </PageContent>
    </Page>
  );
}
