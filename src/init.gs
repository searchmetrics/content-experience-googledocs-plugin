/**
 * @OnlyCurrentDoc
 *
 * The above comment directs Apps Script to limit the scope of file
 * access for this add-on. It specifies that this add-on will only
 * attempt to read or modify the files in which the add-on is used,
 * and not all of the user's files. The authorization request message
 * presented to users will reflect this limited scope.
 */

/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode.
 */
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
      .addItem('Open Content-Ex', 'init')
      .addToUi();
}

/**
 * Runs when the user opens the content experience add-on from the Add-ons menu
 * @returns void
 */
function init() {
  // TODO: remove this before shipping. Just to start user journey from scratch while in development
  PropertiesService.getUserProperties().deleteAllProperties();
  PropertiesService.getDocumentProperties().deleteAllProperties();
  checkIfAPIDetailsExist();
  return;
}

/**
 * Check if this is the first time the Add-on is being launched.
 * If yes, ask the user for API key and secret.
 */
function checkIfAPIDetailsExist() {
  const userProperties = PropertiesService.getUserProperties();

  const apiKey = userProperties.getProperty('API_KEY');
  const apiSecret = userProperties.getProperty('API_SECRET');

  if(!apiKey && !apiSecret) {
    showAPIDetailsDialog();
    return;
  } else {
    checkIfBriefIsSelected();
  }
}

/**
 * Check if the user has already selected a brief.
 */
function checkIfBriefIsSelected() {
  // Check if the user has already selected a brief for the current doc
  const docProperties = PropertiesService.getDocumentProperties();
  const briefId = docProperties.getProperty('BRIEF_ID');

  if(briefId) {
    /**
    * Check if the brief already has some content
    * if yes show a prompt to the user to either select the content in the brief or overwrite with doc
    */
    showSidebar();
    return;
  }

  // if no, show all the briefs in the current account
  showBriefSelectorDialog();
}

/**
 * Shows a dialog listing all the briefs.
 */
function showBriefSelectorDialog() {
  var ui = HtmlService.createHtmlOutputFromFile('src/html/briefSelector')
      .setTitle('Select a Brief').setWidth(400).setHeight(500);
  DocumentApp.getUi().showModalDialog(ui, 'Select a Brief');
}

function getAllBriefs(page) {
  const userProperties = PropertiesService.getUserProperties();
  const docProperties = PropertiesService.getDocumentProperties();
  const noOfResults = 20;

  const apiKey = userProperties.getProperty('API_KEY');
  const apiSecret = userProperties.getProperty('API_SECRET');
  const licenseId = docProperties.getProperty('LICENSE_ID');
  const parentLicenseId = docProperties.getProperty('PARENT_LICENSE_ID');

  const query = '{"query": "{ content_experience { briefings_list(filter:{ account_id:' + parseInt(licenseId) + '}, license_id: ' + parseInt(parentLicenseId) + ', limit: ' + noOfResults + ', offset: ' + (page * noOfResults) + ') { briefings { id story } count } } }"}';

  const response = apiRequest(apiKey, apiSecret, query);
  if(response.data && response.data.content_experience.briefings_list.briefings) {
    return response.data.content_experience.briefings_list.briefings;
  }
  return null;
}

function getBrief() {
  const userProperties = PropertiesService.getUserProperties();
  const apiKey = userProperties.setProperty('API_KEY', key);
  const apiSecret = userProperties.setProperty('API_SECRET', secret);

  const docProperties = PropertiesService.getDocumentProperties();
  const briefId = docProperties.getProperty('BRIEF_ID');

  const query = '{"query": "{ content_experience { briefing(id:\"' + parseInt(briefId) + '\") { owner_id assignee_id name title content content_score target_score content_length target_length topics { state type value } topics_coverage { topic keywords_coverage { keyword current_frequency target_frequency keyword_type } } questions { id topic data { active group id origin question local_rank global_rank } } infos{ average_median_num_words content_score_goal readability_target seo_value seo_value_potential status traffic_index traffic_index_potential } content_optimization { docStats { customerReadability readability } } validation { overallScore readability contentScore { content_score coverage_score natural_language_score repetition_score length_score } duplicationCheckResults{ duplication_score level title url } } } } }"}'; 
  const response = apiRequest(key, secret, query);
  if(response.data && response.data.content_experience.briefing) {
    return response.data && response.data.content_experience.briefing
  }
}

/**
 * Runs when the add-on is installed.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Opens a dialog in the document asking the user for the API key and secret
 */
function showAPIDetailsDialog() {
  var ui = HtmlService.createHtmlOutputFromFile('src/html/apiDetails')
      .setTitle('API Details').setWidth(400).setHeight(300);
  DocumentApp.getUi().showModalDialog(ui, 'API Details');
}

/**
 * Called on apiDetails.html form submit
 * Receives the API key and secret and fetches the corresponding license to check if the details entered are correct
 */
function submitAPIDetailsAndVerify(key, secret) {
  const userProperties = PropertiesService.getUserProperties();
  const apiKey = userProperties.setProperty('API_KEY', key);
  const apiSecret = userProperties.setProperty('API_SECRET', secret);
  const docsService = getService();
  if(!docsService.hasAccess()) {
    const authorizationURL = docsService.getAuthorizationUrl();
    return authorizationURL;
  } else {
    checkIfBriefIsSelected();
    return true;
  }
}

function setSelectedBriefId(briefId) {
  const docProperties = PropertiesService.getDocumentProperties();
  docProperties.setProperty('BRIEF_ID', briefId);
  showSidebar();
  return;
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 */
function showSidebar() {
  var ui = HtmlService.createHtmlOutputFromFile('src/html/sidebar')
      .setTitle('Content Experience');
  DocumentApp.getUi().showSidebar(ui);
}

/**
 * Gets the text the user has selected. If there is no selection,
 * this function displays an error message.
 *
 * @return {Array.<string>} The selected text.
 */
function getSelectedText() {
  var selection = DocumentApp.getActiveDocument().getSelection();
  var text = [];
  if (selection) {
    var elements = selection.getSelectedElements();
    for (var i = 0; i < elements.length; ++i) {
      if (elements[i].isPartial()) {
        var element = elements[i].getElement().asText();
        var startIndex = elements[i].getStartOffset();
        var endIndex = elements[i].getEndOffsetInclusive();

        text.push(element.getText().substring(startIndex, endIndex + 1));
      } else {
        var element = elements[i].getElement();
        // Only translate elements that can be edited as text; skip images and
        // other non-text elements.
        if (element.editAsText) {
          var elementText = element.asText().getText();
          // This check is necessary to exclude images, which return a blank
          // text element.
          if (elementText) {
            text.push(elementText);
          }
        }
      }
    }
  }
  if (!text.length) throw new Error('Please select some text.');
  return text;
}

/**
 * Gets the stored user preferences for the origin and destination languages,
 * if they exist.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @return {Object} The user's origin and destination language preferences, if
 *     they exist.
 */
function getPreferences() {
  var userProperties = PropertiesService.getUserProperties();
  return {
    originLang: userProperties.getProperty('originLang'),
    destLang: userProperties.getProperty('destLang')
  };
}

/**
 * Gets the user-selected text and translates it from the origin language to the
 * destination language. The languages are notated by their two-letter short
 * form. For example, English is 'en', and Spanish is 'es'. The origin language
 * may be specified as an empty string to indicate that Google Translate should
 * auto-detect the language.
 *
 * @param {string} origin The two-letter short form for the origin language.
 * @param {string} dest The two-letter short form for the destination language.
 * @param {boolean} savePrefs Whether to save the origin and destination
 *     language preferences.
 * @return {Object} Object containing the original text and the result of the
 *     translation.
 */
function getTextAndTranslation(origin, dest, savePrefs) {
  if (savePrefs) {
    PropertiesService.getUserProperties()
        .setProperty('originLang', origin)
        .setProperty('destLang', dest);
  }
  var text = getSelectedText().join('\n');
  return {
    text: text,
    translation: translateText(text, origin, dest)
  };
}

/**
 * Replaces the text of the current selection with the provided text, or
 * inserts text at the current cursor location. (There will always be either
 * a selection or a cursor.) If multiple elements are selected, only inserts the
 * translated text in the first element that can contain text and removes the
 * other elements.
 *
 * @param {string} newText The text with which to replace the current selection.
 */
function insertText(newText) {
  var selection = DocumentApp.getActiveDocument().getSelection();
  if (selection) {
    var replaced = false;
    var elements = selection.getSelectedElements();
    if (elements.length === 1 && elements[0].getElement().getType() ===
        DocumentApp.ElementType.INLINE_IMAGE) {
      throw new Error('Can\'t insert text into an image.');
    }
    for (var i = 0; i < elements.length; ++i) {
      if (elements[i].isPartial()) {
        var element = elements[i].getElement().asText();
        var startIndex = elements[i].getStartOffset();
        var endIndex = elements[i].getEndOffsetInclusive();
        element.deleteText(startIndex, endIndex);
        if (!replaced) {
          element.insertText(startIndex, newText);
          replaced = true;
        } else {
          // This block handles a selection that ends with a partial element. We
          // want to copy this partial text to the previous element so we don't
          // have a line-break before the last partial.
          var parent = element.getParent();
          var remainingText = element.getText().substring(endIndex + 1);
          parent.getPreviousSibling().asText().appendText(remainingText);
          // We cannot remove the last paragraph of a doc. If this is the case,
          // just remove the text within the last paragraph instead.
          if (parent.getNextSibling()) {
            parent.removeFromParent();
          } else {
            element.removeFromParent();
          }
        }
      } else {
        var element = elements[i].getElement();
        if (!replaced && element.editAsText) {
          // Only translate elements that can be edited as text, removing other
          // elements.
          element.clear();
          element.asText().setText(newText);
          replaced = true;
        } else {
          // We cannot remove the last paragraph of a doc. If this is the case,
          // just clear the element.
          if (element.getNextSibling()) {
            element.removeFromParent();
          } else {
            element.clear();
          }
        }
      }
    }
  } else {
    var cursor = DocumentApp.getActiveDocument().getCursor();
    var surroundingText = cursor.getSurroundingText().getText();
    var surroundingTextOffset = cursor.getSurroundingTextOffset();

    // If the cursor follows or preceds a non-space character, insert a space
    // between the character and the translation. Otherwise, just insert the
    // translation.
    if (surroundingTextOffset > 0) {
      if (surroundingText.charAt(surroundingTextOffset - 1) != ' ') {
        newText = ' ' + newText;
      }
    }
    if (surroundingTextOffset < surroundingText.length) {
      if (surroundingText.charAt(surroundingTextOffset) != ' ') {
        newText += ' ';
      }
    }
    cursor.insertText(newText);
  }
}

function apiRequest(key, secret, query) {

  var docsService = getService();
  var response = UrlFetchApp.fetch('https://api.searchmetrics.com', {
    headers: {
      Authorization: 'Bearer ' + docsService.getAccessToken()
    }
  });

  console.log('API Request response:', response.getContentText());

  return JSON.parse(response.getContentText());
}

// https://script.google.com/macros/d/{SCRIPT ID}/usercallback