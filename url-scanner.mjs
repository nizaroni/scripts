// NOTE: Requires --experimental-fetch flag in Node < v18
import { createReadStream } from 'fs'
import { parse } from 'csv'

const [,, listPath, urlIndex = 0] = process.argv

const INTERVAL = 400

async function scanUrls(urls) {
	console.log('\n Starting scan! 🧐\n')
	let notOkay = []
	let noIndexHeader = []
	let noIndexMeta = []
	let index = 0
	let timer

	async function loop() {
		const url = urls[index]
		console.log(`Scanning URL #${index + 1} — ${url}`)

		const response = await fetch(url)
		const { headers, ok } = response

		if (!ok) {
			notOkay.push(url)
		} else {
			if (headers.has('x-robots-tag')
				&& headers.get('x-robots-tag').includes('noindex')
			) {
				noIndexHeader.push(url)
			}

			const text = await response.text()

			if (text.includes('noindex')) {
				noIndexMeta.push(url)
			}
		}

		index += 1

		if (index === urls.length) {
			clearInterval(timer)
			console.log(`\nScan finished. 🏁 Scanned ${index} URLs.`)
			console.log(`- ⛔️ ${notOkay.length} URLs didn't respond with a 200 OK.`)
			console.log(`- 🤯 ${noIndexHeader.length} URLs had the noindex header.`)
			console.log(`- 🏷️ ${noIndexMeta.length} URLs had the noindex tag.`)
			return
		}
		timer = setTimeout(loop, INTERVAL)
	}
	loop()
}

const urls = []

const listCsv = parse()
listCsv.on('error', err => console.error(err))
listCsv.on('readable', () => {
	let row
	while((row = listCsv.read()) !== null) {
		const url = row[urlIndex]

		if (!url.startsWith('http')) {
			continue
		}
		urls.push(url)
	}
})
listCsv.on('end', () =>
	scanUrls(urls)
)

const listFile = createReadStream(listPath)
listFile.pipe(listCsv)
