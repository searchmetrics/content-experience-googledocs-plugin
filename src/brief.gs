let briefId;
function getSelectedBrief() {
  // Check if the user has already selected a brief for the current doc
  const docProperties = PropertiesService.getDocumentProperties();
  briefId = docProperties.getProperty('BRIEF_ID');
  return briefId;
}

function showSidebar() {
  var ui = HtmlService.createHtmlOutputFromFile('src/html/sidebar')
    .setTitle('Content Experience');
  DocumentApp.getUi().showSidebar(ui);
}

function setSelectedBrief(selectedBriefId) {
  const docProperties = PropertiesService.getDocumentProperties();
  docProperties.setProperty('BRIEF_ID', selectedBriefId);
  briefId = selectedBriefId;
  showSidebar();
  return;
}

function getBrief() {
  const docProperties = PropertiesService.getDocumentProperties();
  const briefId = docProperties.getProperty('BRIEF_ID');
  const brief = fetchBrief(briefId);
  // DocumentApp.getActiveDocument().getBody().getText() }
  return brief;
}

function fetchBrief(briefId) {
  const requestPath = `/briefs/123e4567-e89b-12d3-a456-426614174000`
  const response = apiRequest(requestPath);
  return response;
}