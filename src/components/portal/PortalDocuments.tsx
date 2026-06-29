import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { DocumentsEntity } from '@/product-types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink } from 'lucide-react';
import { PortalDocumentUpload } from '@/components/portal/PortalDocumentUpload';

// Reads the Client's own Documents rows (server-side RowPolicy is the
// isolation boundary). Read-only download links for the portal.
export const PortalDocuments = ({ clientId }: { clientId?: string }) => {
  const { data: docs, isLoading } = useEntityGetAll(DocumentsEntity);

  const rows = (docs ?? []).filter((d) => !clientId || d.clientId === clientId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>Files shared with your company.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <PortalDocumentUpload clientId={clientId} />
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No documents available yet.
          </p>
        ) : (
          rows.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-muted-foreground" />
                <Badge variant="secondary">{doc.type || 'General'}</Badge>
              </div>
              {doc.fileUrl && (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                >
                  Download
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};