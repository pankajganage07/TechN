const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')

// @desc get all notes
// @route GET /notes
// @access private
const getAllNotes = asyncHandler(
    async (req, res) => {
        const notes = await Note.find().lean().exec()
        if(!notes?.length){
            return res.status(400).json({ message: 'No Note present'})
        }
        res.json(notes)
}
)

// @desc create new note
// @route GET /notes
// @access private
const createNewNote = asyncHandler(
    async (req, res) => {
        const { user, title, text, completed} = req.body

        //confirm data
        if(!user || !title || !text || typeof completed !== 'boolean'){
            return res.status(400).json({ message: 'missing fields or invalid data'})
        }

        //checking if the user exists in DB
        const userExist = await User.findById(user)
        if(!userExist){
            return res.status(400).json({ message: 'user does not exist'})
        }

        const noteobj = {user, title, text, completed}

        const note = await Note.create(noteobj)

        if(note){
            res.status(201).json({ message: `note ${note.title} created sucessfully`})
        }else{
            res.status(400).json({ message: 'invalid note data received, prb in creating note'})
        }
}
)

// @desc update note
// @route GET /notes
// @access private
const updateNote = asyncHandler(
    async (req, res) => {
        const { id, user, title, text, completed} = req.body

        //confirm data
        if(!id || !user || !title || !text || typeof completed !== 'boolean'){
            return res.status(400).json({ message: 'missing fields or invalid data'})
        }

        //find note by id
        const note = await Note.findById(id).exec()
        if(!note){
            return res.status(400).json({ message: `no note found with id: ${id}`})
        }

        note.user = user
        note.title = title
        note.text = text
        note.completed = completed

        const updatedNote = await note.save()
        res.json({ message: `note with id: ${updatedNote._id} has been updated`, updatedNote })
}
)

// @desc delete note
// @route GET /notes
// @access private
const deleteNote = asyncHandler(
    async (req, res) => {
        const { id } = req.body
        //confirm data
        if(!id){
            return res.status(400).json({ message: 'Missing field id'})
        }

        const note = await Note.findById(id).exec()
        if(!note){
            return res.status(400).json({ message: `no Note exist for if id: ${id}`})
        }

        const deletednote = await note.deleteOne()
        res.json({ message: 'note deleted sucessfully'})

}
)

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}