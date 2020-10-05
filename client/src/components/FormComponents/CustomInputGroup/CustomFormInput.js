import React from 'react';
import { InputGroup, Input } from 'reactstrap';

import './CustomFormInput.css';

export default class CustomFormInput extends React.Component {
  render() {

    return (
      <InputGroup>
        <Input
          onChange={this.props.handleChange}
          type={this.props.type}
          name={this.props.name}
          className="rounded-edges input text-input"
          placeholder={this.props.placeholder} />
      </InputGroup>
    )
  }
}