import assert from 'assert'

const [,, email, url ] = process.argv

function addDotsToEmail (email, url) {
	const urlObj = new URL(url)
	const hostLetters = urlObj.hostname.replace(/\./g, '')
	let [ emailName, emailDomain ] = email.split('@')

	for (let character of hostLetters) {
		const charRegex = new RegExp(character + '(?!\\.|$)')
		emailName = emailName.replace(charRegex, character + '.')
	}

	return emailName + '@' + emailDomain
}

let testResult = addDotsToEmail('blah@gmail.com', 'http://boom.com')
assert.equal(testResult, 'b.lah@gmail.com', 'Adds dots to the email')

testResult = addDotsToEmail('blah@gmail.com', 'http://bloom.com')
assert.equal(testResult, 'b.l.ah@gmail.com', 'Adds dots for multiple letters')

testResult = addDotsToEmail('pizzaparty@gmail.com', 'http://pepper.com')
assert.equal(testResult, 'p.izzap.ar.ty@gmail.com', 'Adds dots for repeated letters')

testResult = addDotsToEmail('pub@gmail.com', 'http://boom.com')
assert.equal(testResult, 'pub@gmail.com', 'Does NOT add dots to the last letter')

const newEmail = addDotsToEmail(email, url)
console.log(newEmail)
