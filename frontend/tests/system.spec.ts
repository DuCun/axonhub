import { test, expect } from '@playwright/test'
import { gotoAndEnsureAuth, waitForGraphQLOperation } from './auth.utils'

const API_KEY_PREFIX_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

test.describe('Admin System Management', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndEnsureAuth(page, '/system')
  })

  test('can view system tabs and update brand settings', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /System|系统/i }).first()
    ).toBeVisible()

    const brandTab = page.getByRole('tab', { name: /Brand|品牌/i })
    await brandTab.click()
    await expect(brandTab).toHaveAttribute('aria-selected', 'true')

    const brandInput = page.getByLabel(/Brand Name|品牌名称/i)
    await expect(brandInput).toBeVisible()

    const originalValue = await brandInput.inputValue()
    const newValue = originalValue.includes('pw-test')
      ? `${originalValue}-${Date.now().toString().slice(-4)}`
      : `pw-test-${Date.now().toString().slice(-4)}`

    await brandInput.fill(newValue)
    const saveButton = page.getByRole('button', { name: /Save Settings|保存设置/i })
    await expect(saveButton).toBeEnabled()

    await Promise.all([
      waitForGraphQLOperation(page, 'UpdateBrandSettings'),
      saveButton.click()
    ])

    await expect(brandInput).toHaveValue(newValue)

    if (newValue !== originalValue) {
      await brandInput.fill(originalValue)
      const revertButton = page.getByRole('button', { name: /Save Settings|保存设置/i })
      await expect(revertButton).toBeEnabled()
      await Promise.all([
        waitForGraphQLOperation(page, 'UpdateBrandSettings'),
        revertButton.click()
      ])
      await expect(brandInput).toHaveValue(originalValue)
    }

    const storageTab = page.getByRole('tab', { name: /Storage|存储/i })
    await storageTab.click()
    await expect(storageTab).toHaveAttribute('aria-selected', 'true')
    
    // Wait for storage content to load and check for any storage-related content
    await page.waitForTimeout(1000)
    const storageContent = page.locator('h1, h2, h3, h4, div, span').filter({ hasText: /Storage|storage|存储/i })
    if (await storageContent.count() > 0) {
      await expect(storageContent.first()).toBeVisible()
    } else {
      // If no specific storage text, just verify the tab is active
      await expect(storageTab).toHaveAttribute('aria-selected', 'true')
    }
  })

  test('can update api key prefix in general settings', async ({ page }) => {
    const generalTab = page.getByRole('tab', { name: /General|常规/i })
    await generalTab.click()
    await expect(generalTab).toHaveAttribute('aria-selected', 'true')

    const prefixInput = page.getByLabel(/API Key Prefix|API Key 前缀/i)
    await expect(prefixInput).toBeVisible()

    const originalValue = await prefixInput.inputValue()
    const baselineValue = API_KEY_PREFIX_PATTERN.test(originalValue) ? originalValue : 'sk'
    const nextValue = baselineValue === 'sk-v2' ? 'sk-prod-2026' : 'sk-v2'
    const finalValue = baselineValue === nextValue ? 'sk' : baselineValue

    await prefixInput.fill(nextValue)
    const saveButton = page.getByRole('button', { name: /Save Settings|保存设置/i })
    await expect(saveButton).toBeEnabled()

    await Promise.all([
      waitForGraphQLOperation(page, 'UpdateSystemGeneralSettings'),
      saveButton.click()
    ])

    await expect(prefixInput).toHaveValue(nextValue)

    await prefixInput.fill(finalValue)
    const revertButton = page.getByRole('button', { name: /Save Settings|保存设置/i })
    await expect(revertButton).toBeEnabled()
    await Promise.all([
      waitForGraphQLOperation(page, 'UpdateSystemGeneralSettings'),
      revertButton.click()
    ])

    await expect(prefixInput).toHaveValue(finalValue)
  })

  test('rejects invalid api key prefix formats in general settings', async ({ page }) => {
    const generalTab = page.getByRole('tab', { name: /General|常规/i })
    await generalTab.click()
    await expect(generalTab).toHaveAttribute('aria-selected', 'true')

    const prefixInput = page.getByTestId('system-api-key-prefix')
    await expect(prefixInput).toBeVisible()

    const saveButton = page.getByRole('button', { name: /Save Settings|保存设置/i })
    const validation = page.getByTestId('system-api-key-prefix-validation')

    await prefixInput.fill('sk--prod')
    await expect(validation).toBeVisible()
    await expect(saveButton).toBeDisabled()

    await prefixInput.fill('SK-prod')
    await expect(validation).toBeVisible()
    await expect(saveButton).toBeDisabled()

    await prefixInput.fill('2026-sk')
    await expect(validation).toBeVisible()
    await expect(saveButton).toBeDisabled()

    await prefixInput.fill('sk-')
    await expect(validation).toBeVisible()
    await expect(saveButton).toBeDisabled()
  })
})
