const votes = `
B, h, n, q,u V
A B H I N R Q T V
H, N, R, U
A T N I V
A N U
`

const normalized = votes.toUpperCase().replace(/(,| )+/g, ' ')

const rows = normalized.split('\n')

const result = rows.reduce((globalCount, row) => {
	if (row.length === 0) {
		return globalCount
	}

	const letters = row.trim().split(' ')

	const newCount = letters.reduce((previousCount, letter) => {
		const count = { ...previousCount }
		if (count[letter] === undefined) {
			count[letter] = 0
		}

		count[letter] += 1
		return count
	}, { ...globalCount })

	return newCount
}, {})

const letters = Object.keys(result)

const rankedLetters = [ ...letters ].sort((a, b) => {
	if (result[a] === result[b]) {
		return a.localeCompare(b)
	}
	return result[b] - result[a]
})

rankedLetters.forEach(letter => console.log(`${letter}=${result[letter]}`))
