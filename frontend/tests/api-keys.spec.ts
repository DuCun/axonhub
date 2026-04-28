import { test, expect } from '@playwright/test'
import { gotoAndEnsureAuth, waitForGraphQLOperation } from './auth.utils'

test.describe('Admin API Keys Management', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndEnsureAuth(page, '/project/api-keys')
  })

  test('status counts refresh after creating an API key', async ({ page }) => {
    const uniqueName = `pw-test-count-${Date.now().toString().slice(-6)}`
    const searchInput = page.getByPlaceholder(/按名称过滤|Filter by name|名称|Name/i).first()
    await expect(searchInput).toBeVisible()
    await searchInput.fill(uniqueName)

    await expect
      .poll(async () => {
        const statusButton = page.getByRole('button', { name: /状态|Status/i }).first()
        await expect(statusButton).toBeVisible()
        await statusButton.click()

        const popover = page.locator('[cmdk-list]').last()
        await expect(popover).toBeVisible()

        const item = popover.locator('[cmdk-item]').filter({ hasText: /启用|Enabled/i }).first()
        await expect(item).toBeVisible()

        const countText = await item.locator('span.font-mono').textContent()
        await page.keyboard.press('Escape')

        return Number(countText ?? '0')
      })
      .toBe(0)

    const addApiKeyButton = page.getByRole('button', { name: /创建 API Key|Create API Key|新建/i })
    await expect(addApiKeyButton).toBeVisible()
    await addApiKeyButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByLabel(/名称|Name/i).fill(uniqueName)

    const userSelect = dialog.locator('[data-testid="user-select"], [role="combobox"]').first()
    if (await userSelect.isVisible()) {
      await userSelect.click()
      const firstOption = page.locator('[role="option"]:not([aria-disabled="true"])').first()
      if (await firstOption.isVisible()) {
        await firstOption.click()
      }
    }

    await dialog.getByRole('button', { name: /创建|Create|保存|Save/i }).click()

    const viewDialog = page.getByRole('dialog', { name: /查看 API 密钥|View API Key/i })
    await expect(viewDialog).toBeVisible({ timeout: 10000 })
    await viewDialog.getByRole('button', { name: /Close|关闭/i }).click()
    await expect(viewDialog).not.toBeVisible({ timeout: 10000 })

    const table = page.locator('[data-testid="api-keys-table"], table:has(th), table').first()
    const row = table.locator('tbody tr').filter({ hasText: uniqueName })
    await expect(row).toBeVisible()

    await expect
      .poll(async () => {
        const statusButton = page.getByRole('button', { name: /状态|Status/i }).first()
        await expect(statusButton).toBeVisible()
        await statusButton.click()

        const popover = page.locator('[cmdk-list]').last()
        await expect(popover).toBeVisible()

        const item = popover.locator('[cmdk-item]').filter({ hasText: /启用|Enabled/i }).first()
        await expect(item).toBeVisible()

        const countText = await item.locator('span.font-mono').textContent()
        await page.keyboard.press('Escape')

        return Number(countText ?? '0')
      })
      .toBe(1)
  })

  test('can create, disable, enable an API key', async ({ page }) => {
    const uniqueName = `pw-test-apikey-${Date.now().toString().slice(-6)}`

    const addApiKeyButton = page.getByRole('button', { name: /创建 API Key|Create API Key|新建/i })
    await expect(addApiKeyButton).toBeVisible()
    await addApiKeyButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByLabel(/名称|Name/i).fill(uniqueName)

    const userSelect = dialog.locator('[data-testid="user-select"], [role="combobox"]').first()
    if (await userSelect.isVisible()) {
      await userSelect.click()
      const firstOption = page.locator('[role="option"]:not([aria-disabled="true"])').first()
      if (await firstOption.isVisible()) {
        await firstOption.click()
      }
    }

    // Click create button and wait for response
    const createButton = dialog.getByRole('button', { name: /创建|Create|保存|Save/i })
    await createButton.click()
    
    // Handle the "View API Key" dialog that appears after creation
    const viewDialog = page.getByRole('dialog', { name: /查看 API 密钥|View API Key/i })
    await expect(viewDialog).toBeVisible({ timeout: 10000 })
    await viewDialog.getByRole('button', { name: /Close|关闭/i }).click()
    await expect(viewDialog).not.toBeVisible({ timeout: 10000 })

    const table = page.locator('[data-testid="api-keys-table"], table:has(th), table').first()
    const row = table.locator('tbody tr').filter({ hasText: uniqueName })
    await expect(row).toBeVisible()

    // Locate the actions button (three dots menu) in the last cell of the row
    // Avoid clicking the Eye or Copy buttons in the key column
    const actionsTrigger = row.locator('td:last-child button, button:has-text("Open menu")').first()

    // Disable API key
    await actionsTrigger.click()
    const menu1 = page.getByRole('menu')
    await expect(menu1).toBeVisible()
    await menu1.getByRole('menuitem', { name: /禁用|Disable/i }).focus()
    await page.keyboard.press('Enter')
    const statusDialog = page.getByRole('alertdialog').or(page.getByRole('dialog'))
    await expect(statusDialog).toBeVisible()
    await expect(statusDialog).toContainText(uniqueName)
    // Click the confirm button - it's the second button (first is Cancel)
    const confirmButton = statusDialog.locator('button').last()
    await confirmButton.click()
    await expect(statusDialog).not.toBeVisible({ timeout: 10000 })
    await expect(row).toContainText(/禁用|Disabled/i)

    // Verify by menu toggle: now it should show Enable
    await actionsTrigger.click()
    const menu2 = page.getByRole('menu')
    await expect(menu2).toBeVisible()
    await expect(menu2.getByRole('menuitem', { name: /启用|Enable/i })).toBeVisible()
    
    // Close the menu before reopening
    await page.keyboard.press('Escape')
    await expect(menu2).not.toBeVisible()

    // Enable API key again
    await actionsTrigger.click()
    const menu3 = page.getByRole('menu')
    await expect(menu3).toBeVisible()
    await menu3.getByRole('menuitem', { name: /启用|Enable/i }).focus()
    await page.keyboard.press('Enter')
    const enableDialog = page.getByRole('alertdialog').or(page.getByRole('dialog'))
    await expect(enableDialog).toBeVisible()
    await expect(enableDialog).toContainText(uniqueName)
    // Click the confirm button - it's the second button (first is Cancel)
    const enableConfirmButton = enableDialog.locator('button').last()
    await enableConfirmButton.click()
    await expect(enableDialog).not.toBeVisible({ timeout: 10000 })
    await expect(row).toContainText(/启用|Enabled/i)
  })

  test('bulk mixed archived and disabled api keys use restore enable semantics', async ({ page }) => {
    const archivedName = `pw-test-arch-${Date.now().toString().slice(-6)}`
    const disabledName = `pw-test-dis-${Date.now().toString().slice(-6)}`

    for (const name of [archivedName, disabledName]) {
      const addApiKeyButton = page.getByRole('button', { name: /创建 API Key|Create API Key|新建/i })
      await expect(addApiKeyButton).toBeVisible()
      await addApiKeyButton.click()

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await dialog.getByLabel(/名称|Name/i).fill(name)

      const userSelect = dialog.locator('[data-testid="user-select"], [role="combobox"]').first()
      if (await userSelect.isVisible()) {
        await userSelect.click()
        const firstOption = page.locator('[role="option"]:not([aria-disabled="true"])').first()
        if (await firstOption.isVisible()) {
          await firstOption.click()
        }
      }

      await Promise.all([
        waitForGraphQLOperation(page, 'CreateAPIKey'),
        dialog.getByRole('button', { name: /创建|Create|保存|Save/i }).click(),
      ])

      const viewDialog = page.getByRole('dialog', { name: /查看 API 密钥|View API Key/i })
      await expect(viewDialog).toBeVisible({ timeout: 10000 })
      await viewDialog.getByRole('button', { name: /Close|关闭/i }).click()
      await expect(viewDialog).not.toBeVisible({ timeout: 10000 })
    }

    const table = page.locator('[data-testid="api-keys-table"], table:has(th), table').first()
    const archivedRow = table.locator('tbody tr').filter({ hasText: archivedName })
    const disabledRow = table.locator('tbody tr').filter({ hasText: disabledName })
    await expect(archivedRow).toBeVisible()
    await expect(disabledRow).toBeVisible()

    const archivedActionsTrigger = archivedRow.locator('td:last-child button, button:has-text("Open menu")').first()
    await archivedActionsTrigger.click()
    const archivedMenu = page.getByRole('menu')
    await expect(archivedMenu).toBeVisible()
    await archivedMenu.getByRole('menuitem', { name: /归档|Archive/i }).focus()
    await page.keyboard.press('Enter')
    const archiveDialog = page.getByRole('alertdialog').or(page.getByRole('dialog'))
    await expect(archiveDialog).toBeVisible()
    await expect(archiveDialog).toContainText(archivedName)
    await Promise.all([
      waitForGraphQLOperation(page, 'UpdateAPIKeyStatus'),
      archiveDialog.locator('button').last().click(),
    ])
    await expect(archiveDialog).not.toBeVisible({ timeout: 10000 })
    await expect(archivedRow).not.toBeVisible({ timeout: 10000 })

    const disabledActionsTrigger = disabledRow.locator('td:last-child button, button:has-text("Open menu")').first()
    await disabledActionsTrigger.click()
    const disabledMenu = page.getByRole('menu')
    await expect(disabledMenu).toBeVisible()
    await disabledMenu.getByRole('menuitem', { name: /禁用|Disable/i }).focus()
    await page.keyboard.press('Enter')
    const disableDialog = page.getByRole('alertdialog').or(page.getByRole('dialog'))
    await expect(disableDialog).toBeVisible()
    await expect(disableDialog).toContainText(disabledName)
    await Promise.all([
      waitForGraphQLOperation(page, 'UpdateAPIKeyStatus'),
      disableDialog.locator('button').last().click(),
    ])
    await expect(disableDialog).not.toBeVisible({ timeout: 10000 })
    await expect(disabledRow).toContainText(/禁用|Disabled/i)

    const statusButton = page.getByRole('button', { name: /状态|Status/i }).first()
    await expect(statusButton).toBeVisible()
    await statusButton.click()
    const statusPopover = page.locator('[cmdk-list]').last()
    await expect(statusPopover).toBeVisible()
    const archivedFilter = statusPopover.locator('[cmdk-item]').filter({ hasText: /已归档|Archived/i }).first()
    const disabledFilter = statusPopover.locator('[cmdk-item]').filter({ hasText: /已禁用|Disabled/i }).first()
    await expect(archivedFilter).toBeVisible()
    await expect(disabledFilter).toBeVisible()
    await archivedFilter.click()
    await disabledFilter.click()
    await page.keyboard.press('Escape')

    const archivedRowInFilteredTable = table.locator('tbody tr').filter({ hasText: archivedName })
    const disabledRowInFilteredTable = table.locator('tbody tr').filter({ hasText: disabledName })
    await expect(archivedRowInFilteredTable).toBeVisible()
    await expect(disabledRowInFilteredTable).toBeVisible()

    await archivedRowInFilteredTable.getByRole('checkbox', { name: /选择行|Select row/i }).click()
    await disabledRowInFilteredTable.getByRole('checkbox', { name: /选择行|Select row/i }).click()

    const bulkEnableButton = page.getByTestId('apikeys-bulk-enable-button')
    await expect(bulkEnableButton).toBeVisible()
    await expect(bulkEnableButton).toHaveAttribute('title', /恢复\/启用|Restore\/Enable/)
    await bulkEnableButton.click()

    const bulkDialog = page.getByRole('alertdialog').or(page.getByRole('dialog'))
    await expect(bulkDialog).toBeVisible()
    await expect(bulkDialog).toContainText(/批量恢复\/启用 API Keys|Bulk Restore\/Enable API Keys/i)
    await expect(bulkDialog).toContainText(/恢复\/启用|restore\/enable/i)

    await Promise.all([
      waitForGraphQLOperation(page, 'BulkEnableAPIKeys'),
      bulkDialog.locator('button').last().click(),
    ])
    await expect(bulkDialog).not.toBeVisible({ timeout: 10000 })

    const successToast = page.locator('[data-sonner-toast]').filter({ hasText: /恢复\/启用|restored\/enabled/i }).last()
    await expect(successToast).toBeVisible({ timeout: 10000 })

    const resetFiltersButton = page.getByRole('button', { name: /重置|Reset/i })
    await expect(resetFiltersButton).toBeVisible()
    await resetFiltersButton.click()

    await expect(table.locator('tbody tr').filter({ hasText: archivedName })).toBeVisible()
    await expect(table.locator('tbody tr').filter({ hasText: archivedName })).toContainText(/启用|Enabled/i)
    await expect(table.locator('tbody tr').filter({ hasText: disabledName })).toContainText(/启用|Enabled/i)
  })

  test('profile duplicate name validation - real-time error display', async ({ page }) => {
    // First, create an API key to work with
    const uniqueName = `pw-test-profile-${Date.now().toString().slice(-6)}`
    
    const addApiKeyButton = page.getByRole('button', { name: /创建 API Key|Create API Key|新建/i })
    await addApiKeyButton.click()
    
    const createDialog = page.getByRole('dialog')
    await createDialog.getByLabel(/名称|Name/i).fill(uniqueName)
    
    const userSelect = createDialog.locator('[data-testid="user-select"], [role="combobox"]').first()
    if (await userSelect.isVisible()) {
      await userSelect.click()
      const firstOption = page.locator('[role="option"]:not([aria-disabled="true"])').first()
      if (await firstOption.isVisible()) {
        await firstOption.click()
      }
    }
    
    await createDialog.getByRole('button', { name: /创建|Create|保存|Save/i }).click()
    
    // Handle the "View API Key" dialog that appears after creation
    const viewDialog = page.getByRole('dialog', { name: /查看 API 密钥|View API Key/i })
    await expect(viewDialog).toBeVisible({ timeout: 10000 })
    await viewDialog.getByRole('button', { name: /Close|关闭/i }).click()
    await expect(viewDialog).not.toBeVisible({ timeout: 10000 })
    
    // Find the API key row and open profiles dialog
    const table = page.locator('[data-testid="api-keys-table"], table:has(th), table').first()
    const row = table.locator('tbody tr').filter({ hasText: uniqueName })
    await expect(row).toBeVisible()
    
    const actionsTrigger = row.locator('td:last-child button, button:has-text("Open menu")').first()
    await actionsTrigger.click()
    
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    await menu.getByRole('menuitem', { name: /配置|Profiles|Settings/i }).click()
    
    // Wait for profiles dialog to open
    const profilesDialog = page.getByRole('dialog').filter({ hasText: /配置|Profiles/i })
    await expect(profilesDialog).toBeVisible()

    const profileInputSelector = 'input[placeholder*="配置名称"], input[placeholder*="Profile Name"]'
    const addProfileButton = profilesDialog.getByRole('button', { name: /新增配置|Add Profile/i })
    await expect(addProfileButton).toBeVisible()

    // Add first profile card (UI starts empty)
    await addProfileButton.click()
    const profileInputs = profilesDialog.locator(profileInputSelector)
    await expect(profileInputs).toHaveCount(1)

    // Rename the first profile to "production" to set the baseline duplicate
    const firstProfileInput = profileInputs.first()
    await expect(firstProfileInput).toBeVisible()
    await firstProfileInput.clear()
    await firstProfileInput.fill('production')

    // Add a second profile for duplicate validation
    await addProfileButton.click()
    await expect(profileInputs).toHaveCount(2)
    const secondProfileInput = profileInputs.nth(1)

    // Type a duplicate name "production" - should show error immediately
    await secondProfileInput.clear()
    await secondProfileInput.fill('production')

    // Wait a bit for the error to appear (should be immediate, but give it a small buffer)
    await page.waitForTimeout(600)

    // Check that error message is displayed for the duplicated profile
    const secondProfileError = secondProfileInput.locator('xpath=ancestor::*[@data-slot="form-item"]//p[@data-slot="form-message"]')
    await expect(secondProfileError).toBeVisible()
    await expect(secondProfileInput).toHaveAttribute('aria-invalid', 'true')

    // Check that Save button is disabled
    const saveButton = profilesDialog.getByRole('button', { name: /保存|Save/i })
    await expect(saveButton).toBeDisabled()

    // Change to a unique name
    await secondProfileInput.clear()
    await secondProfileInput.fill('production-main')

    // Wait for validation
    await page.waitForTimeout(600)

    // Error should disappear for the edited profile
    await expect(secondProfileInput).not.toHaveAttribute('aria-invalid', 'true')
    await expect(secondProfileError).not.toBeVisible()

    // Close dialog
    const cancelButton = profilesDialog.getByRole('button', { name: /取消|Cancel/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.focus()
    await page.keyboard.press('Escape')
    await expect(profilesDialog).not.toBeVisible()
  })

  test('profile duplicate name validation - case insensitive', async ({ page }) => {
    // Create an API key
    const uniqueName = `pw-test-case-${Date.now().toString().slice(-6)}`
    
    const addApiKeyButton = page.getByRole('button', { name: /创建 API Key|Create API Key|新建/i })
    await addApiKeyButton.click()
    
    const createDialog = page.getByRole('dialog')
    await createDialog.getByLabel(/名称|Name/i).fill(uniqueName)
    
    const userSelect = createDialog.locator('[data-testid="user-select"], [role="combobox"]').first()
    if (await userSelect.isVisible()) {
      await userSelect.click()
      const firstOption = page.locator('[role="option"]:not([aria-disabled="true"])').first()
      if (await firstOption.isVisible()) {
        await firstOption.click()
      }
    }
    
    await createDialog.getByRole('button', { name: /创建|Create|保存|Save/i }).click()
    
    // Handle the "View API Key" dialog that appears after creation
    const viewDialog = page.getByRole('dialog', { name: /查看 API 密钥|View API Key/i })
    await expect(viewDialog).toBeVisible({ timeout: 10000 })
    await viewDialog.getByRole('button', { name: /Close|关闭/i }).click()
    await expect(viewDialog).not.toBeVisible({ timeout: 10000 })
    
    // Open profiles dialog
    const table = page.locator('[data-testid="api-keys-table"], table:has(th), table').first()
    const row = table.locator('tbody tr').filter({ hasText: uniqueName })
    const actionsTrigger = row.locator('td:last-child button, button:has-text("Open menu")').first()
    await actionsTrigger.click()
    
    const menu = page.getByRole('menu')
    await menu.getByRole('menuitem', { name: /配置|Profiles|Settings/i }).click()
    
    const profilesDialog = page.getByRole('dialog').filter({ hasText: /配置|Profiles/i })
    await expect(profilesDialog).toBeVisible()
    
    const profileInputSelector = 'input[placeholder*="配置名称"], input[placeholder*="Profile Name"]'
    const addProfileButton = profilesDialog.getByRole('button', { name: /新增配置|Add Profile/i })
    await expect(addProfileButton).toBeVisible()

    // Add first profile and set its name to "Default" for baseline comparison
    await addProfileButton.click()
    const profileInputs = profilesDialog.locator(profileInputSelector)
    const firstProfileInput = profileInputs.first()
    await expect(firstProfileInput).toBeVisible()
    await firstProfileInput.clear()
    await firstProfileInput.fill('Default')

    // Add the second profile that will trigger duplicate validation
    await addProfileButton.click()
    await expect(profileInputs).toHaveCount(2)
    const secondProfileInput = profileInputs.nth(1)
    
    // Type "default" (different case) - should still show error
    await secondProfileInput.clear()
    await secondProfileInput.fill('default')
    
    await page.waitForTimeout(600)

    // Should show duplicate error (case-insensitive)
    const duplicateErrorMessages = profilesDialog.locator('p[data-slot="form-message"]').filter({
      hasText: /配置名称不能重复|Profile names must be unique|duplicate/i,
    })
    await expect(duplicateErrorMessages.first()).toBeVisible()
    await expect(secondProfileInput).toHaveAttribute('aria-invalid', 'true')
    
    // Save button should be disabled
    const saveButton = profilesDialog.getByRole('button', { name: /保存|Save/i })
    await expect(saveButton).toBeDisabled()
    
    // Try with whitespace: " default "
    await secondProfileInput.clear()
    await secondProfileInput.fill(' default ')
    
    await page.waitForTimeout(600)

    // Should still show error (whitespace trimmed)
    await expect(duplicateErrorMessages.first()).toBeVisible()
    await expect(saveButton).toBeDisabled()
    
    // Close dialog
    const cancelButton = profilesDialog.getByRole('button', { name: /取消|Cancel/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.focus()
    await page.keyboard.press('Escape')
    await expect(profilesDialog).not.toBeVisible()
  })

  test('can configure per-minute quota in profiles', async ({ page }) => {
    const uniqueName = `pw-test-quota-minute-${Date.now().toString().slice(-6)}`

    const addApiKeyButton = page.getByRole('button', { name: /创建 API Key|Create API Key|新建/i })
    await addApiKeyButton.click()

    const createDialog = page.getByRole('dialog')
    await createDialog.getByLabel(/名称|Name/i).fill(uniqueName)

    const userSelect = createDialog.locator('[data-testid="user-select"], [role="combobox"]').first()
    if (await userSelect.isVisible()) {
      await userSelect.click()
      const firstOption = page.locator('[role="option"]:not([aria-disabled="true"])').first()
      if (await firstOption.isVisible()) {
        await firstOption.click()
      }
    }

    await createDialog.getByRole('button', { name: /创建|Create|保存|Save/i }).click()

    // Handle the "View API Key" dialog that appears after creation
    const viewDialog = page.getByRole('dialog', { name: /查看 API 密钥|View API Key/i })
    await expect(viewDialog).toBeVisible({ timeout: 10000 })
    await viewDialog.getByRole('button', { name: /Close|关闭/i }).click()
    await expect(viewDialog).not.toBeVisible({ timeout: 10000 })

    const table = page.locator('[data-testid="api-keys-table"], table:has(th), table').first()
    const row = table.locator('tbody tr').filter({ hasText: uniqueName })
    await expect(row).toBeVisible()

    const actionsTrigger = row.locator('td:last-child button, button:has-text("Open menu")').first()
    await actionsTrigger.click()

    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    await menu.getByRole('menuitem', { name: /配置|Profiles|Settings/i }).click()

    const profilesDialog = page.getByRole('dialog').filter({ hasText: /配置|Profiles/i })
    await expect(profilesDialog).toBeVisible()

    const addProfileButton = profilesDialog.getByRole('button', { name: /新增配置|Add Profile/i })
    await addProfileButton.click()

    const profileInputSelector = 'input[placeholder*="配置名称"], input[placeholder*="Profile Name"]'
    const profileInputs = profilesDialog.locator(profileInputSelector)
    const firstProfileInput = profileInputs.first()
    await expect(firstProfileInput).toBeVisible()
    await firstProfileInput.clear()
    await firstProfileInput.fill('default')

    const activeProfileSelect = profilesDialog
      .getByText(/活跃配置|Active Profile/i)
      .locator('xpath=ancestor::*[@data-slot="form-item"]')
      .getByRole('combobox')
    await activeProfileSelect.click()
    await page.getByRole('option', { name: /default/i }).first().click()

    const expandButton = profilesDialog.locator('button[aria-expanded="false"]').first()
    if (await expandButton.isVisible().catch(() => false)) {
      await expandButton.click()
      await page.waitForTimeout(300)
    }

    const quotaSwitch = profilesDialog.getByRole('switch').first()
    await quotaSwitch.click()

    await profilesDialog.getByLabel(/请求次数|Request Count/i).fill('1')

    const periodSelect = profilesDialog
      .getByText(/周期|Period/i)
      .locator('xpath=ancestor::*[@data-slot="form-item"]')
      .getByRole('combobox')
      .first()
    await periodSelect.click()
    await page.getByRole('option', { name: /过去一段时间|Past duration/i }).first().click()

    const unitSelect = profilesDialog
      .getByText(/单位|Unit/i)
      .locator('xpath=ancestor::*[@data-slot="form-item"]')
      .getByRole('combobox')
      .first()
    await unitSelect.click()
    await page.getByRole('option', { name: /分钟|Minute/i }).first().click()

    const saveButton = profilesDialog.getByRole('button', { name: /保存|Save/i })
    await expect(saveButton).toBeEnabled()

    await Promise.all([waitForGraphQLOperation(page, 'UpdateAPIKeyProfiles'), saveButton.click()])
    await expect(profilesDialog).not.toBeVisible({ timeout: 10000 })
  })
})
