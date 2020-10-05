import React from 'react';
import { Form, Button } from 'reactstrap';
import fetch from 'node-fetch';

import '../FormComponents/CustomInputGroup/CustomFormInput.css';

import Title from '../FormComponents/Title/Title'
import CatchPhrase from '../FormComponents/CatchPhrase/CatchPhrase'
import CustomText from '../FormComponents/CustomText/CustomText'
import CustomFormGroup from '../FormComponents/CustomFormGroup/CustomFormGroup'
import { validateFields } from '../Validation';


export default class LoginForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: {
        value: "",
        isValid: false,
      },
      password: {
        value: "",
        isValid: false,
      },
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

    const isEmailValid = validateFields.validateEmail(this.state.email.value);
    const isPasswordValid = validateFields.validatePassword(this.state.password.value);

    if (isEmailValid && isPasswordValid) {
      this.createNewSession(this.state.email.value, this.state.password.value)
    }
  }

  createNewSession(email, password) {
    const bodyData = {
      "email": email,
      "password": password,
    }

    fetch("https://smallbank-api.herokuapp.com/sessions", {
      method: 'post',
      body:    JSON.stringify(bodyData),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
      })
      .then(res => res.json())
      .then(json => {
        if (json.error) {
          return;
        } else {
          this.props.handleLoginSubmit()
        }
      })
  }

  render() {

    return (
      <div className="w-100 mb-4">
        <Title className="text-center mb-3" title="Small Bank API"/>

        <CatchPhrase className="mb-3" catchphrase="Feel yourself like a millionaire for once and get the feeling of what it’s like to move around big sums of money!"/>

        <CustomText className="mb-3" customtext="Introducing Small Bank.  New and innovative, but completely fake bank made for Henno Täht’s API course. Under any circumstances, don’t insert any real passwords or credentials here."/>

        <CustomText className="mb-3" customtext="Other than that, become a millionaire now and sign up today!"/>

        <Form onSubmit={this.onFormSubmit}>
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

          <CustomFormGroup isButton btntext="Sign in"/>
        </Form>

        <CustomText textWithLink routePath="/register" pathName="Create" className="text-center" customtext="Don't have an account?"/>
      </div>
    )
  }
}