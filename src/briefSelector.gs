let briefDialog;
/**
 * Shows a dialog listing all the briefs.
 */
function showBriefSelectorDialog() {
  briefDialog = HtmlService.createHtmlOutputFromFile('src/html/briefSelector').setTitle('Select a Brief').setWidth(400).setHeight(500);
  DocumentApp.getUi().showModalDialog(briefDialog, 'Select a Brief');
}

function fetchBriefsList(limit, offset) {
  const requestPath = `/briefs?limit=${limit}&offset=${offset}`
  const response = apiRequest(requestPath);
  return response;
}