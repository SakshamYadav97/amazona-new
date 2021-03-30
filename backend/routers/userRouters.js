import express from 'express'
import expressAsyncHandler from 'express-async-handler'
import data from '../data.js'
import User from '../models/userModel.js'
import bcrypt from 'bcryptjs'
import { generateToken, isAuth, isAdmin } from '../utils.js'

const userRouter = express.Router();

userRouter.get('/seed', expressAsyncHandler(async (req, res) => {
    const createdUser = await User.insertMany(data.users)
    res.send({ createdUser })
}))

userRouter.get('/', isAuth, isAdmin, expressAsyncHandler(async (req, res) => {
    const users = await User.find({})
    res.send(users)
}))

userRouter.post('/signin', expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
        if (bcrypt.compareSync(req.body.password, user.password)) {
            res.send({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                isSeller: user.isSeller,
                token: generateToken(user)
            })
            return
        } else {
            res.status(401).send({ message: 'Invalid email or password' })
        }

    } else {
        res.status(401).send({ message: 'Invalid email or password' })
    }
}))

userRouter.post('/register', expressAsyncHandler(async (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8)
    })
    const createdUser = await user.save()
    res.send({
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        isAdmin: createdUser.isAdmin,
        isSeller: createdUser.isSeller,
        token: generateToken(createdUser)
    })
}))

userRouter.get('/:id', expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        res.send(user)
    } else {
        res.status(404).send({ message: 'User Not Found' })
    }
}))

userRouter.put('/profile', isAuth, expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        if (user.isSeller) {
            user.seller.name = req.body.sellerName || user.seller.name
            user.seller.logo = req.body.sellerLogo || user.seller.logo
            user.seller.description = req.body.sellerDescription || user.seller.description
        }
        if (req.body.password) {
            user.password = bcrypt.hashSync(req.body.password, 8)
        }
        const updatedUser = await user.save()
        res.send({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            isSeller: updatedUser.isSeller,
            token: generateToken(updatedUser)
        })

    } else {
        res.status(404).send({ message: 'User not found' })
    }
}))

userRouter.delete('/:id', isAuth, isAdmin, expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
    if (user) {
        const deleteUser = await user.remove()
        res.send({ message: 'User Deleted', user: deleteUser })
    } else {
        res.status(404).send({ message: 'User not found' })
    }
}))

userRouter.put(`/:id`, isAuth, isAdmin, expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
    if (user) {
        user.name = req.body.name || user.name
        user.email = req.body.email || user.email
        user.isAdmin = req.body.isAdmin || user.isAdmin
        user.isSeller = req.body.isSeller || user.isSeller
        const updatedUser = await user.save()
        res.send({ message: 'User Updated', user: updatedUser })
    } else {
        res.status(404).send({ message: 'User not found' })
    }
}))

userRouter.get('/top/top-seller', expressAsyncHandler(async (req, res) => {
    //.sort({ 'seller.rating': -1 }).limit(3)
    //isSeller: true 
    const topSellers = await User.find({ isSeller: true }).sort({ 'seller.rating': -1 }).limit(3)

    res.send(topSellers)
}))

export default userRouter