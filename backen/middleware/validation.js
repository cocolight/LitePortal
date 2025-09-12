const yup = require('yup')

const linkSchema = yup.object({
  id: yup.string().optional(),
  name: yup.string().required().max(50),
  iconType: yup.string().oneOf(['online_icon', 'text_icon', 'upload_icon']),
  int: yup.string().url(),
  ext: yup.string().url().optional()
})

async function validateLinkData(req, res, next) {
  try {
    req.validData = await linkSchema.validate(req.body)
    next()
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

module.exports = { validateLinkData }
