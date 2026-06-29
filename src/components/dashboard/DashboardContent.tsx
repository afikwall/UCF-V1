import { useState } from 'react';
import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { Building2 } from 'lucide-react';
import {
  ApplicationsEntity,
  ClientsEntity,
  SitesEntity,
} from '@/product-types';
import { useThresholds } from '@/utils/pipelineAlerts';
import { KpiStat } from '@/components/dashboard/KpiStat';
import { StartupsByTrackChart } from '@/components/dashboard/StartupsByTrackChart';
import { PipelineKpis } from '@/components/dashboard/PipelineKpis';
import { EconomicImpactTile } from '@/components/dashboard/EconomicImpactTile';
import { JobsCreatedTile } from '@/components/dashboard/JobsCreatedTile';
import { AwardsMilestonesTile } from '@/components/dashboard/AwardsMilestonesTile';
import { PipelineAlertsPanel } from '@/components/dashboard/PipelineAlertsPanel';
import { AdminSiteFilter, ALL_SITES } from '@/components/dashboard/AdminSiteFilter';

type App = typeof ApplicationsEntity['instanceType'] & {
  id?: string;
  updatedAt?: string;
  createdAt?: string;
};
type Client = typeof ClientsEntity['instanceType'];

interface ScopeFilter {
  where: { column: string; operator: string; value: string[] };
}

interface Props {
  isAdmin: boolean;
  // Server-side scope filters (undefined for admin). Computed before this
  // component renders so all hooks below stay unconditional.
  appsFilter?: ScopeFilter;
  clientsFilter?: ScopeFilter;
  enabled: boolean;
}

export const DashboardContent = ({
  isAdmin,
  appsFilter,
  clientsFilter,
  enabled,
}: Props) => {
  const [selectedSite, setSelectedSite] = useState<string>(ALL_SITES);
  const thresholds = useThresholds();

  const { data: appsData, isLoading: appsLoading } = useEntityGetAll(
    ApplicationsEntity,
    appsFilter as Record<string, unknown> | undefined,
    { enabled },
  );
  const { data: clientsData, isLoading: clientsLoading } = useEntityGetAll(
    ClientsEntity,
    clientsFilter as Record<string, unknown> | undefined,
    { enabled },
  );
  const { data: sites } = useEntityGetAll(SitesEntity);

  // Admin-only client-side site filter applied on top of the loaded set.
  const applyAdminFilter = isAdmin && selectedSite !== ALL_SITES;

  const apps = ((appsData ?? []) as App[]).filter((a) =>
    applyAdminFilter ? a.selectedSiteId === selectedSite : true,
  );
  const clients = ((clientsData ?? []) as Client[]).filter((c) =>
    applyAdminFilter ? c.siteId === selectedSite : true,
  );

  const activeStartups = clients.filter((c) => c?.status === 'Active').length;

  return (
    <div className="flex flex-col gap-6">
      {isAdmin ? (
        <div className="flex items-center justify-end">
          <AdminSiteFilter
            sites={sites ?? []}
            value={selectedSite}
            onChange={setSelectedSite}
          />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat
          title="Active Startups"
          value={activeStartups}
          caption="Companies currently active in scope"
          icon={<Building2 className="size-4" />}
          isLoading={clientsLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StartupsByTrackChart clients={clients} isLoading={clientsLoading} />
        <PipelineKpis applications={apps} isLoading={appsLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <EconomicImpactTile clients={clients} isLoading={clientsLoading} />
        <JobsCreatedTile />
        <AwardsMilestonesTile />
      </div>

      <PipelineAlertsPanel
        applications={apps}
        thresholds={thresholds}
        isLoading={appsLoading}
      />
    </div>
  );
};