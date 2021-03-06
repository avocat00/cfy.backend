const logger = require('debug')('components:graphql:auth ')

const { GraphQLObjectType, GraphQLString, GraphQLNonNull } = require('graphql')

const UserType = require('./user/model')
const User = require('../db/models/user')
const tokenService = require('../services/token.service')
const { UserInputError } = require('apollo-server-express')

const AuthUserType = new GraphQLObjectType({
	name: 'AuthUserType',
	fields: {
		user: { type: UserType },
		token: { type: new GraphQLNonNull(GraphQLString) },
	},
})

const AuthMutationType = new GraphQLObjectType({
	name: 'AuthMutationType',
	type: UserType,
	fields: {
		login: {
			description: 'Authorization of an existing user',
			type: AuthUserType,
			args: {
				email: { type: new GraphQLNonNull(GraphQLString) },
				password: { type: new GraphQLNonNull(GraphQLString) },
			},
			async resolve(parent, { email, password }) {
				logger('Login ', email, password)

				if (email && password) {
					try {
						const user = await User.findOne({ email })
						if (user) {
							const verify = await user.comparePassword(password)

							if (verify) {
								return {
									user: user.getPublicFields(),
									token: await tokenService.createToken(user.id),
								}
							}
						}
					} catch (err) {
						throw new Error(err.message)
					}
				}

				throw new UserInputError('Incorrect email or password')
			},
		},
		create: {
			description: 'Create a new user',
			type: AuthUserType,
			args: {
				email: { type: new GraphQLNonNull(GraphQLString) },
				password: { type: new GraphQLNonNull(GraphQLString) },
				name: { type: GraphQLString },
			},
			async resolve(parent, fields) {
				const { email, password } = fields
				logger('Create ', email, password)

				if (!email || !password) {
					throw new UserInputError('Invalid data')
				}

				try {
					const user = await User.findOne({ email })
					if (user) {
						throw new UserInputError('User alrady exist')
					}
				} catch (err) {
					throw new Error(err.message)
				}

				const user = await User.create(fields)

				return {
					user: user.getPublicFields(),
					token: await tokenService.createToken(user.id),
				}
			},
		},
	},
})

const AuthMutation = {
	name: 'AuthMutation',
	type: AuthMutationType,
	resolve() {
		return true
	},
}

module.exports = {
	mutation: AuthMutation,
}
