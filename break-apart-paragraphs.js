function identifyWord (word) {
  let identifiedWord = {
    originWord: word,
    startsWith: [],
    endsWith: []
  }
  let cleanedWord = word
    // Check for beginning and ending quotes
  while (cleanedWord.length > 0 && ['\'', '"', '`','(','[','“','‘'].includes(cleanedWord[0])) {
    identifiedWord.startsWith.push(cleanedWord[0])
    cleanedWord = cleanedWord.slice(1)
  }
  while (cleanedWord.length > 0 && ['\'', '"', '`', ':', ';', '.', ',', '!','?',')',']','’','”'].includes(cleanedWord[cleanedWord.length - 1])) {
    identifiedWord.endsWith.push(cleanedWord[cleanedWord.length - 1])
    cleanedWord = cleanedWord.slice(0, cleanedWord.length - 1)
  }
  identifiedWord.cleanedWord = cleanedWord;

  return identifiedWord
}

function breakApartParagraph (paragraphText) {
  let words = paragraphText.split(/\s+/)
  let identifiedWords = []

  for (let word of words) {
    let identifiedWord = identifyWord(word)
    identifiedWords.push(identifiedWord)
  }
  return identifiedWords;
}

module.exports = breakApartParagraph
