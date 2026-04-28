'use client';

import { IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useApiKeysContext } from '../context/apikeys-context';
import { useBulkEnableApiKeys } from '../data/apikeys';

export function ApiKeysBulkEnableDialog() {
  const { t } = useTranslation();
  const { isDialogOpen, closeDialog, selectedApiKeys, resetRowSelection, setSelectedApiKeys } = useApiKeysContext();
  const hasArchived = selectedApiKeys.some((apiKey) => apiKey.status === 'archived');
  const hasDisabled = selectedApiKeys.some((apiKey) => apiKey.status === 'disabled');
  const archivedCount = selectedApiKeys.filter((apiKey) => apiKey.status === 'archived').length;
  const disabledCount = selectedApiKeys.filter((apiKey) => apiKey.status === 'disabled').length;
  const isMixedMode = hasArchived && hasDisabled;
  const isRestoreMode = hasArchived && !hasDisabled;
  const mode = isMixedMode ? 'mixed' : isRestoreMode ? 'restore' : 'enable';
  const affectedCount = isRestoreMode ? archivedCount : disabledCount;
  const bulkEnableApiKeys = useBulkEnableApiKeys(mode, affectedCount);

  if (!selectedApiKeys || selectedApiKeys.length === 0) return null;

  const handleBulkEnable = async () => {
    try {
      const ids = selectedApiKeys.map((apiKey) => apiKey.id);
      await bulkEnableApiKeys.mutateAsync(ids);
      resetRowSelection();
      setSelectedApiKeys([]);
      closeDialog();
    } catch (error) {
    }
  };

  return (
    <ConfirmDialog
      open={isDialogOpen.bulkEnable}
      onOpenChange={() => closeDialog('bulkEnable')}
      handleConfirm={handleBulkEnable}
      disabled={bulkEnableApiKeys.isPending}
      isLoading={bulkEnableApiKeys.isPending}
      title={
        <span className='text-primary flex items-center gap-2'>
          <IconAlertTriangle className='h-4 w-4' />
          {t(
            isRestoreMode
              ? 'apikeys.dialogs.bulkRestore.title'
              : isMixedMode
                ? 'apikeys.dialogs.bulkEnableMixed.title'
                : 'apikeys.dialogs.bulkEnable.title'
          )}
        </span>
      }
      desc={t(
        isRestoreMode
          ? 'apikeys.dialogs.bulkRestore.description'
          : isMixedMode
            ? 'apikeys.dialogs.bulkEnableMixed.description'
            : 'apikeys.dialogs.bulkEnable.description',
        { count: affectedCount }
      )}
      confirmText={isMixedMode ? `${t('common.buttons.restore')}/${t('common.buttons.enable')}` : t(isRestoreMode ? 'common.buttons.restore' : 'common.buttons.enable')}
      cancelBtnText={t('common.buttons.cancel')}
    >
      <div className='flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-900/20'>
        <IconCheck className='mt-0.5 h-4 w-4 text-green-600 dark:text-green-400' />
        <div className='space-y-1 text-left'>
          <p>
            {t(
              isRestoreMode
                ? 'apikeys.dialogs.bulkRestore.warning'
                : isMixedMode
                  ? 'apikeys.dialogs.bulkEnableMixed.warning'
                  : 'apikeys.dialogs.bulkEnable.warning'
            )}
          </p>
        </div>
      </div>
    </ConfirmDialog>
  );
}
