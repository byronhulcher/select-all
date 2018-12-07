const mongoist = require('mongoist')

async function deleteMongoParagraphData () {
  let db = mongoist('mongodb://127.0.0.1:27017/selectall')
  await db.paragraphs.remove({})
  db.close()
}

// function inFiveSeconds () {
//   return new Promise((resolve) => {
//     setTimeout(function () {
//       resolve()
//     }, 2000)
//   })
// }

async function main () {
  // console.log("Clearing data in 2 seconds...")
  // await inFiveSeconds();
  await Promise.all([deleteMongoParagraphData()])
  console.log('Data is cleared!')
}

main()
