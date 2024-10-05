let sections = [];
let currentSectionIndex = 0;

async function searchWikipedia() {
    const query = document.getElementById("search-bar").value;
    const language = document.getElementById("language-dropdown").value;
    const url = `https://${language}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&format=json&origin=*`;

    const response = await fetch(url);
    const data = await response.json();
    displayResults(data.query.search, language);
}

function displayResults(results, language) {
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    results.forEach(result => {
        const resultItem = document.createElement("div");
        resultItem.classList.add("result-item");
        resultItem.textContent = result.title;
        resultItem.onclick = () => loadArticle(result.title, language);
        resultsContainer.appendChild(resultItem);
    });
}

async function loadArticle(title, language) {
    const url = `https://${language}.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&format=json&origin=*`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.parse) {
        const articleHTML = data.parse.text["*"];
        const parser = new DOMParser();
        const doc = parser.parseFromString(articleHTML, 'text/html');

        sections = Array.from(doc.querySelectorAll("h2, h3, p"));
        displaySection(0);

        document.getElementById("article-container").style.display = "block";
    } else {
        document.getElementById("article").innerHTML = "Unable to load the article.";
    }
}

function displaySection(index) {
    const articleContainer = document.getElementById("article");
    articleContainer.innerHTML = "";

    for (let i = index; i < sections.length; i++) {
        if (sections[i].tagName === "H2" || sections[i].tagName === "H3") {
            if (i !== index) break;
        }
        articleContainer.appendChild(sections[i].cloneNode(true));
    }

    currentSectionIndex = index;
    updateNavigationButtons();
}

function navigateSection(direction) {
    let newIndex = currentSectionIndex;

    if (direction === 1) { 
        for (let i = currentSectionIndex + 1; i < sections.length; i++) {
            if (sections[i].tagName === "H2" || sections[i].tagName === "H3") {
                newIndex = i;
                break;
            }
        }
    } else if (direction === -1) { 
        for (let i = currentSectionIndex - 1; i >= 0; i--) {
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

    let isLastSection = true;
    for (let i = currentSectionIndex + 1; i < sections.length; i++) {
        if (sections[i].tagName === "H2" || sections[i].tagName === "H3") {
            isLastSection = false;
            break;
        }
    }
    document.getElementById("next-btn").disabled = isLastSection;
}

async function sendToKindle() {
    const articleContent = document.getElementById("article").innerText;
    const articleTitle = sections[0].innerText;
    const kindleEmail = prompt("Enter your Kindle email:");

    if (kindleEmail) {
        convertToEPUB(articleTitle, articleContent)
            .then(epubBlob => sendEmail(kindleEmail, articleTitle, epubBlob))
            .then(response => {
                if (response) {
                    alert("Article sent to your Kindle!");
                } else {
                    alert("Failed to send to Kindle.");
                }
            });
    }
}

function convertToEPUB(title, content) {
    return new Promise((resolve, reject) => {
        const zip = new JSZip();
        const epubFileName = `${title.replace(/\s+/g, "_")}.epub`;

        const epubContent = `
            <h1>${title}</h1>
            <p>${content}</p>
        `;

        zip.file("content.html", epubContent);

        zip.generateAsync({ type: "blob" })
            .then(blob => resolve(blob))
            .catch(err => reject(err));
    });
}

function sendEmail(kindleEmail, title, epubBlob) {
    const formData = new FormData();
    formData.append('to', kindleEmail);
    formData.append('subject', `Your Wikipedia Article: ${title}`);
    formData.append('attachment', epubBlob, `${title.replace(/\s+/g, "_")}.epub`);

    return fetch('https://api.email-service.com/send', {
        method: 'POST',
        body: formData
    })
    .then(response => response.ok)
    .catch(() => false);
}
