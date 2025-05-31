const apiKey = 'YOUR_API_KEY'; // Replace with your actual API key

let allWebPageData = '';
let webpageContent = '';

// Utility: Get all bookmarks
function getAllBookMarks() {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        const bookmarks = [];
        function extractBookmarks(nodes) {
            for (const node of nodes) {
                if (node.url) bookmarks.push({ title: node.title, url: node.url });
                if (node.children) extractBookmarks(node.children);
            }
        }
        extractBookmarks(bookmarkTreeNodes);
        chrome.runtime.sendMessage({ bookmarks });
    });
}

// Utility: Search tabs or bookmarks
function searchAnythingWithQuery(query) {
    chrome.tabs.query({}, (tabs) => {
        const match = tabs.find(tab => tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query));
        if (match) {
            chrome.tabs.update(match.id, { active: true });
            chrome.runtime.sendMessage({ prompt: `Opened tab with query: ${query}` });
        } else {
            chrome.runtime.sendMessage({ prompt: `No matching tab found for: ${query}` });
        }
    });
}

// Utility: Toggle tab mute state
function toggleMuteState(tabId, mute) {
    chrome.tabs.update(tabId, { muted: mute });
}

// Utility: Check if current tab is bookmarked
function checkBookmarkStatus(url) {
    chrome.bookmarks.search({ url }, (results) => {
        const isBookmarked = results.length > 0;
        chrome.runtime.sendMessage({ isBookmarked });
    });
}

// Utility: Remove bookmark by URL
function removeBookmark(url) {
    chrome.bookmarks.search({ url }, (results) => {
        for (const bookmark of results) {
            chrome.bookmarks.remove(bookmark.id);
        }
        chrome.runtime.sendMessage({ prompt: "Bookmark removed!" });
    });
}

// Utility: Add current tab as bookmark
function addBookmark(url, title) {
    chrome.bookmarks.create({ title, url }, () => {
        chrome.runtime.sendMessage({ prompt: "Bookmark added!" });
    });
}

// Utility: Analyze page content using OpenAI
async function analyzeContent(content) {
    try {
        const prompt = `Summarize this page content in simple points:\n\n${content}`;
        const response = await fetch("https://api.openai.com/v1/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "text-davinci-003",
                prompt,
                max_tokens: 300,
                temperature: 0.7,
            }),
        });

        const data = await response.json();
        const result = data.choices?.[0]?.text?.trim() || "Could not get summary.";
        chrome.runtime.sendMessage({ prompt: result });
    } catch (error) {
        console.error("OpenAI Error:", error);
        chrome.runtime.sendMessage({ prompt: "Failed to summarize content." });
    }
}

// Listener for content scripts to send webpage text
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.webpageContent) {
        webpageContent = message.webpageContent;
        return true;
    }

    if (message.type === "voiceCommand") {
        handleVoiceCommand(message.payloadData.toLowerCase().trim());
        return true;
    }
});

// Handles voice commands
function handleVoiceCommand(command) {
    const firstWord = command.split(" ")[0];

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        const tabId = currentTab.id;
        const url = currentTab.url;
        const title = currentTab.title;

        switch (true) {
            case command.includes("open"):
                searchAnythingWithQuery(command.slice(command.indexOf("open") + 5));
                break;

            case command.includes("refresh"):
                chrome.tabs.reload(tabId);
                chrome.runtime.sendMessage({ prompt: "Page refreshed!" });
                break;

            case command.includes("closetab"):
                chrome.tabs.remove(tabId);
                break;

            case command.includes("gotonewtab"):
                chrome.tabs.create({ url: "https://www.google.com" });
                break;

            case command.includes("previous") || command.includes("gotoprevioustab"):
                chrome.tabs.query({ currentWindow: true }, (tabs) => {
                    const index = currentTab.index;
                    const prevTab = tabs[index - 1] || tabs[tabs.length - 1];
                    chrome.tabs.update(prevTab.id, { active: true });
                    chrome.runtime.sendMessage({ prompt: "Switched to previous tab!" });
                });
                break;

            case command.includes("gotonexttab"):
                chrome.tabs.query({ currentWindow: true }, (tabs) => {
                    const index = currentTab.index;
                    const nextTab = tabs[(index + 1) % tabs.length];
                    chrome.tabs.update(nextTab.id, { active: true });
                    chrome.runtime.sendMessage({ prompt: "Switched to next tab!" });
                });
                break;

            case command.includes("mute"):
                toggleMuteState(tabId, true);
                chrome.runtime.sendMessage({ prompt: "Tab muted!" });
                break;

            case command.includes("unmute"):
                toggleMuteState(tabId, false);
                chrome.runtime.sendMessage({ prompt: "Tab unmuted!" });
                break;

            case command.includes("restore"):
                chrome.sessions.getRecentlyClosed({ maxResults: 1 }, (sessions) => {
                    if (sessions[0]?.tab) {
                        chrome.sessions.restore(sessions[0].tab.sessionId);
                        chrome.runtime.sendMessage({ prompt: "Tab restored!" });
                    } else {
                        chrome.runtime.sendMessage({ prompt: "No recently closed tab to restore." });
                    }
                });
                break;

            case command.includes("showbookmarks"):
                getAllBookMarks();
                break;

            case command.includes("addbookmark"):
                addBookmark(url, title);
                break;

            case command.includes("removebookmark"):
                removeBookmark(url);
                break;

            case command.includes("checkbookmark"):
                checkBookmarkStatus(url);
                break;

            case command.includes("analyze"):
                if (webpageContent.length > 100) {
                    analyzeContent(webpageContent);
                } else {
                    chrome.runtime.sendMessage({ prompt: "Content too short or not available!" });
                }
                break;

            default:
                chrome.runtime.sendMessage({ prompt: "Sorry, command not recognized." });
        }
    });
}

// Run content script to extract webpage content on tab switch
function executeContentScript() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ["content.js"],
            });
        }
    });
}

chrome.tabs.onActivated.addListener(() => {
    executeContentScript();
});
