var sections = [];
var currentSectionIndex = 0;

function searchWikipedia() {
    var query = document.getElementById("search-bar").value;
    var language = document.getElementById("language-dropdown").value;
    var url = 'https://' + language + '.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent(query) + '&format=json&origin=*';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            displayResults(data.query.search, language);
        } else if (xhr.readyState === 4) {
            console.error('Error loading Wikipedia data', xhr.responseText);
        }
    };
    xhr.send();
}

function displayResults(results, language) {
    var resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";  // Clear previous results

    for (var i = 0; i < results.length; i++) {
        var resultItem = document.createElement("div");
        resultItem.textContent = results[i].title;
        resultItem.style.cursor = "pointer";
        resultItem.onclick = (function (title) {
            return function () {
                loadArticle(title, language);
            };
        })(results[i].title);
        resultsContainer.appendChild(resultItem);
    }
}

function loadArticle(title, language) {
    var url = 'https://' + language + '.wikipedia.org/w/api.php?action=parse&page=' + encodeURIComponent(title) + '&format=json&origin=*';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            if (data.parse) {
                var articleHTML = data.parse.text['*'];
                var parser = new DOMParser();
                var doc = parser.parseFromString(articleHTML, 'text/html');
                sections = Array.prototype.slice.call(doc.querySelectorAll("h2, h3, p"));
                currentSectionIndex = 0;
                displaySection(0);
                document.getElementById("article-container").style.display = "block";
            } else {
                console.error('Error parsing Wikipedia article', data);
                document.getElementById("article").innerHTML = "Unable to load the article.";
            }
        } else if (xhr.readyState === 4) {
            console.error('Error loading article', xhr.responseText);
        }
    };
    xhr.send();
}

function displaySection(index) {
    var articleContainer = document.getElementById("article");
    articleContainer.innerHTML = "";

    for (var i = index; i < sections.length; i++) {
        if (sections[i].tagName === "H2" || sections[i].tagName === "H3") {
            if (i !== index) break;
        }
        articleContainer.appendChild(sections[i].cloneNode(true));
    }

    currentSectionIndex = index;
    updateNavigationButtons();
}

function navigateSection(direction) {
    var newIndex = currentSectionIndex;

    if (direction === 1) {
        for (var i = currentSectionIndex + 1; i < sections.length; i++) {
            if (sections[i].tagName === "H2" || sections[i].tagName === "H3") {
                newIndex = i;
                break;
            }
        }
    } else if (direction === -1) {
        for (var i = currentSectionIndex - 1; i >= 0; i--) {
            if (sections[i].tagName === "H2" || sections[i].tagName === "H3") {
                newIndex = i;
                break;
            }
        }
    }

    displaySection(newIndex);
}

function updateNavigationButtons() {
    document.getElementById("prev-btn").disabled = currentSectionIndex === 0;

    var isLastSection = true;
    for (var i = currentSectionIndex + 1; i < sections.length; i++) {
        if (sections[i].tagName === "H2" || sections[i].tagName === "H3") {
            isLastSection = false;
            break;
        }
    }
    document.getElementById("next-btn").disabled = isLastSection;
}

function sendToKindle() {
    // Prompt for the Kindle email
    var email = prompt("Enter your Kindle email:");
    
    // Validate the email input
    if (!email) {
        alert("Email is required to send the EPUB.");
        return;
    }

    var articleContent = document.getElementById("article").innerHTML;
    var title = document.getElementById("search-bar").value; // Use the search title as the document title
    var epubContent = createEpub(title, articleContent);

    // Create a blob and use FileSaver.js to save it as an EPUB file
    var blob = new Blob([epubContent], { type: 'application/epub+zip' });
    var url = URL.createObjectURL(blob);
    
    // Use FileSaver.js to save the file
    saveAs(blob, title + ".epub");

    // Notify the user
    alert("EPUB created. Please manually attach it and send it to " + email);
}

function createEpub(title, content) {
    // Simple EPUB structure
    var epub = `
<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
    <metadata>
        <dc:title>${title}</dc:title>
        <dc:creator>Wikipedia Reader</dc:creator>
        <dc:identifier id="id">urn:uuid:123456</dc:identifier>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    </metadata>
    <manifest>
        <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
    </manifest>
    <spine>
        <itemref idref="content"/>
    </spine>
</package>
`;

    // Create content.xhtml
    var contentXhtml = `
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
    <meta charset="utf-8"/>
    <title>${title}</title>
</head>
<body>
    ${content}
</body>
</html>
`;

    return epub + contentXhtml; // Combine both parts
}

