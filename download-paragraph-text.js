const rp = require('request-promise')
const mongoist = require('mongoist')
const db = mongoist('mongodb://127.0.0.1:27017/selectall')
const STATES = {
  UNPUBLISHED: 'UNPUBLISHED',
  PUBLISHED: 'PUBLISHED',
  IGNORED: 'IGNORED'
}
const requestOptions = {
  headers: {
    'User-Agent': 'Hey it\'s me Byron, I\'m scraping clay-paragraph'
  },
  json: true // Automatically parses the JSON string in the response
}

async function getRemoteParagraphText (uri) {
  // console.log('Getting paragraph text from: ', uri);
  let paragraphData = ''
  paragraphData = await rp(Object.assign({}, requestOptions, { uri: 'http://' + uri + '@published' }))

  return paragraphData.text
}

async function updateDocumentsWithParagraphText (documents) {
  // console.log("Fetching from:", JSON.stringify(uris));
  let updatedDocuments = await Promise.all(documents.map(updateDocumentWithParagraphText))
  return updatedDocuments
}

async function updateDocumentWithParagraphText (document) {
  if (document.uri.includes('-date') || document.uri.includes('-read-more') || document.uri.includes('-started-by')) {
    document.state = STATES.IGNORED
  } else {
    try {
      document.text = await getRemoteParagraphText(document.uri)
      document.state = STATES.PUBLISHED
    } catch (error) {
      document.state = STATES.UNPUBLISHED
    }
  }
  return document
}

async function downloadParagraphText (step = 50) {
  let paragraphsToUpdate = []
  let updatedParagraphs = []

  try {
    let count = await db.paragraphs.count({'state': null})
    console.log(`You have ${count} remaining to download`)
  } catch (error) {

  }
  console.log('Getting paragraphs to download')
  try {
    paragraphsToUpdate = await db.paragraphs.findAsCursor({'state': null}).limit(step).toArray()
  } catch (error) {
    console.error(error)
    console.error(error.stack)
  }
  console.log(`Got ${paragraphsToUpdate.length} paragraph uris`)

  updatedParagraphs = await updateDocumentsWithParagraphText(paragraphsToUpdate)
  console.log(`Got text for ${updatedParagraphs.filter((document) => document.state === STATES.PUBLISHED).length}  paragraphs`)

  console.log('Saving...')
  let bulk = db.paragraphs.initializeUnorderedBulkOp()
  for (let document of updatedParagraphs) {
    bulk.find({'_id': document._id}).updateOne(document)
  }
  await bulk.execute()
  console.log('Saved!')
}

module.export = downloadParagraphText

async function main () {
  await downloadParagraphText(1000)
  db.close()
}

if (require.main === module) {
  main()
}
