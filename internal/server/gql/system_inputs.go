package gql

type UpdateSystemGeneralSettingsInput struct {
	CurrencyCode *string `json:"currencyCode,omitempty"`
	Timezone     *string `json:"timezone,omitempty"`
	APIKeyPrefix *string `json:"apiKeyPrefix,omitempty"`
}
