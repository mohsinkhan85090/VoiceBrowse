// Getting the search result links from current tab
// receiving message from popup.js
//chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  //if (message.action === "fromPopup") {
    var links = Array.from(document.querySelectorAll('div.g a[href^="https"]')).map(function (link) {
      return link.href;
    });

    var Title = Array.from(document.querySelectorAll('div.g h3')).map(function (Title) {
      return Title.innerHTML;
    });

    //Sending the link to background.js
    (async () => {
      const response = await chrome.runtime.sendMessage({ action: 'sendLinks', links: links, Title: Title }, (resposne) => {
        // console.log(response.received);
      });

    })();
  //}
//})

// Function to scrape and send webpage content to the background script
function scrapeWebpageContent() {
  var webpageContent = document.documentElement.innerText;

  // Send the webpage content to the background script
  chrome.runtime.sendMessage({ action: 'sendWebpageContent', content: webpageContent });
}

// Execute the content scraping function
scrapeWebpageContent();