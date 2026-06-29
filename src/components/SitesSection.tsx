import { useState } from 'react';
import {
  useEntityGetAll,
  useEntityDelete,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import { SitesEntity } from '@/product-types';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SiteFormDialog } from '@/components/SiteFormDialog';

type Site = (typeof SitesEntity)['instanceType'] & { id: string };

const statusVariant = (
  status?: string,
): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status) {
    case 'Active':
      return 'default';
    case 'Under Renovation':
      return 'secondary';
    case 'Coming Soon':
      return 'outline';
    case 'Closed':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const SitesSection = () => {
  const { data: sites, isLoading } = useEntityGetAll(SitesEntity);
  const { deleteFunction } = useEntityDelete(SitesEntity);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  const openCreate = () => {
    setEditingSite(null);
    setDialogOpen(true);
  };

  const openEdit = (site: Site) => {
    setEditingSite(site);
    setDialogOpen(true);
  };

  const handleDelete = async (site: Site) => {
    try {
      await deleteFunction({ id: site.id });
      toast.success(`Deleted "${site.siteName}"`);
    } catch {
      toast.error('Failed to delete site');
    }
  };

  const list = (sites ?? []) as Site[];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Sites</CardTitle>
          <CardDescription>
            Manage incubator locations across the program.
          </CardDescription>
        </div>
        <Button onClick={openCreate}>
          <Plus data-icon="inline-start" />
          Add Site
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <MapPin className="size-8 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">No sites yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first incubator location to get started.
              </p>
            </div>
            <Button variant="outline" onClick={openCreate}>
              <Plus data-icon="inline-start" />
              Add Site
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((site) => (
                <TableRow key={site.id}>
                  <TableCell className="font-medium">
                    {site.siteName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {[site.city, site.state].filter(Boolean).join(', ') || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(site.status)}>
                      {site.status ?? 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {site.currentOccupancy ?? 0} / {site.totalCapacity ?? 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(site)}
                        aria-label="Edit site"
                      >
                        <Pencil />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete site"
                          >
                            <Trash2 />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete site?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove "{site.siteName}".
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(site)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <SiteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        site={editingSite}
      />
    </Card>
  );
};