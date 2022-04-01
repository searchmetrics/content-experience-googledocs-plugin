function getDocsService(key, secret) {
  // Create a new service with the given name. The name will be used when
  // persisting the authorized token, so ensure it is unique within the
  // scope of the property store.
  return OAuth2.createService('content-ex')

      // Set the endpoint URLs
      .setAuthorizationBaseUrl('https://login.searchmetrics.com/authorize')
      .setTokenUrl('https://login.searchmetrics.com/oauth/token')
      // Set the client ID and secret

      .setClientId(key)
      .setClientSecret(secret)

      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scopes to request.
      .setScope('create:briefs read:briefs update:briefs')
      .setParam('response_type', 'code')
      .setParam('audience', 'https://api.searchmetrics.com');
}