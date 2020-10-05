import React from 'react';
import { Col, Row, Form } from 'reactstrap';
import fetch from 'node-fetch';

import '../FormComponents/CustomInputGroup/CustomFormInput.css';

import { validateFields } from '../Validation';
import Title from '../FormComponents/Title/Title'
import CustomFormGroup from '../FormComponents/CustomFormGroup/CustomFormGroup'

export default class RegisterForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      firstname: {
        value: "",
        isValid: false,
      },
      lastname: {
        value: "",
        isValid: false,
      },
      password: {
        value: "",
        isValid: false,
      },
      passwordAgain: {
        value: "",
        isValid: false,
      },
      email: {
        value: "",
        isValid: false,
      }
    }
    this.handleChange = this.handleChange.bind(this);
    this.onFormSubmit = this.onFormSubmit.bind(this);
  }

  handleChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: {
        value: value
      }
    });
  }

  onFormSubmit(e) {
    e.preventDefault()

    const isFirstnameValid = validateFields.validateFirstName(this.state.firstname.value);
    const isLastnameValid = validateFields.validateLastName(this.state.lastname.value);
    const isEmailValid = validateFields.validateEmail(this.state.email.value);
    const isPasswordValid = validateFields.validatePassword(this.state.password.value);
    const isPasswordAgainValid = this.state.passwordAgain.value === this.state.password.value;

    if (isFirstnameValid && isLastnameValid && isEmailValid && isPasswordValid && isPasswordAgainValid === true) {
      this.fetchNewUser(this.state.firstname.value, this.state.lastname.value, this.state.email.value, this.state.password.value);
    }
  }

  fetchNewUser(firstname, lastname, email, password) {
    const bodyData = {
      "firstname": firstname,
      "lastname": lastname,
      "email": email,
      "password": password,
    }

    fetch("https://smallbank-api.herokuapp.com/users", {
      method: 'post',
      body:    JSON.stringify(bodyData),
      headers: { 'Content-Type': 'application/json' }
      })
      .then(res => res.json)
      .then(
        this.props.handleRegisterSubmit
      )

  }

  render() {
    return (
      <div className="w-100 mb-4">
        <Title className="text-center mb-3" title="Create Account!"/>

        <Form onSubmit={this.onFormSubmit}>
          <Row form>
            <Col sm={6}>

              <CustomFormGroup
              handleChange={this.handleChange}
              type="text"
              name="firstname"
              placeholder="First name"/>

            </Col>
            <Col sm={6}>

              <CustomFormGroup
              handleChange={this.handleChange}
              type="text"
              name="lastname"
              placeholder="Last name"/>

            </Col>
          </Row>

          <CustomFormGroup
          handleChange={this.handleChange}
          type="email"
          name="email"
          placeholder="Email"/>

          <CustomFormGroup
          handleChange={this.handleChange}
          type="password"
          name="password"
          placeholder="Password"/>

          <CustomFormGroup
          handleChange={this.handleChange}
          type="password"
          name="passwordAgain"
          placeholder="Confirm Password"/>

          <CustomFormGroup
          isButton
          btntext="Sign up!"/>

        </Form>
      </div>
    )
  }
}