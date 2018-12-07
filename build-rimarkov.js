const breakApartParagraph = require('./break-apart-paragraphs.js')
const mongoist = require('mongoist')
const db = mongoist('mongodb://127.0.0.1:27017/selectall')
const prompt = require('prompt-sync')({sigint: true})
const _ = require('lodash')
const STATES = {
  CLEANED: 'CLEANED'
}
const rita = require('rita')
const markov = new rita.RiMarkov(3)

function addParagraphToMarkov(paragraph){
  markov.loadText(paragraph);
}

function buildSentencesFromMarkov(){
  return markov.generateSentences(10);
}

async function cleanParagraphTexts (step = 50) {
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

  for (let i = 0; i < 1; i++){
    console.log(buildSentencesFromMarkov());
  }
}

module.export = cleanParagraphTexts

async function main () {
  await cleanParagraphTexts(50000)
  db.close()
}

if (require.main === module) {
  main()
}
