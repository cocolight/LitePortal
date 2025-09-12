const express = require('express')
const router = express.Router()
const { validateLinkData } = require('../middleware/validation')
const db = require('../db/models')

// GET /config
router.get('/', async (req, res) => {
  try {
    const userId = await getUserId(req.get('X-User'))
    const links = await getLinks(userId)
    res.json({ links })
  } catch (err) {
    res.status(500).json({ error: 'Database error' })
  }
})

// POST /config
router.post('/', validateLinkData, async (req, res) => {
  try {
    const userId = await getUserId(req.get('X-User'))
    await saveLink(userId, req.validData)
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: 'Save failed' })
  }
})

// Helper functions
async function getUserId(username = 'guest') {
  return await db.getUser(username) || await db.createUser(username)
}

function getLinks(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT link_id as id, name, online_icon as icon,
       text_icon as textIcon, upload_icon as uploadIcon,
       icon_type as iconType, int_url as int,
       ext_url as ext, description as desc
       FROM links WHERE user_id = ?`,
      [userId],
      (err, rows) => err ? reject(err) : resolve(rows || [])
    )
  })
}

function saveLink(userId, data) {
  return new Promise((resolve, reject) => {
    const sql = data.id ? updateSql : insertSql
    const params = data.id ? updateParams(userId, data) : insertParams(userId, data)

    db.run(sql, params, (err) => err ? reject(err) : resolve())
  })
}

module.exports = router
