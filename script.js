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
        var resultItem = document.createElement("a");
        resultItem.href = "#article";
        resultItem.className = "result-item";
        resultItem.textContent = results[i].title;
        resultItem.setAttribute('data-title', results[i].title);  // Save the title as a data attribute

        // Use standard function instead of arrow function
        resultItem.onclick = function () {
            var title = this.getAttribute('data-title');
            loadArticle(title, language);
        };
        
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
