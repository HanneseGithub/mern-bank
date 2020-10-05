import React from 'react';

import CustomFormInput from '../CustomInputGroup/CustomFormInput'
import { FormGroup, Button } from 'reactstrap';

import '../CustomInputGroup/CustomFormInput.css';

export default class CustomFormGroup extends React.Component{
  render() {
    return (
      this.props.isButton ?
      <FormGroup>
        <Button className="rounded-edges input w-100" color="primary">{this.props.btntext}</Button>
      </FormGroup>
      :
      <FormGroup>
        <CustomFormInput
        handleChange={this.props.handleChange}
        type={this.props.type}
        name={this.props.name}
        placeholder={this.props.placeholder}/>
      </FormGroup>
    )
  }
};