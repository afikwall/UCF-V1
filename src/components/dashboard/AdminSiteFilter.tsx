import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SitesEntity } from '@/product-types';

type Site = typeof SitesEntity['instanceType'] & { id?: string };

export const ALL_SITES = '__all__';

interface Props {
  sites: Site[];
  value: string;
  onChange: (value: string) => void;
}

export const AdminSiteFilter = ({ sites, value, onChange }: Props) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="All sites" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={ALL_SITES}>All sites</SelectItem>
          {(sites ?? [])
            .filter((s) => !!s.id)
            .map((s) => (
              <SelectItem key={s.id} value={s.id as string}>
                {s.siteName || 'Unnamed site'}
              </SelectItem>
            ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};