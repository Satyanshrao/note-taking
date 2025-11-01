const marked = require('marked');

// Configure marked options
marked.setOptions({
    breaks: true,
    gfm: true
});

function markdownToHtml(markdown) {
    return marked.parse(markdown);
}

function htmlToPlain(html) {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

module.exports = {
    markdownToHtml,
    htmlToPlain
};

