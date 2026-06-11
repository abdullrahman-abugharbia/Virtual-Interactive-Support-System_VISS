const { Router } = require('express');
const userController = require('../controllers/user.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { userIdParamSchema, updateUserSchema } = require('../validators/user.validator');

const router = Router();

router.use(requireAuth);

router.get('/own', userController.getOwnUser);
router.patch('/:id', validate({ params: userIdParamSchema, body: updateUserSchema }), userController.updateUser);

module.exports = router;
