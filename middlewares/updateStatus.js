const { HttpError } = require("../helpers");

const updateStatus = (schema, resMessage) => {

    const valid = (req, res, next) => {
        
        if (!Object.keys(req.body).length) {
            
            next(HttpError(400, `${resMessage}`));
            
        }
        
        const { error } = schema.validate(req.body);
        
        if (error) {
            
			next(HttpError(400, error.message));
        }
        
        next();
        
    };
    
	return valid;
};

module.exports = updateStatus;