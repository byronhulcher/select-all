const breakApartParagraph = require('./break-apart-paragraphs.js')
const mongoist = require('mongoist')
const db = mongoist('mongodb://127.0.0.1:27017/selectall')
const prompt = require('prompt-sync')({sigint: true})
const _ = require('lodash')
const STATES = {
  CLEANED: 'CLEANED'
}
const MARKOV = {
  words: {

  },
  sentenceStarters: [],
  sentenceEnders: []
}

function addParagraphToMarkov(paragraph){
  let brokenUpParagraph = breakApartParagraph(paragraph)
  let identifiedWord
  let previousIdentifiedWord
  let markovKey
  let previousMarkovKey
  for (let identifiedWordIndex = 0; identifiedWordIndex < brokenUpParagraph.length; identifiedWordIndex++){
    identifiedWord = brokenUpParagraph[identifiedWordIndex]
    markovKey = identifiedWord.cleanedWord.toLowerCase();
    if (typeof(MARKOV.words[markovKey]) == 'undefined'){
      MARKOV.words[markovKey] = {
        count: 0,
        startsSentences: 0,
        endsSentences: 0,
        instances: [],
        next: []
      }
    }
    MARKOV.words[markovKey].count += 1,
    MARKOV.words[markovKey].instances.push(identifiedWord)
    if (_.intersection(identifiedWord.endsWith, ['.', '!','?']).length){
      MARKOV.words[markovKey].endsSentences += 1
      MARKOV.sentenceEnders.push(identifiedWord.cleanedWord)
    }
    if (identifiedWordIndex == 0) {
      MARKOV.words[markovKey].startsSentences += 1
      MARKOV.sentenceStarters.push(identifiedWord.cleanedWord)
    } else {
      previousIdentifiedWord = brokenUpParagraph[identifiedWordIndex-1]
      previousMarkovKey = previousIdentifiedWord.cleanedWord.toLowerCase();
      if (_.intersection(previousIdentifiedWord.endsWith, ['.', '!','?']).length){
        MARKOV.words[markovKey].startsSentences += 1
        MARKOV.sentenceStarters.push(identifiedWord.cleanedWord)
      }
      MARKOV.words[previousMarkovKey].next.push(markovKey)
    }
  }
}

function buildSentenceFromMarkov(){
  let words = []
  let currentWord = _.sample(MARKOV.sentenceStarters);
  let currentWordInfo = MARKOV.words[currentWord.toLowerCase()]
  words.push(currentWord);
  while (Math.random() > (currentWordInfo.endsSentences/currentWordInfo.count)){
    currentWord = _.sample(currentWordInfo.next);
    currentWordInfo = MARKOV.words[currentWord]
    words.push(_.sample(currentWordInfo.instances).cleanedWord);
  }

  return words.join(' ')+'.'; 
}

async function buildMarkovLibrary (step = 50000) {
  let paragraphsToBreakApart = []

  try {
    let count = await db.paragraphs.count({'state': STATES.CLEANED})
    console.log(`You have ${count} remaining to break apart`)
  } catch (error) {
  }

  console.log('Getting cleaned paragraphs to break apart')
  try {
    paragraphsToBreakApart = await db.paragraphs.findAsCursor({'state': STATES.CLEANED}).limit(step).toArray()
  } catch (error) {
    console.error(error)
    console.error(error.stack)
  }
  console.log(`Got ${paragraphsToBreakApart.length} cleaned paragraphs`)
  for (let document of paragraphsToBreakApart) {
    addParagraphToMarkov(document.cleanedText) 
  }
  console.log(`Got ${Object.keys(MARKOV.words).length} words`)
  console.log(`Got ${_.uniq(MARKOV.sentenceStarters).length} starters`)
  console.log(`Got ${_.uniq(MARKOV.sentenceEnders).length} enders`)

  return MARKOV;
}



module.exports = buildMarkovLibrary

async function main () {
  await cleanParagraphTexts(50000)
  db.close()
  for (let i = 0; i < 100; i++){
    console.log(buildSentenceFromMarkov());
  }
}

if (require.main === module) {
  main()
}
