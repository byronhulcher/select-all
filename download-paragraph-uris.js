const mongoist = require('mongoist')
const rp = require('request-promise')
const _ = require('lodash')
const db = mongoist('mongodb://127.0.0.1:27017/selectall')
const requestOptions = {
  headers: {
    'User-Agent': 'Request-Promise'
  },
  json: true // Automatically parses the JSON string in the response
}

async function saveNewParagraphUris (newParagraphUris) {
  let inserts = newParagraphUris.map((uri) => { return {uri} })
  let paragraphs = await db.paragraphs.insert(inserts)
  return paragraphs
}

async function getLocalParagraphUris () {
  // get all 'paragraph' documents, filter down to uris
  let paragraphUris = await db.paragraphs.distinct('uri', {})
  return paragraphUris
}

async function getRemoteParagraphUris () {
  let paragraphUris = await rp(Object.assign({}, requestOptions, { uri: 'http://nymag.com/selectall/_components/clay-paragraph/instances/' }))
  return paragraphUris
}

async function downloadNewParagraphsUris () {
  let localParagraphUris
  let remoteParagraphUris
  let newParagraphUris
  let allParagraphUris

  console.log('Getting paragraphs')
  try {
    localParagraphUris = await getLocalParagraphUris()
  } catch (error) {
    localParagraphUris = []
  }
  console.log(`Got ${localParagraphUris.length} local paragraphs uris`)
  remoteParagraphUris = await getRemoteParagraphUris()
  console.log(`Got ${remoteParagraphUris.length} remote paragraphs uris`)
  newParagraphUris = _.difference(remoteParagraphUris, localParagraphUris)
  allParagraphUris = localParagraphUris.concat(newParagraphUris)
  console.log(`That means ${newParagraphUris.length} new paragraph uris`)
  if (newParagraphUris.length > 0) {
    console.log('Writing to mongo')
    await saveNewParagraphUris(newParagraphUris)
    console.log('Done writing')
  }
  return { newParagraphUris, allParagraphUris }
};

async function main () {
  try {
    await downloadNewParagraphsUris()
  } catch (error) {
    console.error(error)
    console.error(error.stack)
  }
  db.close()
}

module.exports = downloadNewParagraphsUris
module.exports.getLocalParagraphUris = getLocalParagraphUris

if (require.main === module) {
  main()
}
