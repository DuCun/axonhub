'use client';

import { IconAlertTriangle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useApiKeysContext } from '../context/apikeys-context';
import { useUpdateApiKeyStatus } from '../data/apikeys';

export function ApiKeysStatusDialog() {
  const { t } = useTranslation();
  const { isDialogOpen, closeDialog, selectedApiKey, resetRowSelection } = useApiKeysContext();
  const updateApiKeyStatus = useUpdateApiKeyStatus();

  if (!selectedApiKey) return null;

  const handleStatusChange = async () => {
    const newStatus = selectedApiKey.status === 'enabled' ? 'disabled' : 'enabled';

    try {
      await updateApiKeyStatus.mutateAsync({
        id: selectedApiKey.id,
        status: newStatus,
      });
      closeDialog('status');
      resetRowSelection(); // 清空选中的行
    } catch (error) {
    }
  };

  const isDisabling = selectedApiKey.status === 'enabled';
  const isArchived = selectedApiKey.status === 'archived';

  return (
    <ConfirmDialog
      open={isDialogOpen.status}
      onOpenChange={() => closeDialog('status')}
      handleConfirm={handleStatusChange}
      disabled={updateApiKeyStatus.isPending}
      title={
        <span className={isDisabling ? 'text-destructive' : 'text-green-600'}>
          <IconAlertTriangle className={`${isDisabling ? 'stroke-destructive' : 'stroke-green-600'} mr-1 inline-block`} size={18} />
          {isDisabling
            ? t('apikeys.dialogs.status.disableTitle')
            : t(isArchived ? 'apikeys.dialogs.status.restoreTitle' : 'apikeys.dialogs.status.enableTitle')}
        </span>
      }
      desc={
        isDisabling
          ? t('apikeys.dialogs.status.disableDescription', { name: selectedApiKey.name })
          : t(isArchived ? 'apikeys.dialogs.status.restoreDescription' : 'apikeys.dialogs.status.enableDescription', {
              name: selectedApiKey.name,
            })
      }
      confirmText={isDisabling ? t('common.buttons.disable') : t(isArchived ? 'common.buttons.restore' : 'common.buttons.enable')}
      cancelBtnText={t('common.buttons.cancel')}
    />
  );
}
