import { useRef, useState, ChangeEvent } from 'react';
import {
  useEntityGetAll,
  useEntityCreate,
  useFileUpload,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import { ClientsEntity, DocumentsEntity } from '@/product-types';
import { withOwnerEmail } from '@/utils/OwnerEmail';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Field, FieldLabel } from '@/components/ui/field';
import { Upload, FileText, ExternalLink, Loader2 } from 'lucide-react';

type Client = typeof ClientsEntity['instanceType'] & { id?: string };
type Doc = typeof DocumentsEntity['instanceType'] & {
  id?: string;
  createdAt?: string;
};

export const DocumentsPanel = ({ client }: { client: Client }) => {
  const { data: docs, isLoading } = useEntityGetAll(
    DocumentsEntity,
    client.id
      ? { where: { column: 'clientId', operator: '=', value: client.id } }
      : undefined,
    { enabled: !!client.id },
  );

  const { createFunction } = useEntityCreate(DocumentsEntity);
  const { uploadFunction, isLoading: isUploading } = useFileUpload();

  const [docType, setDocType] = useState('General');
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = (docs ?? []) as Doc[];

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFunction(file);
      // New document — stamp ownerEmail = parent Client.ownerEmail.
      await createFunction({
        data: withOwnerEmail(client, {
          clientId: client.id,
          fileUrl: url,
          type: docType || 'General',
        }),
      });
      toast.success('Document uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>
          Files attached to this client company.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field className="w-48">
            <FieldLabel htmlFor="doc-type">Document type</FieldLabel>
            <Input
              id="doc-type"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              placeholder="e.g. Contract, NDA"
            />
          </Field>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={handleFile}
          />
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Upload data-icon="inline-start" />
            )}
            Upload document
          </Button>
        </div>

        <Separator />

        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No documents uploaded yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((doc) => (
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
                    Open file
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};