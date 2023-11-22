module.exports = {
    globDirectory: 'build/',
    globPatterns: [
        '**/*.{html,js,css,json}'
    ],
    swDest: 'build/sw.js',
    ignoreURLParametersMatching: [
        /^utm_/,
        /^fbclid$/
    ]
};