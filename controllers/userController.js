const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean();
    if(!users?.length) {
        return res.status(400).json({message: 'No users found'})
    };
    res.json({
        count: users.length,
        users
    });
});

// @desc Create new user
// @route post /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body;

    // confirm data
    if(!username || !password || !Array.isArray(roles) || !roles.length ) {
        return res.status(400).json({ message: 'All fields are required'})
    };

    // check for dublicate username
    const dublicate = await User.findOne({ username }).lean().exec();
    if ( dublicate) {
        return res.status(409).json({ message: 'Username already exists'})
    }

    // hash password
    const hashedPwd = await bcrypt.hash(password, 10);

    const userObject = { username, "password": hashedPwd, roles };

    // create and store new user
    const user = await User.create(userObject);

    if (user) {
        // created
        return res.status(201).json({ message: `New user ${username} created`});
    } else {
        return res.status(400).json({ message: 'Invalid user data received'})
    }
});

// @desc update user
// @route patch /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
    const { id, username, password, roles, active } = req.body;

    // confirm data
    if ( !id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
        return res.status(400).json({ message: 'All fields are required'})
    }

    const user = await User.findById(id).exec();
    if (!user) {
        return res.status(400).json({ message: 'User not found'})
    }

    // check for duplicate username
    const dublicate = await User.findOne({ username }).lean().exec();
    // Allow updates to the original user
    if (dublicate && dublicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Username already exists'})
    }

    user.username = username;
    user.roles = roles;
    user.active = active;

    if (password) {
        user.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await user.save();

    res.json({ message: `${updatedUser.username} updated`});
});

// @desc delete user
// @route delete /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    // Does the user still have assigned notes?
    const note = await Note.findOne({ user: id }).lean().exec()
    if (note) {
        return res.status(400).json({ message: 'User has assigned notes' })
    }

    // Does the user exist to delete?
    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({ message: 'User not found' })
    }

    // Store user information before deletion
    const deletedUsername = user.username;
    const deletedUserId = user._id;

    // Delete the user
    await user.deleteOne();

    const reply = `User ${deletedUsername} with ID ${deletedUserId} deleted`;
    res.json(reply);
})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}