import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Props {
  title: string;
  description: string;
  rows: string[];
}

// Shared labeled placeholder used by Jobs Created and Awards & Milestones.
// All values are 0 / "No data yet" until the Phase-6 source lands. Never
// crashes — it renders a fixed set of labeled rows.
export const LabeledPlaceholderTile = ({ title, description, rows }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {rows.map((label) => (
          <div
            key={label}
            className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
          >
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium text-foreground">
              0
              <span className="ml-2 text-xs text-muted-foreground">
                No data yet
              </span>
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};