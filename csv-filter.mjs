import { createReadStream, createWriteStream } from 'fs'
import { parse, stringify } from 'csv'

const [,, srcPath, tgtPath] = process.argv

const badPatterns = [
	'/br/en',
	'/de/en',
	'/es/en',
	'/fr/en',
	'/mx/en',
	'/nl/en',
	'/page/',
	'/pt/en',
]
let writeCount = -1

const srcCsv = parse()
srcCsv.on('error', err => console.error(err))
srcCsv.on('readable', () => {
	let row
	while((row = srcCsv.read()) !== null) {
		if (badPatterns.some(str => row[0].includes(str))) {
			continue
		}
		tgtCsv.write(row)
		writeCount += 1
	}
})
srcCsv.on('end', () =>
	console.log(`Write finished. Wrote ${writeCount} lines.`)
)

const srcFile = createReadStream(srcPath)
srcFile.pipe(srcCsv)

const tgtCsv = stringify()
const tgtFile = createWriteStream(tgtPath)
tgtCsv.pipe(tgtFile)
