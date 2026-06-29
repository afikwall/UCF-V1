import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';

// Quarterly Impact Survey placeholder kept as-is. The Room Availability surface
// is now live (see PortalRoomAvailability) and rendered separately in MyCompany.
export const PortalPlaceholders = () => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 text-muted-foreground" />
          <CardTitle className="text-lg">Quarterly Impact Survey</CardTitle>
        </div>
        <Badge variant="secondary">Coming soon</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <CardDescription>
        Share funding, revenue, and team updates each quarter. This will be
        available here soon.
      </CardDescription>
    </CardContent>
  </Card>
);