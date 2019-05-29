const csv = require('csv-parser')
const natural = require('natural')
const shuffle = require('knuth-shuffle').knuthShuffle
const Text = require('markov-chains-text').default

let titles = []
let descriptions = ['what']

let input = process.stdin
input
    .pipe(csv())
    .on('data', (data) => {
        titles.push(data.Title)
        let tokenizer = new natural.SentenceTokenizer()
        try {
            let sentences = tokenizer.tokenize(data.Description)
            descriptions = descriptions.concat(sentences)
        } catch(e) {
            // ignore errors
        }
    })
    .on('end', () => {
        shuffle(titles)
        shuffle(descriptions)
        let fakeTitles = new Text(titles.join(" "), { stateSize: 1 })
        console.log("Title:")
        console.log(fakeTitles.makeSentence({maxChars: 100}))
        console.log("Description:")
        console.log(descriptions.slice(0,5).join(" "))
    })

