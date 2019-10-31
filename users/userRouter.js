const express = require('express');
const userDb = require('./userDb');
const postDb = require('../posts/postDb');

const router = express.Router();


router.post('/', validateUser, (req, res, next) => {
    userDb.insert({ name: req.body.name })
    .then(user => {
        res.status(200).json(user);
    })
    .catch(next)
})

router.post('/:id/posts', validateUserId, validatePost, (req, res, next) => {
    postDb.insert({ text: req.body.text, user_id: req.user.id })
    .then(post => {
        res.status(200).json(post);
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
    userDb.get()
    .then(users => {
        let usersPostsPromises = users.map(user => userDb.getUserPosts(user.id));
        Promise.all(usersPostsPromises)
        .then(usersPostsLists => {
            const usersWithPosts = users.map((user, i) => ({ ...user, posts: usersPostsLists[i] }));
            res.status(200).json(usersWithPosts);
        })
        .catch(next)
    })
    .catch(next)
})

router.get('/:id', validateUserId, (req, res) => {
    res.status(200).json(req.user);
})

router.get('/:id/posts', validateUserId, (req, res, next) => {
    userDb.getUserPosts(req.user.id)
    .then(posts => {
        res.status(200).json(posts);
    })
    .catch(next)
})

router.delete('/:id', validateUserId, (req, res, next) => {
    userDb.delete(req.user.id)
    .then(() => {
        res.status(200).json(req.user);
    })
    .catch(next)
})

router.put('/:id', validateUserId, validateUser, (req, res, next) => {
    const { name } = req.body;
    userDb.update(req.user.id, { name })
    .then(() => {
        res.status(200).json({ ...req.user, name });
    })
    .catch(next);
})

//custom middleware

function validateUserId(req, res, next) {
    const { id } = req.params;
    userDb.getById(id)
    .then(user => {
        if(user) {
            req.user = user;
            next();
        } else {
            res.status(400).json({ message: "invalid user id" });
        }
    })
    .catch(next);
}

function validateUser(req, res, next) {
    if(Object.keys(req.body).length) {
        const { name } = req.body;
        if (name) {
            next();
        } else {
            res.status(400).json({ message: "missing required name field" });
        }
    } else {
        res.status(400).json({ message: "missing user data" });
    }
}

function validatePost(req, res, next) {
    if (Object.keys(req.body).length) {
        const { text } = req.body;
        if (text) {
            next();
        } else {
            res.status(400).json({ message: "missing required text field" });
        }
    } else {
        res.status(400).json({ message: "missing post data" });
    }
}

router.use((error, req, res) => {
    res.status(500).json({
        file: 'userRouter',
        method: req.method,
        url: req.url,
        message: error.message
    })
})

module.exports = router;
