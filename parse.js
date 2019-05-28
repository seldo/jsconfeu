const csv = require('csv-parser')
const ngrams = require('natural').NGrams
const util = require('util')
const stopword = require('stopword')
const MINIMUM_FREQUENCY = 10

let input = process.stdin
let corpus = []
let unigrams = {}
let bigrams = {}
let trigrams = {}

input
    .pipe(csv())
    .on('data', (data) => {

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

        data.ngrams = {}
        let cleanWords = (str) => {
            let stripped = str.replace("’","'").replace(":"," ").replace("\""," ").replace("("," ").replace(")"," ").replace("-"," ").replace(","," ").replace("&"," and ").replace("!"," ").replace("'","")
            let lowercased = stripped.toLowerCase().split(" ")
            let noStops = stopword.removeStopwords(lowercased)
            let singularized = []
            for(let i = 0; i < noStops.length; i++) {
                let str = noStops[i]
                if(/.*s$/.test(str) && str.slice(-2) != 'js' && str != 'css') {                    
                    singularized.push(str.slice(0,-1))
                } else {
                    singularized.push(str)
                }
            }
            let myStops = [
                '-',
                '',
                '+',
                'let',
                'it',
                'its'
            ]
            let noStops2 = []
            for(let i = 0; i < singularized.length; i++) {
                let str = singularized[i]
                if(!myStops.includes(str)) {
                    noStops2.push(str)
                }
            }
            return noStops2
        }

        let titleWords = cleanWords(data.Title)
        data.ngrams.title = {}
        data.ngrams.title.unigrams = ngrams.ngrams(titleWords,1)
        data.ngrams.title.bigrams = ngrams.ngrams(titleWords,2)
        data.ngrams.title.trigrams = ngrams.ngrams(titleWords,3)

        countGrams(data.ngrams.title.unigrams,unigrams)
        countGrams(data.ngrams.title.bigrams,bigrams)
        countGrams(data.ngrams.title.trigrams,trigrams)

        let bodyWords = cleanWords(data.Description)
        data.ngrams.body = {}
        data.ngrams.body.unigrams = ngrams.ngrams(bodyWords,1)
        data.ngrams.body.bigrams = ngrams.ngrams(bodyWords,2)
        data.ngrams.body.trigrams = ngrams.ngrams(bodyWords,3)

        countGrams(data.ngrams.body.unigrams,unigrams)
        countGrams(data.ngrams.body.bigrams,bigrams)
        countGrams(data.ngrams.body.trigrams,trigrams)

        corpus.push(data)
    })
    .on('end', () => {
        let sortCountedGrams = function(collection) {
            // convert to array
            let gramsArray = []
            for(let gram in collection) {
                // ignore below our threshold for uniqueness
                if(collection[gram] >= MINIMUM_FREQUENCY) {
                    gramsArray.push([gram,collection[gram]])
                }
            }
            let bestCount = (a,b) => {
                if(a[1] < b[1]) return 1
                if(a[1] == b[1]) {
                    return a[0].localeCompare(b[0])
                }
                else return -1
            }
            return gramsArray.sort(bestCount)
        }
        console.log(sortCountedGrams(unigrams))
        console.log(sortCountedGrams(bigrams))
        console.log(sortCountedGrams(trigrams))
    })

