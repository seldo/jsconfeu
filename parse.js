const csv = require('csv-parser')
const ngrams = require('natural').NGrams
const util = require('util')
const MINIMUM_FREQUENCY = 3

let input = process.stdin
let corpus = []
let unigrams = {}
let bigrams = {}

input
    .pipe(csv())
    .on('data', (data) => {
        data.ngrams = {}
        data.ngrams.title = {}
        data.ngrams.title.unigrams = ngrams.ngrams(data.Title.toLowerCase(),1)
        data.ngrams.title.bigrams = ngrams.ngrams(data.Title.toLowerCase(),2)
        data.ngrams.title.trigrams = ngrams.ngrams(data.Title.toLowerCase(),3)

        console.log(data.Title)

        let countGrams = function(grams,collector) {
            grams.forEach((gram) => {
                let id = gram.join('-')
                if(collector[id]) {
                    collector[id]++
                } else {
                    collector[id] = 1
                }
            })    
        }

        countGrams(data.ngrams.title.bigrams,bigrams)

        /*
        data.ngrams.body = {}
        data.ngrams.body.unigrams = ngrams.ngrams(data.Description,1)
        data.ngrams.body.bigrams = ngrams.ngrams(data.Description,2)
        data.ngrams.body.trigrams = ngrams.ngrams(data.Description,3)
        console.log(util.inspect(data,{depth:4}))
        */
        corpus.push(data)
    })
    .on('end', () => {
        let sortCountedGrams = function(collection) {
            let gramsArray = []
            for(let gram in collection) {
                // ignore below our threshold for uniqueness
                if(collection[gram] >= MINIMUM_FREQUENCY) {
                    gramsArray.push([gram,collection[gram]])
                }
            }
            let bestCount = (a,b) => {
                if(a[1] < b[1]) return 1
                else return -1
            }
            return gramsArray.sort(bestCount)
        }
        console.log(sortCountedGrams(bigrams))
    })

