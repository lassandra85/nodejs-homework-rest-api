const express = require('express');
const ctrl = require("../../controllers/contacts");
const {validateBody, isValidId, patchValidate, authenticate} = require("../../middlewares");
const {schemas} = require("../../models/contact");

const router = express.Router();


router.get('/', authenticate, ctrl.listContacts);

router.get('/:contactId', authenticate, isValidId, ctrl.getContactById);

router.post('/', authenticate, validateBody(schemas.addSchema), ctrl.addContact);

router.put('/:contactId', authenticate, isValidId, validateBody(schemas.addSchema), ctrl.updateContact);

router.patch('/:contactId/favorite', authenticate, isValidId, patchValidate(schemas.updateFavoriteSchema), ctrl.updateFavorite);

router.delete('/:contactId', authenticate, isValidId, ctrl.removeContact);



module.exports = router;
