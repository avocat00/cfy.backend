const express = require('express')
const mainRouter = express.Router()
const { router: authRouter, isAuth } = require('./auth')

mainRouter.get('/', (req, res) => {
	res.send('Hello, world!')
})

mainRouter.use('/auth', authRouter)

mainRouter.use(isAuth)

mainRouter.get('/profile', (req, res) => {
	res.send({
		user: req.user,
	})
})

module.exports = mainRouter