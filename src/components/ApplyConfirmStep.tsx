import { CheckCircle2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ApplyConfirmStepProps {
  companyName: string;
  onStartAnother: () => void;
}

export const ApplyConfirmStep = ({
  companyName,
  onStartAnother,
}: ApplyConfirmStepProps) => {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <CheckCircle2 className="size-12 text-accent" />
        <CardTitle>Application submitted</CardTitle>
        <CardDescription>
          Thank you for applying to the UCF Business Incubation Program
          {companyName ? ` on behalf of ${companyName}` : ''}.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            What happens next
          </h3>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
            <li>
              Our team reviews new applications on a rolling basis, typically
              within 1–2 weeks.
            </li>
            <li>
              If your business is a strong fit, a program coordinator will reach
              out to schedule an introductory meeting.
            </li>
            <li>
              Selected applicants are invited to present to our review committee.
            </li>
          </ul>
        </div>
        <p className="text-sm text-muted-foreground">
          Questions in the meantime? Contact the UCF Business Incubation Program
          team at your selected site.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={onStartAnother}>
          Submit another application
        </Button>
      </CardFooter>
    </Card>
  );
};