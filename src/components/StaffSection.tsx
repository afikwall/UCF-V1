import {
  useEntityGetAll,
  useEntityDelete,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import { SitesEntity, StaffAssignmentsEntity } from '@/product-types';
import { toast } from 'sonner';
import { Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { StaffAssignmentForm } from '@/components/StaffAssignmentForm';

type Site = (typeof SitesEntity)['instanceType'] & { id: string };
type Assignment = (typeof StaffAssignmentsEntity)['instanceType'] & {
  id: string;
};

export const StaffSection = () => {
  const { data: sites } = useEntityGetAll(SitesEntity);
  const { data: assignments, isLoading } = useEntityGetAll(
    StaffAssignmentsEntity,
  );
  const { deleteFunction } = useEntityDelete(StaffAssignmentsEntity);

  const siteList = (sites ?? []) as Site[];
  const assignmentList = (assignments ?? []) as Assignment[];

  const siteNameById = (id?: string) =>
    siteList.find((s) => s.id === id)?.siteName ?? 'Unknown site';

  const handleDelete = async (assignment: Assignment) => {
    try {
      await deleteFunction({ id: assignment.id });
      toast.success('Assignment removed');
    } catch {
      toast.error('Failed to remove assignment');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Assignments</CardTitle>
        <CardDescription>
          Assign staff members to one or more sites by email.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <StaffAssignmentForm sites={siteList} assignments={assignmentList} />
        <Separator />
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : assignmentList.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Users className="size-8 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">
                No staff assignments yet
              </p>
              <p className="text-sm text-muted-foreground">
                Use the form above to assign staff to sites.
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignmentList.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.userEmail}</TableCell>
                  <TableCell>{siteNameById(a.siteId)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{a.staffRole}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove assignment"
                        >
                          <Trash2 />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remove assignment?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will unassign {a.userEmail} from{' '}
                            {siteNameById(a.siteId)}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(a)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};