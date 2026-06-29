import { useState, type FormEvent } from 'react';
import {
  useExecuteAction,
  useFileUpload,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import { toast } from 'sonner';
import { UploadMyDocumentAction } from '@/product-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { Loader2, Upload } from 'lucide-react';

// Client document upload: uploads a file then registers it via the
// UploadMyDocument action (server stamps clientId ownership).
export const PortalDocumentUpload = ({ clientId }: { clientId?: string }) => {
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const { uploadFunction, isLoading: isUploading } = useFileUpload();
  const { executeFunction, isLoading: isSaving } = useExecuteAction(
    UploadMyDocumentAction,
  );

  const busy = isUploading || isSaving;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    if (!file) {
      toast.error('Choose a file to upload');
      return;
    }
    try {
      const url = await uploadFunction(file);
      if (!url) {
        toast.error('Upload failed');
        return;
      }
      const result = await executeFunction({
        clientId,
        fileUrl: url,
        type: label,
      });
      if (result?.success) {
        toast.success(result.message || 'Document uploaded');
        setLabel('');
        setFile(null);
      } else {
        toast.error(result?.message || 'Could not save document');
      }
    } catch {
      toast.error('Could not upload document');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3 sm:flex-row sm:items-end"
    >
      <Field className="flex-1">
        <FieldLabel htmlFor="doc-label">Label</FieldLabel>
        <Input
          id="doc-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Pitch Deck"
          disabled={busy}
        />
      </Field>
      <Field className="flex-1">
        <FieldLabel htmlFor="doc-file">File</FieldLabel>
        <Input
          id="doc-file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={busy}
        />
      </Field>
      <Button type="submit" disabled={busy}>
        {busy ? (
          <Loader2 data-icon="inline-start" className="animate-spin" />
        ) : (
          <Upload data-icon="inline-start" />
        )}
        {busy ? 'Uploading…' : 'Upload'}
      </Button>
    </form>
  );
};