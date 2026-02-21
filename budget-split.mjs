// WHY this exists
// ===============
// Helps split expenses between a group of people where different people pay for
// different things. For example, when a group takes a trip and one person pays
// for lodging, they other for tickets, etc.

// Usage
// =====
// node budget-split.mjs USD

import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { expenses, patrons } = require('./data/expenses.json')

const [,, currency = 'EUR'] = process.argv

calculateExpenses(expenses, patrons)

function calculateExpenses(expenses, patrons) {
	let total = 0
	const balanceByParticipants =
		expenses
			.reduce(
				function addExpense(acc, expense) {
					const { cost, participants, paidBy } = expense

					total += cost

					const payerBalance = currentBalanceFor(paidBy, acc)
					payerBalance.totalPaid += cost

					const participAmt = participants.length
					const dividedCost = Math.floor(cost / participAmt)
					participants.forEach(function addDebt(name, index) {
						const participantBalance = currentBalanceFor(name, acc)
						participantBalance.totalDebt += dividedCost
						if (index === 0) {
							participantBalance.totalDebt += cost % participAmt
						}
					})

					return acc
				},
				[]
			)
			.reduce(
				function consolidatePatronage(acc, balance, _, originalList) {
					const { name, totalDebt, totalPaid } = balance

					const patronsForBeneficiary = patrons[name]
					if (!patronsForBeneficiary) return [...acc, balance]

					const patronAmt = patronsForBeneficiary.length
					const dividedPaid = Math.floor(totalPaid / patronAmt)
					const dividedDebt = Math.floor(totalDebt / patronAmt)
					patronsForBeneficiary.forEach(
						function transferBalanceToPatron (patron, index) {
							const patronBalance = currentBalanceFor(
								patron,
								originalList
							)
							patronBalance.totalDebt -= dividedPaid
							patronBalance.totalPaid -= dividedDebt
							if (index === 0) {
								patronBalance.totalDebt -= totalPaid % patronAmt
								patronBalance.totalPaid -= totalDebt % patronAmt
							}
						}
					)

					return acc
				},
				[]
			)

	balanceByParticipants.forEach(function logBalance(balance) {
		const { name, totalDebt, totalPaid } = balance
		const balanceCents = totalDebt - totalPaid
		const absCents = Math.abs(balanceCents)
		const prettyBalance = prettyCash(absCents)
		if (balanceCents < 0) {
			console.log(name, green(`is owed ${prettyBalance}`))
		} else {
			console.log(name, red(`owes ${prettyBalance}`))
		}

	})
	console.log('\nTotal spent', prettyCash(total))
}

function currentBalanceFor(name, referenceList) {
	let balance = referenceList.find(balance => balance.name === name)
	if (!balance) {
		balance = { name, totalDebt: 0, totalPaid: 0 }
		referenceList.push(balance)
	}

	return balance
}

function red(str) {
	return `\x1b[31m${str}\x1b[0m`
}

function green(str) {
	return `\x1b[32m${str}\x1b[0m`
}

function prettyCash(totalCents) {
	const formatter = new Intl.NumberFormat(
		'en',
		{ currency, style: 'currency' }
	)
	return formatter.format(totalCents / 100)
}
