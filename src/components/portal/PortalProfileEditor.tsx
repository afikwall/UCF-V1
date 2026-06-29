import { useState, type ChangeEvent } from 'react';
import {
  useExecuteAction,
  useFileUpload,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import { toast } from 'sonner';
import { ClientsEntity, UpdateMyCompanyProfileAction } from '@/product-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
} from '@/components/ui/field';
import { Loader2, Pencil, Upload } from 'lucide-react';

type Client = typeof ClientsEntity['instanceType'] & { id?: string };

// Editable profile editor for the Client portal. Edits ONLY the client-safe,
// client-writable fields whitelisted by the UpdateMyCompanyProfile action:
// description, website, logoUrl, phone. NEVER exposes riskLevel/ein/revenue/
// funding/status/stage/track.
export const PortalProfileEditor = ({ client }: { client: Client }) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(client.description ?? '');
  const [website, setWebsite] = useState(client.website ?? '');
  const [logoUrl, setLogoUrl] = useState(client.logoUrl ?? '');
  const [phone, setPhone] = useState((client as { phone?: string }).phone ?? '');

  const { executeFunction, isLoading } = useExecuteAction(
    UpdateMyCompanyProfileAction,
  );
  const { uploadFunction, isLoading: isUploading } = useFileUpload();

  const handleOpenChange = (next: boolean) => {
    if (!next && (isLoading || isUploading)) return;
    if (next) {
      // Re-seed form from the latest client values when opening.
      setDescription(client.description ?? '');
      setWebsite(client.website ?? '');
      setLogoUrl(client.logoUrl ?? '');
      setPhone((client as { phone?: string }).phone ?? '');
    }
    setOpen(next);
  };

  const handleLogoFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFunction(file);
      if (url) {
        setLogoUrl(url);
        toast.success('Logo uploaded');
      }
    } catch {
      toast.error('Logo upload failed');
    }
  };

  const handleSave = async () => {
    if (!client.id) return;
    try {
      const result = await executeFunction({
        clientId: client.id,
        description,
        website,
        logoUrl,
        phone,
      });
      if (result?.success) {
        toast.success(result.message || 'Profile updated');
        setOpen(false);
      } else {
        toast.error(result?.message || 'Could not update profile');
      }
    } catch {
      toast.error('Could not update profile');
    }
  };

  const busy = isLoading || isUploading;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil data-icon="inline-start" />
          Edit profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit company profile</DialogTitle>
          <DialogDescription>
            Update your public company details. Program staff manage your
            stage, track, and status.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="profile-description">Description</FieldLabel>
            <Textarea
              id="profile-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your company"
              rows={4}
              disabled={busy}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-website">Website</FieldLabel>
            <Input
              id="profile-website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              disabled={busy}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-phone">Phone</FieldLabel>
            <Input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              disabled={busy}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-logo">Logo URL</FieldLabel>
            <Input
              id="profile-logo"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              disabled={busy}
            />
            <FieldDescription>
              Paste a logo URL, or upload an image to set it automatically.
            </FieldDescription>
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={busy}
              >
                <label htmlFor="profile-logo-file" className="cursor-pointer">
                  {isUploading ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Upload data-icon="inline-start" />
                  )}
                  {isUploading ? 'Uploading…' : 'Upload logo'}
                </label>
              </Button>
              <input
                id="profile-logo-file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoFile}
                disabled={busy}
              />
            </div>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={busy}>
            {isLoading && (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            )}
            {isLoading ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};