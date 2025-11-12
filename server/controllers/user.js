const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// const nodemailer = require('nodemailer');
// const hbs = require('nodemailer-express-handlebars').default;
const bcrypt = require('bcrypt');

require('dotenv').config();

let userModel = require('../models/user.js');
let verificationLinkModel = require('../models/verificationLink.js');
const credentialsModel = require('../models/credentials.js');
const authorizationCodeModel = require('../models/authorizationCode.js');

const randomCode = () => {
    return crypto.randomBytes(32).toString('hex');
};

const generateAccessToken = (payload) => {
    let options = {
        expiresIn: '15m'
    };
    let token = jwt.sign(payload, process.env.ACCESS_SECRET_CODE, options);
    return token;
};

const generateRefreshToken = (payload) => {
    let options = {
        expiresIn: '7d'
    };
    let token = jwt.sign(payload, process.env.REFRESH_SECRET_CODE, options);
    return token;
};

const refreshToken = (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.REFRESH_SECRET_CODE, (err, user) => {
        if (err) return res.sendStatus(403);
        const newAccessToken = generateAccessToken({ userId: user.userId });
        res.json({ accessToken: newAccessToken });
    });
};

// const createLink = async (req, res) => {
//     let { email, purpose } = req.query;
//     let code = randomCode();
    
//     try {
//         let user = await userModel.findOne({ email: email });
//         if (user) {
//             return res.status(400).json({ message: 'Email Already Registered' });
//         }

//         let result = await verificationLinkModel.create({
//             email: email,
//             purpose: purpose,
//             code: code,
//             expiresAt: new Date(Date.now() + 120 * 60 * 1000)
//         });
        
//         // sendMail(email, code);
//         return res.status(200).json({ message: 'Send Successfully' });
//     } catch (err) {
//         console.log('error :', err);
//         return res.status(500).json({ message: 'Server Error' });
//     }
// };

// const verifyLink = async (req, res) => {
//     let { code } = req.query;
//     console.log(code);
    
//     try {
//         let result = await verificationLinkModel.findOne({ code: code });
//         if (!result) {
//             return res.status(404).json({ message: 'Invalid verification link' });
//         }

//         if (result.expiresAt < new Date()) {
//             return res.status(404).json({ message: 'Link got Expired' });
//         }

//         console.log(result);
//         if (result.purpose === 'register') {
//             res.redirect(`http://localhost:5173/redirect?token=${code}&purpose=${result.purpose}&email=${result.email}`);
//         }
//     } catch (err) {
//         console.log('error :', err);
//         res.status(500).json({ message: 'Server Error' });
//     }
// };

const loginUser = async (req, res) => {
    try {
        let result = await userModel.findOne({ email: req.body.email });
        if (!result) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        let enteredPass = req.body.password;
        let isSame = await bcrypt.compare(enteredPass, result.password);

        if (!isSame) {
            return res.status(401).json({ message: 'Incorrect Password' });
        }

        let accessToken = generateAccessToken({ userId: result._id });
        res.status(200).json({ 
            message: 'Successfully logged in', 
            user: result, 
            accessToken 
        });
    } catch (err) {
        console.log('error :', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

const userInfo = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_SECRET_CODE);
        const userInfo = await userModel.findById(decoded.userId);

        if (!userInfo) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json(userInfo);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        
        console.error('Error fetching user info:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const registerUser = async (req, res) => {
    console.log(req.body);
    
    try {
        // Check if user already exists
        const existingUser = await userModel.findOne({ 
            $or: [
                { email: req.body.email },
                { username: req.body.username }
            ]
        });
        
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email or username' });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const userData = {
            ...req.body,
            password: hashedPassword
        };

        let result = await userModel.create(userData);
        let accessToken = generateAccessToken({ userId: result._id });
        
        res.status(201).json({ 
            message: 'Successfully created', 
            user: result, 
            accessToken 
        });
    } catch (err) {
        console.log('error :', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Email configuration
// const transporter = nodemailer.createTransporter({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER || 'gamerdevil033@gmail.com',
//         pass: process.env.EMAIL_PASS || 'acuq kycu iyhe xiyc'
//     }
// });

// const sendMail = (email, code) => {
//     // transporter.use('compile', hbs({
//     //     viewEngine: {
//     //         extname: '.hbs',
//     //         partialsDir: path.resolve(__dirname, '../templates'),
//     //         defaultLayout: false
//     //     },
//     //     viewPath: path.resolve(__dirname, '../templates'),
//     //     extName: '.hbs'
//     // }));

//     // let options = {
//     //     from: process.env.EMAIL_USER || 'gamerdevil033@gmail.com',
//     //     to: email,
//     //     subject: 'Verification Link',
//     //     template: 'verificationLink',
//     //     context: {
//     //         link: `http://localhost:5000/user/verifyLink/callback?code=${code}`
//     //     }
//     // };

//     // transporter.sendMail(options, (err, info) => {
//     //     if (err) { 
//     //         console.log('Email error:', err);
//     //         return;
//     //     }
//     //     console.log('Email sent:', info.response);
//     // });
// };

const getApps = async (req, res) => {
    let { userId } = req.query;
    console.log(userId);
    
    try {
        let result = await credentialsModel.find({ userId: userId });
        res.status(200).json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

const createCredentials = async (req, res) => {
    let client_id = randomCode();
    let client_secret = randomCode();
    
    try {
        let result = await credentialsModel.create({
            ...req.body,
            clientId: client_id,
            clientSecret: client_secret
        });
        
        console.log(result);
        res.status(201).json(result);
    } catch (err) {
        console.log('Error creating credentials:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getCode = async (req, res) => {
    let { userId } = req.query;
    let code = randomCode();

    try {
        let result = await authorizationCodeModel.create({ userId: userId, code: code });
        res.status(200).json({ code: result.code });
    } catch (err) {
        console.log('Error in code generation', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getToken = async (req, res) => {
    const { code, client_id, client_secret, redirect_uri } = req.query;

    try {
        // Verify client credentials first
        const client = await credentialsModel.findOne({ 
            clientId: client_id, 
            clientSecret: client_secret 
        });
        
        if (!client) {
            return res.status(401).json({ message: 'Invalid client credentials' });
        }

        const result = await authorizationCodeModel.findOne({ code });
        if (!result) {
            return res.status(400).json({ message: 'Invalid authorization code' });
        }

        const access_token = generateAccessToken({ userId: result.userId });
        res.status(200).json({ 
            access_token,
            token_type: 'Bearer',
            expires_in: 900 // 15 minutes
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUser = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_SECRET_CODE);
        const userInfo = await userModel.findById(decoded.userId);

        if (!userInfo) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json(userInfo);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        
        console.error('Error fetching user info:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateCredentials = async (req, res) => {
    const { id } = req.params;
    const { name, home, callback, scope } = req.body;

    try {
        // Validate URLs
        const isValidUrl = (string) => {
            try {
                new URL(string);
                return true;
            } catch (_) {
                return false;
            }
        };

        if (home && !isValidUrl(home)) {
            return res.status(400).json({ message: 'Invalid homepage URL' });
        }

        if (callback && !isValidUrl(callback)) {
            return res.status(400).json({ message: 'Invalid callback URL' });
        }

        const result = await credentialsModel.findByIdAndUpdate(
            id,
            { 
                name, 
                home, 
                callback, 
                scope, 
                updatedAt: new Date() 
            },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.status(200).json(result);
    } catch (err) {
        console.error('Error updating credentials:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteCredentials = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await credentialsModel.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.status(200).json({ message: 'Application deleted successfully' });
    } catch (err) {
        console.error('Error deleting credentials:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const regenerateClientSecret = async (req, res) => {
    const { id } = req.params;
    const newClientSecret = randomCode();

    try {
        const result = await credentialsModel.findByIdAndUpdate(
            id,
            { 
                clientSecret: newClientSecret,
                updatedAt: new Date(),
                lastSecretRegenerated: new Date()
            },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.status(200).json(result);
    } catch (err) {
        console.error('Error regenerating client secret:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    // createLink,
    // verifyLink,
    registerUser,
    loginUser,
    userInfo,
    refreshToken,
    getApps,
    createCredentials,
    getToken,
    getCode,
    getUser,
    updateCredentials,
    deleteCredentials,
    regenerateClientSecret
};