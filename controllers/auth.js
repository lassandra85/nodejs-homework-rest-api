const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const { nanoid } = require("nanoid");

const path = require("path");
const fs = require("fs").promises;

require("dotenv").config();

const {User} = require("../models/user");
const { HttpError, ctrlWrapper, jimpResizer } = require("../helpers/index");
const mailSender = require("../services/mailSender");
const mailTemplate = require("../services/mailTemplate");



const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const { SECRET_KEY: key, BACK_URL: backUrl, MAIL_USER: mailUser } = process.env;   /// localUrl for local, BACK_URL: backUrl for render



const register = async(req, res) => {

    const { email, password} = req.body;
    const user = await User.findOne({ email });

    if (user) {
        throw HttpError(409, "Email in use");
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravatar.url(email);
    const verificationToken = nanoid(30);

    const newUser = await User.create({
        ...req.body,
        password: hashPassword,
        avatarURL,
        verificationToken,
    });

    const verifyEmail = {
		from: mailUser,
		to: email,
		subject: "Verify email",
		html: mailTemplate(backUrl, verificationToken),
    };
    
    await mailSender(verifyEmail);
    
    res.status(201).json({
       user: {
			email: newUser.email,
			subscription: newUser.subscription,
		},
        
    });  
};

const verifyEmail = async (req, res) => {

	const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });
    
	if (!user) {
		throw HttpError(404, "User not found");
	}
    await User.findByIdAndUpdate(user._id, { verificationToken: null, verify: true });
    
	res.status(200).json({
		message: "Verification successful",
	});
};


const resendVerify = async (req, res) => {

	const { email } = req.body;
    const user = await User.findOne({ email });
    
	if (!user) {
		throw HttpError(404, "User not found");
    }
    
	if (user.verify) {
		throw HttpError(400, "Verification has already been passed");
    }
    
	const verifyEmail = {
		from: mailUser,
		to: email,
		subject: "Verify email",
		html: mailTemplate(backUrl, user.verificationToken),
    };
    
	await mailSender(verifyEmail);

	res.status(200).json({ message: "Verification email sent" });
};


const login = async(req, res) => {

    const { email, password } = req.body;

    const user = await User.findOne({email});

    if (!user) {
        throw HttpError(401, "Email or password is wrong");
    }

    const passwordCompare = await bcrypt.compare(password, user.password);

    if(!passwordCompare) {
        throw HttpError(401, "Email or password is wrong");
    }

    const payload = {
        id: user._id,
    };

    const token = jwt.sign(payload, key, { expiresIn: "23h" });

    await User.findByIdAndUpdate(user._id, { token });
    
    res.status(200).json({
		token,
		user: {
			email: user.email,
			subscription: user.subscription,
		},
	});
   
};


const getCurrent = async (req, res) => {
    
    const { email, subscription } = req.user;

   res.status(200).json({ email, subscription });
};



const logout = async (req, res) => {
    const { _id } = req.user;
    await User.findByIdAndUpdate( _id, {token: null});

  res.status(204).json({ message: "No content" });
};



const updateSubscription = async (req, res) => {
	const { authorization = "" } = req.headers;
	const token = authorization.split(" ")[1];
	const user = await User.findOne({ token });
	const updatedUserSubscription = await User.findByIdAndUpdate(user._id, req.body, { new: true });
	res.status(200).json(updatedUserSubscription);
};



const updateAvatar = async (req, res) => {

    const { _id } = req.user;
    const { path: tempUpload, originalname } = req.file;
    
    try {

		await jimpResizer(tempUpload);
		const newName = `${_id}_${originalname}`;
		const distUpload = path.join(avatarsDir, newName);

		await fs.rename(tempUpload, distUpload);
		const avatarURL = path.join("avatars", newName);
        await User.findByIdAndUpdate(_id, {avatarURL});
         
        res.json({
            avatarURL,
        });
        
    } catch (error) {
        
        await fs.unlink(tempUpload);
        
	}
};

module.exports = {
    register: ctrlWrapper(register),
    verifyEmail: ctrlWrapper(verifyEmail),
    resendVerify: ctrlWrapper(resendVerify),
    login: ctrlWrapper(login),
    getCurrent: ctrlWrapper(getCurrent),
    logout: ctrlWrapper(logout),
    updateSubscription: ctrlWrapper(updateSubscription),
    updateAvatar: ctrlWrapper(updateAvatar),
};