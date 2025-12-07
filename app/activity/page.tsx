import FlowGrid from "@/components/feed/flow-grid";
import {
  Page,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/components/page-layout";

export default function ActivityPage() {
  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Market Activity</PageTitle>
          <p className="text-muted-foreground">
            Live feed of the latest inscriptions and artifacts.
          </p>
        </div>
      </PageHeader>
      <PageContent>
        <FlowGrid />
      </PageContent>
    </Page>
  );
}
