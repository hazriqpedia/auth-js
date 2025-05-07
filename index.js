const express = require("express")
const uuid = require("uuid")

const app = express()
const PORT = 3000;

app.use(express.json())

// IN MEMORY
const users = {};
// {
//     "user_id": {
//         "login": "username",
//         "password": "password"
//      }
// }
const tokens = {};
// {
//     "token<uuid>": "user_id"
// }
const articles = [];
// [{
// }]


function verifyUser(login, password) {
    let user_id;
    let is_login_found = false;
    let is_password_match = false;

    for (const [key, value] of Object.entries(users)) {
        console.log('key: ', key)
        console.log('value: ', value)
        const currentUser = key
        const currentLogin = value.login
        const currentPassword = value.password

        if (currentLogin === login) {
            user_id = key;
            is_login_found = true;
            if (currentPassword === password) {
                is_password_match = true
            }
            break
        }
    }

    return { user_id, is_login_found, is_password_match }
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]

    console.log('authHeader: ', authHeader)
    console.log('token: ', token)
    if (token === null) {
        return res.sendStatus(401)
    }

    if (tokens[token]) {
        req.user_id = tokens[token]
        next()
    } else {
        return res.sendStatus(401)
    }
}

app.post('/api/user', (req, res) => {
    const { user_id, login, password } = req.body;

    if (!user_id || !login || !password) {
        return res.sendStatus(400)
    }

    // Check if userid registered
    const existingUser = users[user_id];
    if (existingUser) {
        return res.status(400).json({ 'message': 'Existing user' })
    }

    users[user_id] = { login, password }

    return res.status(201).json({ 'message': 'Added new user' })

})

app.post('/api/authenticate', (req, res) => {
    const { login, password } = req.body

    if (!login || !password) {
        return res.sendStatus(500);
    }

    const { user_id, is_login_found, is_password_match } = verifyUser(login, password)
    console.log('user_id: ', user_id)
    console.log('is_login_found: ', is_login_found)
    console.log('is_password_match: ', is_password_match)

    if (!is_login_found && !is_password_match) {
        return res.sendStatus(403)
    }

    if (is_login_found && !is_password_match) {
        return res.sendStatus(400)
    }

    const token = uuid.v4();

    tokens[token] = user_id

    res.status(200).json({ "token": token })
})

app.post('/api/logout', (req, res) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]

    if (token && tokens[token]) {
        delete tokens[token]
        return res.sendStatus(200)
    } else {
        return res.sendStatus(400)
    }
})

app.get('/', (req, res) => {
    return res.status(200).json({ 'message': 'App is live' })
})

app.post('/api/articles', authenticateToken, (req, res) => {
    const { title, content, visibility } = req.body
    const { user_id } = req

    console.log('user_id: ', user_id)

    if (!title || !content || !['public', 'private', 'logged_in'].includes(visibility)) {
        return res.sendStatus(400);
    }

    const article = {
        article_id: uuid.v4(),
        title,
        content,
        visibility,
        user_id
    }

    articles.push(article)

    res.status(200).json({ article })

})

app.get('/api/articles', authenticateToken, (req, res) => {
    return res.status(200).json({ 'message': 'Articles endpoint is live', articles })
})

app.get('/vars', (req, res) => {
    return res.json({ users, tokens, articles })
})

app.listen(PORT, () => {
    console.log(`App running on ${PORT}`)
})