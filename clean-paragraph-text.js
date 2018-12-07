const mongoist = require('mongoist')
const db = mongoist('mongodb://127.0.0.1:27017/selectall')
const striptags = require('striptags')
const Entities = require('html-entities').AllHtmlEntities
const entities = new Entities()
const STATES = {
  PUBLISHED: 'PUBLISHED',
  CLEANED: 'CLEANED'
}

function replaceAll (target, search, replacement) {
  return target.replace(new RegExp(search, 'g'), replacement)
}

function cleanParagraphText (paragraphText) {
  let cleanedText = replaceAll(paragraphText, /(<[ ]+\/[a-zA-Z ]+>)(<[ ]+[a-zA-Z]+)/, '$1 $2')
  cleanedText = striptags(cleanedText)
  cleanedText = entities.decode(cleanedText)
  cleanedText = cleanedText.split(/\s+/).filter((text) => text.length > 0).join(' ')
  return cleanedText.trim()
}

async function cleanParagraphTexts (step = 50) {
  let paragraphsToClean = []
  let cleanedParagraphs = []

  try {
    let count = await db.paragraphs.count({'state': STATES.PUBLISHED})
    console.log(`You have ${count} remaining to clean`)
  } catch (error) {

  }
  console.log('Getting published paragraphs to clean')
  try {
    paragraphsToClean = await db.paragraphs.findAsCursor({'state': STATES.PUBLISHED}).limit(step).toArray()
  } catch (error) {
    console.error(error)
    console.error(error.stack)
  }
  console.log(`Got ${paragraphsToClean.length} published paragraphs`)

  cleanedParagraphs = paragraphsToClean
    .map((document) => {
      document.cleanedText = cleanParagraphText(document.text)
      document.state = STATES.CLEANED
      return document
    })
    .filter((document) => document.state === STATES.CLEANED)

  console.log(`Cleaned ${cleanedParagraphs.length} paragraphs`)

  console.log('Saving...')
  let bulk = db.paragraphs.initializeUnorderedBulkOp()
  for (let document of cleanedParagraphs) {
    bulk.find({'_id': document._id}).updateOne(document)
  }
  await bulk.execute()
  console.log('Saved!')
}

module.export = cleanParagraphText

async function main () {
  await cleanParagraphTexts(10000)
  db.close()
}

if (require.main === module) {
  main()
}
