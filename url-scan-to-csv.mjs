// WHY this exists
// ---------------
// I was given a CSV of URLs that are 404ing on the website.
// URLs were duplicated many times and many weren't 404 at all.
// This makes a new CSV that's deduped and shows the current status code.

// Usage
// -----
// node url-scan-to-csv.mjs /path/to/source/csv /path/to/created/csv

// NOTE: Requires --experimental-fetch flag in Node < v18
import { createReadStream, createWriteStream } from 'fs'
import { parse, stringify } from 'csv'

const [,, listPath, tgtPath] = process.argv

const INTERVAL = 400

async function scanUrls(urls) {
	console.log('\nStarting scan! 🧐\n')
	tgtCsv.write([
		'Current Status Code',
		'URL',
		'Redirect Destination',
		'Bot Names',
		'Datetimes',
	])

	let statusCodes = {}
	let index = 0
	let timer

	async function loop() {
		const url = urls[index]
		console.log(`Scanning URL #${index + 1} — ${url.eventUrl}`)

		const response = await fetch(url.eventUrl, { redirect: 'manual' })
		const { headers, status, statusText } = response

		if (![200, 301, 404].includes(status)) {
			console.log('Unsupported status code', { status, statusText })
			return
		}

		if (!statusCodes[status]) {
			statusCodes[status] = 0
		}
		statusCodes[status] += 1

		let redirectDestination = null
		if (status === 301) {
			redirectDestination = headers.get('location')
		}

		const botNames = Array.from(url.eventBotNames).join('\n')
		const datetimes = Array.from(url.eventDatetimes).join('\n')
		tgtCsv.write([
			status,
			url.eventUrl,
			redirectDestination,
			botNames,
			datetimes,
		])

		index += 1

		if (index === urls.length) {
			clearInterval(timer)
			tgtCsv.end()

			console.log(`\nScan finished. 🏁 Scanned ${index} URLs.`)
			console.log(`- ⛔️ ${statusCodes[404] ?? 0} URLs responded with 404`)
			console.log(`- ✅ ${statusCodes[200] ?? 0} URLs responded with 200`)
			console.log(`- 👉 ${statusCodes[301] ?? 0} URLs responded with 301`)
			return
		}

		timer = setTimeout(loop, INTERVAL)
	}

	loop()
}

// -----------------------------------------------------------------------------

const urls = {}

const listCsv = parse({ from: 2 })
listCsv.on('error', err => console.error(err))
listCsv.on('readable', () => {
	let row
	while((row = listCsv.read()) !== null) {
		const [datetime, url, botName] = row
		if (!urls[url]) {
			urls[url] = {
				eventBotNames: new Set(),
				eventDatetimes: new Set(),
				eventUrl: url,
			}
		}
		const { eventBotNames, eventDatetimes } = urls[url]
		eventBotNames.add(botName)
		eventDatetimes.add(datetime)
	}
})
listCsv.on('end', () =>
	scanUrls(Object.values(urls))
)

const listFile = createReadStream(listPath)
listFile.pipe(listCsv)

const tgtCsv = stringify()
const tgtFile = createWriteStream(tgtPath)
tgtCsv.pipe(tgtFile)
