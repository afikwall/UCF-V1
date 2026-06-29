import { useEntityUpdate } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { ApplicationsEntity } from '@/product-types';
import { toast } from 'sonner';

type Application = typeof ApplicationsEntity['instanceType'] & { id?: string };

// Centralized status-transition writer for applications. Handles the Hold
// branch (which also persists holdReason + followUpDate) and plain status moves.
export function useApplicationStatus() {
  const { updateFunction, isLoading } = useEntityUpdate(ApplicationsEntity);

  const moveTo = async (app: Application, status: string) => {
    if (!app.id) return;
    try {
      await updateFunction({ id: app.id, data: { status } });
      toast.success(`Moved to "${status}".`);
    } catch (err) {
      toast.error('Could not update status.');
      throw err;
    }
  };

  const placeOnHold = async (
    app: Application,
    holdReason: string,
    followUpDate: string,
  ) => {
    if (!app.id) return;
    try {
      await updateFunction({
        id: app.id,
        data: { status: 'Hold', holdReason, followUpDate },
      });
      toast.success('Application placed on hold.');
    } catch (err) {
      toast.error('Could not place the application on hold.');
      throw err;
    }
  };

  return { moveTo, placeOnHold, isLoading };
}