import { PORTUGUESE_CIPHER, PORTUGUESE_FREQUENCY_INDEX_TABLE, PORTUGUESE_ALPHABET } from "./portugese";
import inquirer from 'inquirer'
import chalk from 'chalk'

const coincidenceIndex = 0.072723

const calculateCoincidenceIndexForText = (text: string): number => {
    const letters = []
    for (const letter of PORTUGUESE_ALPHABET) {
        let letterFrequency = 0
        for (const textLetter of text) {
            if (letter === textLetter) {
                letterFrequency++
            }
        }
        letters.push({
            letter,
            frequency: letterFrequency
        })
    }

    let index: number;
    let f: number = 0
    const n: number = text.length * (text.length - 1)

    for (const { frequency } of letters) {
        f += frequency * (frequency - 1)
    }

    index = f / n

    return parseFloat(index.toFixed(6))
}

const isThisAgoodIndex = (index: number): boolean => {
    if (Math.abs(coincidenceIndex - index) === 0) return true
    if (Math.abs(coincidenceIndex - index) <= 0.01) return true
    if (Math.abs(coincidenceIndex - index) <= 0.002) return true
    return false
}


const findKeySize = (cipher: string) => {
    let keySize = 0
    const textIndex = calculateCoincidenceIndexForText(cipher)

    if (isThisAgoodIndex(textIndex)) {
        keySize = 1
        return keySize
    }

    const parsedTextFromOdds = cipher.split('').map((letter, index) => {
        if (index % 2 !== 0) return letter
        return ''
    }).filter(letter => letter !== '').join('')

    const parsedTextFromEvens = cipher.split('').map((letter, index) => {
        if (index % 2 === 0) return letter
        return ''
    }).filter(letter => letter !== '').join()

    const evensIndex = calculateCoincidenceIndexForText(parsedTextFromEvens)
    const oddsIndex = calculateCoincidenceIndexForText(parsedTextFromOdds)

    if (isThisAgoodIndex(evensIndex) || isThisAgoodIndex(oddsIndex)) {
        return 2
    }

    let m = 3;
    while (m < PORTUGUESE_ALPHABET.length) {
        let text = ''


        for (let i = 0; i < cipher.length / m; i++) {
            const textArray = cipher.split('').map((letter, index) => letter)
            text += textArray[i * m]
        }

        const calculatedIndex = calculateCoincidenceIndexForText(text)
        console.log('calculating coincidence index...', calculatedIndex)

        if (isThisAgoodIndex(calculatedIndex)) {
            console.log('found a good index', calculatedIndex)
            keySize = m
            return keySize
        }
        m++;
    }

    return keySize
}

const transformCipherIntoMatrix = (keySize: number): string[][] => {
    let matrix: string[][] = []
    const cipherArray = PORTUGUESE_CIPHER.split('')

    let text = ''
    let count = 0
    for (let i = 0; i < cipherArray.length; i++) {
        text += cipherArray[i]
        count++

        if (count % keySize === 0) {
            matrix.push(text.split(''))
            text = ''
            count = 0
        }
    }

    return matrix
}

const getMatrixColumns = (cipherMatrix: string[][]): string[] => {
    const res: string[] = []
    const columnSize = cipherMatrix[0].length
    let count = 0

    while(count < columnSize) {
        let text = ''
        for (let line = 0; line < cipherMatrix.length; line++) {
            text += cipherMatrix[line][count]
        }
        res.push(text)
        count++
    }

    return res
}

const getMostFrequentCharacterOfColumn = (columnText: string): string => {
    const textArray = columnText.split('')
    const letterFrequencies = []
    for (const letter of PORTUGUESE_ALPHABET) {
        let letterFrequency = 0
        for (const textLetter of textArray) {
            if (letter === textLetter) {
                letterFrequency++
            }
        }
        letterFrequencies.push({
            letter: letter,
            frequency: letterFrequency
        })
    }

    const mostFrequent = letterFrequencies.sort((a, b) => {
        return b.frequency - a.frequency
    })

    return mostFrequent[0].letter
}

const generateStates = (n: number) => {
    var states = [];

    // Convert to decimal
    var maxDecimal = parseInt("1".repeat(n),2);

    // For every number between 0->decimal
    for(var i = 0; i <= maxDecimal; i++){
        // Convert to binary, pad with 0, and add to final results
        states.push(
            i.toString(2)
             .padStart(n,'0')
             .replaceAll('0', 'e')
             .replaceAll('1', 'a')
             .toUpperCase()
        );
    }



    return states;
}

const getMostFrequentLettersForPortuguese = (): Promise<string[]> => {
    return inquirer
        .prompt([
            /* Pass your questions in here */
            {
                type: 'list',
                name: 'keys',
                message: 'Choose the most frequent letters order to calculate the padding for portuguese language',
                choices: generateStates(7),
            },
        ])
        .then(answers => {
            // Use user feedback for... whatever!!
            return answers.keys.toLowerCase().split('')
        })
        .catch(error => {
            if(error.isTtyError) {
                // Prompt couldn't be rendered in the current environment
            } else {
                // Something else went wrong
            }
        });
}

const calculatePaddingForLetter = (character: string, languageCharacter: string): number => {
    const characterToGetPaddingIndex = PORTUGUESE_FREQUENCY_INDEX_TABLE.find((item: any) => item.letter === character).index
    const languageCharacterIndex = PORTUGUESE_FREQUENCY_INDEX_TABLE.find((item: any) => item.letter === languageCharacter).index
    return Math.abs(languageCharacterIndex - characterToGetPaddingIndex)
}

const shiftLetter = (letter: string, padding: number): string => {
    let letterIndex = PORTUGUESE_FREQUENCY_INDEX_TABLE.find((item: any) => item.letter === letter).index
    let count = padding

    while (count > 0) {
        letterIndex--

        if (letterIndex < 0) {
            letterIndex = 25
        }
        count--
    }

    return PORTUGUESE_FREQUENCY_INDEX_TABLE.find((letter: any) => letter.index === letterIndex).letter
}

const parseColumnWithCharacters = async (columns: string[], characters: string[]): Promise<string[]> => {
    let parsedColumns: string[] = []
    const mostFrequentCharacters = await getMostFrequentLettersForPortuguese()
    console.log(
        chalk.blue.bold(`Parsing [${characters.map(c => c.toUpperCase())}] with `),
        chalk.green.bold(`[${mostFrequentCharacters.map(c => c.toUpperCase())}]`)
    )

    for (let i = 0; i < characters.length; i++) {
        const mostFrequent = characters[i]
        const text = columns[i]
        const padding = calculatePaddingForLetter(mostFrequent, mostFrequentCharacters[i])

        let result: string = ''

        for (const letter of text) {
            const shiftedLetter = shiftLetter(letter, padding)
            result += shiftedLetter
        }

        parsedColumns.push(result)
        result = ''
    }

    return parsedColumns
}

const decryptText = (shiftedColumns: string[]): string => {
    let decryptedText = ''
    let count = 0

    while (count < shiftedColumns[0].length) {
        for (const column of shiftedColumns) {
            decryptedText += column[count]
        }
        count++
    }

    return decryptedText
}

const findEachKeyLetter = async (keySize: number): Promise<string[]> => {
    console.log('Trying to find letters with key size of ', keySize)

    const cipherMatrix: string[][] = transformCipherIntoMatrix(keySize)
    const columns = getMatrixColumns(cipherMatrix)
    const characters = []

    for (const column of columns) {
        characters.push(getMostFrequentCharacterOfColumn(column))
    }

    console.log(chalk.green.bold.underline('Most frequent characters:'), )
    console.log(chalk.blue.bold(`[ ${characters} ]`), )

    return characters
}


const begin = async () => {
    const keySize = findKeySize(PORTUGUESE_CIPHER)
    const key = await findEachKeyLetter(keySize)
    const cipherMatrix: string[][] = transformCipherIntoMatrix(keySize)
    const columns = getMatrixColumns(cipherMatrix)
    const shiftedColumns: string[] = await parseColumnWithCharacters(columns, key)
    const parsedText = decryptText(shiftedColumns)
    console.log(parsedText)
}

begin()
