import validator from 'validator';

class ValidateFields {
  /*
   * A method that takes in the email
   * Validates it
   * Returns the response either error or false if there is no error
   */
  validateFirstName(name) {
    if (validator.isEmpty(name) || (!validator.isLength(name, { min: 2 }))) {
      return false;
    }
    return true;
  }

  validateLastName(name) {
    if (validator.isEmpty(name) || !validator.isLength(name, { min: 2 })) {
      return false;
    }
    return true;
  }

  validateEmail(email) {
    if (validator.isEmpty(email) || !validator.isEmail(email)) {
      return false;
    }
    return true;
  }

  validatePassword(password) {
    if (validator.isEmpty(password) || !validator.isLength(password, { min: 6 })) {
      return false;
    }
    return true;
  }
}

const validateFields = new ValidateFields();

// export the class instance, so we can import and use it anywhere
export { validateFields };