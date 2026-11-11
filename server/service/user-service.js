
const UserModel = require('../models/user-model.js');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const MailService = require('./mail-service.js');
const tokenService = require('./token-service.js');

const UserDto = require('../dtos/user-dto.js');
const ApiError = require('../exceptions/api-error.js');

class UserService {
    async registration(email, password) {
        const candidate = await UserModel.findOne({ email });

        if (candidate) {
            throw ApiError.BadRequest('User with this email already exists');
        }

        const hashPassword = await bcrypt.hash(password, 3);
        const activationLink = uuid.v4();

        const user = await UserModel.create({
            email,
            password: hashPassword,
            activationLink
        });

        await MailService.sendActivationMail(
            email,
            `${process.env.API_URL}/api/activation/${activationLink}`
        );

        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({ ...userDto });

        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {
            ...tokens,
            user: userDto
        };
    }

    async activate(activationLink) {
        const user = await UserModel.findOne({ activationLink });

        if (!user) {
            throw ApiError.BadRequest('Incorrect activation link');
        }

        user.isActivated = true;
        await user.save();
    }

    async login(email, password) {
        const user = await UserModel.findOne({ email });

        if (!user) {
            throw ApiError.BadRequest('Пользователь не был найден');
        }

        const isPassEquals = await bcrypt.compare(password, user.password);

        if (!isPassEquals) {
            throw ApiError.BadRequest('Неверный пароль');
        }

        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({ ...userDto });

        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {
            ...tokens,
            user: userDto
        };
    }

    async logout(refreshToken) {
        return await tokenService.removeToken(refreshToken);
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw ApiError.UnauthorizedError();
        }

        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await tokenService.findToken(refreshToken);

        if (!userData || !tokenFromDb) {
            throw ApiError.UnauthorizedError();
        }

        const user = await UserModel.findById(userData.id);

        if (!user) {
            throw ApiError.UnauthorizedError();
        }

        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({ ...userDto });

        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {
            ...tokens,
            user: userDto
        };
    }

    async getAllUsers() {
        return await UserModel.find();
    }
}

module.exports = new UserService();
