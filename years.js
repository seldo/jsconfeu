const csv = require('csv-parser')
const ngrams = require('natural').NGrams
const util = require('util')
const stopword = require('stopword')
const MINIMUM_FREQUENCY = 5

let input = process.stdin
let unigrams = {}
let bigrams = {}
let trigrams = {}

input
    .pipe(csv())
    .on('data', (data) => {

        let year = data.Year
        let countGrams = function(year,grams,collector) {
            if(!collector[year]) collector[year] = {}
            grams.forEach((gram) => {
                let id = gram.join('-')
                if(collector[year][id]) {
                    collector[year][id]++
                } else {
                    collector[year][id] = 1
                }
            })    
        }

        data.ngrams = {}
        let cleanWords = (str) => {
            let stripped = str.replace("’","'").replace(":"," ").replace("\""," ").replace("("," ").replace(")"," ").replace("-"," ").replace(","," ").replace("&"," and ").replace("!"," ").replace("'","").replace("\n"," ").replace("{"," ").replace("}"," ").replace("["," ").replace("]"," ")
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
            let trimmed = []
            for(let i = 0; i < singularized.length; i++) {
                let str = singularized[i]
                str = str.trim()
                if(/.*\./.test(str)) {
                    str = str.slice(0,-1)
                }
                if(/.*,/.test(str)) {
                    str = str.slice(0,-1)
                }
                if(!str) continue
                trimmed.push(str)
            }
            let myStops = [
                '-',
                '',
                '+',
                'let',
                'it',
                'its',
                ']',
                '[',
                '{',
                '}'
            ]
            let noStops2 = []
            for(let i = 0; i < trimmed.length; i++) {
                let str = trimmed[i]
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

        countGrams(year,data.ngrams.title.unigrams,unigrams)
        countGrams(year,data.ngrams.title.bigrams,bigrams)
        countGrams(year,data.ngrams.title.trigrams,trigrams)

        let bodyWords = cleanWords(data.Description)
        data.ngrams.body = {}
        data.ngrams.body.unigrams = ngrams.ngrams(bodyWords,1)
        data.ngrams.body.bigrams = ngrams.ngrams(bodyWords,2)
        data.ngrams.body.trigrams = ngrams.ngrams(bodyWords,3)

        countGrams(year,data.ngrams.body.unigrams,unigrams)
        countGrams(year,data.ngrams.body.bigrams,bigrams)
        countGrams(year,data.ngrams.body.trigrams,trigrams)
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
        /*
        console.log(sortCountedGrams(unigrams))
        console.log(sortCountedGrams(bigrams))
        console.log(sortCountedGrams(trigrams))
        */
        let outputYears = function(grams) {
            for(let year in grams) {
                let sortedGrams = sortCountedGrams(grams[year])
                for(let i = 0; i < sortedGrams.length; i++) {
                    console.log(year + "," + sortedGrams[i].join(","))
                }
            }                
        }
        console.log("--Unigrams--")
        outputYears(unigrams)
        console.log("--Bigrams--")
        outputYears(bigrams)
        console.log("--Trigrams--")
        outputYears(trigrams)
    })

