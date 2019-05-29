const csv = require('csv-parser')
const fs = require('fs')
const natural = require('natural')
const tokenizer = new natural.WordTokenizer()
const MINIMUM_FREQUENCY = 5

let input = process.stdin
let wordFile = process.argv[2]
if (!wordFile) throw new Error("Must supply a file of words to track")
let words = fs.readFileSync(wordFile,{encoding:'utf8'}).split("\n")

/*
get all the words
get all the submissions
    for each submission
    tokenize all the words
    for each word
        check if it has the word
            count it per year if it does
*/

let trackedWords = {}

input
    .pipe(csv())
    .on('data', (data) => {
        
        let year = data.Year
        if (!trackedWords[year]) trackedWords[year] = {
            submissions: 0,
            counts: {}
        }
        trackedWords[year].submissions++

        let tokens = tokenizer.tokenize(data.Title.toLowerCase()).concat(tokenizer.tokenize(data.Description.toLowerCase()))
        
        words.forEach(word => {
            if (!trackedWords[year].counts[word]) trackedWords[year].counts[word] = 0

            if (tokens.includes(word)) {
                trackedWords[year].counts[word]++
            }
        })
    })
    .on('end', () => {
        console.log(`Year\t${words.join('\t')}\tSubmissions`)
        for(let year in trackedWords) {
            let submissions = trackedWords[year].submissions
            let ratios = []
            for(let word in trackedWords[year].counts) {                
                ratios.push(trackedWords[year].counts[word]/submissions)
            }
            console.log(`${year}\t${ratios.join('\t')}\t${submissions}`)
        }
    })

