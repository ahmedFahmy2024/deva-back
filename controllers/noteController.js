const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');

// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find().lean();

    if(!notes?.length) {
        return res.status(400).json({ message: 'No notes found'})
    }

    // add username to each note before sending response
    const notesWithUser = await Promise.all(notes.map(async note => {
        const user = await User.findById(note.user).lean().exec();
        return { ...note, username: user.username };
    }))

    res.json({
        count: notesWithUser.length,
        notes: notesWithUser
    })
});

// @desc Get note
// @route GET /note
// @access Private
const getNoteById = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id).lean().exec();
    if(!note) {
        return res.status(400).json({ message: 'Note not found'})
    };

    const user = await User.findById(note.user).lean().exec();
    if(!user) {
        return res.status(400).json({ message: 'User not found'})
    };
    res.json({ ...note, username: user.username });
});

// @desc Create new note
// @route post /notes
// @access Private
const createNewNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body;

    // confirm data
    if(!user || !title || !text) {
        return res.status(400).json({ message: 'All fields are required'})
    }

    // check if user exsists and active
    const existingUser = await User.findById(user).exec();
    if (!existingUser) {
        return res.status(404).json({ message: 'User not found'})
    }

    if (!existingUser.active) {
        return res.status(403).json({ message: 'User not active'})
    }

    // check for duplicate title
    const dublicate = await Note.findOne({ title }).lean().exec();
    if (dublicate) {
        return res.status(409).json({ message: 'Title already exists'})
    }

    // create and store new note
    const note = await Note.create({user, title, text});
    // created

    if (note) {
        return res.status(201).json({ message: 'New note created'})
    } else {
        return res.status(400).json({ message: 'Invalid note data'})
    }
});

// @desc update note
// @route patch /notes
// @access Private
const updateNote = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { user, title, text, completed } = req.body;

    // confirm data
    if(!user || !title || !text || typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'All fields are required'})
    }

    // check note is exist
    const note = await Note.findById(id).exec();
    if (!note) {
        return res.status(404).json({ message: 'Note not found'})
    }

    // check for duplicate title
    const dublicate = await Note.findOne({ title }).lean().exec();
    if (dublicate && dublicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Title already exists'})
    }

    note.user = user;
    note.title = title;
    note.text = text;
    note.completed = completed;

    const updatedNote = await note.save();
    res.json(`Note ${updatedNote.title} updated`)
});

// @desc delete note
// @route delete /notes
// @access Private
const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // confirm data
    if (!id) {
        return res.status(400).json({ message: 'Note ID Required' })
    };

    // check note is exist
    const note = await Note.findById(id).exec();
    if (!note) {
        return res.status(404).json({ message: 'Note not found' })
    };

    const deletedTitle = note.title;
    const deletedId = note._id;

    await note.deleteOne();
    const reply = `Note ${deletedTitle} with ID ${deletedId} deleted`;
    res.json(reply);
})

module.exports = {
    getAllNotes,
    getNoteById,
    createNewNote,
    updateNote,
    deleteNote
}